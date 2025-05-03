import db from "@/db/db";
import log from "@/log";
import type { Request, Response } from "express";

export const getSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { repo } = req;
  log.info(`Fetching summary for repo ${repo?.repo_name}:${repo?.repo_id}`);
  const summary = await db.getRepoSummaryStats(repo!.id);
  res.json(summary);
};
