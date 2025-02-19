import dotenv from "dotenv";
import { readFileSync } from "fs";
import log from "log.ts";
import { dirname, join } from "path";
import pgk from "pg";
import { fileURLToPath } from "url";
import type { EPullRequestState } from "webhooks/constants.ts";
import type { TPullRequest, TRepo, TUser, TUserRepo } from "./models.ts";
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
      SELECT id, github_id, github_username, created_at 
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
   * @param githubUsername - The GitHub username.
   * @returns A Promise that resolves to the newly created user.
   */
  public async createUser(
    githubId: number,
    githubUsername: string
  ): Promise<TUser> {
    const query = `
      INSERT INTO users (github_id, github_username) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    const { rows } = await this.pg.query<TUser>(query, [
      githubId,
      githubUsername,
    ]);
    return rows[0];
  }

  /**
   * getUserRepo:
   * Get the user-repo entry given a user's and repo's id
   *
   * @param userId - The user ID (from repos table - not the github service user id)
   * @param repoId - The repo ID (from repos table - not the github service repo id)
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

  /**
   * createPullRequest:
   * Inserts a new pull request record into the pull_requests table.
   *
   * @param prNumber - The Git Service PR number (unique per repo).
   * @param repoId - The internal repository id.
   * @param userId - The internal user id for the PR creator.
   * @param headSha - The commit SHA of the PR's head.
   * @param state - The state of the pull request (e.g., 'open', 'closed', 'merged').
   * @param checkPassed - Optional flag indicating if the GitKarma check has passed (defaults to false).
   * @returns A Promise that resolves to the newly created pull request record.
   */
  public async createPullRequest(
    prNumber: number,
    repoId: number,
    userId: number,
    headSha: string,
    state: string,
    checkPassed: boolean = false
  ): Promise<TPullRequest> {
    const query = `
      INSERT INTO 
        pull_requests (pr_number, repo_id, user_id, head_sha, state, check_passed)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows } = await this.pg.query<TPullRequest>(query, [
      prNumber,
      repoId,
      userId,
      headSha,
      state,
      checkPassed,
    ]);
    return rows[0];
  }

  /**
   * getPullRequest:
   * Fetches a pull request record by its Git Service PR number and repository id.
   *
   * @param prNumber - The pull request number from the git service.
   * @param repoId - The internal repository id (from your repos table).
   * @returns - A Promise that resolves to the pull request record if found, or null.
   */
  public async getPullRequest(
    prNumber: number,
    repoId: number
  ): Promise<TPullRequest | null> {
    const query = `
      SELECT *
      FROM pull_requests
      WHERE pr_number = $1 AND repo_id = $2
      LIMIT 1;
    `;
    const { rows } = await this.pg.query<TPullRequest>(query, [
      prNumber,
      repoId,
    ]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * updatePullRequest:
   * Updates one or more fields of a pull request record.
   *
   * @param prNumber - The Git Service PR number.
   * @param repoId - The internal repository id.
   * @param updates - An object that can include the new state and/or check_passed flag.
   * @returns A Promise that resolves to the updated pull request record if found, or null.
   */
  public async updatePullRequest(
    prNumber: number,
    repoId: number,
    updates: { state?: EPullRequestState; checkPassed?: boolean }
  ): Promise<TPullRequest | null> {
    const setClauses: string[] = [];
    const params: any[] = [];

    // Build SET clauses and parameters dynamically.
    if (updates.state !== undefined) {
      params.push(updates.state);
      setClauses.push(`state = $${params.length}`);
    }
    if (updates.checkPassed !== undefined) {
      params.push(updates.checkPassed);
      setClauses.push(`check_passed = $${params.length}`);
    }
    // If no fields are provided, return the existing record.
    if (setClauses.length === 0) {
      return await this.getPullRequest(prNumber, repoId);
    }
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the WHERE clause parameters.
    params.push(prNumber, repoId);

    // The position of prNumber and repoId in the parameter array.
    const prParamPosition = params.length - 1; // second-to-last parameter
    const repoParamPosition = params.length; // last parameter

    const query = `
    UPDATE pull_requests
    SET ${setClauses.join(", ")}
    WHERE pr_number = $${prParamPosition} AND repo_id = $${repoParamPosition}
    RETURNING *;
  `;

    const { rows } = await this.pg.query<TPullRequest>(query, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

export default await DB.connect();
