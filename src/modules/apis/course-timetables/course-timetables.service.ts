import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, In, IsNull, Repository } from 'typeorm';
import {
  CreateCourseTimetableDto,
  GetCourseTimeTablesDto,
  UpdateCourseTimetableDto,
} from './course-timetables.dto';
import { CourseTimetables } from './course-timetables.entity';
import { IdGenerator } from 'src/common/Idgenerator';
import { CoursesService } from '../courses/courses.service';
const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

@Injectable()
export class CourseTimetablesService {
  constructor(
    @InjectRepository(CourseTimetables)
    private readonly courseTimetablesRepository: Repository<CourseTimetables>,

    private readonly courseService: CoursesService,
  ) {}

  // Note: Overlap validation is handled by database trigger

  getNextDay(day: string): string {
    const index = DAYS.indexOf(day);
    return DAYS[(index + 1) % 7];
  }

  timeToSeconds(timeStr: string): number {
    const [hours = 0, minutes = 0, seconds = 0] = timeStr
      .split(':')
      .map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  splitTimetableIfCrossesMidnight(
    dto: CreateCourseTimetableDto,
  ): CourseTimetables[] {
    const { day, start_time, end_time, course_id } = dto;
    const payload: CourseTimetables[] = [
      {
        ...dto,
        unique_id: IdGenerator.generateUniqueId(),
      },
    ];

    const startSeconds = this.timeToSeconds(start_time);
    const endSeconds = this.timeToSeconds(end_time);

    if (startSeconds > endSeconds) {
      const nextDay = this.getNextDay(day);
      payload[0].end_time = '23:59:59';

      payload.push({
        day: nextDay,
        start_time: '00:00:00',
        end_time,
        course_id,
        parent_id: payload[0].unique_id,
        unique_id: IdGenerator.generateUniqueId(),
      });
    }

    return payload;
  }

  async create(createDto: CreateCourseTimetableDto | CourseTimetables) {
    const { course_id } = createDto;

    const course = await this.courseService.findOne(course_id);
    if (!course) throw new BadRequestException('Invalid Course Id');

    const payload = this.splitTimetableIfCrossesMidnight(createDto);
    try {
      return await this.courseTimetablesRepository.save(payload);
    } catch (error: any) {
      // You can also handle unique constraint, validation etc.
      console.log('Error while creating course timetable:', error);
      if (error.code === '23P01') {
        throw new BadRequestException('Overlapping timetable slot');
      }
      // Fallback
      throw error;
    }
  }

  async findAll(
    getCourseTimeTablesDto: GetCourseTimeTablesDto,
  ): Promise<CourseTimetables[]> {
    try {
      const { limit: take, skip, course_ids } = getCourseTimeTablesDto;
      const whereConditions: FindConditions<CourseTimetables> = {
        parent_id: IsNull(),
      };
      if (course_ids?.length) {
        whereConditions.course_id = In(course_ids);
      }
      const parent_schedules = await this.courseTimetablesRepository.find({
        where: whereConditions,
        take,
        skip,
        order: { day: 'ASC', start_time: 'ASC' },
        relations: ['course_id'],
      });

      const child_schedules = await this.courseTimetablesRepository.find({
        where: {
          parent_id: In(parent_schedules.map((s) => s.unique_id)),
        },
      });

      child_schedules.forEach((child) => {
        const parentIndex = parent_schedules.findIndex(
          (p) => p.unique_id === child.parent_id,
        );
        if (parentIndex !== -1) {
          parent_schedules[parentIndex].end_time = child.end_time;
        }
      });

      return parent_schedules;
    } catch (error: any) {
      console.log('Error while fetching course timetables:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<CourseTimetables> {
    const [parent, child] = await Promise.all([
      this.courseTimetablesRepository.findOne({
        where: { unique_id: id, parent_id: IsNull() },
        relations: ['course_id'],
      }),
      this.courseTimetablesRepository.findOne({
        where: { parent_id: id },
      }),
    ]);
    if (!parent) throw new NotFoundException('Course timetable not found');

    parent.end_time = child?.end_time || parent.end_time;
    return parent;
  }

  async update(
    id: string,
    updateDto: UpdateCourseTimetableDto,
  ): Promise<CourseTimetables> {
    const timetable = await this.findOne(id);
    Object.assign(timetable, updateDto);
    try {
      return this.courseTimetablesRepository.save(timetable);
    } catch (error: any) {
      // Handle optimized database trigger errors with structured error codes
      // Handle timetable conflict errors
      if (error.message?.includes('TIMETABLE_CONFLICT:')) {
        const cleanMessage = error.message.replace('TIMETABLE_CONFLICT: ', '');
        throw new BadRequestException(cleanMessage);
      }
      // Handle validation errors
      if (error.message?.includes('VALIDATION_ERROR:')) {
        const cleanMessage = error.message.replace('VALIDATION_ERROR: ', '');
        throw new BadRequestException(cleanMessage);
      }
      // Fallback for any other trigger errors
      if (error.code === 'P0001') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.courseTimetablesRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Course timetable not found');
  }
}
