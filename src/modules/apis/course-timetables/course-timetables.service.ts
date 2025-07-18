import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';
import {
  CreateCourseTimetableDto,
  GetCourseTimeTablesDto,
  UpdateCourseTimetableDto,
} from './course-timetables.dto';
import { CourseTimetables } from './course-timetables.entity';
import { IdGenerator } from 'src/common/Idgenerator';

@Injectable()
export class CourseTimetablesService {
  constructor(
    @InjectRepository(CourseTimetables)
    private readonly courseTimetablesRepository: Repository<CourseTimetables>,
  ) {}

  // Note: Overlap validation is handled by database trigger

  getNextDay(day) {
    return [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ][
      ([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ].indexOf(day) +
        1) %
        7
    ];
  }
  timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  async create(createDto: CreateCourseTimetableDto | CourseTimetables) {
    const { course_id } = createDto;

    const courseDetails = await this.courseTimetablesRepository.query(
      `select unique_id from courses where unique_id = '${course_id}'`,
    );

    if (!courseDetails.length) {
      throw new BadRequestException('Invalid Course Id');
    }
    // this.timeToSeconds(createDto.start_time) >
    // this.timeToSeconds(createDto.end_time)
    //   ? this.getNextDay(createDto.day)
    //   : createDto.day;

    // The database trigger will handle overlap validation automatically
    try {
      return await this.courseTimetablesRepository.save({
        ...createDto,
        unique_id: IdGenerator.generateUniqueId(),
      });
    } catch (error: any) {
      // You can also handle unique constraint, validation etc.
      if (error.code === '23505') {
        throw new BadRequestException('Duplicate timetable slot');
      }

      console.log('Error while creating course timetable:', error);
      // Fallback
      throw error;
    }
  }

  async findAll(
    getCourseTimeTablesDto: GetCourseTimeTablesDto,
  ): Promise<CourseTimetables[]> {
    try {
      const { limit: take, skip, course_ids } = getCourseTimeTablesDto;
      const findManyOptions: FindManyOptions<CourseTimetables> = {
        relations: ['course_id.college_id'],
      };

      if (take && skip) {
        findManyOptions.take = take;
        findManyOptions.skip = skip;
      }

      if (course_ids) {
        findManyOptions.where = {
          course_id: {
            unique_id: In(course_ids),
          },
        } as any;
      }
      return await this.courseTimetablesRepository.find(findManyOptions);
    } catch (err) {
      throw err;
    }
  }

  async findOne(id: string): Promise<CourseTimetables> {
    const timetable = await this.courseTimetablesRepository.findOne({
      where: { unique_id: id },
    });
    if (!timetable) throw new NotFoundException('Course timetable not found');
    return timetable;
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
