/*********************************************** */
/*                  CHECKS                       */
/*********************************************** */
const completedCheckTitle = "GitKarma Funds Check Completed";
const inProgressCheckTitle = "GitKarma Funds Check in Progress";
const failedCheckTitle = "GitKarma Funds Check Failed";
const adminApprovedCheckTitle = "GitKarma Funds Check Approved by Admin";

const adminApprovedCheckSummary = () => {
  return `### ✅ Token Verification Complete - Admin Approved

#### Pull Request Approved for Merge by Administrator

This pull request has been administratively approved, bypassing the token verification process.

#### Impact on Balance
- No tokens were deducted from the author's balance
- This is an administrative override

Thank you for using GitKarma!`;
};

const completedCheckSummary = (
  username: string,
  oldBalance: number,
  newBalance: number,
  mergePenalty: number
) => {
  return `### ✅ Token Verification Complete

#### Pull Request Approved for Merge

@${username} has a sufficient balance of **${oldBalance}💰** tokens, exceeding the required **${mergePenalty}** tokens for this repository.

#### Balance Details
- Previous balance: ${oldBalance}💰
- Tokens deducted: ${mergePenalty}💰  
- New balance: ${newBalance}💰

Thank you for using GitKarma!`;
};

const inProgressCheckSummary = (username: string, mergePenalty: number) => {
  return `### 🔄 Processing Token Verification

We're currently verifying if @${username} has sufficient tokens for this pull request.

### Required Tokens: ${mergePenalty || "calculating..."} 💰

The verification process typically takes a few seconds. Once complete, you'll see whether this pull request passes our token requirements.

Thank you for your patience!`;
};

const failedCheckSummary = (
  username: string,
  balance: number,
  mergePenalty: number
) => {
  return `## ❌ Funds Verification Failed

### Pull Request Blocked from Merging

@${username} has an insufficient balance of **${balance}💰** tokens, below the required **${mergePenalty}** tokens for this repository.

### Balance Details
- Current balance: ${balance}💰
- Required tokens: ${mergePenalty}💰  
- Shortfall: ${mergePenalty - balance}💰

Please earn more tokens by reviewing PRs or contributing in other ways before attempting to merge.

Thank you for using GitKarma!`;
};

export const checks = {
  inProgress: { title: inProgressCheckTitle, summary: inProgressCheckSummary },
  completed: { title: completedCheckTitle, summary: completedCheckSummary },
  failed: { title: failedCheckTitle, summary: failedCheckSummary },
  adminApproved: {
    title: adminApprovedCheckTitle,
    summary: adminApprovedCheckSummary,
  },
};

/*************************************************** */
/*                     COMMENTS                      */
/*************************************************** */

const pullRequestAdminOverrideMessage = (admin: string, prNumber: number) => {
  return `### 🔄 Admin Override Activated for PR #${prNumber}

#### Override Information
Administrator @${admin} has manually approved this pull request, bypassing the funds verification process. 

This action allows the PR to be merged without checking the author's balance.

Only repository administrators can perform this override.`;
};

const pullRequestAlreadyFundedMessage = (prNumber: number) => {
  return `### ℹ️ PR #${prNumber} Already Funded

The check is already marked as successful, so re-checking is unnecessary. No additional tokens are required.`;
};

const balanceCheckMessage = (username: string, balance: number) => {
  return `### 💰 Balance Check

Hello @${username}!

Your current balance is **${balance} tokens**.

You can use this balance to fund your pull requests in repositories that use GitKarma.
Need more tokens? Earn them by reviewing PRs or through other contributions defined by your repository's rules.`;
};

const pullRequestFundedMessage = (
  username: string,
  balance: number,
  reTriggerText: string,
  adminReTriggerText: string
) => {
  return `### ✅ PR Funding Check: Passed

Hi @${username}! Your pull request has been successfully funded.

#### Current Balance: ${balance} karma points

##### Need to re-trigger gitkarma check? Use:
- ${reTriggerText} - for all users
- ${adminReTriggerText} - for bypassing gitkarma rules and directly passing check (admin only)
- 💰 - to view your current balance

Thank you for contributing!`;
};

const pullRequestNotEnoughFundsMessage = (
  username: string,
  balance: number,
  prMergePenalty: number,
  reTriggerText: string,
  adminReTriggerText: string
) => {
  return `## ❌ PR Funding Check: Insufficient Funds

Hi @${username}! Your pull request could not be approved due to insufficient funds.

### Balance Details:
- Current balance: ${balance} karma points
- Required balance: ${prMergePenalty} karma points
- Shortfall: ${prMergePenalty - balance} karma points

#### What to do next:
- Earn more karma points by reviewing and approving other PRs
- Add helpful comments to other PRs
- ${reTriggerText} - after you've earned more karma points to re-trigger gitkarma check
- ${adminReTriggerText} - for bypassing rules and directly passing gitkarma check (admin only)
- 💰 - to view your current balance

Need help? Contact your repository administrator.`;
};

const pullRequestReviewSubmittedMessage = (
  username: string,
  totalDebitsAwarded: number,
  timelyBonus: number
) => {
  const timelyBonusMessage =
    timelyBonus > 0
      ? `This includes a timely review bonus of **${timelyBonus} karma points** for submitting your review within the configured time frame.`
      : `No timely review bonus was awarded as the review was submitted outside the configured time frame.`;

  return `### 🎉 Review Submitted - Debits Awarded!

Thank you @${username} for submitting your review!

#### Reward Details:
- **${totalDebitsAwarded} karma points** have been added to your balance
- ${timelyBonusMessage}
- These karma points can be used to fund your future pull requests
- Quality reviews help maintain code quality while building your balance

Keep up the great work and thank you for contributing to the project!`;
};

const pullRequestMergedMessage = (
  author: string,
  prNumber: number,
  approvers: string[], // list of names of approvers
  debitsAwarded: number
) => {
  const approversList = approvers
    .map((approver) => `- @${approver}`)
    .join("\n");

  const approversMessage =
    approvers.length > 0
      ? `#### Reviewer Rewards
Pull request approvers:
${approversList}

All reviewers who approved this PR before merge have been awarded ${debitsAwarded} karma points as per repository rules.
`
      : ` There were no Pull Request approvers therefore no karma points were awarded.`;

  return `### 🚀 PR #${prNumber} Merged Successfully

Congratulations @${author}, your pull request has been merged!

${approversMessage}
`;
};

const pullRequestClosedMessage = (
  author: string,
  prNumber: number,
  refundAmount: number,
  wasAdminOverride: boolean
) => {
  const refundMessage = wasAdminOverride
    ? `> ℹ️ This PR was approved via admin override, so **no refund** has been issued.`
    : `> 💸 **${refundAmount} karma points** have been refunded to @${author}.`;

  return `## ❌ PR #${prNumber} Closed Without Merge

Hello @${author},

This pull request was closed without being merged.

${refundMessage}

Thank you for participating — feel free to continue contributing!`;
};

export const comments = {
  pullRequestAdminOverrideMessage,
  pullRequestAlreadyFundedMessage,
  balanceCheckMessage,
  pullRequestFundedMessage,
  pullRequestNotEnoughFundsMessage,
  pullRequestReviewSubmittedMessage,
  pullRequestMergedMessage,
  pullRequestClosedMessage,
};
