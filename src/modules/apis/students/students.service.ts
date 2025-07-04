import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import {
  CreateStudentDto,
  UpdateStudentDto,
  FilterUserDto,
} from './students.dto';
import { Students } from './students.entity';
import { IdGenerator } from 'src/common/Idgenerator';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Students)
    private readonly studentsRepository: Repository<Students>,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    try {
      const newStudent = this.studentsRepository.create({
        ...createStudentDto,
        unique_id: IdGenerator.generateUniqueId(),
      });
      return this.studentsRepository.save(newStudent);
    } catch (err) {
      throw new HttpException(err.stack || err.message, 500);
    }
  }

  async findAll(filterUserDto: FilterUserDto): Promise<Students[]> {
    const { limit: take, skip, college_id } = filterUserDto;
    const findManyConditions: FindManyOptions<Students> = {
      skip,
      take,
      relations: ['college_id'],
    };

    if (college_id) {
      findManyConditions.where = {
        college_id: {
          unique_id: college_id,
        },
      } as any;
    }
    return this.studentsRepository.find(findManyConditions);
  }

  async findOne(id: string): Promise<Students> {
    const student = await this.studentsRepository.findOne({
      where: { unique_id: id },
      relations: ['college_id'],
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Students> {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentsRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Student not found');
  }
}
