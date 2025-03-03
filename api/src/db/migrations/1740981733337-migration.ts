import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740981733337 implements MigrationInterface {
    name = 'Migration1740981733337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "trigger_recheck_text" character varying NOT NULL DEFAULT '✨'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "admin_trigger_recheck_text" character varying NOT NULL DEFAULT '🚀'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "admin_trigger_recheck_text"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "trigger_recheck_text"`);
    }

}
