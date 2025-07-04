import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  FilterUserDto,
  UpdateStudentDto,
} from './students.dto';
import { Students } from './students.entity';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll(@Query() filterUserDto: FilterUserDto): Promise<Students[]> {
    return this.studentsService.findAll(filterUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Students> {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Students> {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.studentsService.remove(id);
  }
}
