import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { Courses } from '../courses/courses.entity';
import { IdGenerator } from 'src/common/Idgenerator';

@Entity('course_timetables')
@Unique('date_start_end_time_course_unique', [
  'course_id',
  'start_time',
  'end_time',
  'date',
])
export class CourseTimetables {
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @ManyToOne(() => Courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'unique_id' })
  course_id: string;
}
