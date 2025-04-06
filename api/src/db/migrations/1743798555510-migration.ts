import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743798555510 implements MigrationInterface {
    name = 'Migration1743798555510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_repo_role_enum" AS ENUM('0', '1')`);
        await queryRunner.query(`ALTER TABLE "user_repo" ADD "role" "public"."user_repo_role_enum" NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "installation_id" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "installation_id"`);
        await queryRunner.query(`ALTER TABLE "user_repo" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."user_repo_role_enum"`);
    }

}
