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
import {
  CreateCourseTimetableDto,
  GetCourseTimeTablesDto,
  UpdateCourseTimetableDto,
} from './course-timetables.dto';
import { CourseTimetablesService } from './course-timetables.service';
import { CourseTimetables } from './course-timetables.entity';

@Controller('course-timetables')
export class CourseTimetablesController {
  constructor(
    private readonly courseTimetablesService: CourseTimetablesService,
  ) {}

  @Post()
  create(@Body() createDto: CreateCourseTimetableDto) {
    return this.courseTimetablesService.create(createDto);
  }

  @Get()
  findAll(
    @Query() getCourseTimeTablesDto: GetCourseTimeTablesDto,
  ): Promise<CourseTimetables[]> {
    return this.courseTimetablesService.findAll(getCourseTimeTablesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CourseTimetables> {
    return this.courseTimetablesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCourseTimetableDto,
  ): Promise<CourseTimetables> {
    return this.courseTimetablesService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.courseTimetablesService.remove(id);
  }
}
