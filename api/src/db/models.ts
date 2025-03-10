import type { Account } from "tigerbeetle-node";

export type TUser = {
  id: number;
  github_id: number;
  github_username: string;
  created_at: Date;
};

export type TUserRepo = {
  id: number;
  user_id: number;
  repo_id: number;
  tigerbeetle_account_id: number;
  prs_opened: number;
  prs_approved: number;
  comments_count: number;
  created_at: Date;
};

export type TRepo = {
  id: number;
  repo_id: number;
  repo_name: string;
  repo_owner: string;
  tigerbeetle_account_id: bigint;
  created_at: Date;

  // Analytics fields
  total_prs_opened: number;
  total_prs_approved: number;
  total_comments: number;

  // Configuration fields
  initial_debits: number;
  approval_bonus: number;
  comment_bonus: number;
  complexity_bonus: number;
  merge_penalty: number;
  enable_complexity_bonus: boolean;
  enable_review_quality_bonus: boolean;
  trigger_recheck_text: string;
  admin_trigger_recheck_text: string;
};

export type TJsonAccount = {
  [K in keyof Account]: Account[K] extends bigint ? string : Account[K];
};

export type TUserData = {
  account: TJsonAccount;
} & TUser &
  TUserRepo;

export type TRepoAndUsers = {
  users: TUserData[];
} & TRepo;

export type TPullRequest = {
  id: number;
  pr_number: number;
  repo_id: number;
  user_id: number;
  head_sha: string;
  state: string;
  check_passed: boolean;
  created_at: Date;
  updated_at: Date;
  // Add additional fields here if needed.
};

export type TUserRepoAccount = {
  user: TUser;
  userRepo: TUserRepo;
  account: Account;
};
