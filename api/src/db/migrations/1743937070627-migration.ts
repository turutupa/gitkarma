import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743937070627 implements MigrationInterface {
    name = 'Migration1743937070627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "admin_approved" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "admin_approved"`);
    }

}
