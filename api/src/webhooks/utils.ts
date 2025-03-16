import db from "@/db/db";
import type { TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import { DEFAULT_REPO_CONFIG } from "./constants";

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
  repoOwner: string
) => {
  // get repo
  let repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  if (!repo) {
    repo = await db.createRepo(repoId, repoName, repoOwner); // pass repoOwner
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
  githubUsername: string
) => {
  // get user
  let user = await db.getUserByGithubUserId(githubUserId);
  if (!user) {
    user = await db.createUser(githubUserId, githubUsername);
  }

  // get user tb account
  let userTBAccount = await tb.getUserAccount(BigInt(user.id), BigInt(repo.id));
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
  let userRepo = await db.getUserRepo(user.id, repo.id);
  if (!userRepo) {
    userRepo = await db.createUserRepo(user.id, repo.id, userTBAccount.id);
  }

  return { user, userRepo, account: userTBAccount };
};
