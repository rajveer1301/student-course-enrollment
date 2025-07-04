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
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  FilterCourseDto,
  UpdateCourseDto,
} from './courses.dto';
import { Courses } from './courses.entity';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(@Query() filterCourseDto: FilterCourseDto): Promise<Courses[]> {
    return this.coursesService.findAll(filterCourseDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Courses> {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<Courses> {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}
