import { kv } from "@vercel/kv";

/**
 * Enhanced Database Layer with Roles & PR Review History
 * Supports both Redis and in-memory storage
 */

// Check if KV is configured
const isKVConfigured = !!(
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN
);

// ============================================
// Types
// ============================================

export type UserRole = "admin" | "user";

export interface User {
  id: string; // GitHub ID or email
  email: string;
  githubUsername?: string;
  githubId?: string;
  role: UserRole;
  status: "active" | "suspended";
  openaiKey?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface PRReview {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  reviewedBy: string; // User email or GitHub username
  issuesFound: number;
  hasHighSeverity: boolean;
  summary: string;
  reviewedAt: string;
  installationId: number;
}

export interface Installation {
  installationId: number;
  accountLogin: string;
  repoIds: number[];
  openaiKey?: string;
  userId?: string; // Link to user
  updatedAt: string;
}

// ============================================
// In-Memory Storage (fallback)
// ============================================

const userStore = new Map<string, User>();
const prReviewStore = new Map<string, PRReview>();
const installationStore = new Map<number, Installation>();

// ============================================
// User Operations
// ============================================

export const userDb = {
  async create(data: {
    email: string;
    githubUsername?: string;
    githubId?: string;
    role?: UserRole;
    openaiKey?: string;
  }): Promise<User> {
    const id = data.githubId || data.email;
    const user: User = {
      id,
      email: data.email.toLowerCase(),
      githubUsername: data.githubUsername,
      githubId: data.githubId,
      role: data.role || "user",
      status: "active",
      openaiKey: data.openaiKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isKVConfigured) {
      await kv.set(`user:${id}`, user);
      await kv.set(`user:email:${user.email}`, id);
      await kv.sadd("users:all", id);
    }

    userStore.set(id, user);
    return user;
  },

  async findById(id: string): Promise<User | null> {
    if (isKVConfigured) {
      const user = (await kv.get(`user:${id}`)) as User | null;
      if (user) return user;
    }
    return userStore.get(id) || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase();

    if (isKVConfigured) {
      const userId = await kv.get(`user:email:${normalized}`);
      if (userId) {
        return this.findById(userId as string);
      }
    }

    // Fallback: search in-memory
    for (const user of userStore.values()) {
      if (user.email === normalized) {
        return user;
      }
    }

    return null;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (isKVConfigured) {
      await kv.set(`user:${id}`, updated);
    }

    userStore.set(id, updated);
    return updated;
  },

  async getAll(): Promise<User[]> {
    if (isKVConfigured) {
      const userIds = (await kv.smembers("users:all")) as string[];
      const users: User[] = [];

      for (const id of userIds) {
        const user = await this.findById(id);
        if (user) users.push(user);
      }

      return users.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return Array.from(userStore.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getAllByRole(role: UserRole): Promise<User[]> {
    const users = await this.getAll();
    return users.filter((u) => u.role === role);
  },

  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.update(id, { role });
  },

  async updateStatus(
    id: string,
    status: "active" | "suspended"
  ): Promise<User> {
    return this.update(id, { status });
  },

  async updateLastLogin(id: string): Promise<User> {
    return this.update(id, { lastLoginAt: new Date().toISOString() });
  },

  async getFirstUser(): Promise<User | null> {
    const users = await this.getAll();
    return users.length > 0 ? users[0] : null;
  },
};

// ============================================
// PR Review Operations
// ============================================

export const prReviewDb = {
  async create(data: {
    owner: string;
    repo: string;
    prNumber: number;
    prTitle: string;
    reviewedBy: string;
    issuesFound: number;
    hasHighSeverity: boolean;
    summary: string;
    installationId: number;
  }): Promise<PRReview> {
    const id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const review: PRReview = {
      id,
      ...data,
      reviewedAt: new Date().toISOString(),
    };

    if (isKVConfigured) {
      await kv.set(`pr_review:${id}`, review);
      await kv.sadd("pr_reviews:all", id);
      // Index by user for quick lookups
      await kv.sadd(`pr_reviews:user:${data.reviewedBy}`, id);
    }

    prReviewStore.set(id, review);
    return review;
  },

  async getByUser(username: string, limit: number = 10): Promise<PRReview[]> {
    if (isKVConfigured) {
      const reviewIds = (await kv.smembers(
        `pr_reviews:user:${username}`
      )) as string[];
      const reviews: PRReview[] = [];

      for (const id of reviewIds.slice(0, limit)) {
        const review = (await kv.get(`pr_review:${id}`)) as PRReview | null;
        if (review) reviews.push(review);
      }

      return reviews.sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      );
    }

    // Fallback: in-memory search
    const userReviews = Array.from(prReviewStore.values()).filter(
      (r) => r.reviewedBy === username
    );

    return userReviews
      .sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      )
      .slice(0, limit);
  },

  async getAll(limit: number = 50): Promise<PRReview[]> {
    if (isKVConfigured) {
      const reviewIds = (await kv.smembers("pr_reviews:all")) as string[];
      const reviews: PRReview[] = [];

      for (const id of reviewIds.slice(0, limit)) {
        const review = (await kv.get(`pr_review:${id}`)) as PRReview | null;
        if (review) reviews.push(review);
      }

      return reviews.sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      );
    }

    return Array.from(prReviewStore.values())
      .sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      )
      .slice(0, limit);
  },

  async getStats(username?: string): Promise<{
    totalReviews: number;
    criticalIssues: number;
    cleanPRs: number;
    totalIssues: number;
  }> {
    const reviews = username
      ? await this.getByUser(username, 1000)
      : await this.getAll(1000);

    return {
      totalReviews: reviews.length,
      criticalIssues: reviews.filter((r) => r.hasHighSeverity).length,
      cleanPRs: reviews.filter((r) => r.issuesFound === 0).length,
      totalIssues: reviews.reduce((sum, r) => sum + r.issuesFound, 0),
    };
  },
};

