import type { Octokit } from "@octokit/rest";
import type {
  PullRequestClosedEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import db from "db/db.ts";
import log from "log.ts";
import tb from "../db/tigerbeetle.ts";
import { EPullRequestState } from "./constants.ts";
import { getOrDefaultGithubUser } from "./utils.ts";

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
  const prOwnerId = payload.pull_request.user.id; // GitHub user id
  const merged = payload.pull_request.merged;

  const repo = await db.getRepoByGitServiceRepoId(repoId);

  // Fetch first PR to know current state before closing it. To know if it was passing or not.
  const pr = await db.getPullRequest(prNumber, repo.id);
  // Then set pull request to merged / closed
  const prState = merged ? EPullRequestState.Merged : EPullRequestState.Closed;
  await db.updatePullRequest(prNumber, repo.id, {
    state: prState,
    checkPassed: merged, // update checksPassed to false if PR was closed but not merged
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

    for (const approver of approvers) {
      const { account } = await getOrDefaultGithubUser(
        repo,
        approver.id,
        approver.name!
      );
      log.debug(
        { repo, approver },
        "Pull Request closed and merged. Transfering funds to approvers."
      );
      await tb.repoTransfersFundsToUser(
        BigInt(repo.tigerbeetle_account_id),
        BigInt(account.id),
        BigInt(repo.review_approval_debits),
        repo.id
      );
    }
    return;
  }

  // Handle pull request was closed but not merged
  // Case where pull request was NOT passing gitkarma check -> no refund
  if (!pr?.check_passed) {
    log.info(
      { pr },
      "Pull request closed > Not issueing as it was not passing check"
    );
    return;
  }
  // Case where pull request was passing gitkarma check -> refund-user
  const user = await db.getUserByGithubId(prOwnerId);
  const userRepo = await db.getUserRepo(user.id, repo.id);
  log.info(
    { repo, user: userRepo },
    "Pull Request closed but not merged. Transfering funds back to PR Owner."
  );
  await tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(userRepo.tigerbeetle_account_id),
    BigInt(repo.pr_merge_deduction_debits),
    repo.id
  );
};
