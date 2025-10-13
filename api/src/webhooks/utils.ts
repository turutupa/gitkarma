import db from "@/db/db";
import { EUserRepoRole } from "@/db/entities/UserRepo";
import type { TRepo, TUser, TUserRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import type { Octokit } from "@octokit/rest";
import type {
  InstallationCreatedEvent,
  InstallationEvent,
  InstallationRepositoriesAddedEvent,
  IssueCommentEvent,
  PullRequestClosedEvent,
  PullRequestEvent,
  PullRequestLabeledEvent,
  PullRequestOpenedEvent,
  PullRequestReopenedEvent,
  PullRequestReviewComment,
  PullRequestReviewEvent,
  PullRequestUnlabeledEvent,
  User,
} from "@octokit/webhooks-types";
import type { Account } from "tigerbeetle-node";
import { DEFAULT_REPO_CONFIG } from "./constants";

// Type guards
function hasRepository(
  payload: any
): payload is { repository: { owner: User } } {
  return payload?.repository?.owner?.type !== undefined;
}

function hasSender(payload: any): payload is { sender: User } {
  return payload?.sender?.type !== undefined;
}

function hasPullRequest(
  payload: any
): payload is { pull_request: { user: User } } {
  return payload?.pull_request?.user?.type !== undefined;
}

function hasReview(payload: any): payload is { review: { user: User } } {
  return payload?.review?.user?.type !== undefined;
}

export const isBot = (
  payload:
    | PullRequestOpenedEvent
    | PullRequestReopenedEvent
    | PullRequestClosedEvent
    | PullRequestLabeledEvent
    | PullRequestUnlabeledEvent
    | PullRequestReviewComment
    | PullRequestReviewEvent
    | IssueCommentEvent
    | InstallationEvent
    | InstallationCreatedEvent
    | InstallationRepositoriesAddedEvent,
  userType: "repo_owner" | "sender" | "pr_owner" | "review_owner" = "sender"
): boolean => {
  switch (userType) {
    case "repo_owner":
      return hasRepository(payload) && payload.repository.owner.type === "Bot";
    case "sender":
      return hasSender(payload) && payload.sender.type === "Bot";
    case "pr_owner":
      return (
        hasPullRequest(payload) && payload.pull_request.user.type === "Bot"
      );
    case "review_owner":
      return hasReview(payload) && payload.review.user.type === "Bot";
    default:
      return false;
  }
};

/**
 * getOrDefaultGithubRepo:
 * Helper function to get a repo or create one in PG Databsae if it doesn't exist one.
 * Should create a tiger beetle account and associcate it.
 *
 * @param repoId - git service repo id
 * @param repoName - git service repo name
 * @param repoOwner - git service repo owner
 * @returns - repo entry from pg db and with
 */
export const getOrDefaultGithubRepo = async (
  repoId: number,
  repoName: string,
  repoOwner: string,
  installationId: number = 0
) => {
  // get repo
  let repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  if (!repo) {
    repo = await db.createRepo(repoId, repoName, repoOwner, installationId); // pass repoOwner
  }
  // create tiger beetle account for repo
  if (!repo.tigerbeetle_account_id) {
    const repoTBAccount = await tb.createRepoAccount(BigInt(repo.id));
    await db.updateRepoTigerbeetleAccount(repo.id, repoTBAccount.id);
    repo.tigerbeetle_account_id = repoTBAccount.id;
  }

  return repo;
};

/**
 * getOrDefaultGithubUser:
 * Helper function to get or create a default GitHub user. It:
 * - Creates a new user if it doesn't exist
 * - Creates a new tb account for that user if it doesn't exist
 * - Create a new user repo entry if it doesn't exist
 *
 * @param repo
 * @param githubUserId
 * @param githubUsername
 * @param githubUrl?
 * @returns
 */
export const getOrDefaultGithubUser = async (
  repo: TRepo,
  githubUserId: number,
  githubUsername: string,
  githubUrl?: string,
  role = EUserRepoRole.COLLABORATOR
) => {
  // get user
  let user: TUser = await db.getUserByGithubUserId(githubUserId);
  if (!user) {
    user = await db.createUser(githubUserId, githubUsername, githubUrl);
  }
  // insert github url if missing
  if (githubUrl && !user.github_url) {
    await db.updateUserGithubUrl(user.id, githubUrl);
  }

  // get user tb account
  let userTBAccount: Account = await tb.getUserAccount(
    BigInt(user.id),
    BigInt(repo.id)
  );
  if (!userTBAccount) {
    const defaultDebits = BigInt(DEFAULT_REPO_CONFIG.defaultDebits);
    userTBAccount = await tb.createUserAccount(
      BigInt(user.id),
      BigInt(repo.id)
    );
    // transfer default debits to user
    await tb.repoTransfersFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(userTBAccount.id),
      BigInt(defaultDebits),
      repo.id
    );
    userTBAccount.debits_posted = defaultDebits;
  }

  // get user repo
  let userRepo: TUserRepo = await db.getUserRepo(user.id, repo.id);
  if (!userRepo) {
    userRepo = await db.createUserRepo(
      user.id,
      repo.id,
      userTBAccount.id,
      role
    );
  }

  return { user, userRepo, account: userTBAccount };
};

