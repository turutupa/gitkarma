import DB from "@/db/db";
import type { TUserRepoAccount } from "@/db/models";
import log from "@/log";
import type { Request, Response } from "express";
import { verifyUserIsRepoAdmin } from "./utils";

/**
 * Updates a user's role in a repository
 *
 * @param req - Express request object containing:
 *   - repo: The repository object
 *   - user: The authenticated user (sender) with userRepo information
 *   - body.role: The new role to assign
 *   - body.userId: ID of the user to update
 * @param res - Express response object
 * @returns Promise<void> - Sends JSON response with status code
 * @throws Returns 403 if user is not admin
 * @throws Returns 500 if database operation fails
 */
export const updateUserRepoRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sender = req.user as TUserRepoAccount;
  const repo = req.repo;

  console.log("repo", repo);

  if (!repo) {
    log.error("No repo found");
    res.status(400).json({ error: "No repo found" });
    return;
  }

  // Check if the user has the required role
  if (!(await verifyUserIsRepoAdmin(req.octokit, sender, repo))) {
    log.info(`User ${sender.user.github_username} is not admin`);
    res.status(403).json({ error: "User is not admin" });
    return;
  }

  // update user role
  const { role, userId } = req.body;
  try {
    await DB.updateUserRepoRole(userId, repo.id, role);
    res.status(200).json({ comment: "ok" });
  } catch (error: any) {
    console.log("error", error);
    log.error({ error: error?.message }, "Failed to update user role");
    res.status(500).json({ error: "Failed to update user role" });
  }
};
