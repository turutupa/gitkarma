import db from "@/db/db";
import type { TRepo } from "@/db/models";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { Label, PullRequestUnlabeledEvent } from "@octokit/webhooks-types";
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
  const pullRequestUnlabeledWebhook = new PullRequestUnlabeledWebhook(
    octokit,
    payload
  );
  return await pullRequestUnlabeledWebhook.handle();
};

class PullRequestUnlabeledWebhook {
  private repoId: number;
  private repoName: string;
  private repoOwner: string;
  private prNumber: number;
  private label: Label;
  private bountyAmount: number;

  private repo: TRepo;

  constructor(
    private octokit: Octokit,
    private payload: PullRequestUnlabeledEvent
  ) {
    const { repository, pull_request, label } = payload;
    this.repoId = repository.id;
    this.repoName = repository.name;
    this.repoOwner = repository.owner.login;
    this.prNumber = pull_request.number;
    this.label = label;
  }

  public async handle() {
    const isBot = this.payload.sender.type === "Bot";
    if (isBot) {
      return;
    }

    // Check if the label is a bounty label
    const bountyLabelMatch = this.label?.name?.match(/^bounty: (\d+) karma$/);
    if (!bountyLabelMatch) {
      return;
    }

    this.bountyAmount = parseInt(bountyLabelMatch[1], 10);
    this.repo = await db.getRepoByGithubRepoId(this.repoId);

    // If sender is not admin then revert changes
    const isAdmin = await isSenderAdmin(this.octokit, this.payload, this.repo);
    if (!isAdmin) {
      await this.handleRevertUnlabeling();
      return;
    }

    // remove bounty from pr
    await this.handleUnlabeling();
  }

  /**
   * Updates the Pull Request to remove the bounty from it
   * @returns
   */
  private async handleUnlabeling() {
    // Remove bounty from the database
    const pr = await db.getPullRequest(this.prNumber, this.repo.id);
    if (!pr) {
      log.warn(`Pull request #${this.prNumber} not found in database.`);
      return;
    }

    await db.updatePullRequest(this.prNumber, this.repo.id, { bounty: null });
    log.info(`Removed bounty from PR #${this.prNumber}`);

    await this.octokit.request(EGithubEndpoints.Comments, {
      owner: this.repoOwner,
      repo: this.repoName,
      issue_number: this.prNumber,
      body: comments.bountyRemovedMessage(),
      headers: githubHeaders,
    });
  }

  /**
   * Should revert changes by adding the bounty back again
   * @returns
   */
  private async handleRevertUnlabeling() {
    // 1. Ensure the label exists or create it
    try {
      await this.octokit.rest.issues.getLabel({
        owner: this.repoOwner,
        repo: this.repoName,
        name: `bounty: ${this.bountyAmount} karma`,
      });
    } catch (error: any) {
      if (error.status === 404) {
        await this.octokit.rest.issues.createLabel({
          owner: this.repoOwner,
          repo: this.repoName,
          name: `bounty: ${this.bountyAmount} karma`,
          color: "79E99E",
          description: `Be the first to claim the bounty of ${this.bountyAmount} karma points!`,
        });
      } else {
        throw error;
      }
    }

    // 2. Re-add the bounty label
    await this.octokit.rest.issues.addLabels({
      owner: this.repoOwner,
      repo: this.repoName,
      issue_number: this.prNumber,
      labels: [`bounty: ${this.bountyAmount} karma`],
    });
    log.warn(
      `Non-admin attempted to remove bounty label from PR #${this.prNumber}`
    );
  }
}
