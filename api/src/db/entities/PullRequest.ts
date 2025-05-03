import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Repo } from "./Repo";
import { User } from "./User";

@Entity({ name: "pull_requests" })
@Index("IDX_pull_requests_repo_id", ["repo"])
@Index("IDX_pull_requests_repo_created_at", ["repo", "created_at"])
export class PullRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne("Repo", "pullRequests", { nullable: false })
  @JoinColumn({ name: "repo_id" })
  repo: Repo;

  @ManyToOne("User", "pullRequests", { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "int" })
  pr_number: number; // GitHub PR number (unique per repo)

  @Column({ type: "varchar", length: 50, nullable: true })
  pr_title: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  pr_description: string;

  @Column({ type: "int", nullable: true })
  pr_num_changed_files: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  pr_url: string;

  @Column({ length: 255, type: "varchar" })
  head_sha: string;

  @Column({ length: 50, type: "varchar" })
  state: string; // e.g., 'open', 'closed', 'merged'

  @Column({ default: false, type: "boolean" })
  check_passed: boolean;

  @Column({ default: false, type: "boolean" })
  admin_approved: boolean;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;
}
