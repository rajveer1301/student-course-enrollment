import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollegesModule } from './modules/apis/colleges/colleges.module';
import { CoursesModule } from './modules/apis/courses/courses.module';
import { StudentsModule } from './modules/apis/students/students.module';
import { CourseTimetablesModule } from './modules/apis/course-timetables/course-timetables.module';
import { StudentCourseMappingModule } from './modules/apis/student-course-mapping/student-course-mapping.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { dbConfig } = require('../ormconfig');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dbConfig),
    CollegesModule,
    CoursesModule,
    StudentsModule,
    CourseTimetablesModule,
    StudentCourseMappingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
