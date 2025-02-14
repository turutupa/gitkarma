export const DEFAULT_REPO_CONFIG = {
  defaultDebits: 200, // starting debits for a new user
  reviewApprovalDebits: 50, // debits granted for approving a PR review
  commentDebits: 5, // debits per comment
  maxComplexityBonusDebits: 20, // Maximum bonus debits for complex reviews
  prMergeDeductionDebits: 100, // debits deducted from the PR creator when merged
};

export enum GithubEndpoints {
  Comments = "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
}

export const githubHeaders = {
  "x-github-api-version": "2022-11-28",
};
