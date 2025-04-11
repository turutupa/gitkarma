import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1744400939539 implements MigrationInterface {
    name = 'Migration1744400939539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" ADD "disable_gitkarma" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "disable_gitkarma"`);
    }

}
