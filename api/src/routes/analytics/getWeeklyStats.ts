import db from "@/db/db";
import type {
  TWeeklyComments,
  TWeeklyDebits,
  TWeeklyPullRequests,
  TWeeklyReviews,
} from "@/db/models";
import type { Request, Response } from "express";
import { combineWeeklyData, getSeriesFromWeeklyData } from "./utils";

export const getAllWeekly = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { repo } = req;
  const { startDate, endDate } = req.query;

  // Convert string dates to Date objects if provided
  const startDateParam = startDate ? new Date(startDate as string) : undefined;
  const endDateParam = endDate ? new Date(endDate as string) : undefined;

  const weeklyPullRequestsReq: Promise<TWeeklyPullRequests[]> =
    db.getWeeklyPullRequestsByRepoId(repo!.id, startDateParam, endDateParam);
  const weekklyReviewsReq: Promise<TWeeklyReviews[]> =
    db.getWeeklyReviewsByRepoId(repo!.id, startDateParam, endDateParam);
  const weeklyCommentsReq: Promise<TWeeklyComments[]> =
    db.getWeeklyCommentsByRepoId(repo!.id, startDateParam, endDateParam);
  const weeklyDebitsReq: Promise<TWeeklyDebits[]> =
    db.getWeeklyDebitsAwardedByRepoId(repo!.id, startDateParam, endDateParam);

  const weeklyData = await Promise.all([
    weeklyPullRequestsReq,
    weekklyReviewsReq,
    weeklyCommentsReq,
    weeklyDebitsReq,
  ]);

  const data = combineWeeklyData(...weeklyData);
  const series = getSeriesFromWeeklyData(data);

  res.json({ data, series });
};
