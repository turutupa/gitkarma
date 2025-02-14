BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repos (
  id SERIAL PRIMARY KEY,
  repo_id VARCHAR(255) NOT NULL UNIQUE, -- Can be github/gitlab/etc repo id
  repo_name VARCHAR(255) NOT NULL,
  tigerbeetle_account_id NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- analytics
  total_prs_opened INTEGER DEFAULT 0,
  total_prs_approved INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  -- Configuration fields:
  default_debits INTEGER DEFAULT 200,              -- Starting credits for a new user 
  review_approval_debits INTEGER DEFAULT 50,       -- Credits granted for approving a PR review 
  comment_debits INTEGER DEFAULT 5,                -- Credits per comment 
  max_complexity_bonus_debits INTEGER DEFAULT 20,  -- Maximum bonus credits for complex reviews 
  pr_merge_deduction_debits INTEGER DEFAULT 100            -- Credits deducted from the PR creator when merged 
);

CREATE TABLE IF NOT EXISTS user_repo (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  repo_id INTEGER NOT NULL REFERENCES repos(id),
  tigerbeetle_account_id NUMERIC NOT NULL,
  prs_opened INTEGER DEFAULT 0,
  prs_approved INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  UNIQUE(user_id, repo_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_repo_id INTEGER NOT NULL REFERENCES user_repo(id),
  amount NUMERIC NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
