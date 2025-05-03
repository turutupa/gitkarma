import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "review_comments" })
export class ReviewComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment_id: string; // GitHub comment ID

  @Column({ type: "varchar", length: 255, nullable: true })
  review_id: string; // GitHub review ID

  @Column({ type: "text", nullable: true })
  url: string;

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
