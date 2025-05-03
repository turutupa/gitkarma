import db from "@/db/db";
import type { Request, Response } from "express";
import { transformCumulative } from "./utils";

export const getReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { repo } = req;
  const { startDate, endDate } = req.query;

  // Convert string dates to Date objects if provided
  const startDateParam = startDate ? new Date(startDate as string) : undefined;
  const endDateParam = endDate ? new Date(endDate as string) : undefined;

  const reviews = await db.getReviewsByRepoId(
    repo!.id,
    startDateParam,
    endDateParam
  );
  const { data, series } = transformCumulative(reviews);
  res.json({ data, series });
};
