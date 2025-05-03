import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746039023965 implements MigrationInterface {
    name = 'Migration1746039023965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_logs" ("id" SERIAL NOT NULL, "event" character varying(100) NOT NULL, "description" character varying(255) NOT NULL, "action" character varying(255) NOT NULL, "debits" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "repo_id" integer NOT NULL, "pull_request_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_repo_created_at" ON "activity_logs" ("repo_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "github_url" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_c3aa2265dd3936d795e9d80d49b" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_c98426bbf7499be5cb7d59f694b" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_c98426bbf7499be5cb7d59f694b"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_c3aa2265dd3936d795e9d80d49b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "github_url"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_repo_created_at"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
    }

}
