import { ApiProperty } from '@nestjs/swagger';
import { IdGenerator } from 'src/common/Idgenerator';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('colleges')
export class Colleges {
  @ApiProperty()
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @ApiProperty()
  @Column()
  name: string;
}
