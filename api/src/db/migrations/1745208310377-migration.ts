import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745208310377 implements MigrationInterface {
    name = 'Migration1745208310377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" RENAME COLUMN "enable_timely_review_bonus" TO "timely_review_bonus_enabled"`);
        await queryRunner.query(`ALTER TABLE "repos" ALTER COLUMN "timely_review_bonus_enabled" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ALTER COLUMN "timely_review_bonus_enabled" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "repos" RENAME COLUMN "timely_review_bonus_enabled" TO "enable_timely_review_bonus"`);
    }

}
