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
