import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import type { Repo } from "./Repo";
import type { User } from "./User";

@Entity({ name: "user_repo" })
@Unique(["user", "repo"])
export class UserRepo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne("User", "userRepos", { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne("Repo", "userRepos", { nullable: false })
  @JoinColumn({ name: "repo_id" })
  repo: Repo;

  @Column({ type: "numeric" })
  tigerbeetle_account_id: number;

  @Column({ default: 0 })
  prs_opened: number;

  @Column({ default: 0 })
  prs_approved: number;

  @Column({ default: 0 })
  comments_count: number;
}
