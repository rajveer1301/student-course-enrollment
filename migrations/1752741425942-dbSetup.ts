/* eslint-disable prettier/prettier */
import {MigrationInterface, QueryRunner} from "typeorm";

export class dbSetup1752741425942 implements MigrationInterface {
    name = 'dbSetup1752741425942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "colleges" ("unique_id" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_66961f03bbfc8d22b9bd83deda5" PRIMARY KEY ("unique_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_66961f03bbfc8d22b9bd83deda" ON "colleges" ("unique_id") `);
        await queryRunner.query(`CREATE TABLE "students" ("unique_id" character varying NOT NULL, "name" character varying NOT NULL, "college_id" character varying NOT NULL, CONSTRAINT "PK_84997e180eaff3a80d54b94a693" PRIMARY KEY ("unique_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_84997e180eaff3a80d54b94a69" ON "students" ("unique_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f4ec087094a2e63fb2e5e5031" ON "students" ("college_id") `);
        await queryRunner.query(`CREATE TABLE "courses" ("unique_id" character varying NOT NULL, "name" character varying NOT NULL, "course_code" character varying NOT NULL, "college_id" character varying NOT NULL, CONSTRAINT "name_college_unique_check" UNIQUE ("name", "college_id"), CONSTRAINT "PK_64f2204ea82dc468c76caa0fcc8" PRIMARY KEY ("unique_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_64f2204ea82dc468c76caa0fcc" ON "courses" ("unique_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b842812430f192167d10f9f99d" ON "courses" ("course_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6c557f8d705614b735e1462ee" ON "courses" ("college_id") `);
        await queryRunner.query(`CREATE TABLE "student_course_mapping" ("unique_id" character varying NOT NULL, "student_id" character varying NOT NULL, "course_id" character varying NOT NULL, CONSTRAINT "student_course_unique_contraint" UNIQUE ("student_id", "course_id"), CONSTRAINT "PK_9b4aba892be22533b28d1df71da" PRIMARY KEY ("unique_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b4aba892be22533b28d1df71d" ON "student_course_mapping" ("unique_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d8ff1ddbcc425ea2176ce669a" ON "student_course_mapping" ("student_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb8f0b088b208282dada288e10" ON "student_course_mapping" ("course_id") `);
        await queryRunner.query(`CREATE TYPE "public"."course_timetables_day_enum" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`);
        await queryRunner.query(`CREATE TABLE "course_timetables" ("unique_id" character varying NOT NULL, "day" "public"."course_timetables_day_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "course_id" character varying, CONSTRAINT "day_start_end_time_course_unique" UNIQUE ("course_id", "start_time", "end_time", "day"), CONSTRAINT "PK_8426601381f4f392aad1e143795" PRIMARY KEY ("unique_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8426601381f4f392aad1e14379" ON "course_timetables" ("unique_id") `);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_1f4ec087094a2e63fb2e5e5031e" FOREIGN KEY ("college_id") REFERENCES "colleges"("unique_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_e6c557f8d705614b735e1462ee7" FOREIGN KEY ("college_id") REFERENCES "colleges"("unique_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_course_mapping" ADD CONSTRAINT "FK_3d8ff1ddbcc425ea2176ce669af" FOREIGN KEY ("student_id") REFERENCES "students"("unique_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_course_mapping" ADD CONSTRAINT "FK_cb8f0b088b208282dada288e102" FOREIGN KEY ("course_id") REFERENCES "courses"("unique_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_timetables" ADD CONSTRAINT "FK_29592b3a4634a39da34c3109622" FOREIGN KEY ("course_id") REFERENCES "courses"("unique_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE "query-result-cache" ("id" SERIAL NOT NULL, "identifier" character varying, "time" bigint NOT NULL, "duration" integer NOT NULL, "query" text NOT NULL, "result" text NOT NULL, CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "query-result-cache"`);
        await queryRunner.query(`ALTER TABLE "course_timetables" DROP CONSTRAINT "FK_29592b3a4634a39da34c3109622"`);
        await queryRunner.query(`ALTER TABLE "student_course_mapping" DROP CONSTRAINT "FK_cb8f0b088b208282dada288e102"`);
        await queryRunner.query(`ALTER TABLE "student_course_mapping" DROP CONSTRAINT "FK_3d8ff1ddbcc425ea2176ce669af"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_e6c557f8d705614b735e1462ee7"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_1f4ec087094a2e63fb2e5e5031e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8426601381f4f392aad1e14379"`);
        await queryRunner.query(`DROP TABLE "course_timetables"`);
        await queryRunner.query(`DROP TYPE "public"."course_timetables_day_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb8f0b088b208282dada288e10"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d8ff1ddbcc425ea2176ce669a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b4aba892be22533b28d1df71d"`);
        await queryRunner.query(`DROP TABLE "student_course_mapping"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6c557f8d705614b735e1462ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b842812430f192167d10f9f99d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64f2204ea82dc468c76caa0fcc"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f4ec087094a2e63fb2e5e5031"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84997e180eaff3a80d54b94a69"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66961f03bbfc8d22b9bd83deda"`);
        await queryRunner.query(`DROP TABLE "colleges"`);
    }

}
