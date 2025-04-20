import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745140030591 implements MigrationInterface {
    name = 'Migration1745140030591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reviews_state_enum" AS ENUM('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED')`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "review_id" character varying(255), "state" "public"."reviews_state_enum" NOT NULL DEFAULT 'COMMENTED', "body" text, "commit_id" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "pull_request_id" integer NOT NULL, "repo_id" integer NOT NULL, "reviewer_id" integer NOT NULL, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "review_comments" ("id" SERIAL NOT NULL, "comment_id" character varying(255), "body" text, "path" character varying(255), "position" integer, "line" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "review_id" integer NOT NULL, CONSTRAINT "PK_7a18556c348d381630855d05f0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "repos" ADD "review_bonus" integer NOT NULL DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_a652f08f460a1ac62abb172e478" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728095d63883952beebd4e46335" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_92e950a2513a79bb3fab273c92e" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD CONSTRAINT "FK_16cc302113c3fd00d930056fa38" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT "FK_16cc302113c3fd00d930056fa38"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_92e950a2513a79bb3fab273c92e"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728095d63883952beebd4e46335"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_a652f08f460a1ac62abb172e478"`);
        await queryRunner.query(`ALTER TABLE "repos" DROP COLUMN "review_bonus"`);
        await queryRunner.query(`DROP TABLE "review_comments"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TYPE "public"."reviews_state_enum"`);
    }

}
