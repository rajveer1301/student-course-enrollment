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

  isOverlapping(a: CreateCourseTimetableDto, b: CreateCourseTimetableDto) {
    const startA = new Date(`1970-01-01T${a.start_time}Z`).getTime();
    const endA = new Date(`1970-01-01T${a.end_time}Z`).getTime();
    const startB = new Date(`1970-01-01T${b.start_time}Z`).getTime();
    const endB = new Date(`1970-01-01T${b.end_time}Z`).getTime();
    return startA < endB && startB < endA;
  }

  async create(createDto: CreateCourseTimetableDto | CourseTimetables) {
    const { course_id, date } = createDto;
    const courseDetails = await this.courseTimetablesRepository.query(
      `select unique_id from courses where unique_id = '${course_id}'`,
    );

    if (!courseDetails.length) {
      throw new BadRequestException('Invalid Course Id');
    }
    const otherSchedulesWithSameCourse =
      await this.courseTimetablesRepository.find({
        where: {
          course_id: {
            unique_id: course_id,
          },
        } as any,
      });
    otherSchedulesWithSameCourse.forEach((schedule) => {
      if (schedule.date === date && this.isOverlapping(createDto, schedule)) {
        throw new BadRequestException(
          'Overalapping Time Table with same course',
        );
      }
    });
    return this.courseTimetablesRepository
      .createQueryBuilder()
      .insert()
      .into(CourseTimetables)
      .values([
        {
          ...createDto,
          unique_id: IdGenerator.generateUniqueId(),
        },
      ])
      .orIgnore()
      .execute();
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
    return this.courseTimetablesRepository.save(timetable);
  }

  async remove(id: string): Promise<void> {
    const result = await this.courseTimetablesRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Course timetable not found');
  }
}
