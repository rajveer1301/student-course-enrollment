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
  CreateCollegeDto,
  UpdateCollegeDto,
  PaginationDto,
} from './colleges.dto';
import { CollegesService } from './colleges.service';
import { Colleges } from './colleges.entity';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Post()
  create(@Body() createCollegeDto: CreateCollegeDto) {
    return this.collegesService.create(createCollegeDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<Colleges[]> {
    return this.collegesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Colleges> {
    return this.collegesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCollegeDto: UpdateCollegeDto,
  ): Promise<Colleges> {
    return this.collegesService.update(id, updateCollegeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.collegesService.remove(id);
  }
}
