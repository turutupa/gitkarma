import db from "@/db/db";
import type { Request, Response } from "express";
import { transformBalanceHistory } from "./utils";

export const getDebits = async (req: Request, res: Response): Promise<void> => {
  const { repo } = req;
  const { startDate, endDate } = req.query;

  // Convert string dates to Date objects if provided
  const startDateParam = startDate ? new Date(startDate as string) : undefined;
  const endDateParam = endDate ? new Date(endDate as string) : undefined;

  const transfers = await db.getDebitsAwardedByRepoId(
    repo!.id,
    startDateParam,
    endDateParam
  );
  const { data, series } = transformBalanceHistory(transfers);
  res.json({ data, series });
};
