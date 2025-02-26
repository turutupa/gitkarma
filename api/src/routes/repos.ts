import db from "db/db.ts";
import type { TJsonAccount } from "db/models.ts";
import tb from "db/tigerbeetle.ts";
import type { Request, Response } from "express";
import log from "log.ts";
import type { Account } from "tigerbeetle-node";

function jsonifyAccount(account: Account): TJsonAccount {
  const result = {} as TJsonAccount;
  for (const key in account) {
    if (Object.prototype.hasOwnProperty.call(account, key)) {
      const k = key as keyof Account;
      const value = account[k];
      // @ts-ignore
      result[k] = (
        typeof value === "bigint" ? value.toString() : value
      ) as TJsonAccount[typeof k];
    }
  }
  return result;
}

export const repo = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  log.info({ userId }, "Fetching all user data");
  const allReposData = await db.getAllReposDataForUser(userId);

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

  log.info({ allReposData }, "All user data");
  res.json(allReposData);
};
