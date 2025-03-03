import type { Octokit } from "@octokit/rest";
import type { PullRequestSynchronizeEvent } from "@octokit/webhooks-types";
import log from "log.ts";
import db from "../db/db.ts";
import tb from "../db/tigerbeetle.ts";
import {
  EGithubEndpoints,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "./constants.ts";
import { getOrDefaultGithubRepo, getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestSynchronize:
 *
 * This handler is invoked when a pull request creator pushes a new commit (i.e. a "synchronize" event).
 *
 * - Checks existing status: If the PR is already marked as having passed the GitKarma check, it immediately marks the new commit as successful and exits.
 * - If sufficient tokens are available:
 *   - Charges the user's account by transferring the necessary tokens.
 *   - Posts a comment to the PR with the updated balance.
 *   - Marks the GitKarma check as "completed" with a "success" conclusion.
 * - If tokens are insufficient:
 *   - Posts an error comment indicating the shortfall.
 *   - Marks the GitKarma check as "completed" with a "failure" conclusion.
 *
 * @param {Object} params - An object containing the handler parameters.
 * @param {Octokit} params.octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {PullRequestSynchronizeEvent} params.payload - The webhook payload for the pull request synchronize event.
 *
 * @returns {Promise<void>} A promise that resolves when the event processing is complete.
 */
export const handlePullRequestSynchronize = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestSynchronizeEvent;
}) => {
  // Make sure we're handling a synchronize event (new commits pushed)
  if (payload.action !== "synchronize") {
    return;
  }

  const owner = payload.repository.owner.login;
  const repoName = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const prOwnerGithubId = payload.pull_request.user.id;
  const prOwnerGithubName = payload.pull_request.user.login;
  const repoId = payload.repository.id;
  const headSha = payload.pull_request.head.sha;

  // set remote pull request check to in progress
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: headSha,
    status: "in_progress",
    output: {
      title: "Tokens Check",
      summary: `In order to pass gitkarma check user must have enough tokens. Checking ${prOwnerGithubName} balance.`,
    },
  });

  const repo = await getOrDefaultGithubRepo(repoId, repoName, owner);
  const { user, account } = await getOrDefaultGithubUser(
    repo,
    prOwnerGithubId,
    prOwnerGithubName
  );

  log.debug({ user }, "pull_request.reopened > user");
  log.debug({ account }, "pull_request.reopened > user account");

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.merge_penalty;

  const pr = await db.getPullRequest(prNumber, repo.id);

  // if pr owner already passed check (already paid for pr), pass current commit as well
  // no need to send message - check run state was unaltered
  if (pr?.check_passed) {
    log.info(
      "Pull Request had already passed gitkarma check. No further actions required."
    );
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

  // Update pull request entry with check run passed / not passed
  await db.updatePullRequest(prNumber, repo.id, {
    checkPassed: hasEnoughDebits,
  });

  log.info(
    { user, repoId, repoName, account },
    `pull_request.synchronize: user has enough credits: ${hasEnoughDebits}`
  );

  // handle pr payment and notify github
  if (hasEnoughDebits) {
    await tb.repoChargesFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(account.id),
      BigInt(repo.merge_penalty),
      repo.id
    );
    const newBalance = balance - repo.merge_penalty;
    const message = `Pull Request funded. Current balance for **${prOwnerGithubName}** is ${newBalance}💰.`;
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
  const message = `Unfortunatley, still not enough tokens! Balance for **${prOwnerGithubName}** is ${balance}💰. A minimum of **${repo.merge_penalty}** tokens are required! Review PRs to get more tokens! 🪙`;
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
      summary: `This PR cannot pass because user ${prOwnerGithubName} does not have enough tokens.`,
    },
  });
};
