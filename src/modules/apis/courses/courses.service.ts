import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';
import { Courses } from './courses.entity';
import {
  CreateCourseDto,
  FilterCourseDto,
  UpdateCourseDto,
} from './courses.dto';
import { IdGenerator } from 'src/common/Idgenerator';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Courses)
    private readonly coursesRepository: Repository<Courses>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const collegeDetails = await this.coursesRepository.query(`
      select unique_id from colleges
      where unique_id = '${createCourseDto.college_id}'
    `);

    if (!collegeDetails.length) {
      throw new BadRequestException('Invalid College Id');
    }
    return this.coursesRepository
      .createQueryBuilder()
      .insert()
      .into(Courses)
      .values([
        {
          ...createCourseDto,
          unique_id: IdGenerator.generateUniqueId(),
        },
      ])
      .orIgnore()
      .execute();
  }

  async findAll(filterCourseDto: FilterCourseDto): Promise<Courses[]> {
    const { limit: take, skip, college_id, course_ids } = filterCourseDto;

    const findManyOptions: FindManyOptions<Courses> = {
      relations: ['college_id'],
    };

    findManyOptions.where = {} as any;

    if (skip && take) {
      findManyOptions.skip = skip;
      findManyOptions.take = take;
    }

    if (college_id) {
      (findManyOptions.where as any).college_id = {
        unique_id: college_id,
      } as any;
    }

    if (course_ids) {
      (findManyOptions.where as any).unique_id = In(course_ids);
    }
    return this.coursesRepository.find(findManyOptions);
  }

  async findOne(id: string): Promise<Courses> {
    const course = await this.coursesRepository.findOne({
      where: { unique_id: id },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Courses> {
    const course = await this.findOne(id);
    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const result = await this.coursesRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Course not found');
  }
}
