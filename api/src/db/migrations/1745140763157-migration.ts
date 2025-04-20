import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745140763157 implements MigrationInterface {
    name = 'Migration1745140763157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728095d63883952beebd4e46335"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "repo_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" ADD "repo_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728095d63883952beebd4e46335" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
