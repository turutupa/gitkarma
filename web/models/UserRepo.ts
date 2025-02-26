export type Account = {
  id: bigint;
  debits_pending: bigint;
  debits_posted: bigint;
  credits_pending: bigint;
  credits_posted: bigint;
  user_data_128: bigint;
  user_data_64: bigint;
  user_data_32: number;
  reserved: number;
  ledger: number;
  code: number;
  flags: number;
  timestamp: bigint;
};

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
