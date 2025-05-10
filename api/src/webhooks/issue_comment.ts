import db from "@/db/db";
import { EUserRepoRole } from "@/db/entities/UserRepo";
import type { TPullRequest, TRepo } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Octokit } from "@octokit/rest";
import type {
  IssueCommentEvent,
  Repository,
  User,
} from "@octokit/webhooks-types";
import {
  BALANCE_CHECK_EMOJI,
  EActivityLogAction,
  EActivityLogEvent,
  EGithubEndpoints,
  EPullRequestState,
  githubHeaders,
  GITKARMA_CHECK_NAME,
} from "./constants";
import { checks, comments } from "./messages";
import { getOrDefaultGithubUser, gitkarmaEnabledOrThrow } from "./utils";

/**
 * handleIssueComment:
 *
 * This handler processes an issue comment event and, if the comment is on a pull request,
 * it triggers a re-check of the GitKarma check based on the content of the comment.
 *
 * - Determines if the comment triggers a re-check:
 *   - Uses a specific emoji (e.g., "💰") to check user balance.
 *   - Uses a specific emoji (e.g., "✨") for a standard re-check.
 *   - Uses a designated admin emoji (e.g., "🚀") to indicate an admin override.
 *
 * @param {Octokit} octokit - An authenticated Octokit instance for GitHub API interactions.
 * @param {IssueCommentEvent} payload - The webhook payload for an issue comment event from GitHub.
 *
 * @returns {Promise<void>} A promise that resolves when processing is complete.
 */

export const handleIssueComment = async ({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: IssueCommentEvent;
}) => {
  const issueCommentWebhook = new IssueCommentWebhook(octokit, payload);
  return await issueCommentWebhook.handle();
};

class IssueCommentWebhook {
  // github payload
  action: string;
  prNumber: number;
  repoId: number;
  owner: string;
  repoName: string;
  prOwnerGithubId: number;
  prOwnerGithubName: string;
  prOwnerGithubUrl: string;
  commentBody: string;
  pullRequest:
    | {
        url?: string;
        html_url?: string;
        diff_url?: string;
        patch_url?: string;
        merged_at?: string | null;
      }
    | undefined;
  sender: User;
  repository: Repository;

  // gitkarma repo
  repo: TRepo;

  constructor(private octokit: Octokit, private payload: IssueCommentEvent) {
    this.action = payload.action;
    this.prNumber = payload.issue.number;
    this.repoId = payload.repository.id; // GitHub ID
    this.owner = payload.repository.owner.login; // GitHub repo owner
    this.repoName = payload.repository.name; // GitHub repo name
    this.prOwnerGithubId = payload.issue.user.id; // GitHub user id
    this.prOwnerGithubName = payload.issue.user.login; // GitHub user id
    this.prOwnerGithubUrl = payload.issue.user.html_url; // GitHub user id
    this.commentBody = payload.comment.body.trim();
    this.pullRequest = payload.issue.pull_request;
    this.sender = payload.sender;
    this.repository = payload.repository;
    // const commentUrl = payload.comment.html_url;
    // const prUrl = payload.comment.html_url;
  }

  public async handle() {
    log.info("Processing issue comment event");

    // its an issues' comment, not a pr comment
    if (!this.pullRequest) {
      log.debug(
        { payload: this.payload },
        "issue_comment > not a pull request, skipping"
      );
      return;
    }

    this.repo = await db.getRepoByGithubRepoId(this.repoId);
    gitkarmaEnabledOrThrow(this.repo);

    // Handle the user balance check emoji
    if (this.commentBody === BALANCE_CHECK_EMOJI && this.action === "created") {
      return this.handleUserBalanceCheck();
    }

    // Handle bounty
    this.handleBounty();

    // handle regular and admin re-check
    this.handleRecheck();
  }

