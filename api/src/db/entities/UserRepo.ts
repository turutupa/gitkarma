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

export enum EUserRepoRole {
  COLLABORATOR = 0,
  ADMIN = 1,
  ORGANIZATION_MEMBER = 2,
}

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

  @Column({
    type: "enum",
    enum: EUserRepoRole,
    default: EUserRepoRole.COLLABORATOR,
  })
  role: EUserRepoRole;

  @Column({ type: "integer", default: 0 })
  prs_opened: number;

  @Column({ type: "integer", default: 0 })
  prs_approved: number;

  @Column({ type: "integer", default: 0 })
  comments_count: number;
}
