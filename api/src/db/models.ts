import type { Account } from "tigerbeetle-node";
import type { EUserRepoRole } from "./entities/UserRepo";

export type TUser = {
  id: number;
  github_id: number;
  github_username: string;
  github_url: string;
  created_at: Date;
};

export type TUserAccount = {
  id: number;
  tbAccountId: number;
};

export type TUserRepo = {
  id: number;
  user_id: number;
  repo_id: number;
  tigerbeetle_account_id: number;
  role: EUserRepoRole;
  prs_opened: number;
  prs_approved: number;
  comments_count: number;
  created_at: Date;
};

export type TRepo = {
  id: number;
  installation_id: number;
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
  disable_gitkarma: boolean;
  initial_debits: number;
  approval_bonus: number;
  comment_bonus: number;
  complexity_bonus: number;
  merge_penalty: number;
  review_bonus: number;
  timely_review_bonus_enabled: boolean;
  timely_review_bonus: number;
  timely_review_bonus_hours: number;
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
  repo_id: number;
  user_id: number;
  pr_number: number;
  pr_title: string;
  pr_desription: string;
  pr_url: string;
  pr_num_changed_files: number;
  head_sha: string;
  state: string;
  bounty?: number;
  check_passed: boolean;
  admin_approved: boolean;
  created_at: Date;
  updated_at: Date;
  // Add additional fields here if needed.
};

export type TReview = {
  id: number;
  review_id: string;
  pull_request_id: number;
  repo_id: number;
  reviewer_id: number;
  state: string;
  body: string | null;
  commit_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type TReviewComment = {
  id: number;
  comment_id: string;
  review_id: number;
  body: string | null;
  path: string | null;
  position: number | null;
  line: number | null;
  created_at: Date;
  updated_at: Date;
};

export type TUserRepoAccount = {
  user: TUser;
  userRepo: TUserRepo;
  account: Account;
};

export type TActivityLog = {
  id: number;
  repo_id: number;
  pull_request_id: number;
  user_id: number;
  event: string;
  description: string;
  descriptionUrl: string;
  action: string;
  debits: number;
  created_at: Date;
};

export type TUsersGlobalStats = {
  user_id: number;
  github_id: number;
  github_username: string;
  github_url: string;
  pull_request_count: number;
  review_count: number;
  debits: number;
};

export type TAnalytics = {
  data: {
    date: string;
    [username: string]: number | string;
  }[];
  series: {
    name: string;
  }[];
};

export type TProcessData = {
  github_username: string;
  created_at: string;
  debits?: number;
  action?: string;
}[];

export type TPullRequestsByRepoId = {
  id: number;
  github_username: string;
  created_at: string;
};

type TBaseWeekly = {
  year: number;
  week_number: number;
};
export type TWeeklyPullRequests = { pr_count: number } & TBaseWeekly;
export type TWeeklyReviews = { review_count: number } & TBaseWeekly;
export type TWeeklyComments = { comment_count: number } & TBaseWeekly;
export type TWeeklyDebits = { debit_count: number } & TBaseWeekly;

export type TTransfer = {
  github_username: string;
  created_at: string;
  debits: number;
  action: string;
};
