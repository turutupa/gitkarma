import type { PullRequestReopenedEvent } from "@octokit/webhooks-types";
import db from "db/db.ts";
import tb from "../db/tigerbeetle.ts";
import { getOrDefaultGithubUser } from "./utils.ts";

/**
 * handlePullRequestReopened:
 *
 *
 * @param { payload} - request payload
 */
export const handlePullRequestReopened = async ({
  payload,
}: {
  payload: PullRequestReopenedEvent;
}) => {
  const repoId = payload.repository.id; // GitHub ID
  const prOwnerId = payload.pull_request.user.id; // GitHub user id
  const prOwnerName = payload.pull_request.user.name; // GitHub user name

  const repo = await db.getRepoByGitServiceRepoId(repoId);
  const { account } = await getOrDefaultGithubUser(
    repo,
    prOwnerId,
    prOwnerName!
  );

  tb.repoTransfersFundsToUser(
    BigInt(repo.tigerbeetle_account_id),
    BigInt(account.id),
    BigInt(repo.pr_merge_deduction_debits),
    repo.id
  );
};
