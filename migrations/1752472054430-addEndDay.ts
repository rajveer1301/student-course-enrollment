import {MigrationInterface, QueryRunner} from "typeorm";

export class addEndDay1752472054430 implements MigrationInterface {
    name = 'addEndDay1752472054430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."course_timetables_end_day_enum" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD "end_day" "public"."course_timetables_end_day_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP COLUMN "end_day"`);
        await queryRunner.query(`DROP TYPE "public"."course_timetables_end_day_enum"`);
    }

}
