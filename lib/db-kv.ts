import { kv } from "@vercel/kv";

/**
 * Vercel KV (Redis) Database Layer
 * This replaces the in-memory database with persistent storage
 * Supports both Vercel KV and direct Redis URL
 */

// Check if KV is configured (either Vercel KV or Redis URL)
const isKVConfigured = !!(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || 
  process.env.REDIS_URL ||
  process.env.KV_URL
);

console.log("🔍 KV Configuration Status:");
console.log("   KV_REST_API_URL:", !!process.env.KV_REST_API_URL);
console.log("   KV_REST_API_TOKEN:", !!process.env.KV_REST_API_TOKEN);
console.log("   REDIS_URL:", !!process.env.REDIS_URL);
console.log("   KV_URL:", !!process.env.KV_URL);
console.log("   isKVConfigured:", isKVConfigured);

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

      // Try to save to KV/Redis
      try {
        console.log(`💾 Attempting to save access request to KV: ${email}`);
        console.log(`   KV Configured: ${isKVConfigured}`);
        
        await kv.set(`access_request:${id}`, request);
        await kv.set(`access_request_email:${email.toLowerCase()}`, id);
        await kv.sadd("access_requests:all", id);
        
        console.log(`✅ Access request saved to KV with ID: ${id}`);
      } catch (err: any) {
        console.error("❌ Failed to save to KV:", err.message);
        console.error("   This might be due to missing KV environment variables");
        console.error("   Request will still be created but won't persist");
      }
      
      return request;
    },

    async findAll() {
      if (!isKVConfigured) {
        console.warn("⚠️ KV not configured - returning empty array");
        return [];
      }
      
      console.log(`🔍 Fetching all access requests from KV...`);
      const requestIds = await kv.smembers("access_requests:all") as string[];
      console.log(`   Found ${requestIds.length} request IDs in set`);
      
      const requests = [];
      
      for (const id of requestIds) {
        const request = await kv.get(`access_request:${id}`);
        if (request) requests.push(request);
      }
      
      console.log(`   Retrieved ${requests.length} full requests from KV`);
      
      // Sort by requested date (newest first)
      return requests.sort((a: any, b: any) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    },

    async findByEmail(email: string) {
      if (!isKVConfigured) return null;
      
      const requestId = await kv.get(`access_request_email:${email.toLowerCase()}`) as string | null;
      
      if (!requestId) return null;
      
      const request = await kv.get(`access_request:${requestId}`) as any;
      return request || null;
    },

    async updateStatus({ id, status, reviewedBy }: any) {
      try {
        console.log(`🔄 Updating access request ${id} to ${status}`);
        
        const request = await kv.get(`access_request:${id}`) as any;
        
        if (!request) {
          console.error(`❌ Access request not found in KV: ${id}`);
          throw new Error("Access request not found");
        }

        const updated = {
          ...request,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy,
        };

        await kv.set(`access_request:${id}`, updated);
        console.log(`✅ Request ${id} updated to ${status}`);

        // If approved, add to whitelist
        if (status === "approved") {
          console.log(`➕ Adding ${request.email} to whitelist`);
          await kv.sadd("whitelist:emails", request.email.toLowerCase());
          await kv.set(`whitelist:${request.email.toLowerCase()}`, {
            email: request.email.toLowerCase(),
            githubUsername: request.githubUsername,
            addedAt: new Date().toISOString(),
            addedBy: reviewedBy,
          });
          console.log(`✅ ${request.email} added to whitelist`);
        }

        return updated;
      } catch (err: any) {
        console.error("❌ Error in updateStatus:", err.message);
        throw err;
      }
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
      if (!isKVConfigured) {
        console.warn("⚠️ KV not configured - cannot check whitelist");
        return false;
      }
      
      try {
        console.log(`🔍 Checking if ${email} is whitelisted...`);
        const isMember = await kv.sismember("whitelist:emails", email.toLowerCase());
        console.log(`   Result: ${isMember ? 'YES' : 'NO'}`);
        return !!isMember;
      } catch (err: any) {
        console.error("❌ Error checking whitelist:", err.message);
        return false;
      }
    },

    async findAll() {
      if (!isKVConfigured) {
        console.warn("⚠️ KV not configured - returning empty whitelist");
        return [];
      }
      
      try {
        console.log(`🔍 Fetching all whitelisted users from KV...`);
        const emails = await kv.smembers("whitelist:emails") as string[];
        console.log(`   Found ${emails.length} whitelisted emails`);
        
        const users = [];
        
        for (const email of emails) {
          const user = await kv.get(`whitelist:${email}`);
          if (user) users.push(user);
        }
        
        console.log(`   Retrieved ${users.length} full user records`);
        
        // Sort by added date (newest first)
        return users.sort((a: any, b: any) => 
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
      } catch (err: any) {
        console.error("❌ Error fetching whitelist:", err.message);
        return [];
      }
    },
  },
};

