import db from "db/db.ts";
import { TUserRepoAccount } from "db/models.ts";
import type { Request, Response } from "express";
import log from "log.ts";
import tb from "../db/tigerbeetle.ts";
import { verifyUserIsRepoAdmin } from "./common.ts";

/**
 * transferFunds:
 * Transfers a specified amount from a repo's funds to a user.
 * Uses bearer token (from the Authorization header) to verify the caller's admin rights.
 *
 * Expects the request body to contain:
 *  { repoId: number, userId: number, amount: string | number }
 *
 * @param req - Express request with authorization header and body payload.
 * @param res - Express response.
 */
export const transferFunds = async (req: Request, res: Response) => {
  log.debug(
    { auth: req.jwt, body: req.body },
    "Transfer funds request received"
  );
  const { octokit, repo } = req;
  const amount = req.body.amount;
  const sender = req.user as TUserRepoAccount;
  const targetUserId = req.body.userId;

  // Extract data from request body.
  if (!repo || !sender || !targetUserId || !amount) {
    log.error(req.body, "Transfer funds error: Missing required fields");
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Verify if the executing user is an admin/owner of the repo using sessionUser.id.
  await verifyUserIsRepoAdmin(octokit, sender, repo!);

  try {
    const targetUserRepo = await db.getUserRepoByGithubUserAndRepoId(
      targetUserId,
      repo.repo_id
    );

    // Call TigerBeetle to perform the funds transfer.
    if (amount < 0) {
      // if the amount is negative, check if the user has enough funds
      const account = await tb.getUserAccount(
        BigInt(targetUserRepo.user_id),
        BigInt(targetUserRepo.repo_id)
      );
      const balance = tb.getBalance(account);
      if (balance < Math.abs(amount)) {
        res
          .status(406)
          .json({ error: "Insufficient funds", message: "Insufficient funds" });
        return;
      }

      await tb.repoChargesFundsToUser(
        BigInt(repo?.tigerbeetle_account_id!),
        BigInt(targetUserRepo.tigerbeetle_account_id),
        BigInt(Math.abs(amount)),
        Number(repo.id)
      );
    } else {
      await tb.repoTransfersFundsToUser(
        BigInt(repo?.tigerbeetle_account_id!),
        BigInt(targetUserRepo.tigerbeetle_account_id),
        BigInt(amount),
        Number(repo.id)
      );
    }
    res.status(200).json({ message: "Funds transferred successfully" });
  } catch (error) {
    log.error(error, "Transfer funds error");
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : error });
  }
};
