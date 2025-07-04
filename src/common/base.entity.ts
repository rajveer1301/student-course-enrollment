import { PrimaryColumn, Index } from 'typeorm';
import { IdGenerator } from './Idgenerator';

export class BaseEntity {
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();
}
