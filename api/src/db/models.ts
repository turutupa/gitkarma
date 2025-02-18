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
  repo_id: string;
  repo_name: string;
  tigerbeetle_account_id: bigint;
  created_at: Date;

  // Analytics fields
  total_prs_opened: number;
  total_prs_approved: number;
  total_comments: number;

  // Configuration fields
  default_debits: number;
  review_approval_debits: number;
  comment_debits: number;
  max_complexity_bonus_debits: number;
  pr_merge_deduction_debits: number;
};

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
