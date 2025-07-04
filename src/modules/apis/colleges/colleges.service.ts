import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateCollegeDto,
  UpdateCollegeDto,
  PaginationDto,
} from './colleges.dto';
import { Colleges } from './colleges.entity';
import { IdGenerator } from 'src/common/Idgenerator';

@Injectable()
export class CollegesService {
  constructor(
    @InjectRepository(Colleges)
    private readonly collegesRepository: Repository<Colleges>,
  ) {}

  async create(createCollegeDto: CreateCollegeDto) {
    const college = this.collegesRepository.create({
      ...createCollegeDto,
      unique_id: IdGenerator.generateUniqueId(),
    });
    return this.collegesRepository.save(college);
  }

  async findAll(paginationDto: PaginationDto): Promise<Colleges[]> {
    const { limit: take, skip } = paginationDto;
    return this.collegesRepository.find({ take, skip });
  }

  async findOne(id: string): Promise<Colleges> {
    const college = await this.collegesRepository.findOne({
      where: { unique_id: id },
    });
    if (!college) throw new NotFoundException('College not found');
    return college;
  }

  async update(
    id: string,
    updateCollegeDto: UpdateCollegeDto,
  ): Promise<Colleges> {
    const college = await this.findOne(id);
    Object.assign(college, updateCollegeDto);
    return this.collegesRepository.save(college);
  }

  async remove(id: string): Promise<void> {
    const result = await this.collegesRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('College not found');
  }
}