  private async handleUserBalanceCheck() {
    const { account } = await getOrDefaultGithubUser(
      this.repo,
      this.sender.id,
      this.sender.login,
      this.sender.html_url
    );
    const balance = tb.getBalance(account);

    const sender = this.sender.login;
    await this.octokit.request(EGithubEndpoints.Comments, {
      owner: this.owner,
      repo: this.repoName,
      issue_number: this.prNumber,
      body: comments.balanceCheckMessage(sender, Number(balance)),
      headers: githubHeaders,
    });
  }

  private async handleBounty() {
    // Extract bounty commands
    const bountyAddMatch = this.commentBody.match(/^gk add bounty (\d+)$/);
    const bountyUpdateMatch = this.commentBody.match(
      /^gk update bounty (\d+)$/
    );
    const bountyRemoveMatch = this.commentBody === "gk remove bounty";

    // exit if not a bounty command
    const isActionCreated = this.action === "created";
    const isBountyCommand =
      bountyAddMatch || bountyUpdateMatch || bountyRemoveMatch;
    if (!(isActionCreated && isBountyCommand)) {
      return;
    }

    // Verify if the sender is an admin
    const sender = await getOrDefaultGithubUser(
      this.repo,
      this.sender.id,
      this.sender.login,
      this.sender.html_url
    );

    let isAdmin = false;
    if (this.repository.permissions?.admin) {
      isAdmin = true;
    } else if (sender.userRepo.role === EUserRepoRole.ADMIN) {
      isAdmin = true;
    } else {
      const { data: permissionData } =
        await this.octokit.rest.repos.getCollaboratorPermissionLevel({
          owner: this.owner,
          repo: this.repoName,
          username: this.sender.login,
        });
      if (permissionData.permission === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      log.info(
        { user: this.payload.sender },
        "Non-admin user attempted to manage bounty"
      );
      return;
    }

    const pr: TPullRequest | null = await db.getPullRequest(
      this.prNumber,
      this.repo.id
    );
    if (!pr) {
      throw new Error(
        `Could not find pull request record for PR #${this.prNumber} and repo id ${this.repoId}`
      );
    }

    if (bountyAddMatch) {
      const bountyAmount = parseInt(bountyAddMatch[1], 10);
      await db.updatePullRequest(this.prNumber, this.repo.id, {
        bounty: bountyAmount,
      });
      await this.octokit.request(EGithubEndpoints.Comments, {
        owner: this.owner,
        repo: this.repoName,
        issue_number: this.prNumber,
        body: comments.bountyAddedMessage(bountyAmount),
        headers: githubHeaders,
      });

      // Remove existing bounty label if present
      if (pr.bounty) {
        try {
          await this.octokit.rest.issues.removeLabel({
            owner: this.owner,
            repo: this.repoName,
            issue_number: this.prNumber,
            name: `bounty: ${pr.bounty} karma`,
          });
        } catch (error: any) {
          if (error.status !== 404) {
            throw error; // Re-throw other errors
          }
        }
      }

      // Check if the label already exists
      try {
        await this.octokit.rest.issues.getLabel({
          owner: this.owner,
          repo: this.repoName,
          name: `bounty: ${bountyAmount} karma`,
        });
        // If the label exists, update it
        await this.octokit.rest.issues.updateLabel({
          owner: this.owner,
          repo: this.repoName,
          name: `bounty: ${bountyAmount} karma`,
          color: "79E99E",
          description: `Be the first to claim the bounty of ${bountyAmount} karma points!`,
        });
      } catch (error: any) {
        if (error.status === 404) {
          // If the label does not exist, create it
          await this.octokit.rest.issues.createLabel({
            owner: this.owner,
            repo: this.repoName,
            name: `bounty: ${bountyAmount} karma`,
            color: "79E99E",
            description: `Be the first to claim the bounty of ${bountyAmount} karma points!`,
          });
        } else {
          throw error; // Re-throw other errors
        }
      }

      await this.octokit.rest.issues.addLabels({
        owner: this.owner,
        repo: this.repoName,
        issue_number: this.prNumber,
        labels: [`bounty: ${bountyAmount} karma`],
      });

      log.info(
        `Added bounty of ${bountyAmount} karma points to PR #${this.prNumber}`
      );
    } else if (bountyRemoveMatch) {
      await db.updatePullRequest(this.prNumber, this.repo.id, {
        bounty: null,
      });
      await this.octokit.request(EGithubEndpoints.Comments, {
        owner: this.owner,
        repo: this.repoName,
        issue_number: this.prNumber,
        body: comments.bountyRemovedMessage(),
        headers: githubHeaders,
      });
      await this.octokit.rest.issues.removeLabel({
        owner: this.owner,
        repo: this.repoName,
        issue_number: this.prNumber,
        name: `bounty: ${pr.bounty} karma`,
      });
      log.info(`Removed bounty from PR #${this.prNumber}`);
    }
  }

  private async handleRecheck() {
    // Exit if the comment is not a re-trigger
    const isTriggeringRecheck =
      this.commentBody === this.repo.trigger_recheck_text;
    const isTriggeringAdminRecheck =
      this.commentBody === this.repo.admin_trigger_recheck_text;

    if (
      this.action != "created" ||
      (!isTriggeringRecheck && !isTriggeringAdminRecheck)
    ) {
      return;
    }

    const pr = await db.getPullRequest(this.prNumber, this.repo.id);
    // if pr doesn't exist exit
    if (!pr) {
      throw new Error(
        `Could not find pull request record for PR #${this.prNumber} and repo id ${this.repoId}`
      );
    }
    // if pr is closed do nothing
    if (pr?.state === EPullRequestState.Closed) {
      return;
    }

    // if check is already passing, exit early.
    if (pr?.check_passed) {
      log.info(comments.pullRequestAlreadyFundedMessage(this.prNumber));
      // send message to PR saying check is already passing
      await this.octokit.request(EGithubEndpoints.Comments, {
        owner: this.owner,
        repo: this.repoName,
        issue_number: this.prNumber,
        body: comments.pullRequestAlreadyFundedMessage(this.prNumber),
        headers: githubHeaders,
      });
      return;
    }

    const { user, account } = await getOrDefaultGithubUser(
      this.repo,
      this.prOwnerGithubId,
      this.prOwnerGithubName,
      this.prOwnerGithubUrl
    );
    const balance = Number(tb.getBalance(account));

    log.debug({ user }, "issue_comment > user");
    log.info({ account }, "issue_comment > user account");

    // set the check to in progress
    await this.octokit.rest.checks.create({
      owner: this.owner,
      repo: this.repoName,
      name: GITKARMA_CHECK_NAME,
      head_sha: pr.head_sha,
      status: "in_progress",
      output: {
        title: checks.inProgress.title,
        summary: checks.inProgress.summary(user.github_username, balance),
      },
    });

    // If the admin emoji is used, verify if the sender is a repo admin:
    const sender = await getOrDefaultGithubUser(
      this.repo,
      this.sender.id,
      this.sender.login,
      this.sender.html_url
    );

    // verify if the sender is an admin
    let isAdmin = false;
    if (isTriggeringAdminRecheck) {
      // Option 1: Try checking the repository permissions in the payload (if available)
      if (this.repository.permissions && this.repository.permissions.admin) {
        isAdmin = true;
        // Optoin 2: Check if the sender is an admin in the database
      } else if (sender.userRepo.role === EUserRepoRole.ADMIN) {
        isAdmin = true;
      } else {
        // Option 3: Query the GitHub API to get the permission level.
        const { data: permissionData } =
          await this.octokit.rest.repos.getCollaboratorPermissionLevel({
            owner: this.owner,
            repo: this.repoName,
            username: this.sender.login,
          });
        if (permissionData.permission === "admin") {
          isAdmin = true;
        }
      }
    }

    // if its admin override, then pass check
    if (isAdmin && isTriggeringAdminRecheck) {
      const admin = this.sender.login;
      // hard-code true to checks passing
      await db.updatePullRequest(this.prNumber, this.repo.id, {
        checkPassed: true,
        adminApproved: true,
      });
      const successComment = await this.octokit.request(
        EGithubEndpoints.Comments,
        {
          owner: this.owner,
          repo: this.repoName,
          issue_number: this.prNumber,
          body: comments.pullRequestAdminOverrideMessage(admin, this.prNumber),
          headers: githubHeaders,
        }
      );
      await this.octokit.rest.checks.create({
        owner: this.owner,
        repo: this.repoName,
        name: GITKARMA_CHECK_NAME,
        head_sha: pr.head_sha,
        status: "completed",
        conclusion: "success",
        output: {
          title: checks.adminApproved.title,
          summary: checks.adminApproved.summary(),
        },
      });
      // activity log - admin override
      await db.createActivityLog(
        this.repo.id,
        pr.id,
        sender.user.id,
        EActivityLogEvent.AdminOverride,
        "pull request funded",
        successComment.data.html_url
      );
      return;
    } else if (!isAdmin && isTriggeringAdminRecheck) {
      log.info(
        { user: this.sender },
        "Non-admin user attempted to trigger admin-recheck"
      );
    }

    // triggering regular re-check...
    const hasEnoughDebits = balance >= this.repo.merge_penalty;

    // set pull request check to passed / not passed based on balance
    await db.updatePullRequest(this.prNumber, this.repo.id, {
      checkPassed: hasEnoughDebits,
    });

    // handle has enough debits to pass check
    if (hasEnoughDebits) {
      // remove funds from user
      await tb.repoChargesFundsToUser(
        BigInt(this.repo.tigerbeetle_account_id),
        BigInt(account.id),
        BigInt(this.repo.merge_penalty),
        this.repo.id
      );

      // send comment to github user
      const newBalance = balance - this.repo.merge_penalty;
      const successComment = await this.octokit.request(
        EGithubEndpoints.Comments,
        {
          owner: this.owner,
          repo: this.repository.name,
          issue_number: this.prNumber,
          body: comments.pullRequestFundedMessage(
            user.github_username,
            newBalance
          ),
          headers: githubHeaders,
        }
      );

      // notify github to pass check
      await this.octokit.rest.checks.create({
        owner: this.owner,
        repo: this.repoName,
        name: GITKARMA_CHECK_NAME,
        head_sha: pr.head_sha,
        status: "completed",
        conclusion: "success",
        output: {
          title: checks.completed.title,
          summary: checks.completed.summary(
            user.github_username,
            balance,
            newBalance,
            this.repo.merge_penalty
          ),
        },
      });

      // activity log - re-check successfull, pr funded
      await db.createActivityLog(
        this.repo.id,
        pr.id,
        user.id,
        EActivityLogEvent.CheckTrigger,
        "Re-check success",
        successComment.data.html_url,
        EActivityLogAction.Spent,
        this.repo.merge_penalty
      );
      return;
    }

    // send error because not enough debits
    const failedComment = await this.octokit.request(
      EGithubEndpoints.Comments,
      {
        owner: this.owner,
        repo: this.repository.name,
        issue_number: this.prNumber,
        body: comments.pullRequestNotEnoughFundsMessage(
          user.github_username,
          balance,
          this.repo.merge_penalty,
          this.repo.trigger_recheck_text,
          this.repo.admin_trigger_recheck_text
        ),
        headers: githubHeaders,
      }
    );

    await this.octokit.rest.checks.create({
      owner: this.owner,
      repo: this.repoName,
      name: GITKARMA_CHECK_NAME,
      head_sha: pr.head_sha,
      status: "completed",
      conclusion: "failure",
      output: {
        title: checks.failed.title,
        summary: checks.failed.summary(
          this.prOwnerGithubName,
          balance,
          this.repo.merge_penalty
        ),
      },
    });

    // activity log - re-check failed, not enough funds
    await db.createActivityLog(
      this.repo.id,
      pr.id,
      user.id,
      EActivityLogEvent.CheckTrigger,
      "Not enough funds",
      failedComment.data.html_url
    );
  }
}
