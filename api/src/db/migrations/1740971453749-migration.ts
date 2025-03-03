import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740971453749 implements MigrationInterface {
    name = 'Migration1740971453749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "enable_complexity_bonus" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "enable_review_quality_bonus" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "enable_review_quality_bonus"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "enable_complexity_bonus"`);
    }

}
