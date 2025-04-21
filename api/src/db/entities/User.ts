import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { PullRequest } from "./PullRequest";
import type { UserRepo } from "./UserRepo";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: "int" })
  github_id: number;

  @Column({ length: 255, type: "varchar" })
  github_username: string;

  @Column({ default: false, type: "boolean" })
  is_super: boolean;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  // Relationships
  @OneToMany("UserRepo", "user")
  userRepos: UserRepo[];

  @OneToMany("PullRequest", "user")
  pullRequests: PullRequest[];
}
