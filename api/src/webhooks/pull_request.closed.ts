import type { Octokit } from "@octokit/rest";
import type {
  PullRequestClosedEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import db from "db/db.ts";
import log from "log.ts";
import tb from "../db/tigerbeetle.ts";
import { EPullRequestStatus } from "./constants.ts";
import { getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestClosed:
 *
 * @param { Octokit, payload }
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

  // Set pull request to merged / closed
  const prStatus = merged
    ? EPullRequestStatus.Closed
    : EPullRequestStatus.Closed;
  await db.setPullRequestStatus(prNumber, repo.id, prStatus);

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

  // Handle pull request was closed but not merged - re-fund the user
  const user = await db.getUserByGithubId(prOwnerId);
  const userRepo = await db.getUserRepo(user.id, repo.id);
  log.info(
    { repo, user: userRepo },
    "Pull Request closed but not merged. Transfering funds to PR Owner."
  );
  await tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(userRepo.tigerbeetle_account_id),
    BigInt(repo.pr_merge_deduction_debits),
    repo.id
  );
};
