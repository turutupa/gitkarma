import db from "@/db/db";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { PullRequestLabeledEvent } from "@octokit/webhooks-types";
import { EGithubEndpoints, githubHeaders } from "./constants";
import { comments } from "./messages";
import { isSenderAdmin } from "./utils";

export const handlePullRequestLabeled = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: PullRequestLabeledEvent;
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
  const pr = await db.getPullRequest(prNumber, repo.id);

  if (!pr) {
    log.warn(`Pull request #${prNumber} not found in database.`);
    return;
  }

  // If not Admin then revert the action by deleting the newly added bounty label
  const isAdmin = await isSenderAdmin(octokit, payload, repo);
  if (!isAdmin) {
    try {
      await octokit.rest.issues.removeLabel({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        name: `bounty: ${bountyAmount} karma`,
      });
    } catch (error: any) {
      if (error.status !== 404) {
        throw error; // Re-throw other errors
      }
    }
    log.warn(`Non-admin attempted to add bounty label to PR #${prNumber}`);
    return;
  }

  // Remove already existing bounty from GitHub PR if present
  if (pr.bounty) {
    try {
      await octokit.rest.issues.removeLabel({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        name: `bounty: ${pr.bounty} karma`,
      });
    } catch (error: any) {
      if (error.status !== 404) {
        throw error; // Re-throw other errors
      }
    }
  }

  // Update the bounty in the database
  await db.updatePullRequest(prNumber, repo.id, { bounty: bountyAmount });
  log.info(
    `Updated bounty to ${bountyAmount} karma points for PR ${repoName}:#${prNumber}`
  );

  await octokit.request(EGithubEndpoints.Comments, {
    owner: repoOwner,
    repo: repoName,
    issue_number: prNumber,
    body: comments.bountyAddedMessage(bountyAmount),
    headers: githubHeaders,
  });
};
