import log from "@/log";
import type { EPullRequestState } from "@/webhooks/constants";
import dotenv from "dotenv";
import pgk from "pg";
import { EReviewState } from "./entities/Review";
import { EUserRepoRole } from "./entities/UserRepo";
import type {
  TActivityLog,
  TPullRequest,
  TPullRequestsByRepoId,
  TRepo,
  TRepoAndUsers,
  TTransfer,
  TUser,
  TUserRepo,
  TUsersGlobalStats,
  TWeeklyComments,
  TWeeklyPullRequests,
  TWeeklyReviews,
} from "./models";
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
    const addressLog = {
      address: db.credentials.host + ":" + db.credentials.port,
    };
    console.log("[postgres]", JSON.stringify(addressLog, null, 2));
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

  /**
   * getAllGithubReposDataForUser
   * Fetches all the data of all repos associated with a user.
   *
   * @param githubUserId
   * @returns
   */
  public async getAllGithubReposDataForUser(
    githubUserId: string
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
                    'role', ur.role,
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
    const { rows } = await this.pg.query(query, [githubUserId]);
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
        github_url,
        created_at 
      FROM users u
      WHERE github_id = $1
    `;
    const { rows } = await this.pg.query<TUser>(query, [githubId]);
    return rows[0];
  }

  /**
   * updateUserGithubUrl:
   *
   * @param githubId - Internal user ID.
   * @param githubUrl - The GitHub
   * @returns A Promise that resolves to the newly created user.
   */
  public async updateUserGithubUrl(
    userId: number,
    githubUrl: string
  ): Promise<TUser> {
    const query = `
      UPDATE users  
      SET github_url = $2
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await this.pg.query<TUser>(query, [userId, githubUrl]);
    return rows[0];
  }

  /**
   * updateUserGithubUrl:
   * Inserts a new user into the `users` table with the provided GitHub ID and username.
   *
   * @param githubId - The GitHub user ID.
   * @param githubUsername - The GitHub username.
   * @returns A Promise that resolves to the newly created user.
   */
  public async createUser(
    githubId: number,
    githubUsername: string,
    githubUrl?: string
  ): Promise<TUser> {
    const query = `
      INSERT INTO users (github_id, github_username, github_url) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const { rows } = await this.pg.query<TUser>(query, [
      githubId,
      githubUsername,
      githubUrl,
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

  /**
   * getUsersInRepo:
   * Fetches all users in a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an array of user IDs and TigerBeetle account IDs.
   */
  public async getUsersInRepo(repoId: number) {
    const query = `
      SELECT 
        user_id as id, 
        tigerbeetle_account_id as tbAccountId 
      FROM 
        user_repo
      WHERE repo_id = $1
    `;
    const params = [repoId];
    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  /**
   * createUserRepo:
   * Creates a new user-repo relationship in the `user_repo` table.
   *
   * @param userId - The internal user ID.
   * @param repoId - The internal repository ID.
   * @param tigerbeetleAccountId - The TigerBeetle account ID associated with the user.
   * @param role - The role of the user in the repository (default: COLLABORATOR).
   * @param prs_opened - The number of pull requests opened by the user (default: 0).
   * @param prs_approved - The number of pull requests approved by the user (default: 0).
   * @param comments_count - The number of comments made by the user (default: 0).
   * @returns A Promise that resolves to the newly created user-repo record.
   */
  public async createUserRepo(
    userId: number,
    repoId: number,
    tigerbeetleAccountId: bigint,
    role = EUserRepoRole.COLLABORATOR,
    prs_opened = 0,
    prs_approved = 0,
    comments_count = 0
  ): Promise<TUserRepo> {
    const query = `
      INSERT INTO 
        user_repo (user_id, repo_id, tigerbeetle_account_id, role, prs_opened, prs_approved, comments_count)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        *
    `;
    const { rows } = await this.pg.query<TUserRepo>(query, [
      userId,
      repoId,
      tigerbeetleAccountId,
      role,
      prs_opened,
      prs_approved,
      comments_count,
    ]);
    return rows[0];
  }

  /**
   * updateUserRepoRole:
   * Updates the role of a user for a specific repository in the user_repo table.
   *
   * @param userId - The internal user ID.
   * @param repoId - The internal repository ID.
   * @param role - The new role to assign to the user.
   * @returns A Promise that resolves to the updated user-repo record if successful.
   */
  public async updateUserRepoRole(
    userId: number,
    repoId: number,
    role: EUserRepoRole
  ): Promise<TUserRepo> {
    const query = `
      UPDATE user_repo
      SET role = $1
      WHERE user_id = $2 AND repo_id = $3
      RETURNING *
    `;
    const { rows } = await this.pg.query<TUserRepo>(query, [
      role,
      userId,
      repoId,
    ]);

    if (rows.length === 0) {
      throw new Error(
        `No user-repo relation found for user ${userId} and repo ${repoId}`
      );
    }

    return rows[0];
  }

  public async;

  /**
   * createRepo:
   * Inserts a new repository into the `repos` table with the provided GitHub repository ID, name, and owner.
   *
   * @param repoId - The GitHub repository ID.
   * @param repoName - The repository name.
   * @param repoOwner - The repository owner.
   * @param installationId - The installation ID.
   * @returns A Promise that resolves to the newly created repository.
   */
  public async createRepo(
    repoId: number,
    repoName: string,
    repoOwner: string,
    installationId: number
  ): Promise<TRepo> {
    const query = `
      INSERT INTO repos (repo_id, repo_name, repo_owner, installation_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await this.pg.query<TRepo>(query, [
      repoId,
      repoName,
      repoOwner,
      installationId,
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
   * getRepoByGithubRepoId:
   * Fetches a repository from the `repos` table using the provided GitHub/GitLab/etc repository ID.
   *
   * @param githubRepoId - The GitHub repository ID.
   * @returns A Promise that resolves to a TDBResponse<TRepo> containing the repository data if found.
   */
  public async getRepoByGithubRepoId(githubRepoId: number): Promise<TRepo> {
    const query = `
      SELECT 
        id, 
        installation_id, 
        repo_id, 
        repo_name, 
        repo_owner,
        tigerbeetle_account_id,
        created_at,
        initial_debits,
        review_bonus,
        approval_bonus,
        comment_bonus,
        complexity_bonus,
        merge_penalty,
        timely_review_bonus,
        timely_review_bonus_hours,
        timely_review_bonus_enabled,
        enable_complexity_bonus,
        enable_review_quality_bonus,
        trigger_recheck_text,
        admin_trigger_recheck_text,
        disable_gitkarma
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
      review_bonus?: number;
      timely_review_bonus_enabled?: boolean;
      timely_review_bonus?: number;
      timely_review_bonus_hours?: number;
      comment_bonus?: number;
      complexity_bonus?: number;
      merge_penalty?: number;
      enable_complexity_bonus?: boolean;
      enable_review_quality_bonus?: boolean;
      trigger_recheck_text?: string;
      admin_trigger_recheck_text?: string;
      disable_gitkarma?: boolean;
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
    if (settings.review_bonus !== undefined) {
      params.push(settings.review_bonus);
      setClauses.push(`review_bonus = $${params.length}`);
    }
    if (settings.timely_review_bonus_enabled !== undefined) {
      params.push(settings.timely_review_bonus_enabled);
      setClauses.push(`timely_review_bonus_enabled = $${params.length}`);
    }
    if (settings.timely_review_bonus !== undefined) {
      params.push(settings.timely_review_bonus);
      setClauses.push(`timely_review_bonus = $${params.length}`);
    }
    if (settings.timely_review_bonus_hours !== undefined) {
      params.push(settings.timely_review_bonus_hours);
      setClauses.push(`timely_review_bonus_hours = $${params.length}`);
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
    if (settings.disable_gitkarma !== undefined) {
      params.push(settings.disable_gitkarma);
      setClauses.push(`disable_gitkarma = $${params.length}`);
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
   * @param checkPassed - Optional flag indicating if the gitkarma check has passed (defaults to false).
   * @returns A Promise that resolves to the newly created pull request record.
   */
  public async createPullRequest(
    repoId: number,
    userId: number,
    prNumber: number,
    prTitle: string,
    prUrl: string,
    prDescription: string,
    prNumChangedFiles: number,
    headSha: string,
    state: string,
    checkPassed: boolean = false
  ): Promise<TPullRequest> {
    const query = `
      INSERT INTO 
        pull_requests (
          repo_id, 
          user_id, 
          pr_number, 
          pr_title, 
          pr_url, 
          pr_description, 
          pr_num_changed_files, 
          head_sha, 
          state, 
          check_passed
        )
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const { rows } = await this.pg.query<TPullRequest>(query, [
      repoId,
      userId,
      prNumber,
      prTitle,
      prUrl,
      prDescription,
      prNumChangedFiles,
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
    updates: {
      state?: EPullRequestState;
      checkPassed?: boolean;
      adminApproved?: boolean;
    }
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
    if (updates.adminApproved !== undefined) {
      params.push(updates.adminApproved);
      setClauses.push(`admin_approved = $${params.length}`);
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

  /**
   * createPullRequestReview:
   * Inserts a new pull request review record into the `reviews` table.
   *
   * @param reviewData - An object containing the review data.
   * @param reviewData.pr_number - The pull request number.
   * @param reviewData.repoId - The internal repository ID.
   * @param reviewData.reviewerId - The internal user ID of the reviewer.
   * @param reviewData.state - The state of the review (e.g., 'APPROVED', 'CHANGES_REQUESTED').
   * @param reviewData.reviewId - (Optional) The GitHub review ID.
   * @param reviewData.body - (Optional) The body of the review.
   * @param reviewData.commitId - (Optional) The commit ID associated with the review.
   * @returns A Promise that resolves to the created review record.
   */
  public async createPullRequestReview(reviewData: {
    pr_number: number;
    repoId: number;
    reviewerId: number;
    url: string;
    state: string;
    reviewId?: string;
    body?: string;
    commitId?: string;
  }): Promise<any> {
    // Convert GitHub review state to our enum
    const reviewState = this.mapGitHubReviewStateToEnum(reviewData.state);

    // Insert the review with a direct subquery to find the pull_request_id
    const reviewQuery = `
      INSERT INTO reviews 
        (review_id, pull_request_id, reviewer_id, url, state, body, commit_id)
      VALUES (
        $1, 
        (SELECT id FROM pull_requests WHERE pr_number = $2 AND repo_id = $3), 
        $4, 
        $5, 
        $6, 
        $7,
        $8
      )
      RETURNING *
    `;

    const reviewParams = [
      reviewData.reviewId || null,
      reviewData.pr_number,
      reviewData.repoId,
      reviewData.reviewerId,
      reviewData.url,
      reviewState,
      reviewData.body,
      reviewData.commitId,
    ];

    const { rows } = await this.pg.query(reviewQuery, reviewParams);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * createPullRequestReviewComment:
   * Inserts a new review comment into the `review_comments` table.
   *
   * @param commentData - An object containing the review comment data.
   * @param commentData.reviewId - The internal review ID.
   * @param commentData.commentId - The GitHub comment ID.
   * @param commentData.url - The URL of the comment.
   * @param commentData.body - The body of the comment.
   * @param commentData.path - The file path the comment was made on.
   * @param commentData.position - The line position in the diff.
   * @param commentData.line - The line number in the file.
   * @returns A Promise that resolves to the created review comment record.
   */
  public async createPullRequestReviewComment(commentData: {
    reviewId: number;
    commentId: string;
    url: string;
    body: string;
    path: string;
    position: number;
    line: number;
  }): Promise<any> {
    const query = `
      INSERT INTO review_comments 
        (review_id, comment_id, url, body, path, position, line)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      commentData.reviewId,
      commentData.commentId,
      commentData.url,
      commentData.body,
      commentData.path,
      commentData.position,
      commentData.line,
    ];
    const { rows } = await this.pg.query(query, params);
    return rows[0];
  }

  /**
   * updatePullRequestReviewComment:
   * Updates an existing review comment in the `review_comments` table.
   *
   * @param commentId - The GitHub comment ID.
   * @param updates - An object containing the fields to update.
   * @param updates.body - (Optional) The updated body of the comment.
   * @param updates.path - (Optional) The updated file path the comment was made on.
   * @param updates.position - (Optional) The updated line position in the diff.
   * @param updates.line - (Optional) The updated line number in the file.
   * @returns A Promise that resolves to the updated review comment record.
   */
  public async updatePullRequestReviewComment(
    commentId: string,
    updates: {
      body?: string;
      path?: string;
      position?: number;
      line?: number;
    }
  ): Promise<any> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.body !== undefined) {
      params.push(updates.body);
      setClauses.push(`body = $${params.length}`);
    }
    if (updates.path !== undefined) {
      params.push(updates.path);
      setClauses.push(`path = $${params.length}`);
    }
    if (updates.position !== undefined) {
      params.push(updates.position);
      setClauses.push(`position = $${params.length}`);
    }
    if (updates.line !== undefined) {
      params.push(updates.line);
      setClauses.push(`line = $${params.length}`);
    }

    if (setClauses.length === 0) {
      throw new Error("No fields provided to update");
    }

    params.push(commentId);
    const query = `
      UPDATE review_comments
      SET ${setClauses.join(", ")}
      WHERE comment_id = $${params.length}
      RETURNING *
    `;
    const { rows } = await this.pg.query(query, params);
    return rows[0];
  }

  /**
   * deletePullRequestReviewComment:
   * Deletes a review comment from the `review_comments` table.
   *
   * @param commentId - The GitHub comment ID.
   * @returns A Promise that resolves to a boolean indicating whether the deletion was successful.
   */
  public async deletePullRequestReviewComment(
    commentId: string
  ): Promise<boolean> {
    const query = `
      DELETE FROM review_comments
      WHERE comment_id = $1
    `;
    const { rowCount } = await this.pg.query(query, [commentId]);
    return rowCount !== null && rowCount > 0;
  }

  /**
   * && rowCount alStats:
   * Inserts a new activity log into the `activity_logs` table.
   *
   * @param repoId - The internal repository ID.
   * @param userId - The internal user ID.
   * @returns A Promise that resolves to the newly created activity log record.
   */
  public async getUsersGlobalStats(
    repoId: number
  ): Promise<TUsersGlobalStats[]> {
    const query = `
      SELECT
        u.id AS user_id,
        u.github_id,
        u.github_username,
        u.github_url,
        (
          SELECT COUNT(*)
          FROM pull_requests pr
          WHERE pr.repo_id = $1 AND pr.user_id = u.id
        ) AS pull_request_count,
        (
          SELECT COUNT(*)
          FROM reviews r
          JOIN pull_requests pr ON r.pull_request_id = pr.id
          WHERE pr.repo_id = $1 AND r.reviewer_id = u.id
        ) AS review_count
      FROM user_repo ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.repo_id = $1;
    `;
    const { rows } = await this.pg.query(query, [repoId]);
    return rows;
  }

  /**
   * getRepoActivity:
   * Fetches all pull requests and reviews for a repository with minimal data for UI rendering.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an array of activity records containing user avatar, username, action, and date.
   */
  public async getRepoActivity(repoId: number): Promise<
    Array<{
      user_avatar: string;
      user_name: string;
      action: string;
      date: Date;
    }>
  > {
    const query = `
      SELECT
        u.github_avatar AS user_avatar,
        u.github_username AS user_name,
        (select pr.pr_number from pull_requests pr where al.pull_request_id = pr.id),
        al.event,
        al.description,
        al.description_url,
        al.created_at 
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.repo_id = $1
      ORDER BY al.created_at DESC
    `;

    const { rows } = await this.pg.query(query, [repoId]);
    return rows;
  }

  /**
   * createActivityLog:
   * Inserts a new activity log into the `activity_logs` table.
   *
   * @param repoId - The internal repository ID.
   * @param prId - The internal pull request ID.
   * @param userId - The internal user ID.
   * @param description - e.g., (pr) merged/closed/open, re-check triggered, admin override
   * @param description_url - link to gitkarma comment on the PR
   * @param action - spent / received funds
   * @param debits - number of debits spent/received
   * @returns A Promise that resolves to the newly created activity log record.
   */
  public async createActivityLog(
    repoId: number,
    prId: number,
    userId: number,
    event: string,
    description: string = "",
    descriptionUrl: string = "",
    action: string = "",
    debits: number = 0
  ): Promise<TActivityLog> {
    const query = `
      INSERT INTO activity_logs 
        (
          repo_id, 
          pull_request_id, 
          user_id, 
          event, 
          description, 
          description_url, 
          action, 
          debits
        )
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const { rows }: { rows: TActivityLog[] } = await this.pg.query(query, [
      repoId,
      prId,
      userId,
      event,
      description,
      descriptionUrl,
      action,
      debits,
    ]);
    return rows[0];
  }

  /**
   * getActivityLogs:
   * Fetches activity logs for a specific repository with optional filters.
   *
   * @param repoId - The internal repository ID (mandatory).
   * @param filters - Optional filters for the query.
   * @param filters.userId - Filter by user ID.
   * @param filters.entityType - Filter by entity type (e.g., 'pull_request', 'review').
   * @param filters.startDate - Filter logs created after this date (defaults to 7 days ago).
   * @param filters.endDate - Filter logs created before this date (defaults to now).
   * @returns A Promise that resolves to an array of activity logs.
   */
  public async getActivityLogs(
    repoId: number,
    filters?: {
      userId?: number | undefined;
      event?: string | undefined;
      startDate?: Date | undefined;
      endDate?: Date | undefined;
    }
  ): Promise<TActivityLog[]> {
    const whereClauses: string[] = ["al.repo_id = $1"];
    const params: any[] = [repoId];

    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    const startDate = filters?.startDate || lastWeek;
    const endDate = filters?.endDate || now;

    // Convert dates to ISO strings
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // Use BETWEEN for date range
    params.push(startDateISO);
    params.push(endDateISO);
    whereClauses.push(
      `al.created_at BETWEEN $${params.length - 1} AND $${params.length}`
    );

    if (filters?.userId !== undefined) {
      params.push(filters.userId);
      whereClauses.push(`al.user_id = $${params.length}`);
    }
    if (filters?.event !== undefined) {
      params.push(filters.event);
      whereClauses.push(`event = $${params.length}`);
    }

    const query = `
      SELECT 
        u.github_id as github_user_id,
        u.github_username,
        pr.pr_number,
        pr.pr_title,
        pr.pr_url,
        al.event,
        al.description,
        al.description_url,
        al.action,
        al.debits,
        al.created_at
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      JOIN pull_requests pr ON al.pull_request_id = pr.id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY al.created_at DESC;
    `;

    const { rows }: { rows: TActivityLog[] } = await this.pg.query(
      query,
      params
    );
    return rows;
  }

  /**
   * getPullRequestsByRepoId:
   * Fetches pull requests for a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @param startDate - Optional start date to filter pull requests.
   * @param endDate - Optional end date to filter pull requests.
   * @returns A Promise that resolves to an array of pull request records.
   */
  public async getPullRequestsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TPullRequestsByRepoId[]> {
    let query = `
      SELECT 
        id, 
        (SELECT github_username FROM users u WHERE u.id = pr.user_id) as github_username, 
        created_at 
      FROM 
        pull_requests pr
      WHERE 
        repo_id = $1 
    `;

    const params: (number | string)[] = [repoId];

    // Add date filtering if provided
    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND created_at <= $${params.length}`;
    }

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  public async getWeeklyPullRequestsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TWeeklyPullRequests[]> {
    let query = `
    SELECT 
      EXTRACT('isoyear' FROM created_at) AS year,
      EXTRACT('week' FROM created_at) AS week_number,
      COUNT(*) AS pr_count
    FROM 
      pull_requests
    WHERE 
      repo_id = $1
  `;

    const params: (number | string)[] = [repoId];

    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND created_at <= $${params.length}`;
    }

    query += `
    GROUP BY year, week_number
    ORDER BY year ASC, week_number ASC
  `;

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  /**
   * getReviewsByRepoId:
   * Fetches reviews for pull requests in a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an array of review records.
   */
  public async getReviewsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TPullRequestsByRepoId[]> {
    let query = `
      SELECT 
        id, 
        (SELECT github_username FROM users u WHERE u.id = r.reviewer_id) as github_username, 
        created_at 
      FROM 
        reviews r
      WHERE 
        pull_request_id in (SELECT prs.id FROM pull_requests prs WHERE prs.repo_id = $1) 
    `;

    const params: (number | string)[] = [repoId];

    // Add date filtering if provided
    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND created_at <= $${params.length}`;
    }

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  public async getWeeklyReviewsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TWeeklyReviews[]> {
    let query = `
      SELECT 
        EXTRACT('isoyear' FROM created_at) AS year,
        EXTRACT('week' FROM created_at) AS week_number,
        COUNT(*) AS review_count
      FROM 
        reviews r
      WHERE 
        pull_request_id IN (SELECT prs.id FROM pull_requests prs WHERE prs.repo_id = $1)
    `;

    const params: (number | string)[] = [repoId];

    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND created_at <= $${params.length}`;
    }

    query += `
      GROUP BY year, week_number
      ORDER BY year ASC, week_number ASC
    `;

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  /**
   * getCommentsByRepoId:
   * Fetches review comments for a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an array of comment records.
   */
  public async getCommentsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TPullRequestsByRepoId[]> {
    let query = `
        SELECT 
          rc.id, 
          rc.created_at,
          (SELECT github_username FROM users u WHERE r.reviewer_id = u.id)
        FROM 
          review_comments rc
        JOIN reviews r ON rc.review_id = r.review_id
        JOIN pull_requests pr ON r.pull_request_id = pr.id
        WHERE 
          pr.repo_id = $1 
    `;
    const params: (number | string)[] = [repoId];
    // Add date filtering if provided
    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND rc.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND rc.created_at <= $${params.length}`;
    }
    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  public async getWeeklyCommentsByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TWeeklyComments[]> {
    let query = `
      SELECT 
        EXTRACT('isoyear' FROM rc.created_at) AS year,
        EXTRACT('week' FROM rc.created_at) AS week_number,
        COUNT(*) AS comment_count
      FROM 
        review_comments rc
      JOIN reviews r ON rc.review_id = r.review_id
      JOIN pull_requests pr ON r.pull_request_id = pr.id
      WHERE 
        pr.repo_id = $1
    `;

    const params: (number | string)[] = [repoId];

    if (startDate) {
      params.push(startDate.toISOString());
      query += ` AND rc.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString());
      query += ` AND rc.created_at <= $${params.length}`;
    }

    query += `
      GROUP BY year, week_number
      ORDER BY year ASC, week_number ASC
    `;

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  /**
   * getDebitsAwardedByRepoId:
   * Fetches transfer logs for a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an array of transfer records.
   */
  public async getDebitsAwardedByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TTransfer[]> {
    const whereClauses: string[] = [
      "al.repo_id = $1",
      "al.action = 'received'",
    ];
    const params: (number | string)[] = [repoId];

    if (startDate) {
      params.push(startDate.toISOString());
      whereClauses.push(`al.created_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate.toISOString());
      whereClauses.push(`al.created_at <= $${params.length}`);
    }

    const query = `
      SELECT
        (SELECT github_username FROM users u WHERE u.id = al.user_id) as github_username, 
        action, 
        debits, 
        created_at 
      FROM
        activity_logs al
      WHERE
        ${whereClauses.join(" AND ")}
      ORDER BY created_at ASC
    `;

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  public async getWeeklyDebitsAwardedByRepoId(
    repoId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ year: number; week_number: number; debit_count: number }[]> {
    const whereClauses: string[] = [
      "al.repo_id = $1",
      "al.action = 'received'",
    ];
    const params: (number | string)[] = [repoId];

    if (startDate) {
      params.push(startDate.toISOString());
      whereClauses.push(`al.created_at >= $${params.length}`);
    }

    if (endDate) {
      params.push(endDate.toISOString());
      whereClauses.push(`al.created_at <= $${params.length}`);
    }

    const query = `
      SELECT
        EXTRACT('isoyear' FROM al.created_at) AS year,
        EXTRACT('week' FROM al.created_at) AS week_number,
        COUNT(*) AS debit_count
      FROM
        activity_logs al
      WHERE
        ${whereClauses.join(" AND ")}
      GROUP BY year, week_number
      ORDER BY year ASC, week_number ASC
    `;

    const { rows } = await this.pg.query(query, params);
    return rows;
  }

  /**
   * getRepoSummaryStats:
   * Fetches summary statistics for a specific repository.
   *
   * @param repoId - The internal repository ID.
   * @returns A Promise that resolves to an object containing the summary statistics.
   */
  public async getRepoSummaryStats(repoId: number): Promise<{
    commentsThisMonth: number;
    commentsLastMonth: number;
    pullRequestsThisMonth: number;
    pullRequestsLastMonth: number;
    reviewsThisMonth: number;
    reviewsLastMonth: number;
    debitsThisMonth: number;
    debitsLastMonth: number;
  }> {
    const query = `
      WITH date_ranges AS (
        SELECT
          date_trunc('month', CURRENT_DATE) AS this_month_start,
          date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AS last_month_start,
          date_trunc('month', CURRENT_DATE) - INTERVAL '2 months' AS two_months_ago_start
      )
      SELECT
        -- Pull requests count
        (SELECT COUNT(*) FROM pull_requests pr
          WHERE pr.repo_id = $1 AND pr.created_at >= dr.this_month_start) AS pull_requests_this_month,
        (SELECT COUNT(*) FROM pull_requests pr
          WHERE pr.repo_id = $1 AND pr.created_at >= dr.last_month_start AND pr.created_at < dr.this_month_start) AS pull_requests_last_month,

        -- Reviews count
        (SELECT COUNT(*) FROM reviews r
          JOIN pull_requests pr ON r.pull_request_id = pr.id
          WHERE pr.repo_id = $1 AND r.created_at >= dr.this_month_start) AS reviews_this_month,
        (SELECT COUNT(*) FROM reviews r
          JOIN pull_requests pr ON r.pull_request_id = pr.id
          WHERE pr.repo_id = $1 AND r.created_at >= dr.last_month_start AND r.created_at < dr.this_month_start) AS reviews_last_month,

        -- Comments count
        (SELECT COUNT(*) FROM review_comments rc
          JOIN reviews r ON rc.review_id = r.review_id
          JOIN pull_requests pr ON r.pull_request_id = pr.id
          WHERE pr.repo_id = $1 AND rc.created_at >= dr.this_month_start) AS comments_this_month,
        (SELECT COUNT(*) FROM review_comments rc
          JOIN reviews r ON rc.review_id = r.review_id
          JOIN pull_requests pr ON r.pull_request_id = pr.id
          WHERE pr.repo_id = $1 AND rc.created_at >= dr.last_month_start AND rc.created_at < dr.this_month_start) AS comments_last_month,

        -- Debits count
        (SELECT COALESCE(SUM(al.debits), 0) FROM activity_logs al
          WHERE al.repo_id = $1 AND al.action = 'received' AND al.created_at >= dr.this_month_start) AS debits_this_month,
        (SELECT COALESCE(SUM(al.debits), 0) FROM activity_logs al
          WHERE al.repo_id = $1 AND al.action = 'received' AND al.created_at >= dr.last_month_start AND al.created_at < dr.this_month_start) AS debits_last_month
      FROM date_ranges dr;
    `;

    const { rows } = await this.pg.query(query, [repoId]);
    return rows[0];
  }

  /**
   * Maps GitHub review state strings to our EReviewState enumxport default await DB.connect();

   */
  private mapGitHubReviewStateToEnum(state: string): EReviewState {
    const stateMap: Record<string, EReviewState> = {
      PENDING: EReviewState.PENDING,
      APPROVED: EReviewState.APPROVED,
      CHANGES_REQUESTED: EReviewState.CHANGES_REQUESTED,
      COMMENTED: EReviewState.COMMENTED,
      DISMISSED: EReviewState.DISMISSED,
    };

    return stateMap[state.toUpperCase()] || EReviewState.COMMENTED;
  }
}

export default await DB.connect();
