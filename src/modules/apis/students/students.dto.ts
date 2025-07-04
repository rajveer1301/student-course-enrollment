import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../colleges/colleges.dto';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  college_id: string;
}

export class UpdateStudentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  college_id?: string;
}

export class FilterUserDto extends PaginationDto {
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
