import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Repo } from "./Repo";
import { User } from "./User";

@Entity({ name: "pull_requests" })
export class PullRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  pr_number: number; // GitHub PR number (unique per repo)

  @ManyToOne("Repo", "pullRequests", { nullable: false })
  @JoinColumn({ name: "repo_id" })
  repo: Repo;

  @ManyToOne("User", "pullRequests", { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

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
