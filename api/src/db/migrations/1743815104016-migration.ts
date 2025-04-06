import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743815104016 implements MigrationInterface {
    name = 'Migration1743815104016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_repo_role_enum" RENAME TO "user_repo_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_repo_role_enum" AS ENUM('0', '1', '2')`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" TYPE "public"."user_repo_role_enum" USING "role"::"text"::"public"."user_repo_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."user_repo_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_repo_role_enum_old" AS ENUM('0', '1')`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" TYPE "public"."user_repo_role_enum_old" USING "role"::"text"::"public"."user_repo_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_repo" ALTER COLUMN "role" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."user_repo_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_repo_role_enum_old" RENAME TO "user_repo_role_enum"`);
    }

}
