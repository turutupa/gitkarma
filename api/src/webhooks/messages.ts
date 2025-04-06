/*************************** */
/*          CHECKS           */
/*************************** */
const completedCheckTitle = "GitKarma Funds Check Completed";
const inProgressCheckTitle = "GitKarma Funds Check in Progress";
const failedCheckTitle = "GitKarma Funds Check Failed";
const adminApprovedCheckTitle = "GitKarma Funds Check Approved by Admin";

const adminApprovedCheckSummary = () => {
  return `## ✅ Token Verification Complete - Admin Approved

### Pull Request Approved for Merge by Administrator

This pull request has been administratively approved, bypassing the token verification process.

### Impact on Balance
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
  return `## ✅ Token Verification Complete

### Pull Request Approved for Merge

@${username} has a sufficient balance of **${oldBalance}💰** tokens, exceeding the required **${mergePenalty}** tokens for this repository.

### Balance Details
- Previous balance: ${oldBalance}💰
- Tokens deducted: ${mergePenalty}💰  
- New balance: ${newBalance}💰

Thank you for using GitKarma!`;
};

const inProgressCheckSummary = (username: string, mergePenalty: number) => {
  return `## 🔄 Processing Token Verification

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
  title: {
    completed: completedCheckTitle,
    inProgress: inProgressCheckTitle,
    failed: failedCheckTitle,
    adminApproved: adminApprovedCheckTitle,
  },
  summary: {
    completed: completedCheckSummary,
    inProgress: inProgressCheckSummary,
    failed: failedCheckSummary,
    adminApproved: adminApprovedCheckSummary,
  },
};

/*************************** */
/*         COMMENTS          */
/*************************** */

const pullRequestAdminOverrideMessage = (admin: string, prNumber: number) => {
  return `## 🔄 Admin Override Activated for PR #${prNumber}

### Override Information
Administrator @${admin} has manually approved this pull request, bypassing the funds verification process. 

This action allows the PR to be merged without checking the author's balance.

Only repository administrators can perform this override.`;
};

const pullRequestAlreadyFundedMessage = (prNumber: number) => {
  return `## ℹ️ PR #${prNumber} Already Funded

The check is already marked as successful, so re-checking is unnecessary. No additional tokens are required.`;
};

const balanceCheckMessage = (username: string, balance: number) => {
  return `## 💰 Balance Check

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
  return `## ✅ PR Funding Check: Passed

Hi @${username}! Your pull request has been successfully funded.

### Current Balance: ${balance} debits

#### Need to re-trigger gitkarma check? Use:
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
- Current balance: ${balance} debits
- Required balance: ${prMergePenalty} debits
- Shortfall: ${prMergePenalty - balance} debits

#### What to do next:
- Earn more debits by reviewing and approving other PRs
- Add helpful comments to other PRs
- ${reTriggerText} - after you've earned more debits to re-trigger gitkarma check
- ${adminReTriggerText} - for bypassing rules and directly passing gitkarma check (admin only)
- 💰 - to view your current balance

Need help? Contact your repository administrator.`;
};

export const comments = {
  pullRequestAdminOverrideMessage,
  pullRequestAlreadyFundedMessage,
  balanceCheckMessage,
  pullRequestFundedMessage,
  pullRequestNotEnoughFundsMessage,
};
