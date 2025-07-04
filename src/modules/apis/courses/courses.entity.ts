import { ApiProperty } from '@nestjs/swagger';
import { IdGenerator } from 'src/common/Idgenerator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Colleges } from '../colleges/colleges.entity';

@Entity('courses')
@Unique('name_college_unique_check', ['name', 'college_id'])
export class Courses {
  @ApiProperty()
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column()
  name: string;

  @ApiProperty()
  @Column()
  @Index()
  course_code: string;

  @ApiProperty()
  @Column()
  @Index()
  @ManyToOne(() => Colleges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'college_id', referencedColumnName: 'unique_id' })
  college_id: string;
}
