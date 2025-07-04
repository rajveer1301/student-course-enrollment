import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseTimetables } from './course-timetables.entity';
import { CourseTimetablesService } from './course-timetables.service';
import { CourseTimetablesController } from './course-timetables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CourseTimetables])],
  providers: [CourseTimetablesService],
  controllers: [CourseTimetablesController],
})
export class CourseTimetablesModule {}
