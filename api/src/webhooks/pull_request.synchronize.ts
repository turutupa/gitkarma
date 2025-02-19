import type { Octokit } from "@octokit/rest";
import type { PullRequestSynchronizeEvent } from "@octokit/webhooks-types";

/**
 * handlePullRequestSynchronize:
 *
 * @param { Octokit, payload }
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
};
