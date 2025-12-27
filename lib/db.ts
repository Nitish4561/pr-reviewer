// Placeholder database client
// TODO: Install and configure Prisma or another database client

interface EncryptedData {
  iv: string;
  content: string;
  tag: string;
}

interface User {
  githubId: string;
  openaiKey?: EncryptedData;
}

interface UserOperations {
  upsert(params: {
    where: { githubId: string };
    update: { openaiKey: EncryptedData };
    create: {
      githubId: string;
      openaiKey: EncryptedData;
    };
  }): Promise<User>;
}

interface Database {
  user: UserOperations;
}

// Temporary in-memory storage (replace with real database)
const inMemoryStore = new Map<string, User>();

export const db: Database = {
  user: {
    async upsert({ where, update, create }) {
      const existing = inMemoryStore.get(where.githubId);
      
      if (existing) {
        const updated = { ...existing, ...update };
        inMemoryStore.set(where.githubId, updated);
        return updated;
      } else {
        const newUser = { ...create };
        inMemoryStore.set(create.githubId, newUser);
        return newUser;
      }
    },
  },
};

