import db from "@/db/db";
import { EUserRepoRole } from "@/db/entities/UserRepo";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { IssueCommentEvent } from "@octokit/webhooks-types";
import {
  BALANCE_CHECK_EMOJI,
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "./constants";
import { checks, comments } from "./messages";
import { getOrDefaultGithubUser } from "./utils";

/**
 * handleIssueComment:
 *
 * This handler processes an issue comment event and, if the comment is on a pull request,
 * it triggers a re-check of the GitKarma check based on the content of the comment.
 *
 * - Determines if the comment triggers a re-check:
 *   - Uses a specific emoji (e.g., "💰") to check user balance.
 *   - Uses a specific emoji (e.g., "✨") for a standard re-check.
 *   - Uses a designated admin emoji (e.g., "🚀") to indicate an admin override.
 *
 * @param {Octokit} octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {IssueCommentEvent} payload - The webhook payload for an issue comment event from GitHub.
 *
 * @returns {Promise<void>} A promise that resolves when processing is complete.
 */

export const handleIssueComment = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: IssueCommentEvent;
}) => {
  const prNumber = payload.issue.number;
  const repoId = payload.repository.id; // GitHub ID
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const prOwnerGithubId = payload.issue.user.id; // GitHub user id
  const prOwnerGithubName = payload.issue.user.login; // GitHub user id
  const commentBody: string = payload.comment.body.trim();

  log.info("Processing issue comment event");

  // its an issues' comment, not a pr comment
  if (!payload.issue.pull_request) {
    log.debug({ payload }, "issue_comment > not a pull request, skipping");
    return;
  }

  const repo = await db.getRepoByGithubRepoId(repoId);

  const isUserBalanceCheck = commentBody === BALANCE_CHECK_EMOJI;
  if (payload.action === "created" && isUserBalanceCheck) {
    const user = await db.getUserByGithubUserId(payload.sender.id);
    const account = await tb.getUserAccount(BigInt(user.id), BigInt(repo.id));
    const balance = tb.getBalance(account);

    const sender = payload.sender.login;
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: prNumber,
      body: comments.balanceCheckMessage(sender, Number(balance)),
      headers: githubHeaders,
    });
    return;
  }

  // Use the custom trigger texts from the repo settings
  const isTriggeringRecheck = commentBody === repo.trigger_recheck_text;
  const isTriggeringAdminRecheck =
    commentBody === repo.admin_trigger_recheck_text;

  if (
    payload.action != "created" ||
    (!isTriggeringRecheck && !isTriggeringAdminRecheck)
  ) {
    log.info(
      {
        commentBody,
        expectedTrigger: repo.trigger_recheck_text,
        expectedAdminTrigger: repo.admin_trigger_recheck_text,
        action: payload.action,
        isTriggeringAdminRecheck,
        isTriggeringRecheck,
      },
      "issue_comment > not a re-trigger"
    );
    return;
  }

  const pr = await db.getPullRequest(prNumber, repo.id);

  if (!pr) {
    throw new Error(
      `Could not find pull request record for PR #${prNumber} and repo id ${repoId}`
    );
  }

  // if pr is closed do nothing
  if (pr?.state === EPullRequestState.Closed) {
    return;
  }

  // if check is already passing, exit early.
  if (pr?.check_passed) {
    log.info(comments.pullRequestAlreadyFundedMessage(prNumber));
    // send message to PR saying check is already passing
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: prNumber,
      body: comments.pullRequestAlreadyFundedMessage(prNumber),
      headers: githubHeaders,
    });
    return;
  }

  const { user, account } = await getOrDefaultGithubUser(
    repo,
    prOwnerGithubId,
    prOwnerGithubName
  );
  const balance = Number(tb.getBalance(account));

  log.debug({ user }, "issue_comment > user");
  log.info({ account }, "issue_comment > user account");

  // set the check to in progress
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: pr.head_sha,
    status: "in_progress",
    output: {
      title: checks.title.inProgress,
      summary: checks.summary.inProgress(user.github_username, balance),
    },
  });

  // If the admin emoji is used, verify if the sender is a repo admin:
  const sender = await getOrDefaultGithubUser(
    repo,
    payload.sender.id,
    payload.sender.login
  );
  let isAdmin = false;
  if (isTriggeringAdminRecheck) {
    // Option 1: Try checking the repository permissions in the payload (if available)
    if (
      payload.repository.permissions &&
      payload.repository.permissions.admin
    ) {
      isAdmin = true;
      // Optoin 2: Check if the sender is an admin in the database
    } else if (sender.userRepo.role === EUserRepoRole.ADMIN) {
      isAdmin = true;
    } else {
      // Option 3: Query the GitHub API to get the permission level.
      const { data: permissionData } =
        await octokit.rest.repos.getCollaboratorPermissionLevel({
          owner,
          repo: repoName,
          username: payload.sender.login,
        });
      if (permissionData.permission === "admin") {
        isAdmin = true;
      }
    }
  }

  // if admin approved check, then pass it
  if (isAdmin && isTriggeringAdminRecheck) {
    const sender = payload.sender.login;
    // hard-code true to checks passing
    await db.updatePullRequest(prNumber, repo.id, {
      checkPassed: true,
      adminApproved: true,
    });
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: comments.pullRequestAdminOverrideMessage(sender, prNumber),
      headers: githubHeaders,
    });
    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: GITKARMA_CHECK_NAME,
      head_sha: pr.head_sha,
      status: "completed",
      conclusion: "success",
      output: {
        title: checks.title.adminApproved,
        summary: checks.summary.adminApproved(),
      },
    });
    return;
  } else if (!isAdmin && isTriggeringAdminRecheck) {
    log.info(
      { user: payload.sender },
      "Non-admin user attempted to trigger admin-recheck"
    );
  }

  // triggering regular re-check...
  const hasEnoughDebits = balance >= repo.merge_penalty;

  // set pull request check to passed / not passed based on balance
  await db.updatePullRequest(prNumber, repo.id, {
    checkPassed: hasEnoughDebits,
  });

  // handle has enough debits to pass check
  if (hasEnoughDebits) {
    // remove funds from user
    await tb.repoChargesFundsToUser(
      BigInt(repo.tigerbeetle_account_id),
      BigInt(account.id),
      BigInt(repo.merge_penalty),
      repo.id
    );

    // send comment to github user
    const newBalance = balance - repo.merge_penalty;
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: payload.issue.number,
      body: comments.pullRequestFundedMessage(
        user.github_username,
        newBalance,
        repo.trigger_recheck_text,
        repo.admin_trigger_recheck_text
      ),
      headers: githubHeaders,
    });

    // notify github to pass check
    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: GITKARMA_CHECK_NAME,
      head_sha: pr.head_sha,
      status: "completed",
      conclusion: "success",
      output: {
        title: checks.title.completed,
        summary: checks.summary.completed(
          user.github_username,
          balance,
          newBalance,
          repo.merge_penalty
        ),
      },
    });
    return;
  }

  // send error because not enough debits
  await octokit.request(EGithubEndpoints.Comments, {
    owner,
    repo: payload.repository.name,
    issue_number: prNumber,
    body: comments.pullRequestNotEnoughFundsMessage(
      user.github_username,
      balance,
      repo.merge_penalty,
      repo.trigger_recheck_text,
      repo.admin_trigger_recheck_text
    ),
    headers: githubHeaders,
  });

  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: GITKARMA_CHECK_NAME,
    head_sha: pr.head_sha,
    status: "completed",
    conclusion: "failure",
    output: {
      title: checks.title.failed,
      summary: checks.summary.failed(
        prOwnerGithubName,
        balance,
        repo.merge_penalty
      ),
    },
  });
};
