import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746079920020 implements MigrationInterface {
    name = 'Migration1746079920020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_pull_requests_repo_created_at" ON "pull_requests" ("repo_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_pull_requests_repo_id" ON "pull_requests" ("repo_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_pull_requests_repo_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_pull_requests_repo_created_at"`);
    }

}
