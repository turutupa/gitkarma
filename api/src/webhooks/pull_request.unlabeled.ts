import db from "@/db/db";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestUnlabeledEvent } from "@octokit/webhooks-types";
import { EGithubEndpoints, githubHeaders } from "./constants";
import { comments } from "./messages";
import { isSenderAdmin } from "./utils";

export const handlePullRequestUnlabeled = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestUnlabeledEvent;
}) => {
  const { repository, pull_request, label } = payload;
  const repoId = repository.id;
  const repoName = repository.name;
  const repoOwner = repository.owner.login;
  const prNumber = pull_request.number;

  // Check if the label is a bounty label
  const bountyLabelMatch = label?.name?.match(/^bounty: (\d+) karma$/);
  if (!bountyLabelMatch) {
    return;
  }

  const bountyAmount = parseInt(bountyLabelMatch[1], 10);
  const repo = await db.getRepoByGithubRepoId(repoId);

  // Check if the sender is an admin
  const isAdmin = await isSenderAdmin(octokit, payload, repo);
  if (!isAdmin) {
    // Ensure the label exists or create it
    try {
      await octokit.rest.issues.getLabel({
        owner: repoOwner,
        repo: repoName,
        name: `bounty: ${bountyAmount} karma`,
      });
    } catch (error: any) {
      if (error.status === 404) {
        await octokit.rest.issues.createLabel({
          owner: repoOwner,
          repo: repoName,
          name: `bounty: ${bountyAmount} karma`,
          color: "79E99E",
          description: `Be the first to claim the bounty of ${bountyAmount} karma points!`,
        });
      } else {
        throw error;
      }
    }

    // Re-add the bounty label
    await octokit.rest.issues.addLabels({
      owner: repoOwner,
      repo: repoName,
      issue_number: prNumber,
      labels: [`bounty: ${bountyAmount} karma`],
    });
    log.warn(`Non-admin attempted to remove bounty label from PR #${prNumber}`);
    return;
  }

  const pr = await db.getPullRequest(prNumber, repo.id);
  if (!pr) {
    log.warn(`Pull request #${prNumber} not found in database.`);
    return;
  }

  // Remove bounty from the database
  await db.updatePullRequest(prNumber, repo.id, { bounty: null });
  log.info(`Removed bounty from PR #${prNumber}`);

  await octokit.request(EGithubEndpoints.Comments, {
    owner: repoOwner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.bountyRemovedMessage(),
    headers: githubHeaders,
  });
};
