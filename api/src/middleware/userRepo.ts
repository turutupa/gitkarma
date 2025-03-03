import db from "db/db.ts";
import { TRepo, TUser, TUserRepoAccount } from "db/models.ts";
import type { NextFunction, Request, Response } from "express";
import { getOrDefaultGithubUser } from "webhooks/utils.ts";

// Extend Express Request to include TUser data.
declare global {
  namespace Express {
    interface Request {
      user: TUser | TUserRepoAccount;
      repo?: TRepo;
      repoId?: number;
    }
  }
}

export async function createInjectUserRepoMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  const jwt = req.jwt;
  const githubUser = await db.getUserByGithubUserId(jwt.id);
  if (req.jwt.id && req.headers.repoid) {
    const repo = await db.getRepoByGithubRepoId(Number(req.headers.repoid));
    const user = await getOrDefaultGithubUser(
      repo,
      req.jwt.id,
      githubUser.github_username
    );
    req.repo = repo;
    req.user = user;
    req.repoId = Number(req.headers.repoid);
  } else if (githubUser && !req.headers.repoid) {
    req.user = githubUser;
  }

  next();
}
