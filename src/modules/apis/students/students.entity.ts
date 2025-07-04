import { ApiProperty } from '@nestjs/swagger';
import { IdGenerator } from 'src/common/Idgenerator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Colleges } from '../colleges/colleges.entity';

@Entity('students')
export class Students {
  @ApiProperty()
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column()
  name: string;

  @ApiProperty()
  @Column()
  @Index()
  @ManyToOne(() => Colleges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'college_id', referencedColumnName: 'unique_id' })
  college_id: string;
}
