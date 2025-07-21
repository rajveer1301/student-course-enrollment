import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseTimetables } from './course-timetables.entity';
import { CourseTimetablesService } from './course-timetables.service';
import { CourseTimetablesController } from './course-timetables.controller';
import { CoursesService } from '../courses/courses.service';
import { Courses } from '../courses/courses.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseTimetables, Courses])],
  providers: [CourseTimetablesService, CoursesService],
  controllers: [CourseTimetablesController],
})
export class CourseTimetablesModule {}
