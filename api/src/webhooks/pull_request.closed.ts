import type { Octokit } from "@octokit/rest";
import type {
  PullRequestOpenedEvent,
  PullRequestReview,
} from "@octokit/webhooks-types";
import log from "log.ts";

export const handlePullRequestClosed = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestOpenedEvent;
}) => {
  const prNumber = payload.number;
  const owner = payload.repository.owner.login; // GitHub repo owner
  const repoName = payload.repository.name; // GitHub repo name
  //   const repoId = payload.repository.id; // GitHub ID
  // const prOwnerId = payload.pull_request.user.id; // GitHub user id
  // const prOwnerName = payload.pull_request.user.login; // GitHub user login name
  const merged = payload.pull_request.merged;

  if (merged) {
    // get list of devs who approved PR
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

    log.info(approvedReviews, "all reviews");
    log.info(approvers, "approved reviews");

    return;
  }
};
