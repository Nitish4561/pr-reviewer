import { kv } from "@vercel/kv";

/**
 * Vercel KV (Redis) Database Layer
 * This replaces the in-memory database with persistent storage
 */

// Check if KV is configured
const isKVConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export const kvdb = {
  installation: {
    async saveInstallation({ installationId, accountLogin, repositories, openaiKey }: any) {
      if (!isKVConfigured) {
        console.warn("⚠️ KV not configured, using in-memory storage");
        return;
      }

      const installation = {
        installationId,
        accountLogin,
        repoIds: repositories.map((r: any) => r.id),
        openaiKey,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`installation:${installationId}`, installation);
      await kv.sadd("installations:all", installationId);
      
      console.log(`✅ Installation saved to KV: ${installationId} for ${accountLogin}`);
    },

    async findUnique({ where }: any) {
      if (!isKVConfigured) return null;
      
      const installation = await kv.get(`installation:${where.installationId}`);
      return installation as any;
    },

    async findByRepoId(repoId: number) {
      if (!isKVConfigured) return null;
      
      const allInstallationIds = await kv.smembers("installations:all");
      
      for (const id of allInstallationIds) {
        const installation = await kv.get(`installation:${id}`) as any;
        if (installation?.repoIds?.includes(repoId)) {
          return installation;
        }
      }
      
      return null;
    },

    async upsert({ where, update, create }: any) {
      if (!isKVConfigured) return create;
      
      const existing = await kv.get(`installation:${where.installationId}`) as any;
      
      if (existing) {
        const updated = { ...existing, ...update };
        await kv.set(`installation:${where.installationId}`, updated);
        return updated;
      }
      
      const newInstallation = {
        installationId: create.installationId,
        accountLogin: "",
        repoIds: [],
        openaiKey: create.openaiKey,
      };
      
      await kv.set(`installation:${where.installationId}`, newInstallation);
      await kv.sadd("installations:all", where.installationId);
      
      return newInstallation;
    },

    getAll() {
      // For backwards compatibility with in-memory DB
      // In production, this should be replaced with proper KV queries
      return [];
    },
  },

  accessRequest: {
    async create({ name, email, githubUsername, message }: any) {
      if (!isKVConfigured) throw new Error("KV not configured");
      
      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request = {
        id,
        name,
        email,
        githubUsername,
        message,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      await kv.set(`access_request:${id}`, request);
      await kv.set(`access_request_email:${email.toLowerCase()}`, id);
      await kv.sadd("access_requests:all", id);
      
      return request;
    },

    findAll() {
      // Placeholder - implement if needed
      return [];
    },

    findByEmail(email: string) {
      // Placeholder - implement if needed
      return null;
    },

    async updateStatus({ id, status, reviewedBy }: any) {
      if (!isKVConfigured) throw new Error("KV not configured");
      
      const request = await kv.get(`access_request:${id}`) as any;
      
      if (!request) {
        throw new Error("Access request not found");
      }

      const updated = {
        ...request,
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      };

      await kv.set(`access_request:${id}`, updated);

      // If approved, add to whitelist
      if (status === "approved") {
        await kv.sadd("whitelist:emails", request.email.toLowerCase());
        await kv.set(`whitelist:${request.email.toLowerCase()}`, {
          email: request.email.toLowerCase(),
          githubUsername: request.githubUsername,
          addedAt: new Date().toISOString(),
          addedBy: reviewedBy,
        });
      }

      return updated;
    },
  },

  whitelist: {
    async add({ email, githubUsername, addedBy }: any) {
      if (!isKVConfigured) return {} as any;
      
      const user = {
        email: email.toLowerCase(),
        githubUsername,
        addedAt: new Date().toISOString(),
        addedBy,
      };

      await kv.sadd("whitelist:emails", email.toLowerCase());
      await kv.set(`whitelist:${email.toLowerCase()}`, user);
      
      return user;
    },

    async remove(email: string) {
      if (!isKVConfigured) return;
      
      await kv.srem("whitelist:emails", email.toLowerCase());
      await kv.del(`whitelist:${email.toLowerCase()}`);
    },

    isWhitelisted(email: string) {
      // This needs to be async, but keeping signature for compatibility
      // In production, make this properly async
      return false;
    },

    async isWhitelistedAsync(email: string) {
      if (!isKVConfigured) return false;
      
      const isMember = await kv.sismember("whitelist:emails", email.toLowerCase());
      return !!isMember;
    },

    findAll() {
      return [];
    },
  },
};

