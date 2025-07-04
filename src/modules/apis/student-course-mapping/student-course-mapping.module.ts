import { Module } from '@nestjs/common';
import { StudentCourseMappingController } from './student-course-mapping.controller';
import { StudentCourseMappingService } from './student-course-mapping.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentCourseMapping } from './student-course-mapping.entity';
import { Students } from '../students/students.entity';
import { Courses } from '../courses/courses.entity';
import { CourseTimetables } from '../course-timetables/course-timetables.entity';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';
import { CourseTimetablesService } from '../course-timetables/course-timetables.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentCourseMapping,
      Students,
      Courses,
      CourseTimetables,
    ]),
  ],
  controllers: [StudentCourseMappingController],
  providers: [
    StudentCourseMappingService,
    StudentsService,
    CoursesService,
    CourseTimetablesService,
  ],
})
export class StudentCourseMappingModule {}
