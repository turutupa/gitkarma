import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740904868064 implements MigrationInterface {
    name = 'Migration1740904868064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_repo" ("id" SERIAL NOT NULL, "tigerbeetle_account_id" numeric NOT NULL, "prs_opened" integer NOT NULL DEFAULT '0', "prs_approved" integer NOT NULL DEFAULT '0', "comments_count" integer NOT NULL DEFAULT '0', "user_id" integer NOT NULL, "repo_id" integer NOT NULL, CONSTRAINT "UQ_72fa93e5eb0c4d621ff0fb1646f" UNIQUE ("user_id", "repo_id"), CONSTRAINT "PK_88cab623ca00ab5ef32f0ace783" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "github_id" integer NOT NULL, "github_username" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_09a2296ade1053a0cc4080bda4a" UNIQUE ("github_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "repos" ("id" SERIAL NOT NULL, "repo_id" integer NOT NULL, "repo_name" character varying(255) NOT NULL, "repo_owner" character varying(255) NOT NULL, "tigerbeetle_account_id" numeric, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "default_debits" integer NOT NULL DEFAULT '400', "review_approval_debits" integer NOT NULL DEFAULT '50', "comment_debits" integer NOT NULL DEFAULT '5', "max_complexity_bonus_debits" integer NOT NULL DEFAULT '20', "pr_merge_deduction_debits" integer NOT NULL DEFAULT '100', "total_prs_opened" integer NOT NULL DEFAULT '0', "total_prs_approved" integer NOT NULL DEFAULT '0', "total_comments" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_f2ae9a09dda4a417a946f4d4665" UNIQUE ("repo_id"), CONSTRAINT "PK_50f4cdbc4e114515f41760400ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_requests" ("id" SERIAL NOT NULL, "pr_number" integer NOT NULL, "head_sha" character varying(255) NOT NULL, "state" character varying(50) NOT NULL, "check_passed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "repo_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_e8a8aa8710c3a9650a19a9c2e7b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_repo" ADD CONSTRAINT "FK_503999bfb8e21e04c564610cdd1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_repo" ADD CONSTRAINT "FK_f530ae3497371905525731fe3e1" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_292d27c87db892edc6e3a59bcdb" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_247bf8a48cd21f3cf938a749d4f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_247bf8a48cd21f3cf938a749d4f"`);
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_292d27c87db892edc6e3a59bcdb"`);
        await queryRunner.query(`ALTER TABLE "user_repo" DROP CONSTRAINT "FK_f530ae3497371905525731fe3e1"`);
        await queryRunner.query(`ALTER TABLE "user_repo" DROP CONSTRAINT "FK_503999bfb8e21e04c564610cdd1"`);
        await queryRunner.query(`DROP TABLE "pull_requests"`);
        await queryRunner.query(`DROP TABLE "repos"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_repo"`);
    }

}