/**
 * Checks if a repository is active and throws an error if it is not.
 *
 * @param repo - The repository object to check.
 * @throws Will throw an error if the repository has GitKarma disabled.
 */
export const gitkarmaEnabledOrThrow = (repo: TRepo) => {
  if (repo.disable_gitkarma) {
    throw new Error("GitKarma is disabled for this repo");
  }
};

/**
 * Verify if the sender is an admin. Checks:
 * - admin permissions from github
 * - gitkarma role
 * - get collaborator role from github
 * @param octokit
 * @param githubSchema
 * @param repo
 * @param sender
 * @returns
 */
export const isSenderAdmin = async (
  octokit: Octokit,
  githubSchema: PullRequestEvent | IssueCommentEvent,
  repo: TRepo,
  // can optionally provide sender if sender si required in parent func
  sender?: {
    user: TUser;
    userRepo: TUserRepo;
    account: Account;
  }
): Promise<boolean> => {
  sender =
    sender ||
    (await getOrDefaultGithubUser(
      repo,
      githubSchema.sender.id,
      githubSchema.sender.login,
      githubSchema.sender.html_url
    ));

  let isAdmin = false;
  if (githubSchema.repository.permissions?.admin) {
    isAdmin = true;
  } else if (sender.userRepo.role === EUserRepoRole.ADMIN) {
    isAdmin = true;
  } else {
    const { data: permissionData } =
      await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner: githubSchema.repository.owner.login,
        repo: repo.repo_name,
        username: githubSchema.sender.login,
      });
    if (permissionData.permission === "admin") {
      isAdmin = true;
    }
  }
  return isAdmin;
};

/**
 * Robust retry mechanism using a loop for a more reliable implementation.
 *
 * @param func The async function to execute and retry.
 * @param retries The number of retry attempts (defaults to 3).
 * @param delayMs The delay between retries in milliseconds (defaults to 2000).
 * @param validate Optional validator to treat "soft failures" (non-throwing) as retryable.
 * @returns The resolved value of the async function.
 */

// Default validator for GitHub/Octokit responses.
// - REST: expect 2xx status and no data.errors
// - GraphQL-like: fail if top-level errors array is present
const defaultGithubValidate = (result: any): boolean => {
  if (result && typeof result.status === "number") {
    const ok = result.status >= 200 && result.status < 300;
    if (!ok) {
      return false;
    }
    const data = (result as any).data;
    if (data && Array.isArray((data as any).errors) && data.errors.length > 0) {
      return false;
    }
    return true;
  }
  if (result && Array.isArray((result as any).errors)) {
    return false;
  }
  return true;
};

export const retry = async <T>(
  func: () => Promise<T>,
  retries = 10,
  delayMs = 2000,
  validate?: (result: T) => boolean | Promise<boolean>
): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await func();

      const isValid =
        typeof validate === "function"
          ? await validate(result)
          : defaultGithubValidate(result as any);

      if (isValid) {
        return result;
      }

      // Validation failed, continue retrying
      if (i === retries) {
        throw new Error("All retry attempts failed validation.");
      }

      console.warn(
        `Attempt ${i + 1} failed validation. Retrying in ${
          delayMs / 1000
        } seconds...`
      );
      await sleep(delayMs);
    } catch (error: any) {
      // All retries failed, re-throw the last error
      if (i === retries) {
        throw error;
      }

      // Respect Retry-After and rate limit headers if present
      let waitMs = delayMs;
      const resp = error?.response;
      const headers = resp?.headers || {};
      const retryAfter = Number(headers["retry-after"]);
      if (!Number.isNaN(retryAfter) && retryAfter > 0) {
        waitMs = retryAfter * 1000;
      } else if (resp?.status === 403 || resp?.status === 429) {
        const resetSec = Number(headers["x-ratelimit-reset"]);
        if (!Number.isNaN(resetSec) && resetSec > 0) {
          const nowSec = Math.floor(Date.now() / 1000);
          const deltaMs = (resetSec - nowSec) * 1000;
          if (deltaMs > waitMs) waitMs = deltaMs;
        }
      }

      const secs = Math.max(0, Math.ceil(waitMs / 1000));
      console.warn(`Attempt ${i + 1} failed. Retrying in ${secs} seconds...`);
      await sleep(waitMs);
    }
  }
  // This line is unreachable but included for full type-safety
  throw new Error("All retry attempts failed.");
};

/**
 * Sleep mechanism - similar to java
 * @param ms
 * @returns
 */
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
