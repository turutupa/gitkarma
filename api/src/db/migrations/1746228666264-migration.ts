import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746228666264 implements MigrationInterface {
    name = 'Migration1746228666264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT "FK_16cc302113c3fd00d930056fa38"`);
        await queryRunner.query(`ALTER TABLE "review_comments" DROP COLUMN "review_id"`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD "review_id" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_comments" DROP COLUMN "review_id"`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD "review_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD CONSTRAINT "FK_16cc302113c3fd00d930056fa38" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
