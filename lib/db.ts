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
  }): Promise<void>;

  findByRepoId(repoId: number): Promise<Installation | null>;
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
    async saveInstallation({ installationId, accountLogin, repositories }) {
      const repoIds = repositories.map(r => r.id);

      installationStore.set(installationId, {
        installationId,
        accountLogin,
        repoIds,
      });

      console.log("💾 Stored installation:", {
        installationId,
        accountLogin,
        repoIds,
      });
    },

    async findByRepoId(repoId: number) {
      for (const installation of installationStore.values()) {
        if (installation.repoIds.includes(repoId)) {
          return installation;
        }
      }
      return null;
    },
  },
};
