import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746226319049 implements MigrationInterface {
    name = 'Migration1746226319049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ADD "url" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD "url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_comments" DROP COLUMN "url"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "url"`);
    }

}
