import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreatestudentCourseMappingDto {
  @ApiProperty()
  @IsString()
  student_id: string;

  @ApiProperty()
  @Transform(({ value }) => Array.from(new Set(value)))
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  course_ids: string[];
}
