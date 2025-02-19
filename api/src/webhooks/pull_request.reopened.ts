import type { Octokit } from "@octokit/rest";
import type { PullRequestReopenedEvent } from "@octokit/webhooks-types";
import log from "log.ts";
import db from "../db/db.ts";
import tb from "../db/tigerbeetle.ts";
import {
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "./constants.ts";
import { getOrDefaultGithubRepo, getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestReopened:
 *
 * This handler is invoked when a pull request is reopened on GitHub.
 *
 * - Checks the user's token balance against the required tokens for merging the PR.
 * - Updates the pull request record in the local database:
 *   - Sets the PR state to "open".
 *   - Updates the check status (flag) based on whether the user has sufficient tokens.
 * - If the user has enough tokens:
 *   - Charges the user's account by transferring the PR merge deduction tokens.
 *   - Posts a comment to the PR indicating that it has been funded and shows the new balance.
 *   - Marks the GitKarma check as "completed" with a "success" conclusion.
 * - If the user does not have enough tokens:
 *   - Posts a comment notifying about the insufficient token balance.
 *   - Marks the GitKarma check as "completed" with a "failure" conclusion.
 *
 * @param {Object} params - The parameters for the handler.
 * @param {Octokit} params.octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {PullRequestReopenedEvent} params.payload - The webhook payload for a pull request reopened event.
 *
 * @returns {Promise<void>} A promise that resolves when the handler processing is complete.
 */
export const handlePullRequestReopened = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestReopenedEvent;
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
  log.debug({ account }, "pull_request.opened > user account");

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.pr_merge_deduction_debits;

  // Create pull request entry with user assigned as owner
  await db.updatePullRequest(prNumber, repo.id, {
    state: EPullRequestState.Open,
    checkPassed: hasEnoughDebits,
  });

  // handle pr payment and notify github
  if (hasEnoughDebits) {
    await tb.repoChargesFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(account.id),
      BigInt(repo.pr_merge_deduction_debits),
      repo.id
    );
    const newBalance = balance - repo.pr_merge_deduction_debits;
    const message = `Pull Request funded. Current balance for **${githubUsername}** is ${newBalance}💰.`;
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
    return;
  }

  // send error because not enough debits
  const message = `Not enough tokens! Balance for **${githubUsername}** is ${balance}💰. A minimum of **${repo.pr_merge_deduction_debits}** tokens are required! Review PRs to get more tokens! 🪙`;
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
};
