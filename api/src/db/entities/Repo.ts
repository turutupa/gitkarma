import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { PullRequest } from "./PullRequest";
import type { UserRepo } from "./UserRepo";

@Entity({ name: "repos" })
export class Repo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: "int" })
  repo_id: number; // GitHub repo id

  // GitHub App installation ID - required for repository-specific API access
  @Column({ nullable: true, type: "int" })
  installation_id: number;

  @Column({ length: 255, type: "varchar" })
  repo_name: string;

  @Column({ length: 255, type: "varchar" })
  repo_owner: string;

  @Column({ type: "numeric", nullable: true })
  tigerbeetle_account_id: number;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  // Relationships
  @OneToMany("UserRepo", "repo")
  userRepos: UserRepo[];

  @OneToMany("PullRequest", "repo")
  pullRequests: PullRequest[];

  // Configuration fields
  @Column({ default: false, type: "boolean" })
  disable_gitkarma: boolean;

  @Column({ default: 400, type: "int" })
  initial_debits: number;

  @Column({ default: 50, type: "int" })
  review_bonus: number;

  @Column({ default: 25, type: "int" })
  timely_review_bonus: number;

  @Column({ default: 24, type: "int" })
  timely_review_bonus_hours: number;

  @Column({ default: false, type: "boolean" })
  timely_review_bonus_enabled: boolean;

  @Column({ default: 50, type: "int" })
  approval_bonus: number;

  @Column({ default: 5, type: "int" })
  comment_bonus: number;

  @Column({ default: 20, type: "int" })
  complexity_bonus: number;

  @Column({ default: 100, type: "int" })
  merge_penalty: number;

  @Column({ default: false, type: "boolean" })
  enable_complexity_bonus: boolean;

  @Column({ default: false, type: "boolean" })
  enable_review_quality_bonus: boolean;

  @Column({ default: "✨", type: "varchar" })
  trigger_recheck_text: string;

  @Column({ default: "🚀", type: "varchar" })
  admin_trigger_recheck_text: string;

  // Analytics
  @Column({ default: 0, type: "int" })
  total_prs_opened: number;

  @Column({ default: 0, type: "int" })
  total_prs_approved: number;

  @Column({ default: 0, type: "int" })
  total_comments: number;
}
