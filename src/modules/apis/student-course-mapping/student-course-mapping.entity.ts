import { IdGenerator } from 'src/common/Idgenerator';
import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Students } from '../students/students.entity';
import { Courses } from '../courses/courses.entity';

@Entity('student_course_mapping')
@Unique('student_course_unique_contraint', ['student_id', 'course_id'])
export class StudentCourseMapping {
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column()
  @Index()
  @ManyToOne(() => Students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'unique_id' })
  student_id: string;

  @Column()
  @Index()
  @ManyToOne(() => Courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id', referencedColumnName: 'unique_id' })
  course_id: string;
}
