import { Octokit } from "@octokit/rest";
import { NextFunction, Request, Response } from "express";

// Extend Request type to include octokit.
declare global {
  namespace Express {
    interface Request {
      octokit: Octokit;
    }
  }
}

export function createInjectOctokit(octokit: Octokit) {
  return function injectOctokit(req: Request, _: Response, next: NextFunction) {
    req.octokit = octokit;
    next();
  };
}
