import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746053612971 implements MigrationInterface {
    name = 'Migration1746053612971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "pr_title" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "pr_description" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "pr_num_changed_files" integer`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "pr_url" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "pr_url"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "pr_num_changed_files"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "pr_description"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "pr_title"`);
    }

}
