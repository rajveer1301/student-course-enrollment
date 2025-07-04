import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StudentCourseMappingService } from './student-course-mapping.service';
import { CreatestudentCourseMappingDto } from './student-course-mapping.dto';

@Controller('student-course-mapping')
export class StudentCourseMappingController {
  constructor(
    private readonly studentCourseMappingService: StudentCourseMappingService,
  ) {}

  @Post()
  async createStudentCourseMapping(
    @Body() createstudentCourseMappingDto: CreatestudentCourseMappingDto,
  ) {
    return this.studentCourseMappingService.createStudentCourseMapping(
      createstudentCourseMappingDto,
    );
  }

  @Get(':id')
  async getStudentCouseMappings(@Param('id') student_id: string) {
    return this.studentCourseMappingService.getStudentCouseMappings(student_id);
  }
}
