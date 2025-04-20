import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Review } from "./Review";

@Entity({ name: "review_comments" })
export class ReviewComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment_id: string; // GitHub comment ID

  @ManyToOne("Review", "comments", { nullable: false })
  @JoinColumn({ name: "review_id" })
  review: Review;

  @Column({ type: "text", nullable: true })
  body: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  path: string; // The file path that the comment was made on

  @Column({ type: "integer", nullable: true })
  position: number; // Line position in the diff

  @Column({ type: "integer", nullable: true })
  line: number; // Line number in the file

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date;
}
