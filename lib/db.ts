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

  getAll(): Installation[];
}

interface Database {
  user: UserOperations;
  installation: InstallationOperations;
}

/**
 * In-memory DB (temporary)
 */
const userStore = new Map<string, User>();
const installationStore = new Map<number, Installation>();

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

      installationStore.set(installationId, {
        installationId,
        accountLogin,
        repoIds,
        openaiKey: openaiKey || existing?.openaiKey, // Preserve existing key if not provided
      });

      console.log("💾 Stored installation:", {
        installationId,
        accountLogin,
        repoIds,
        hasOpenAIKey: !!(openaiKey || existing?.openaiKey),
      });
    },

    async findByRepoId(repoId: number) {
      console.log("🔍 Looking up installation by repoId:", repoId);
      console.log("📦 Current installations:", Array.from(installationStore.entries()).map(([id, inst]) => ({
        id,
        accountLogin: inst.accountLogin,
        repoIds: inst.repoIds,
        hasOpenAIKey: !!inst.openaiKey,
      })));
      
      for (const installation of installationStore.values()) {
        if (installation.repoIds.includes(repoId)) {
          console.log("✅ Found installation:", {
            installationId: installation.installationId,
            hasOpenAIKey: !!installation.openaiKey,
          });
          return installation;
        }
      }
      console.log("❌ No installation found for repoId:", repoId);
      return null;
    },

    async findUnique({ where }) {
      const installation = installationStore.get(where.installationId);
      return installation || null;
    },

    async upsert({ where, update, create }) {
      const existing = installationStore.get(where.installationId);

      if (existing) {
        const updated = { ...existing, ...update };
        installationStore.set(where.installationId, updated);
        console.log("💾 Updated installation:", {
          installationId: where.installationId,
          openaiKey: updated.openaiKey ? "✅ SET" : "❌ NOT SET",
        });
        return updated;
      }

      const newInstallation: Installation = {
        installationId: create.installationId,
        accountLogin: "",
        repoIds: [],
        openaiKey: create.openaiKey,
      };

      installationStore.set(create.installationId, newInstallation);
      console.log("💾 Created installation:", {
        installationId: create.installationId,
        openaiKey: create.openaiKey ? "✅ SET" : "❌ NOT SET",
      });
      return newInstallation;
    },

    getAll() {
      return Array.from(installationStore.values());
    },
  },
};
