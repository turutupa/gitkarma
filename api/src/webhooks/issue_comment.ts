import type { Octokit } from "@octokit/rest";
import type { IssueCommentEvent } from "@octokit/webhooks-types";
import db from "db/db.ts";
import log from "log.ts";
import tb from "../db/tigerbeetle.ts";
import {
  ADMIN_TRIGGER_RECHECK_EMOJI,
  EGithubEndpoints,
  githubHeaders,
  GITKARMA_CHECK_NAME,
  TRIGGER_RECHECK_EMOJI,
} from "./constants.ts";
import { getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestClosed:
 *
 * @param { Octokit, payload }
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

  // its an issues' comment, not a pr comment
  if (!payload.issue.pull_request) {
    log.debug({ payload }, "issue_comment > not a pull request, skipping");
    return;
  }

  // check if a user has triggered a re-check on PR owner funds,
  // otherwise just exit
  const isTriggeringRecheck = commentBody === TRIGGER_RECHECK_EMOJI;
  const isTriggeringAdminRecheck = commentBody === ADMIN_TRIGGER_RECHECK_EMOJI;
  if (
    payload.action != "created" ||
    (!isTriggeringRecheck && !isTriggeringAdminRecheck)
  ) {
    log.info(
      {
        commentBody,
        action: payload.action,
        isTriggeringAdminRecheck,
        isTriggeringRecheck,
      },
      "issue_comment > not a re-trigger"
    );
    return;
  }

  const repo = await db.getRepoByGitServiceRepoId(repoId);
  const pr = await db.getPullRequest(prNumber, repo.id);

  if (!pr) {
    throw new Error(
      `Could not find pull request record for PR #${prNumber} and repo id ${repoId}`
    );
  }

  // if check is already passing, exit early.
  if (pr?.check_passed) {
    const message = `Pull request #${prNumber} is already passing GitKarma Check. Nothing to do here.`;
    log.info(message);
    // send message to PR saying check is already passing
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: prNumber,
      body: message,
      headers: githubHeaders,
    });
    return;
  }

  // If the admin emoji is used, verify if the sender is a repo admin:
  let isAdmin = false;
  if (isTriggeringAdminRecheck) {
    // Option 1: Try checking the repository permissions in the payload (if available)
    if (
      payload.repository.permissions &&
      payload.repository.permissions.admin
    ) {
      isAdmin = true;
    } else {
      // Option 2: Query the GitHub API to get the permission level.
      const { data: permissionData } =
        await octokit.rest.repos.getCollaboratorPermissionLevel({
          owner,
          repo: repoName,
          username: payload.sender.login,
        });
      if (
        permissionData.permission === "admin" ||
        permissionData.permission === "maintain"
      ) {
        isAdmin = true;
      }
    }
  }

  // if admin approved check, then pass it
  if (isAdmin && isTriggeringAdminRecheck) {
    // hard-code true to checks passing
    await db.setPullRequestCheck(prNumber, repo.id, true);
    const message = `Admin override. ${payload.sender.login} has manually approved the GitKarma Check, bypassing the funds verification.`;
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
      name: GITKARMA_CHECK_NAME,
      head_sha: pr.head_sha,
      status: "completed",
      conclusion: "success",
      output: {
        title: "GitKarma Tokens Check",
        summary: `Auto-passed by admin ${payload.sender.login}.`,
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
  // set the check to in progress
  await octokit.rest.checks.create({
    owner,
    repo: repoName,
    name: "Gitkarma Tokens Check",
    head_sha: pr.head_sha,
    status: "in_progress",
    output: {
      title: "Tokens Check",
      summary: `User has enough tokens to merge!`,
    },
  });

  const { user, account } = await getOrDefaultGithubUser(
    repo,
    prOwnerGithubId,
    prOwnerGithubName
  );

  log.debug({ user }, "issue_comment > user");
  log.info({ account }, "issue_comment > user account");

  const balance = Number(tb.getBalance(account));
  const hasEnoughDebits = balance >= repo.pr_merge_deduction_debits;

  // set pull request check to passed / not passed based on balance
  await db.setPullRequestCheck(prNumber, repo.id, hasEnoughDebits);

  if (hasEnoughDebits) {
    try {
      // remove funds from user
      await tb.repoChargesFundsToUser(
        BigInt(repo.tigerbeetle_account_id),
        BigInt(account.id),
        BigInt(repo.pr_merge_deduction_debits),
        repo.id
      );

      // send comment to github user
      const newBalance = balance - repo.pr_merge_deduction_debits;
      const message = `Balance for ${prOwnerGithubName} is ${newBalance}💰. You're good!`;
      await octokit.request(EGithubEndpoints.Comments, {
        owner,
        repo: payload.repository.name,
        issue_number: payload.issue.number,
        body: message,
        headers: githubHeaders,
      });

      // notify github to pass check
      await octokit.rest.checks.create({
        owner,
        repo: repoName,
        name: "Gitkarma Tokens Check",
        head_sha: pr.head_sha,
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
  }

  // send error because not enough debits
  try {
    const message = `Balance for ${prOwnerGithubName} is ${balance}💰.\n\nA minimum of ${repo.pr_merge_deduction_debits} tokens are required! Review PRs to get more tokens! 🪙`;
    await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: payload.repository.name,
      issue_number: prNumber,
      body: message,
      headers: githubHeaders,
    });

    await octokit.rest.checks.create({
      owner,
      repo: repoName,
      name: "Gitkarma Tokens Check",
      head_sha: pr.head_sha,
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Insufficient Tokens",
        summary: `This PR cannot pass because user ${prOwnerGithubName} does not have enough tokens.`,
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
