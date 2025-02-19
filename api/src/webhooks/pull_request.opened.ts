import { Octokit } from "@octokit/rest";
import type { PullRequestOpenedEvent } from "@octokit/webhooks-types";
import db from "db/db.ts";
import tb from "db/tigerbeetle.ts";
import log from "log.ts";
import {
  EGithubEndpoints,
  EPullRequestStatus,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "webhooks/constants.ts";
import { getOrDefaultGithubRepo, getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestOpened:
 *
 * @param { Octokit, payload }
 */
export const handlePullRequestOpened = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestOpenedEvent;
}) => {
  const prNumber = payload.number;
  const headSha = payload.pull_request.head.sha;
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const repoId = payload.repository.id; // GitHub ID
  const githubUserId = payload.pull_request.user.id; // GitHub user id
  const githubUsername = payload.pull_request.user.login; // GitHub user login name

  // set remote pull request check to in progress
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: headSha,
    status: "in_progress",
    output: {
      title: "Tokens Check",
      summary: `User has enough tokens to merge!`,
    },
  });

  const repo = await getOrDefaultGithubRepo(repoId, repoName);
  const { user, account } = await getOrDefaultGithubUser(
    repo,
    githubUserId,
    githubUsername
  );

  log.debug({ user }, "pull_request.opened > user");
  log.info({ account }, "pull_request.opened > user account");

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.pr_merge_deduction_debits;

  // Create pull request entry with user assigned as owner
  await db.createPullRequest(
    prNumber,
    repo.id,
    user.id,
    headSha,
    EPullRequestStatus.Open,
    hasEnoughDebits // set PR to passed check
  );

  if (hasEnoughDebits) {
    try {
      await tb.repoChargesFundsToUser(
        BigInt(repo.tigerbeetle_account_id),
        BigInt(account.id),
        BigInt(repo.pr_merge_deduction_debits),
        repo.id
      );
      const newBalance = balance - repo.pr_merge_deduction_debits;
      const message = `Balance for ${githubUsername} is ${newBalance}💰. You're good!`;
      await octokit.request(EGithubEndpoints.Comments, {
        owner,
        repo: repoName,
        issue_number: prNumber,
        body: message,
        headers: githubHeaders,
      });

      await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: "Gitkarma Tokens Check",
        head_sha: headSha,
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
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: message,
      headers: githubHeaders,
    });

    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: "Gitkarma Tokens Check",
      head_sha: headSha,
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
