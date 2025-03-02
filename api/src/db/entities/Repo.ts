import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { PullRequest } from "./PullRequest.ts";
import type { UserRepo } from "./UserRepo.ts";

@Entity({ name: "repos" })
export class Repo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  repo_id: number; // GitHub repo id

  @Column({ length: 255 })
  repo_name: string;

  @Column({ length: 255 })
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
  @Column({ default: 400 })
  default_debits: number;

  @Column({ default: 50 })
  review_approval_debits: number;

  @Column({ default: 5 })
  comment_debits: number;

  @Column({ default: 20 })
  max_complexity_bonus_debits: number;

  @Column({ default: 100 })
  pr_merge_deduction_debits: number;

  // Analytics
  @Column({ default: 0 })
  total_prs_opened: number;

  @Column({ default: 0 })
  total_prs_approved: number;

  @Column({ default: 0 })
  total_comments: number;
}
