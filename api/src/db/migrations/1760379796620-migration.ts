import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1760379796620 implements MigrationInterface {
  name = "Migration1760379796620";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "pr_title" TYPE character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "state" TYPE character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "state" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "state" TYPE character varying(50)`
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "state" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ALTER COLUMN "pr_title" TYPE character varying(50)`
    );
  }
}
