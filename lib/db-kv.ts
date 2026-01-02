/**
 * Redis Database Layer
 * Supports both Vercel KV (@vercel/kv) and direct Redis (redis package)
 */

// Check which Redis method is available
const hasVercelKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const hasRedisURL = !!process.env.REDIS_URL;
const isKVConfigured = hasVercelKV || hasRedisURL;

console.log("🔍 Redis Configuration Status:");
console.log("   Vercel KV:", hasVercelKV);
console.log("   Redis URL:", hasRedisURL);
console.log("   Configured:", isKVConfigured);

// Create Redis client wrapper
let redisClient: any = null;

async function getRedisClient() {
  if (hasVercelKV) {
    // Use Vercel KV
    const { kv } = await import("@vercel/kv");
    return kv;
  } else if (hasRedisURL) {
    // Use direct Redis connection
    if (!redisClient) {
      const { createClient } = await import("redis");
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      console.log("✅ Connected to Redis via REDIS_URL");
    }
    return redisClient;
  }
  throw new Error("No Redis connection available");
}

export const kvdb = {
  installation: {
    async saveInstallation({ installationId, accountLogin, repositories, openaiKey }: any) {
      if (!isKVConfigured) {
        console.warn("⚠️ Redis not configured, skipping save");
        return;
      }

      try {
        const installation = {
          installationId,
          accountLogin,
          repoIds: repositories.map((r: any) => r.id),
          openaiKey,
          updatedAt: new Date().toISOString(),
        };

        const redis = await getRedisClient();
        await redis.set(`installation:${installationId}`, JSON.stringify(installation));
        await redis.sAdd("installations:all", installationId.toString());
        
        console.log(`✅ Installation saved to Redis: ${installationId} for ${accountLogin}`);
      } catch (err: any) {
        console.error("❌ Error saving installation:", err.message);
      }
    },

    async findUnique({ where }: any) {
      if (!isKVConfigured) return null;
      
      try {
        const redis = await getRedisClient();
        const data = await redis.get(`installation:${where.installationId}`);
        if (!data) return null;
        
        const installation = typeof data === 'string' ? JSON.parse(data) : data;
        return installation as any;
      } catch (err: any) {
        console.error("❌ Error finding installation:", err.message);
        return null;
      }
    },

    async findByRepoId(repoId: number) {
      if (!isKVConfigured) return null;
      
      try {
        const redis = await getRedisClient();
        const allInstallationIds = await redis.sMembers("installations:all");
        
        for (const id of allInstallationIds) {
          const data = await redis.get(`installation:${id}`);
          if (data) {
            const installation = typeof data === 'string' ? JSON.parse(data) : data;
            if (installation?.repoIds?.includes(repoId)) {
              return installation;
            }
          }
        }
        
        return null;
      } catch (err: any) {
        console.error("❌ Error finding installation by repo:", err.message);
        return null;
      }
    },

    async upsert({ where, update, create }: any) {
      if (!isKVConfigured) return create;
      
      try {
        const redis = await getRedisClient();
        const data = await redis.get(`installation:${where.installationId}`);
        const existing = data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
        
        if (existing) {
          const updated = { ...existing, ...update };
          await redis.set(`installation:${where.installationId}`, JSON.stringify(updated));
          return updated;
        }
        
        const newInstallation = {
          installationId: create.installationId,
          accountLogin: "",
          repoIds: [],
          openaiKey: create.openaiKey,
        };
        
        await redis.set(`installation:${where.installationId}`, JSON.stringify(newInstallation));
        await redis.sAdd("installations:all", where.installationId.toString());
        
        return newInstallation;
      } catch (err: any) {
        console.error("❌ Error in installation upsert:", err.message);
        return create;
      }
    },

    async getAll() {
      if (!isKVConfigured) return [];
      
      try {
        const redis = await getRedisClient();
        const installationIds = await redis.sMembers("installations:all");
        const installations = [];
        
        for (const id of installationIds) {
          const data = await redis.get(`installation:${id}`);
          if (data) {
            const installation = typeof data === 'string' ? JSON.parse(data) : data;
            installations.push(installation);
          }
        }
        
        return installations;
      } catch (err: any) {
        console.error("❌ Error getting all installations:", err.message);
        return [];
      }
    },

    async delete(installationId: number | string) {
      if (!isKVConfigured) return;
      
      try {
        const redis = await getRedisClient();
        
        console.log(`🗑️  Deleting installation ${installationId} from Redis...`);
        
        // Delete the installation data
        await redis.del(`installation:${installationId}`);
        
        // Remove from the set of all installations
        await redis.sRem("installations:all", installationId.toString());
        
        console.log(`✅ Installation ${installationId} deleted from Redis`);
      } catch (err: any) {
        console.error("❌ Error deleting installation:", err.message);
      }
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

      // Try to save to Redis
      try {
        console.log(`💾 Attempting to save access request: ${email}`);
        
        const redis = await getRedisClient();
        
        await redis.set(`access_request:${id}`, JSON.stringify(request));
        await redis.set(`access_request_email:${email.toLowerCase()}`, id);
        await redis.sAdd("access_requests:all", id);
        
        console.log(`✅ Access request saved to Redis with ID: ${id}`);
      } catch (err: any) {
        console.error("❌ Failed to save to Redis:", err.message);
        throw new Error(`Failed to save access request: ${err.message}`);
      }
      
      return request;
    },

    async findAll() {
      if (!isKVConfigured) {
        console.warn("⚠️ Redis not configured - returning empty array");
        return [];
      }
      
      try {
        console.log(`🔍 Fetching all access requests from Redis...`);
        const redis = await getRedisClient();
        
        const requestIds = await redis.sMembers("access_requests:all") as string[];
        console.log(`   Found ${requestIds.length} request IDs in set`);
        
        const requests = [];
        
        for (const id of requestIds) {
          const data = await redis.get(`access_request:${id}`);
          if (data) {
            const request = typeof data === 'string' ? JSON.parse(data) : data;
            requests.push(request);
          }
        }
        
        console.log(`   Retrieved ${requests.length} full requests from Redis`);
        
        // Sort by requested date (newest first)
        return requests.sort((a: any, b: any) => 
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        );
      } catch (err: any) {
        console.error("❌ Error fetching requests:", err.message);
        return [];
      }
    },

    async findByEmail(email: string) {
      if (!isKVConfigured) return null;
      
      try {
        const redis = await getRedisClient();
        
        const requestId = await redis.get(`access_request_email:${email.toLowerCase()}`) as string | null;
        
        if (!requestId) return null;
        
        const data = await redis.get(`access_request:${requestId}`);
        if (!data) return null;
        
        const request = typeof data === 'string' ? JSON.parse(data) : data;
        return request;
      } catch (err: any) {
        console.error("❌ Error finding request by email:", err.message);
        return null;
      }
    },

    async updateStatus({ id, status, reviewedBy }: any) {
      try {
        console.log(`🔄 Updating access request ${id} to ${status}`);
        
        const redis = await getRedisClient();
        const data = await redis.get(`access_request:${id}`);
        
        if (!data) {
          console.error(`❌ Access request not found in Redis: ${id}`);
          throw new Error("Access request not found");
        }

        const request = typeof data === 'string' ? JSON.parse(data) : data;
        
        const updated = {
          ...request,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy,
        };

        await redis.set(`access_request:${id}`, JSON.stringify(updated));
        console.log(`✅ Request ${id} updated to ${status}`);

        // If approved, add to whitelist
        if (status === "approved") {
          console.log(`➕ Adding ${request.email} to whitelist`);
          await redis.sAdd("whitelist:emails", request.email.toLowerCase());
          await redis.set(`whitelist:${request.email.toLowerCase()}`, JSON.stringify({
            email: request.email.toLowerCase(),
            githubUsername: request.githubUsername,
            addedAt: new Date().toISOString(),
            addedBy: reviewedBy,
          }));
          console.log(`✅ ${request.email} added to whitelist`);
        }

        return updated;
      } catch (err: any) {
        console.error("❌ Error in updateStatus:", err.message);
        throw err;
      }
    },

    async delete(id: string) {
      if (!isKVConfigured) return;
      
      try {
        console.log(`🗑️ Deleting access request ${id}`);
        
        const redis = await getRedisClient();
        
        // Get the request first to find the email
        const data = await redis.get(`access_request:${id}`);
        
        if (data) {
          const request = typeof data === 'string' ? JSON.parse(data) : data;
          
          // Delete the email mapping
          await redis.del(`access_request_email:${request.email.toLowerCase()}`);
          console.log(`   ✅ Deleted email mapping`);
        }
        
        // Delete the request itself
        await redis.del(`access_request:${id}`);
        
        // Remove from the set of all requests
        await redis.sRem("access_requests:all", id);
        
        console.log(`✅ Access request ${id} deleted`);
      } catch (err: any) {
        console.error("❌ Error deleting access request:", err.message);
        throw err;
      }
    },
  },

  whitelist: {
    async add({ email, githubUsername, addedBy }: any) {
      if (!isKVConfigured) return {} as any;
      
      try {
        const user = {
          email: email.toLowerCase(),
          githubUsername,
          addedAt: new Date().toISOString(),
          addedBy,
        };

        const redis = await getRedisClient();
        await redis.sAdd("whitelist:emails", email.toLowerCase());
        await redis.set(`whitelist:${email.toLowerCase()}`, JSON.stringify(user));
        
        return user;
      } catch (err: any) {
        console.error("❌ Error adding to whitelist:", err.message);
        return {} as any;
      }
    },

    async remove(email: string) {
      if (!isKVConfigured) return;
      
      try {
        const redis = await getRedisClient();
        await redis.sRem("whitelist:emails", email.toLowerCase());
        await redis.del(`whitelist:${email.toLowerCase()}`);
      } catch (err: any) {
        console.error("❌ Error removing from whitelist:", err.message);
      }
    },

    isWhitelisted(email: string) {
      // This needs to be async, but keeping signature for compatibility
      // In production, make this properly async
      return false;
    },

    async isWhitelistedAsync(email: string) {
      if (!isKVConfigured) {
        console.warn("⚠️ Redis not configured - cannot check whitelist");
        return false;
      }
      
      try {
        console.log(`🔍 Checking if ${email} is whitelisted...`);
        const redis = await getRedisClient();
        const isMember = await redis.sIsMember("whitelist:emails", email.toLowerCase());
        console.log(`   Result: ${isMember ? 'YES' : 'NO'}`);
        return !!isMember;
      } catch (err: any) {
        console.error("❌ Error checking whitelist:", err.message);
        return false;
      }
    },

    async findAll() {
      if (!isKVConfigured) {
        console.warn("⚠️ Redis not configured - returning empty whitelist");
        return [];
      }
      
      try {
        console.log(`🔍 Fetching all whitelisted users from Redis...`);
        const redis = await getRedisClient();
        
        const emails = await redis.sMembers("whitelist:emails") as string[];
        console.log(`   Found ${emails.length} whitelisted emails`);
        
        const users = [];
        
        for (const email of emails) {
          const data = await redis.get(`whitelist:${email}`);
          if (data) {
            const user = typeof data === 'string' ? JSON.parse(data) : data;
            users.push(user);
          }
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

  prReview: {
    async create({ owner, repo, prNumber, prTitle, reviewedBy, issuesFound, hasHighSeverity }: any) {
      if (!isKVConfigured) {
        console.warn("⚠️ Redis not configured, skipping PR review save");
        return;
      }

      try {
        const redis = await getRedisClient();
        
        // Create a unique key for this PR (to avoid duplicates)
        const prKey = `${owner}/${repo}#${prNumber}`;
        
        // Check if a review already exists for this PR
        const existingId = await redis.get(`pr_review_key:${prKey}`) as string | null;
        
        let id: string;
        let isUpdate = false;
        
        if (existingId) {
          // Update existing review
          id = existingId;
          isUpdate = true;
          console.log(`🔄 Updating existing review for ${prKey}`);
        } else {
          // Create new review
          id = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log(`✨ Creating new review for ${prKey}`);
        }
        
        const review = {
          id,
          owner,
          repo,
          prNumber,
          prTitle,
          reviewedBy,
          issuesFound,
          hasHighSeverity,
          reviewedAt: new Date().toISOString(),
          ...(isUpdate && { updatedAt: new Date().toISOString() }),
        };

        // Store the review
        await redis.set(`pr_review:${id}`, JSON.stringify(review));
        
        // Store the PR key mapping (for deduplication)
        await redis.set(`pr_review_key:${prKey}`, id);
        
        // Add to user's reviews set (indexed by reviewedBy)
        await redis.sAdd(`pr_reviews:user:${reviewedBy}`, id);
        
        // Add to all reviews set
        await redis.sAdd("pr_reviews:all", id);
        
        console.log(`✅ PR review ${isUpdate ? 'updated' : 'saved'}: ${prKey} (${issuesFound} issues, critical: ${hasHighSeverity})`);
        
        return review;
      } catch (err: any) {
        console.error("❌ Error saving PR review:", err.message);
      }
    },

    async getByUser(username: string, limit: number = 10) {
      if (!isKVConfigured) return [];

      try {
        const redis = await getRedisClient();
        
        // Get all review IDs for this user
        const reviewIds = await redis.sMembers(`pr_reviews:user:${username}`) as string[];
        
        // Fetch all reviews
        const reviews = [];
        for (const id of reviewIds) {
          const data = await redis.get(`pr_review:${id}`);
          if (data) {
            const review = typeof data === 'string' ? JSON.parse(data) : data;
            reviews.push(review);
          }
        }
        
        // Sort by date (newest first) and limit
        return reviews
          .sort((a: any, b: any) => 
            new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
          )
          .slice(0, limit);
      } catch (err: any) {
        console.error("❌ Error fetching PR reviews:", err.message);
        return [];
      }
    },

    async getStats(username: string) {
      if (!isKVConfigured) {
        return {
          totalReviews: 0,
          cleanPRs: 0,
          criticalIssues: 0,
          totalIssues: 0,
        };
      }

      try {
        const reviews = await this.getByUser(username, 1000); // Get all reviews
        
        const totalReviews = reviews.length;
        const cleanPRs = reviews.filter((r: any) => r.issuesFound === 0).length;
        const criticalIssues = reviews.filter((r: any) => r.hasHighSeverity).length;
        const totalIssues = reviews.reduce((sum: number, r: any) => sum + r.issuesFound, 0);
        
        return {
          totalReviews,
          cleanPRs,
          criticalIssues,
          totalIssues,
        };
      } catch (err: any) {
        console.error("❌ Error calculating stats:", err.message);
        return {
          totalReviews: 0,
          cleanPRs: 0,
          criticalIssues: 0,
          totalIssues: 0,
        };
      }
    },
  },
};

