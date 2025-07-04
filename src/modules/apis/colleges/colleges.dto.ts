import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCollegeDto {
  @ApiProperty()
  @IsString()
  name: string;
}

export class UpdateCollegeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  skip?: number = 0;
}
