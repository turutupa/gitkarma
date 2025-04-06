import log from "@/log";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import fs from "fs";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      octokit: Octokit;
    }
  }
}

export async function injectOctokit(
  req: Request,
  _: Response,
  next: NextFunction
) {
  // Create repo-specific Octokit using the installation ID
  try {
    const installationId = req.repo?.installation_id;
    if (installationId) {
      const privateKeyPath = process.env.PRIVATE_KEY_PATH || "";
      const privateKey = fs.readFileSync(privateKeyPath, "utf8");
      req.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: process.env.APP_ID,
          privateKey,
          installationId,
        },
      });
    } else {
      throw new Error("Installation ID not found in request");
    }
  } catch (error) {
    console.log(error);
    log.error(
      { error },
      `Error creating Octokit instance for repo ${req.repo?.repo_name}:${req.repo?.repo_id}`
    );
  }

  next();
}
