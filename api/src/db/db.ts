import dotenv from "dotenv";
import { readFileSync } from "fs";
import log from "log.ts";
import { dirname, join } from "path";
import pgk from "pg";
import { fileURLToPath } from "url";
import type { TRepo, TUser, TUserRepo } from "./models.ts";
const { Pool } = pgk;

dotenv.config();

type TPostgresCredentials = {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
};

class DB {
  private credentials: TPostgresCredentials;
  private pg!: pgk.Pool;

  private constructor() {
    this.credentials = {
      user: process.env.DB_USER || "",
      host: process.env.DB_HOST || "",
      database: process.env.DB_NAME || "",
      password: process.env.DB_PASSWORD || "",
      port: Number(process.env.DB_PORT) || 5432,
    };
  }

  public static async connect(): Promise<DB> {
    const db = new DB();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const schemaPath = join(__dirname, "schema.sql");
    const schemaSQL = readFileSync(schemaPath, "utf-8");
    db.pg = new Pool(db.credentials);

    // test connection on start
    try {
      await db.pg.query("SELECT NOW()");
      log.info("Connection established to postgresql");
    } catch (error) {
      log.error({ error }, "Could not connect to db");
    }

    // run schemas on start
    try {
      await db.pg.query(schemaSQL);
      log.info("Database schema loaded successfully.");
    } catch (error) {
      log.error({ error }, "Error loading database schema:");
    }

    return db;
  }

  /**
   * getUserById:
   * Checks if a user exists in the `users` table by their GitHub ID.
   *
   * @param githubId - The GitHub user ID to look up.
   * @returns A Promise that resolves to the user if found, or null if not.
   */
  public async getUserByGithubId(githubId: number): Promise<TUser> {
    const query = `
    SELECT id, github_id, username, created_at 
    FROM users 
    WHERE github_id = $1
  `;
    const { rows } = await this.pg.query<TUser>(query, [githubId]);
    return rows[0];
  }

  /**
   * createUser:
   * Inserts a new user into the `users` table with the provided GitHub ID and username.
   *
   * @param githubId - The GitHub user ID.
   * @param username - The GitHub username.
   * @returns A Promise that resolves to the newly created user.
   */
  public async createUser(githubId: number, username: string): Promise<TUser> {
    const query = `
    INSERT INTO users (github_id, username) 
    VALUES ($1, $2) 
    RETURNING *
  `;
    const { rows } = await this.pg.query<TUser>(query, [githubId, username]);
    return rows[0];
  }

  /**
   * getUserById:
   * Checks if a user exists in the `users` table by their GitHub ID.
   *
   * @param userId - The user ID to look up.
   * @param repoId - The repo ID to look up.
   * @returns A Promise that resolves to the user if found, or null if not.
   */
  public async getUserRepo(userId: number, repoId: number): Promise<TUserRepo> {
    const query = `
    SELECT *
    FROM user_repo
    WHERE user_id = $1
    AND repo_id = $2
  `;
    const { rows } = await this.pg.query<TUserRepo>(query, [userId, repoId]);
    return rows[0];
  }

  public async createUserRepo(
    userId: number,
    repoId: number,
    tigerbeetleAccountId: bigint,
    prs_opened = 0,
    prs_approved = 0,
    comments_count = 0
  ): Promise<TUserRepo> {
    const query = `
    INSERT INTO 
      user_repo (user_id, repo_id, tigerbeetle_account_id, prs_opened, prs_approved, comments_count)
    VALUES 
      ($1, $2, $3, $4, $5, $6)
    RETURNING 
      *
  `;
    const { rows } = await this.pg.query<TUserRepo>(query, [
      userId,
      repoId,
      tigerbeetleAccountId,
      prs_opened,
      prs_approved,
      comments_count,
    ]);
    return rows[0];
  }

  /**
   * createRepo:
   * Inserts a new repository into the `repos` table with the provided GitHub repository ID and name.
   *
   * @param repoId - The GitHub repository ID.
   * @param repoName - The repository name.
   * @returns A Promise that resolves to the newly created repository.
   */
  public async createRepo(repoId: number, repoName: string): Promise<TRepo> {
    const query = `
    INSERT INTO repos (repo_id, repo_name)
    VALUES ($1, $2)
    RETURNING *
  `;
    const { rows } = await this.pg.query<TRepo>(query, [repoId, repoName]);
    return rows[0];
  }

  /**
   * updateRepoTigerbeetleAccount:
   * Updates the tigerbeetle_account_id of the repository identified by the given repoId.
   *
   * @param repoId - The GitHub repository ID.
   * @param tigerbeetleAccountId - The new TigerBeetle account ID to set.
   * @returns A Promise that resolves to the updated repository.
   */
  public async updateRepoTigerbeetleAccount(
    repoId: number,
    tigerbeetleAccountId: bigint
  ): Promise<TRepo> {
    const query = `
    UPDATE repos
    SET tigerbeetle_account_id = $1
    WHERE repos.id = $2
    RETURNING *
  `;
    log.info(`Updating repo with tiger beetle account ${tigerbeetleAccountId}`);
    const { rows } = await this.pg.query<TRepo>(query, [
      tigerbeetleAccountId,
      repoId,
    ]);
    return rows[0];
  }

  /**
   * getRepoByGitServiceRepoId:
   * Fetches a repository from the `repos` table using the provided GitHub/GitLab/etc repository ID.
   *
   * @param githubRepoId - The GitHub repository ID.
   * @returns A Promise that resolves to a TDBResponse<TRepo> containing the repository data if found.
   */
  public async getRepoByGitServiceRepoId(githubRepoId: number): Promise<TRepo> {
    const query = `
    SELECT * 
    FROM repos 
    WHERE repo_id = $1
  `;
    const { rows } = await this.pg.query<TRepo>(query, [githubRepoId]);
    return rows[0];
  }
}

export default await DB.connect();
