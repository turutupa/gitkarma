import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740971059154 implements MigrationInterface {
    name = 'Migration1740971059154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "default_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "review_approval_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "comment_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "max_complexity_bonus_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "pr_merge_deduction_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "initial_debits" integer NOT NULL DEFAULT '400'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "approval_bonus" integer NOT NULL DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "comment_bonus" integer NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "complexity_bonus" integer NOT NULL DEFAULT '20'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "merge_penalty" integer NOT NULL DEFAULT '100'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "merge_penalty"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "complexity_bonus"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "comment_bonus"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "approval_bonus"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "initial_debits"`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "pr_merge_deduction_debits" integer NOT NULL DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "max_complexity_bonus_debits" integer NOT NULL DEFAULT '20'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "comment_debits" integer NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "review_approval_debits" integer NOT NULL DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "default_debits" integer NOT NULL DEFAULT '400'`);
    }

}
