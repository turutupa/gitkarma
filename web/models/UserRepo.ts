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

export enum EUserRepoRole {
  COLLABORATOR = 0,
  ADMIN = 1,
  ORGANIZATION_MEMBER = 2,
}

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
  repo_id: number;
  repo_name: string;
  tigerbeetle_account_id: bigint;
  created_at: Date;

  // Analytics fields
  total_prs_opened: number;
  total_prs_approved: number;
  total_comments: number;

  // Configuration fields using snake_case
  initial_debits: number; // initial debits assigned when a user is added
  approval_bonus: number; // debits awarded to a PR approver upon review approval
  comment_bonus: number; // bonus debits for high-quality PR comments
  complexity_bonus: number; // extra debits for high complexity PR
  merge_penalty: number; // debits deducted from a PR author upon merge
  enable_complexity_bonus: boolean; // enable complexity bonus
  enable_review_quality_bonus: boolean; // enable review quality bonus
  trigger_recheck_text: string; // text for PR recheck trigger
  admin_trigger_recheck_text: string; // text for admin PR recheck trigger
  disable_gitkarma: boolean;
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
