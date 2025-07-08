import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentCourseMapping } from './student-course-mapping.entity';
import { Repository } from 'typeorm';
import { CreatestudentCourseMappingDto } from './student-course-mapping.dto';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';
import { CourseTimetablesService } from '../course-timetables/course-timetables.service';

@Injectable()
export class StudentCourseMappingService {
  constructor(
    @InjectRepository(StudentCourseMapping)
    private readonly studentCourseMappingRepo: Repository<StudentCourseMapping>,

    private readonly studentService: StudentsService,
    private readonly courseService: CoursesService,
    private readonly courseTimeTableSercice: CourseTimetablesService,
  ) {}

  async getStudentCouseMappings(student_id: string) {
    try {
      const mappingDetails = await this.studentCourseMappingRepo.find({
        where: {
          student_id,
        },
      });
      const course_ids = mappingDetails.map((details) => details.course_id);
      const [userDetails, courseDetails] = await Promise.all([
        this.studentService.findOne(student_id),
        this.courseService.findAll({ course_ids } as any),
      ]);
      return {
        student: userDetails,
        courses: courseDetails,
      };
    } catch (err) {
      throw err;
    }
  }

  async createStudentCourseMapping(
    createstudentCourseMappingDto: CreatestudentCourseMappingDto,
  ) {
    const { student_id, course_ids } = createstudentCourseMappingDto;

    try {
      // Fetch existing mappings for this student
      const existingMappings = await this.studentCourseMappingRepo.find({
        where: { student_id },
      });

      // Check for duplicate course_ids
      if (existingMappings.length) {
        const existingCourseIds = existingMappings.map(
          (mapping) => mapping.course_id,
        );

        if (existingCourseIds.some((id) => course_ids.includes(id))) {
          throw new BadRequestException(
            'You are enrolled for some of the courseIds, please refer to your enrolled courses. Retry with different courses',
          );
        }

        course_ids.push(...existingCourseIds);
      }

      // Fetch related data
      const [studentDetails, courseDetails, courseTimeTableDetails] =
        await Promise.all([
          this.studentService.findOne(student_id),
          this.courseService.findAll({ course_ids } as any),
          this.courseTimeTableSercice.findAll({ course_ids } as any),
        ]);

      // Validate course IDs
      if (courseDetails.length !== course_ids.length) {
        throw new BadRequestException('One or more course IDs are invalid');
      }

      // Validate all courses have timetable
      const courseIdsWithTimetable = Array.from(
        new Set(
          courseTimeTableDetails.map(
            (detail: any) => detail.course_id.unique_id,
          ),
        ),
      );

      if (courseIdsWithTimetable.length !== courseDetails.length) {
        const missingCourses = courseDetails.filter(
          (detail) => !courseIdsWithTimetable.includes(detail.unique_id),
        );
        throw new BadRequestException(
          `These courses don't have timetables. Deselect and try again: ${missingCourses
            .map((x) => x.name)
            .join(', ')}`,
        );
      }

      // Validate all courses belong to student’s college
      const studentCollegeId = (studentDetails.college_id as any).unique_id;
      const courseCollegeIds = courseDetails.map(
        (detail: any) => detail.college_id.unique_id,
      );

      if (!courseCollegeIds.every((id) => id === studentCollegeId)) {
        throw new BadRequestException(
          'All courses must belong to the student’s college',
        );
      }

      // Prepare data to save
      const saveBody = course_ids.map((courseId) =>
        Object.assign(new StudentCourseMapping(), {
          student_id,
          course_id: courseId,
        }),
      );

      // 8. Insert and rely on DB for timetable overlap check
      return await this.studentCourseMappingRepo
        .createQueryBuilder()
        .insert()
        .into(StudentCourseMapping)
        .values(saveBody)
        .orIgnore()
        .execute();
    } catch (err: any) {
      // Handle PostgreSQL trigger error for timetable overlap
      if (
        err.code === 'P0001' &&
        err.message.includes('Time conflict detected')
      ) {
        throw new BadRequestException(
          'Course timetable conflicts with existing enrolled courses',
        );
      }

      // Handle unexpected DB errors
      console.error('Unexpected DB error:', err.response);
      throw new HttpException(
        err.message ||
          err.response.message ||
          'Something went wrong while enrolling the student',
        err.status || err.statusCode || err.response.statusCode,
      );
    }
  }
}
