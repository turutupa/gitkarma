import db from "@/db/db";
import type { TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type {
  PullRequestClosedEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import {
  EActivityLogAction,
  EActivityLogEvent,
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
} from "./constants";
import { comments } from "./messages";
import { getOrDefaultGithubUser, gitkarmaEnabledOrThrow } from "./utils";

/**
 * handlePullRequestClosed:
 *
 * This handler is invoked when a pull request is closed on GitHub.
 * - It updates the pull request state in the local database
 * - If the pull request was merged, it transfers funds to the developers who approved the PR
 * - If the PR is closed without merging and had passed the GitKarma check, it refunds funds to the PR owner
 *
 * @param {Object} params - An object containing the following properties:
 * @param {Octokit} params.octokit - An authenticated Octokit instance used to interact with the GitHub API.
 * @param {PullRequestClosedEvent} params.payload - The webhook payload for the pull request closed event.
 *
 * @returns {Promise<void>} A promise that resolves when the handler has finished processing.
 */
export const handlePullRequestClosed = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestClosedEvent;
}) => {
  const prNumber = payload.number;
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  const repoId = payload.repository.id; // GitHub ID
  const prOwner = payload.pull_request.user.login; // GitHub user id
  const prOwnerId = payload.pull_request.user.id; // GitHub user id
  const merged = payload.pull_request.merged;

  const repo: TRepo = await db.getRepoByGithubRepoId(repoId);
  gitkarmaEnabledOrThrow(repo);

  const user = await db.getUserByGithubUserId(prOwnerId);
  const userRepo = await db.getUserRepo(user.id, repo.id);

  // Fetch first PR to know current state before closing it. To know if it was passing or not.
  const pr = await db.getPullRequest(prNumber, repo.id);
  // Then set pull request to merged / closed
  const prState = merged ? EPullRequestState.Merged : EPullRequestState.Closed;
  await db.updatePullRequest(prNumber, repo.id, {
    state: prState,
    checkPassed: merged, // update checkPassed to false if PR was closed but not merged
  });

  // Handle pull request was closed && merged
  if (merged) {
    // get list of devs who approved PR to transfer funds
    const { data: reviews } = await octokit.rest.pulls.listReviews({
      owner,
      repo: repoName,
      pull_number: prNumber,
    });
    const approvedReviews = reviews.filter(
      (review) => review.state === "APPROVED"
    );
    const approvers = approvedReviews.reduce<PullRequestReview["user"][]>(
      (unique: any[], review) => {
        if (!unique.find((u) => u.id === review?.user?.id)) {
          unique.push(review.user);
        }
        return unique;
      },
      []
    );
    const approversNames = approvers.map((a) => a.login);

    // Send pr merged comment
    const prMergedComment = await octokit.request(EGithubEndpoints.Comments, {
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: comments.pullRequestMergedMessage(
        prOwner,
        prNumber,
        approversNames,
        repo.approval_bonus
      ),
      headers: githubHeaders,
    });

    for (const approver of approvers) {
      const { user: approverUser, account } = await getOrDefaultGithubUser(
        repo,
        approver.id,
        approver.name!,
        approver.html_url
      );
      log.debug(
        { repo, approver },
        "Pull Request closed and merged. Transfering funds to approvers."
      );
      await tb.repoTransfersFundsToUser(
        BigInt(repo.tigerbeetle_account_id),
        BigInt(account.id),
        BigInt(repo.approval_bonus),
        repo.id
      );

      // activity log - transfer funds to approvers
      await db.createActivityLog(
        repo.id,
        pr!.id,
        approverUser.id,
        EActivityLogEvent.ApprovalBonus,
        "PR Merge Bonus",
        prMergedComment.data.html_url,
        EActivityLogAction.Received,
        repo.approval_bonus
      );
    }

    return;
  }

  // Handle pull request was closed but not merged

  // closed message
  const prClosedComment = await octokit.request(EGithubEndpoints.Comments, {
    owner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.pullRequestClosedMessage(
      prOwner,
      prNumber,
      pr?.check_passed && !pr.admin_approved ? repo.merge_penalty : 0,
      pr?.admin_approved || false
    ),
    headers: githubHeaders,
  });

  // Case where pull request was NOT passing gitkarma check -> no refund
  if (!pr?.check_passed) {
    log.info(
      { pr },
      "Pull request closed > Not issueing as it was not passing check"
    );
    return;
  }

  // Case where pull request was admin approved -> no refund
  if (pr.admin_approved) {
    log.info(
      { pr },
      "Pull request closed > Not issueing as it was admin approved"
    );
    return;
  }

  // Case where pull request was passing gitkarma check -> refund-user
  log.info(
    { repo, user: userRepo },
    "Pull Request closed but not merged. Transfering funds back to PR Owner."
  );
  await tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(userRepo.tigerbeetle_account_id),
    BigInt(repo.merge_penalty),
    repo.id
  );

  // activity log - refund pr owner
  await db.createActivityLog(
    repo.id,
    pr!.id,
    user.id,
    EActivityLogEvent.PullRequest,
    prState,
    prClosedComment.data.html_url,
    EActivityLogAction.Received,
    repo.merge_penalty
  );
};
