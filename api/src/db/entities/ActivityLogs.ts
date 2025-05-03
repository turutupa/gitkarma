import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PullRequest } from "./PullRequest";
import { Repo } from "./Repo";
import { User } from "./User";

@Entity({ name: "activity_logs" })
@Index("IDX_repo_created_at", ["repo", "created_at"])
export class ActivityLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Repo, { nullable: false })
  @JoinColumn({ name: "repo_id" })
  repo: Repo;

  @ManyToOne(() => PullRequest, { nullable: false })
  @JoinColumn({ name: "pull_request_id" })
  pull_request: PullRequest;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 100 })
  event: string; // e.g., pr, review, comment

  @Column({ type: "varchar", length: 255 })
  description: string; // e.g., (pr) merged, opened, closed, re-check triggered, admin override

  @Column({ type: "varchar", length: 255 })
  description_url: string; // e.g., url to gitkarma comment (funded message, not enough funds message etc)

  @Column({ type: "varchar", length: 255, nullable: true })
  action: string; // spent / received

  @Column({ type: "int", nullable: true })
  debits: number;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;
}
