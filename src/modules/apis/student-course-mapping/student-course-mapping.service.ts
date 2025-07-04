import { BadRequestException, Injectable } from '@nestjs/common';
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

  getTimeMs = (time: string) => new Date(`1970-01-01T${time}Z`).getTime();

  hasOverlapAcrossCourses = (entries) => {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        // Check same date & different course
        if (
          a.date === b.date &&
          a.course_id.unique_id !== b.course_id.unique_id
        ) {
          const aStart = this.getTimeMs(a.start_time);
          const aEnd = this.getTimeMs(a.end_time);
          const bStart = this.getTimeMs(b.start_time);
          const bEnd = this.getTimeMs(b.end_time);

          if (aStart < bEnd && bStart < aEnd) {
            console.log('Overlap found between:', a.unique_id, b.unique_id);
            return true;
          }
        }
      }
    }
    return false;
  };

  async getStudentCouseMappings(student_id: string) {
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
  }

  async createStudentCourseMapping(
    createstudentCourseMappingDto: CreatestudentCourseMappingDto,
  ) {
    const { student_id, course_ids } = createstudentCourseMappingDto;
    const existingMappings = await this.studentCourseMappingRepo.find({
      where: {
        student_id,
      },
    });

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
    const [studentDetails, courseDetails, courseTimeTableDetails] =
      await Promise.all([
        this.studentService.findOne(student_id),
        this.courseService.findAll({ course_ids } as any),
        this.courseTimeTableSercice.findAll({ course_ids } as any),
      ]);

    if (courseDetails.length !== course_ids.length) {
      throw new BadRequestException('One or more course Ids are invalid');
    }
    // validate each
    const courseIdsFromTimeTable = Array.from(
      new Set(
        courseTimeTableDetails.map((detail: any) => detail.course_id.unique_id),
      ),
    );

    if (courseIdsFromTimeTable.length !== courseDetails.length) {
      const missingCourses = courseDetails.filter(
        (detail) => !courseIdsFromTimeTable.includes(detail.unique_id),
      );
      throw new BadRequestException(
        `
        These courses don't have time tables withing them deselect the courses and try again
        Courses: ${missingCourses.map((x) => x.name).join(', ')}
        `,
      );
    }

    const { unique_id: studentCollegeId } = studentDetails.college_id as any;
    const courseCollegeIds = courseDetails.map(
      (detail: any) => detail.college_id.unique_id,
    );

    if (!courseCollegeIds.every((id) => id === studentCollegeId)) {
      throw new BadRequestException(
        'All courses must belong to the student’s college',
      );
    }

    if (this.hasOverlapAcrossCourses(courseTimeTableDetails)) {
      throw new BadRequestException('Time Table Overlaps');
    }

    const saveBody = [];
    course_ids.forEach((id) =>
      saveBody.push(
        Object.assign(new StudentCourseMapping(), {
          student_id,
          course_id: id,
        }),
      ),
    );

    return this.studentCourseMappingRepo
      .createQueryBuilder()
      .insert()
      .into(StudentCourseMapping)
      .values(saveBody)
      .orIgnore()
      .execute();
  }
}
