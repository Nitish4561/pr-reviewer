interface EncryptedData {
  iv: string;
  content: string;
  tag: string;
}

interface User {
  githubId: string;
  openaiKey?: EncryptedData;
}

/**
 * Installation model
 */
interface Installation {
  installationId: number;
  accountLogin: string;
  repoIds: number[];
  openaiKey?: string;
}

/**
 * Access Request model
 */
interface AccessRequest {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

/**
 * Whitelisted User model
 */
interface WhitelistedUser {
  email: string;
  githubUsername?: string;
  addedAt: string;
  addedBy: string;
}

/**
 * User operations
 */
interface UserOperations {
  upsert(params: {
    where: { githubId: string };
    update: { openaiKey: EncryptedData };
    create: {
      githubId: string;
      openaiKey: EncryptedData;
    };
  }): Promise<User>;
  findByGithubRepo(repoId: number): Promise<User | null>;
}

/**
 * Installation operations
 */
interface InstallationOperations {
  saveInstallation(params: {
    installationId: number;
    accountLogin: string;
    repositories: { id: number }[];
    openaiKey?: string;
  }): Promise<void>;

  findByRepoId(repoId: number): Promise<Installation | null>;

  findUnique(params: {
    where: { installationId: number };
  }): Promise<Installation | null>;

  upsert(params: {
    where: { installationId: number };
    update: { openaiKey: string };
    create: {
      installationId: number;
      openaiKey: string;
    };
  }): Promise<Installation>;

  getAll(): Promise<Installation[]>;
}

/**
 * Access Request operations
 */
interface AccessRequestOperations {
  create(params: {
    name: string;
    email: string;
    githubUsername?: string;
    message?: string;
  }): Promise<AccessRequest>;
  
  findAll(): AccessRequest[];
  
  findByEmail(email: string): AccessRequest | null;
  
  updateStatus(params: {
    id: string;
    status: "approved" | "rejected";
    reviewedBy: string;
  }): Promise<AccessRequest>;
}

/**
 * Whitelist operations
 */
interface WhitelistOperations {
  add(params: {
    email: string;
    githubUsername?: string;
    addedBy: string;
  }): Promise<WhitelistedUser>;
  
  remove(email: string): Promise<void>;
  
  isWhitelisted(email: string): boolean;
  
  findAll(): WhitelistedUser[];
}

interface Database {
  user: UserOperations;
  installation: InstallationOperations;
  accessRequest: AccessRequestOperations;
  whitelist: WhitelistOperations;
}

/**
 * In-memory DB (temporary)
 */
const userStore = new Map<string, User>();
const installationStore = new Map<number, Installation>();
const accessRequestStore = new Map<string, AccessRequest>();
const whitelistStore = new Map<string, WhitelistedUser>();

// Admin emails (configurable)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

// Check if using Vercel KV
const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export const db: Database = {
  user: {
    async upsert({ where, update, create }) {
      const existing = userStore.get(where.githubId);

      if (existing) {
        const updated = { ...existing, ...update };
        userStore.set(where.githubId, updated);
        return updated;
      }

      userStore.set(create.githubId, create);
      return create;
    },

    async findByGithubRepo(_repoId: number) {
      // Will be implemented later after user-repo mapping
      return null;
    },
  },

  installation: {
    async saveInstallation({ installationId, accountLogin, repositories, openaiKey }) {
      const repoIds = repositories.map((r: any) => r.id);
      
      // Check if installation already exists to preserve OpenAI key
      const existing = installationStore.get(installationId);

      const installation = {
        installationId,
        accountLogin,
        repoIds,
        openaiKey: openaiKey || existing?.openaiKey, // Preserve existing key if not provided
      };

      installationStore.set(installationId, installation);
      
      // Also save to KV if available
      if (useKV) {
        try {
          const { kv } = await import("@vercel/kv");
          await kv.set(`installation:${installationId}`, installation);
          await kv.sadd("installations:all", installationId);
          console.log(`✅ Installation saved to KV: ${installationId}`);
        } catch (err) {
          console.error("Failed to save to KV:", err);
        }
      }
    },

    async findByRepoId(repoId: number) {
      for (const installation of installationStore.values()) {
        if (installation.repoIds.includes(repoId)) {
          return installation;
        }
      }
      return null;
    },

    async findUnique({ where }) {
      // Try KV first if available
      if (useKV) {
        try {
          const { kv } = await import("@vercel/kv");
          const installation = await kv.get(`installation:${where.installationId}`);
          if (installation) {
            return installation as Installation;
          }
        } catch (err) {
          console.error("Failed to read from KV:", err);
        }
      }
      
      // Fallback to in-memory
      const installation = installationStore.get(where.installationId);
      return installation || null;
    },

    async upsert({ where, update, create }) {
      const existing = installationStore.get(where.installationId);

      if (existing) {
        const updated = { ...existing, ...update };
        installationStore.set(where.installationId, updated);
        return updated;
      }

      const newInstallation: Installation = {
        installationId: create.installationId,
        accountLogin: "",
        repoIds: [],
        openaiKey: create.openaiKey,
      };

      installationStore.set(create.installationId, newInstallation);
      return newInstallation;
    },

    async getAll() {
      // Try KV first if available
      if (useKV) {
        try {
          const { kv } = await import("@vercel/kv");
          const allIds = await kv.smembers("installations:all") as number[];
          const installations: Installation[] = [];
          
          for (const id of allIds) {
            const inst = await kv.get(`installation:${id}`);
            if (inst) installations.push(inst as Installation);
          }
          
          if (installations.length > 0) {
            return installations;
          }
        } catch (err) {
          console.error("Failed to read from KV:", err);
        }
      }
      
      // Fallback to in-memory
      return Array.from(installationStore.values());
    },
  },

  accessRequest: {
    async create({ name, email, githubUsername, message }) {
      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request: AccessRequest = {
        id,
        name,
        email,
        githubUsername,
        message,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      accessRequestStore.set(id, request);
      return request;
    },

    findAll() {
      return Array.from(accessRequestStore.values()).sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    },

    findByEmail(email: string) {
      for (const request of accessRequestStore.values()) {
        if (request.email.toLowerCase() === email.toLowerCase()) {
          return request;
        }
      }
      return null;
    },

    async updateStatus({ id, status, reviewedBy }) {
      const request = accessRequestStore.get(id);
      
      if (!request) {
        throw new Error("Access request not found");
      }

      const updated: AccessRequest = {
        ...request,
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      };

      accessRequestStore.set(id, updated);

      // If approved, add to whitelist
      if (status === "approved") {
        await db.whitelist.add({
          email: request.email,
          githubUsername: request.githubUsername,
          addedBy: reviewedBy,
        });
      }

      return updated;
    },
  },

  whitelist: {
    async add({ email, githubUsername, addedBy }) {
      const user: WhitelistedUser = {
        email: email.toLowerCase(),
        githubUsername,
        addedAt: new Date().toISOString(),
        addedBy,
      };

      whitelistStore.set(email.toLowerCase(), user);
      return user;
    },

    async remove(email: string) {
      whitelistStore.delete(email.toLowerCase());
    },

    isWhitelisted(email: string) {
      return whitelistStore.has(email.toLowerCase()) || isAdmin(email.toLowerCase());
    },

    findAll() {
      return Array.from(whitelistStore.values()).sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    },
  },
};
