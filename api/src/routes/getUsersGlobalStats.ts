import db from "@/db/db";
import type { TUsersGlobalStats } from "@/db/models";
import tigerbeetle from "@/db/tigerbeetle";
import log from "@/log";
import type { Request, Response } from "express";
import type { Account } from "tigerbeetle-node";

export const getUsersGlobalStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { repo } = req;
  if (!repo) {
    log.error("Get Repo Activity > Repo not found");
    res.status(400).json({ error: "Repo not found" });
    return;
  }
  const usersGlobalStats: TUsersGlobalStats[] = await db.getUsersGlobalStats(
    repo.id
  );
  const accountReqs: Promise<Account>[] = [];
  usersGlobalStats.map((stat) => {
    const fetchAccount = tigerbeetle.getUserAccount(
      BigInt(stat.user_id),
      BigInt(repo.id)
    );
    accountReqs.push(fetchAccount);
  });
  const accounts = await Promise.all(accountReqs);
  usersGlobalStats.forEach((stat, i) => {
    stat.debits = Number(tigerbeetle.getBalance(accounts[i]));
  });
  res.json(usersGlobalStats);
};
