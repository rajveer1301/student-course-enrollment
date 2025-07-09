import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../colleges/colleges.dto';

export const COURSE_TIMETABLE_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export class CreateCourseTimetableDto {
  @ApiProperty({
    enum: COURSE_TIMETABLE_DAYS,
    description: 'Day of the week for the course',
  })
  @IsString()
  @IsIn(COURSE_TIMETABLE_DAYS)
  day: string;

  @ApiProperty()
  @IsString()
  start_time: string;

  @ApiProperty()
  @IsString()
  end_time: string;

  @ApiProperty()
  @IsString()
  course_id: string;
}

export class UpdateCourseTimetableDto {
  @ApiProperty({
    enum: COURSE_TIMETABLE_DAYS,
    required: false,
    description: 'Day of the week for the course',
  })
  @IsOptional()
  @IsString()
  @IsIn(COURSE_TIMETABLE_DAYS)
  day?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  course_id?: string;
}

export class GetCourseTimeTablesDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  course_ids: string[];
}
