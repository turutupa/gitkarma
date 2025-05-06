import db from "@/db/db";
import log from "@/log";
import type { Request, Response } from "express";

export const getRepoActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { repo } = req;
  if (!repo) {
    log.error("Get Repo Activity > Repo not found");
    res.status(400).json({ error: "Repo not found" });
    return;
  }
  const { userId, entityType, startDate, endDate } = req.query;
  const filters = {
    userId: userId ? Number(userId) : undefined,
    entityType: entityType ? String(entityType) : undefined,
    startDate: startDate ? new Date(String(startDate)) : undefined,
    endDate: endDate ? new Date(String(endDate)) : undefined,
  };
  try {
    const repoActivity = await db.getActivityLogs(repo.id, filters);
    res.json(repoActivity);
  } catch (e) {
    log.error("Get Repo Activity > Error fetching activity logs", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
