export const DEFAULT_REPO_CONFIG = {
  defaultDebits: 400, // starting debits for a new user
  reviewApprovalDebits: 50, // debits granted for approving a PR review
  commentDebits: 5, // debits per comment
  maxComplexityBonusDebits: 20, // Maximum bonus debits for complex reviews
  prMergeDeductionDebits: 100, // debits deducted from the PR creator when merged
};

export const GITKARMA_CHECK_NAME: string = "GitKarma Funds Check";
export const TRIGGER_RECHECK_EMOJI: string = "✨";
export const ADMIN_TRIGGER_RECHECK_EMOJI: string = "🚀";
export const BALANCE_CHECK_EMOJI = "💰";

/**
 * @deprecated
 * this should be deprecated. octokit alread has builtin methods for this at **octokit.rest**
 */
export enum EGithubEndpoints {
  Comments = "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
}

export enum EPullRequestState {
  Open = "open",
  Closed = "closed",
  Merged = "merged",
}

export enum EActivityLogEvent {
  Repository = "repository",
  User = "user",
  PullRequest = "pull_request",
  CheckTrigger = "check_trigger",
  AdminOverride = "admin_override",
  ApprovalBonus = "approval_bonus",
  Comment = "comment",
  Review = "review",
}

export enum EActivityLogAction {
  Spent = "spent",
  Received = "received",
}

export const githubHeaders = {
  "x-github-api-version": "2022-11-28",
};
