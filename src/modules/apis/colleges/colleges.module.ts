import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Colleges } from './colleges.entity';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Colleges])],
  providers: [CollegesService],
  controllers: [CollegesController],
})
export class CollegesModule {}
