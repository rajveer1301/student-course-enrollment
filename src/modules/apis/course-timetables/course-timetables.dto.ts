import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../colleges/colleges.dto';

export class CreateCourseTimetableDto {
  @ApiProperty()
  @IsDateString()
  date: string;

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
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

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
