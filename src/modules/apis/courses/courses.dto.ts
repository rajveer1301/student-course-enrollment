import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../colleges/colleges.dto';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  course_code: string;

  @ApiProperty()
  @IsString()
  college_id: string;
}

export class UpdateCourseDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  course_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  college_id?: string;
}

export class FilterCourseDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  college_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  course_ids: string[];
}
