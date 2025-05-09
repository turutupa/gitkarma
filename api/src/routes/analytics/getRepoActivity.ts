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
  const { userId, event, startDate, endDate, limit, offset } = req.query;
  const filters = {
    userId: userId ? Number(userId) : undefined,
    event: event ? String(event) : undefined,
    startDate: startDate ? new Date(String(startDate)) : undefined,
    endDate: endDate ? new Date(String(endDate)) : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  } as {
    userId?: number;
    event?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  };
  try {
    const repoActivity = await db.getActivityLogs(repo.id, filters);
    res.json(repoActivity);
  } catch (e) {
    log.error("Get Repo Activity > Error fetching activity logs", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
