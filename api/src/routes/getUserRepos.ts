import db from "@/db/db";
import type { TJsonAccount } from "@/db/models";
import tb from "@/db/tigerbeetle";
import log from "@/log";
import type { Request, Response } from "express";
import type { Account } from "tigerbeetle-node";

/**
 * Converts a Tigerbeetle account into a JSON-friendly format.
 *
 * Iterates over the properties of the account and converts any BigInt values to strings.
 *
 * @param account - The Tigerbeetle account object.
 * @returns A JSON-friendly account representation.
 */
function jsonifyAccount(account: Account): TJsonAccount {
  const result: Partial<Record<keyof Account, string | number>> = {};
  for (const key in account) {
    if (Object.prototype.hasOwnProperty.call(account, key)) {
      const k = key as keyof Account;
      const value = account[k];
      result[k] = (
        typeof value === "bigint" ? value.toString() : value
      ) as TJsonAccount[typeof k];
    }
  }
  return result as TJsonAccount;
}

/**
 * repos:
 * Fetches all repository data for a user, including user accounts, and sends it as a JSON response.
 *
 * @param req - The request object containing the user ID parameter.
 * @param res - The response object used to send the JSON data.
 */
export const getUserRepos = async (req: Request, res: Response) => {
  const user = req.jwt!;
  const allReposData = await db.getAllGithubReposDataForUser(String(user.id));

  // fetch tiger beetle accounts for each user
  await Promise.all(
    allReposData.map(async (repo) => {
      await Promise.all(
        repo.users.map(async (user) => {
          const account = await tb.getUserAccount(
            BigInt(user.id),
            BigInt(repo.id)
          );
          user.account = jsonifyAccount(account);
        })
      );
    })
  );

  log.debug({ allReposData }, "All user data");
  res.json(allReposData);
};
