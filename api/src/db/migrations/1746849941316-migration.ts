import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746849941316 implements MigrationInterface {
    name = 'Migration1746849941316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" ADD "bounty" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_requests" DROP COLUMN "bounty"`);
    }

}
