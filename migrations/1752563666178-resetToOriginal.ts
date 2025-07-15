/* eslint-disable prettier/prettier */
import {MigrationInterface, QueryRunner} from "typeorm";

export class resetToOriginal1752563666178 implements MigrationInterface {
    name = 'resetToOriginal1752563666178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP CONSTRAINT "no_overlap_for_same_course"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP COLUMN "start_minute_in_week"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP COLUMN "end_minute_in_week"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD "end_minute_in_week" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD "start_minute_in_week" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD CONSTRAINT "no_overlap_for_same_course" EXCLUDE USING gist (course_id WITH =, int4range(start_minute_in_week, end_minute_in_week) WITH &&)`);
    }

}
