import { Octokit } from "@octokit/rest";
import type { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import db from "db/db.ts";
import type { TRepo, TUser, TUserRepo } from "db/models.ts";
import tb from "db/tigerbeetle.ts";
import log from "log.ts";
import { type Account } from "tigerbeetle-node";
import {
  DEFAULT_REPO_CONFIG,
  GithubEndpoints,
  githubHeaders,
} from "webhooks/constants.ts";

const getOrDefaultUserRepo = async (
  repoId: number,
  repoName: string,
  githubUserId: number,
  githubUsername: string
): Promise<{
  repo: TRepo;
  user: TUser;
  userRepo: TUserRepo;
  account: Account;
}> => {
  // get repo
  let repo: TRepo = await db.getRepoByGitServiceRepoId(repoId);
  if (!repo) {
    repo = await db.createRepo(repoId, repoName);
  }

  // create tiger beetle account for repo
  if (!repo.tigerbeetle_account_id) {
    const repoTBAccount = await tb.createRepoAccount(BigInt(repo.id));
    await db.updateRepoTigerbeetleAccount(repo.id, repoTBAccount.id);
    repo.tigerbeetle_account_id = repoTBAccount.id;
  }

  // get user
  let user = await db.getUserByGithubId(githubUserId);
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
  return { repo, user, userRepo, account: userTBAccount };
};

// This adds an event handler that your code will call later. When this event handler is called,
// it will log the event to the console. Then, it will use GitHub's REST API to add a comment to
// the pull request that triggered the event.
export const handlePullRequestOpened = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestOpenedEvent;
}) => {
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const repoId = payload.repository.id; // GitHub ID
  const githubUserId = payload.pull_request.user.id; // GitHub user id
  const githubUsername = payload.pull_request.user.login; // GitHub user login name

  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: "Gitkarma Tokens Check",
    head_sha: payload.pull_request.head.sha,
    status: "in_progress",
    output: {
      title: "Tokens Check",
      summary: `User has enough tokens to merge!`,
    },
  });

  const { repo, user, userRepo, account } = await getOrDefaultUserRepo(
    repoId,
    repoName,
    githubUserId,
    githubUsername
  );

  log.debug({ user }, "pull_request.opened > user");
  log.info({ account }, "pull_request.opened > user account");
  log.debug({ userRepo }, "pull_request.opened > user repo");

  const balance = tb.getBalance(account);
  const hasEnoughDebits = balance >= repo.pr_merge_deduction_debits;

  if (hasEnoughDebits) {
    try {
      const message = `Balance for ${githubUsername} is ${balance}💰. You're good!`;
      await octokit.request(GithubEndpoints.Comments, {
        owner,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: message,
        headers: githubHeaders,
      });

      await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: "Gitkarma Tokens Check",
        head_sha: payload.pull_request.head.sha,
        status: "completed",
        conclusion: "success",
        output: {
          title: "Tokens Check",
          summary: `User has enough tokens to merge!`,
        },
      });
    } catch (error: any) {
      if (error.response) {
        log.error(
          `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
        );
      }
      log.error(error);
    }
    return;
  }

  // send error because not enough debits
  try {
    const message = `Balance for ${githubUsername} is ${balance}💰.\n\nA minimum of ${repo.pr_merge_deduction_debits} tokens are required! Review PRs to get more tokens! 🪙`;
    await octokit.request(GithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: message,
      headers: githubHeaders,
    });

    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: "Gitkarma Tokens Check",
      head_sha: payload.pull_request.head.sha,
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Insufficient Tokens",
        summary: `This PR cannot pass because user ${githubUsername} does not have enough tokens.`,
      },
    });
  } catch (error: any) {
    if (error.response) {
      log.error(
        `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
      );
    }
    log.error(error);
  }
};
