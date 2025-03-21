import type { TUserRepoAccount } from "@/db/models";
import log from "@/log";
import type { Request, Response } from "express";
import DB from "../db/db";
import { verifyUserIsRepoAdmin } from "./utils";

export async function repoSettings(req: Request, res: Response): Promise<void> {
  const { octokit, repo } = req;
  const sender = req.user as TUserRepoAccount;
  const {
    initial_debits,
    approval_bonus,
    comment_bonus,
    complexity_bonus,
    merge_penalty,
    enable_complexity_bonus,
    enable_review_quality_bonus,
    trigger_recheck_text,
    admin_trigger_recheck_text,
  } = req.body;

  log.info(
    {
      repo,
      sender,
      settings: {
        initial_debits,
        approval_bonus,
        comment_bonus,
        complexity_bonus,
        merge_penalty,
        enable_complexity_bonus,
        enable_review_quality_bonus,
        trigger_recheck_text,
        admin_trigger_recheck_text,
      },
    },
    "Repo settings update"
  );

  // check that user is admin
  await verifyUserIsRepoAdmin(octokit, sender, repo!);

  try {
    const updatedRepo = await DB.updateRepoSettings(repo!.id, {
      initial_debits,
      approval_bonus,
      comment_bonus,
      complexity_bonus,
      merge_penalty,
      enable_complexity_bonus,
      enable_review_quality_bonus,
      trigger_recheck_text,
      admin_trigger_recheck_text,
    });

    res.json(updatedRepo);
  } catch (error: any) {
    log.error(error);
    res.status(500).json({ error: error.message });
  }
}
