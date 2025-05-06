import { jwtMiddleware } from "@/middleware/jwt";
import { injectOctokit } from "@/middleware/octokit";
import { injectUserRepoMiddleware } from "@/middleware/userRepo";
import { getUserRepos } from "@/routes/getUserRepos";
import { transferFunds } from "@/routes/transferFunds";
import { updateRepoSettings } from "@/routes/updateRepoSettings";
import { updateUserRepoRole } from "@/routes/updateUserRepoRole";
import express from "express";
import { errorHandler } from "../middleware/error";
import { getComments } from "./analytics/getComments";
import { getDebits } from "./analytics/getDebits";
import { getPullRequests } from "./analytics/getPullRequests";
import { getRepoActivity } from "./analytics/getRepoActivity";
import { getReviews } from "./analytics/getReviews";
import { getSummary } from "./analytics/getSummary";
import { getAllWeekly } from "./analytics/getWeeklyStats";
import { getUsersGlobalStats } from "./getUsersGlobalStats";

export const routes = (endpoint: string) => {
  // Create a router for routes
  const routes = express.Router();
  // inject middlewares
  routes.use(express.json());
  routes.use(jwtMiddleware);
  routes.use(injectUserRepoMiddleware);
  routes.use(injectOctokit);

  // set "regular" routes
  routes.get(`${endpoint}/repos`, getUserRepos);
  routes.put(`${endpoint}/repos/settings`, updateRepoSettings);
  routes.put(`${endpoint}/repos/roles`, updateUserRepoRole);
  routes.post(`${endpoint}/funds`, transferFunds);

  // set analytics routes
  routes.get(`${endpoint}/summary`, getSummary);
  routes.get(`${endpoint}/repoActivity`, getRepoActivity);
  routes.get(`${endpoint}/usersGlobalStats`, getUsersGlobalStats);
  routes.get(`${endpoint}/pullRequests`, getPullRequests);
  routes.get(`${endpoint}/reviews`, getReviews);
  routes.get(`${endpoint}/comments`, getComments);
  routes.get(`${endpoint}/debits`, getDebits);
  routes.get(`${endpoint}/weekly`, getAllWeekly);

  // error handling middleware
  routes.use(errorHandler);

  return routes;
};
