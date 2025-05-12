import db from "@/db/db";
import type { TPullRequest, TRepo } from "@/db/models";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type { Label, PullRequestLabeledEvent } from "@octokit/webhooks-types";
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
  const pullRequestLabeledWebhook = new PullRequestLabeledWebhook(
    octokit,
    payload
  );
  return await pullRequestLabeledWebhook.handle();
};

class PullRequestLabeledWebhook {
  repoId: number;
  repoName: string;
  repoOwner: string;
  prNumber: number;
  label: Label;

  bountyAmount: number;
  repo: TRepo;
  pr: TPullRequest | null;

  constructor(
    private octokit: Octokit,
    private payload: PullRequestLabeledEvent
  ) {
    const { repository, pull_request, label } = payload;
    this.label = label;
    this.repoId = repository.id;
    this.repoName = repository.name;
    this.repoOwner = repository.owner.login;
    this.prNumber = pull_request.number;
  }

  public async handle() {
    // Check if the label is a bounty label
    const bountyLabelMatch = this.label?.name?.match(/^bounty: (\d+) karma$/);
    if (!bountyLabelMatch) {
      return;
    }

    this.bountyAmount = parseInt(bountyLabelMatch[1], 10);
    this.repo = await db.getRepoByGithubRepoId(this.repoId);
    this.pr = await db.getPullRequest(this.prNumber, this.repo.id);

    if (!this.pr) {
      log.warn(`Pull request #${this.prNumber} not found in database.`);
      return;
    }

    const isAdmin = await isSenderAdmin(this.octokit, this.payload, this.repo);
    if (!isAdmin) {
      await this.handleRevertLabeling();
      return;
    }

    await this.handleLabeling();
  }

  /**
   * If a bounty was added and an existing one already existed, then remove previous one,
   * only supporting one bounty allowed at a time.
   *
   * Update TPullRequest with new bounty amount.
   *
   * Notify on github of newly added bounty.
   */
  private async handleLabeling() {
    // Remove already existing bounty from GitHub PR if present
    if (this.pr!.bounty) {
      try {
        await this.octokit.rest.issues.removeLabel({
          owner: this.repoOwner,
          repo: this.repoName,
          issue_number: this.prNumber,
          name: `bounty: ${this.pr!.bounty} karma`,
        });
      } catch (error: any) {
        if (error.status !== 404) {
          throw error; // Re-throw other errors
        }
      }
    }

    // Update the bounty in the database
    await db.updatePullRequest(this.prNumber, this.repo.id, {
      bounty: this.bountyAmount,
    });
    log.info(
      `Updated bounty to ${this.bountyAmount} karma points for PR ${this.repoName}:#${this.prNumber}`
    );

    await this.octokit.request(EGithubEndpoints.Comments, {
      owner: this.repoOwner,
      repo: this.repoName,
      issue_number: this.prNumber,
      body: comments.bountyAddedMessage(this.bountyAmount),
      headers: githubHeaders,
    });
  }

  /**
   * If not Admin then revert the action by deleting the newly added bounty label
   */
  private async handleRevertLabeling() {
    try {
      await this.octokit.rest.issues.removeLabel({
        owner: this.repoOwner,
        repo: this.repoName,
        issue_number: this.prNumber,
        name: `bounty: ${this.bountyAmount} karma`,
      });
    } catch (error: any) {
      if (error.status !== 404) {
        throw error; // Re-throw other errors
      }
    }
    log.warn(`Non-admin attempted to add bounty label to PR #${this.prNumber}`);
  }
}
