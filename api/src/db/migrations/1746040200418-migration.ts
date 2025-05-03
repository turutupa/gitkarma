import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746040200418 implements MigrationInterface {
    name = 'Migration1746040200418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD "description_url" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "action" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "debits" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "debits" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ALTER COLUMN "action" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "description_url"`);
    }

}
