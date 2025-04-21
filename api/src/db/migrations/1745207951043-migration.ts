import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745207951043 implements MigrationInterface {
    name = 'Migration1745207951043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_super" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "enable_timely_review_bonus" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "timely_review_bonus" integer NOT NULL DEFAULT '25'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "timely_review_bonus_hours" integer NOT NULL DEFAULT '24'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "timely_review_bonus_hours"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "timely_review_bonus"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "enable_timely_review_bonus"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_super"`);
    }

}
