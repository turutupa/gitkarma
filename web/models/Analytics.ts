export type TAnalytics = {
  data: {
    date: string;
    [username: string]: number | string;
  }[];
  series: {
    name: string;
  }[];
};

export type TSummary = {
  pull_requests_this_month: number;
  pull_requests_last_month: number;
  reviews_this_month: number;
  reviews_last_month: number;
  comments_this_month: number;
  comments_last_month: number;
  debits_this_month: number;
  debits_last_month: number;
};

export type TActivityLog = {
  id: number;
  github_user_id: number;
  github_username: string;
  event: string;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  description: string;
  description_url: string;
  action: string;
  debits: number;
  created_at: string;
};

export type TUsersGlobalStats = {
  id: number;
  github_id: number;
  github_username: string;
  github_url: string;
  pull_request_count: number;
  pull_request_review: number;
  review_count: number;
  debits: number;
};

export enum EActivityLogEvent {
  Repository = 'repository',
  User = 'user',
  PullRequest = 'pull_request',
  CheckTrigger = 'check_trigger',
  AdminOverride = 'admin_override',
  ApprovalBonus = 'approval_bonus',
  Comment = 'comment',
  Review = 'review',
}