// ============================================
// Installation Operations (Enhanced)
// ============================================

export const installationDb = {
  async save(data: {
    installationId: number;
    accountLogin: string;
    repositories: { id: number }[];
    openaiKey?: string;
    userId?: string;
  }): Promise<Installation> {
    const installation: Installation = {
      installationId: data.installationId,
      accountLogin: data.accountLogin,
      repoIds: data.repositories.map((r) => r.id),
      openaiKey: data.openaiKey,
      userId: data.userId,
      updatedAt: new Date().toISOString(),
    };

    if (isKVConfigured) {
      await kv.set(`installation:${data.installationId}`, installation);
      await kv.sadd("installations:all", data.installationId);
    }

    installationStore.set(data.installationId, installation);
    return installation;
  },

  async findById(
    installationId: number
  ): Promise<Installation | null> {
    if (isKVConfigured) {
      const inst = (await kv.get(
        `installation:${installationId}`
      )) as Installation | null;
      if (inst) return inst;
    }

    return installationStore.get(installationId) || null;
  },

  async getAll(): Promise<Installation[]> {
    if (isKVConfigured) {
      const installationIds = (await kv.smembers(
        "installations:all"
      )) as number[];
      const installations: Installation[] = [];

      for (const id of installationIds) {
        const inst = await this.findById(id);
        if (inst) installations.push(inst);
      }

      return installations;
    }

    return Array.from(installationStore.values());
  },
};

// ============================================
// Helper: Make First User Admin
// ============================================

export async function ensureFirstAdmin(): Promise<void> {
  const users = await userDb.getAll();

  if (users.length === 0) {
    console.log("ℹ️ No users yet - first user will become admin");
    return;
  }

  const hasAdmin = users.some((u) => u.role === "admin");

  if (!hasAdmin && users.length > 0) {
    console.log("🔐 No admin found - promoting first user to admin");
    await userDb.updateRole(users[0].id, "admin");
    console.log(`✅ ${users[0].email} is now an admin`);
  }
}

