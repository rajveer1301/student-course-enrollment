import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { Courses } from '../courses/courses.entity';
import { IdGenerator } from 'src/common/Idgenerator';
import { COURSE_TIMETABLE_DAYS } from './course-timetables.dto';

@Entity('course_timetables')
export class CourseTimetables {
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column({
    type: 'enum',
    enum: COURSE_TIMETABLE_DAYS,
  })
  day: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ nullable: true })
  @ManyToOne(() => CourseTimetables, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'unique_id' })
  parent_id?: string;

  @ManyToOne(() => Courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'unique_id' })
  course_id: string;
}
