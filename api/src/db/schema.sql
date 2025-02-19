BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  github_username VARCHAR(255) NOT NULL,
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
  default_debits INTEGER DEFAULT 400,              -- Starting credits for a new user 
  review_approval_debits INTEGER DEFAULT 50,       -- Credits granted for approving a PR review 
  comment_debits INTEGER DEFAULT 5,                -- Credits per comment 
  max_complexity_bonus_debits INTEGER DEFAULT 20,  -- Maximum bonus credits for complex reviews 
  pr_merge_deduction_debits INTEGER DEFAULT 100    -- Credits deducted from the PR creator when merged 
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

CREATE TABLE IF NOT EXISTS pull_requests (
  id SERIAL PRIMARY KEY,
  pr_number INTEGER NOT NULL,                     -- Git Service PR number (unique per repo)
  repo_id INTEGER NOT NULL REFERENCES repos(id),  -- Reference to the repo table
  user_id INTEGER NOT NULL REFERENCES users(id),  -- The PR creator's internal user id
  head_sha VARCHAR(255) NOT NULL,                 -- Latest commit SHA of the PR
  state VARCHAR(50) NOT NULL,                     -- e.g. 'open', 'closed', 'merged'
  check_passed BOOLEAN DEFAULT false,             -- Whether the GitKarma check passed for this PR
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- can create more entries here for analytics, such as # comments, # reviews, code quality etc
);

COMMIT;