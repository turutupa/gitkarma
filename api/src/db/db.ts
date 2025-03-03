import dotenv from "dotenv";
import log from "log.ts";
import pgk from "pg";
import type { EPullRequestState } from "webhooks/constants.ts";
import type {
  TPullRequest,
  TRepo,
  TRepoAndUsers,
  TUser,
  TUserRepo,
} from "./models.ts";
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
    db.pg = new Pool(db.credentials);
    // test connection on start
    try {
      await db.pg.query("SELECT NOW()");
      log.info("Connection established to postgresql");
    } catch (error) {
      log.error({ error }, "Could not connect to db");
    }
    return db;
  }

  public async getAllReposDataForUser(
    gitUserId: string
  ): Promise<TRepoAndUsers[]> {
    const query = `
      SELECT
        r.*,
        (
          SELECT json_agg(
                  json_build_object(
                    'id', u.id,
                    'github_id', u.github_id,
                    'github_username', u.github_username,
                    'prs_opened', ur.prs_opened,
                    'prs_approved', ur.prs_approved,
                    'comments_count', ur.comments_count,
                    'created_at', u.created_at
                  )
                )
          FROM user_repo ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.repo_id = r.id
        ) AS users
      FROM repos r
      WHERE r.id IN (
        SELECT repo_id
        FROM user_repo
        WHERE user_id = (
          SELECT id FROM users WHERE github_id = $1
        )
      );
    `;
    const { rows } = await this.pg.query(query, [gitUserId]);
    return rows;
  }

  /**
   * getUserByGithubId:
   * Checks if a user exists in the `users` table by their GitHub ID.
   *
   * @param githubId - The GitHub user ID to look up.
   * @returns A Promise that resolves to the user if found, or null if not.
   */
  public async getUserByGithubUserId(githubId: number): Promise<TUser> {
    const query = `
      SELECT 
        id, 
        github_id, 
        github_username, 
        created_at 
      FROM users u
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

  /**
   * getUserRepoByGithubUserAndRepoId:
   *
   *
   * @param githubUserId
   * @param githubRepoId
   * @returns
   */
  public async getUserRepoByGithubUserAndRepoId(
    githubUserId: number,
    githubRepoId: number
  ): Promise<TUserRepo> {
    const query = `
      SELECT 
        ur.*,
        (SELECT u.github_username FROM users u WHERE u.id = ur.user_id) AS github_username
      FROM 
        user_repo ur
      WHERE 
        ur.user_id = (SELECT id FROM users u WHERE u.github_id = $1) 
      AND 
        ur.repo_id = (SELECT id FROM repos r WHERE r.repo_id = $2)
    `;
    const { rows } = await this.pg.query<TUserRepo>(query, [
      githubUserId,
      githubRepoId,
    ]);
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
   * Inserts a new repository into the `repos` table with the provided GitHub repository ID, name, and owner.
   *
   * @param repoId - The GitHub repository ID.
   * @param repoName - The repository name.
   * @param repoOwner - The repository owner.
   * @returns A Promise that resolves to the newly created repository.
   */
  public async createRepo(
    repoId: number,
    repoName: string,
    repoOwner: string
  ): Promise<TRepo> {
    const query = `
      INSERT INTO repos (repo_id, repo_name, repo_owner)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await this.pg.query<TRepo>(query, [
      repoId,
      repoName,
      repoOwner,
    ]);
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
  public async getRepoByGithubRepoId(githubRepoId: number): Promise<TRepo> {
    const query = `
      SELECT * 
      FROM repos 
      WHERE repo_id = $1
    `;
    const { rows } = await this.pg.query<TRepo>(query, [githubRepoId]);
    return rows[0];
  }

  // New method to update repo configuration settings
  public async updateRepoSettings(
    repoInternalId: number,
    settings: {
      initial_debits?: number;
      approval_bonus?: number;
      comment_bonus?: number;
      complexity_bonus?: number;
      merge_penalty?: number;
      enable_complexity_bonus?: boolean;
      enable_review_quality_bonus?: boolean;
      trigger_recheck_text?: string;
      admin_trigger_recheck_text?: string;
    }
  ): Promise<TRepo> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (settings.initial_debits !== undefined) {
      params.push(settings.initial_debits);
      setClauses.push(`initial_debits = $${params.length}`);
    }
    if (settings.approval_bonus !== undefined) {
      params.push(settings.approval_bonus);
      setClauses.push(`approval_bonus = $${params.length}`);
    }
    if (settings.comment_bonus !== undefined) {
      params.push(settings.comment_bonus);
      setClauses.push(`comment_bonus = $${params.length}`);
    }
    if (settings.complexity_bonus !== undefined) {
      params.push(settings.complexity_bonus);
      setClauses.push(`complexity_bonus = $${params.length}`);
    }
    if (settings.merge_penalty !== undefined) {
      params.push(settings.merge_penalty);
      setClauses.push(`merge_penalty = $${params.length}`);
    }
    if (settings.enable_complexity_bonus !== undefined) {
      params.push(settings.enable_complexity_bonus);
      setClauses.push(`enable_complexity_bonus = $${params.length}`);
    }
    if (settings.enable_review_quality_bonus !== undefined) {
      params.push(settings.enable_review_quality_bonus);
      setClauses.push(`enable_review_quality_bonus = $${params.length}`);
    }
    if (settings.trigger_recheck_text !== undefined) {
      params.push(settings.trigger_recheck_text);
      setClauses.push(`trigger_recheck_text = $${params.length}`);
    }
    if (settings.admin_trigger_recheck_text !== undefined) {
      params.push(settings.admin_trigger_recheck_text);
      setClauses.push(`admin_trigger_recheck_text = $${params.length}`);
    }

    if (setClauses.length === 0) {
      throw new Error("No fields provided to update");
    }

    params.push(repoInternalId);
    const query = `
      UPDATE repos
      SET ${setClauses.join(", ")}
      WHERE id = $${params.length}
      RETURNING *
    `;
    const { rows } = await this.pg.query<TRepo>(query, params);
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
      RETURNING *
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
      LIMIT 1
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
    RETURNING *
  `;

    const { rows } = await this.pg.query<TPullRequest>(query, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

export default await DB.connect();
