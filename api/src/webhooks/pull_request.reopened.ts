import db from "@/db/db";
import type { TPullRequest, TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestReopenedEvent } from "@octokit/webhooks-types";
import {
  EActivityLogAction,
  EActivityLogEvent,
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "./constants";
import { checks, comments } from "./messages";
import {
  getOrDefaultGithubRepo,
  getOrDefaultGithubUser,
  gitkarmaEnabledOrThrow,
  retry,
} from "./utils";

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
  const headSha = payload.pull_request.head.sha;
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const repoId = payload.repository.id; // GitHub ID
  const githubUserId = payload.pull_request.user.id; // GitHub user id
  const githubUsername = payload.pull_request.user.login; // GitHub user login name
  const githubUserUrl = payload.pull_request.user.html_url; // GitHub user login name
  const prNumber = payload.number;
  const prTitle = payload.pull_request.title;
  const prDescription = payload.pull_request.body;
  const prUrl = payload.pull_request.html_url;
  const prNumChangedFiles = payload.pull_request.changed_files;

  const repo: TRepo = await getOrDefaultGithubRepo(repoId, repoName, owner);
  gitkarmaEnabledOrThrow(repo);
  const pr: TPullRequest | null = await db.getPullRequest(prNumber, repo.id);

  const { user, account } = await getOrDefaultGithubUser(
    repo,
    githubUserId,
    githubUsername,
    githubUserUrl
  );

  log.debug({ user }, "pull_request.opened > user");
  log.debug({ account }, "pull_request.opened > user account");

  // if it was admin approved then do nothing
  if (pr?.admin_approved) {
    return;
  }

  // set remote pull request check to in progress
  await retry(
    async () =>
      await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: GITKARMA_CHECK_NAME,
        head_sha: headSha,
        status: "in_progress",
        output: {
          title: checks.inProgress.title,
          summary: checks.inProgress.summary(
            githubUsername,
            repo.merge_penalty
          ),
        },
      })
  );

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.merge_penalty;

  // create pr if it doesn't exist for whatever reason
  if (!pr) {
    await db.createPullRequest(
      repo.id,
      user.id,
      prNumber,
      prTitle,
      prUrl,
      prDescription || "",
      prNumChangedFiles,
      headSha,
      EPullRequestState.Open,
      hasEnoughDebits // set PR to passed/not passed check
    );
  } else {
    // Create pull request entry with user assigned as owner
    await db.updatePullRequest(prNumber, repo.id, {
      state: EPullRequestState.Open,
      checkPassed: hasEnoughDebits,
    });
  }

  // handle pr payment and notify github
  if (hasEnoughDebits) {
    await tb.repoChargesFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(account.id),
      BigInt(repo.merge_penalty),
      repo.id
    );
    const newBalance = balance - repo.merge_penalty;
    const fundedPrComment = await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: comments.pullRequestFundedMessage(githubUsername, newBalance),
      headers: githubHeaders,
    });

    // set pr check to success
    await retry(
      async () =>
        await octokit.rest.checks.create({
          owner,
          repo: repoName,
          name: GITKARMA_CHECK_NAME,
          head_sha: headSha,
          status: "completed",
          conclusion: "success",
          output: {
            title: checks.completed.title,
            summary: checks.completed.summary(
              githubUsername,
              balance,
              newBalance,
              repo.merge_penalty
            ),
          },
        })
    );

    // activity log - pr funded
    await db.createActivityLog(
      repo.id,
      pr!.id,
      user.id,
      EActivityLogEvent.PullRequest,
      "Funded",
      fundedPrComment.data.html_url,
      EActivityLogAction.Spent,
      repo.merge_penalty
    );

    return;
  }

  // send error because not enough debits
  const unfundedPrComment = await octokit.request(EGithubEndpoints.Comments, {
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.pullRequestNotEnoughFundsMessage(
      githubUsername,
      balance,
      repo.merge_penalty,
      repo.trigger_recheck_text,
      repo.admin_trigger_recheck_text
    ),
    headers: githubHeaders,
  });

  // set pr check to failed
  await retry(
    async () =>
      await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: GITKARMA_CHECK_NAME,
        head_sha: headSha,
        status: "completed",
        conclusion: "failure",
        output: {
          title: checks.failed.title,
          summary: checks.failed.summary(
            githubUsername,
            balance,
            repo.merge_penalty
          ),
        },
      })
  );

  // activity log - failed to fund pr
  await db.createActivityLog(
    repo.id,
    pr!.id,
    user.id,
    EActivityLogEvent.PullRequest,
    "Not enough funds",
    unfundedPrComment.data.html_url
  );
};
