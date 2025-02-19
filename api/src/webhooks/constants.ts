export const DEFAULT_REPO_CONFIG = {
  defaultDebits: 400, // starting debits for a new user
  reviewApprovalDebits: 50, // debits granted for approving a PR review
  commentDebits: 5, // debits per comment
  maxComplexityBonusDebits: 20, // Maximum bonus debits for complex reviews
  prMergeDeductionDebits: 100, // debits deducted from the PR creator when merged
};

export const GITKARMA_CHECK_NAME: string = "Gitkarma Tokens Check";
export const TRIGGER_RECHECK_EMOJI: string = "✨";
export const ADMIN_TRIGGER_RECHECK_EMOJI: string = "🚀";

export enum EGithubEndpoints {
  Comments = "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
}

export enum EPullRequestState {
  Open = "open",
  Closed = "closed",
  Merged = "merged",
}

export const githubHeaders = {
  "x-github-api-version": "2022-11-28",
};
