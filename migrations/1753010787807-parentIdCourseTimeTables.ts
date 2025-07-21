/* eslint-disable prettier/prettier */
import {MigrationInterface, QueryRunner} from "typeorm";

export class parentIdCourseTimeTables1753010787807 implements MigrationInterface {
    name = 'parentIdCourseTimeTables1753010787807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP CONSTRAINT "day_start_end_time_course_unique"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD "parent_id" character varying`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD CONSTRAINT "FK_8819efb1688e2f54bde9ae0e6b3" FOREIGN KEY ("parent_id") REFERENCES "course_timetables"("unique_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP CONSTRAINT "FK_8819efb1688e2f54bde9ae0e6b3"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP COLUMN "parent_id"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD CONSTRAINT "day_start_end_time_course_unique" UNIQUE ("day", "start_time", "end_time", "course_id")`);
    }

}
