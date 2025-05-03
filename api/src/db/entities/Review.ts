import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PullRequest } from "./PullRequest";
import type { ReviewComment } from "./ReviewComment";
import type { User } from "./User";

export enum EReviewState {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  COMMENTED = "COMMENTED",
  DISMISSED = "DISMISSED",
}

@Entity({ name: "reviews" })
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  review_id: string; // GitHub review ID

  @ManyToOne("PullRequest", { nullable: false })
  @JoinColumn({ name: "pull_request_id" })
  pull_request: PullRequest;

  @ManyToOne("User", { nullable: false })
  @JoinColumn({ name: "reviewer_id" })
  reviewer: User;

  @Column({ type: "varchar", nullable: true, length: 255 })
  url: string;

  @Column({
    type: "enum",
    enum: EReviewState,
    default: EReviewState.COMMENTED,
  })
  state: EReviewState;

  @Column({ type: "text", nullable: true })
  body: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  commit_id: string;

  @OneToMany("ReviewComment", "review")
  comments: ReviewComment[];

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;
}
