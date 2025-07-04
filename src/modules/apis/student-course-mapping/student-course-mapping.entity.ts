import { IdGenerator } from 'src/common/Idgenerator';
import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity('student_course_mapping')
@Unique('student_course_unique_contraint', ['student_id', 'course_id'])
export class StudentCourseMapping {
  @PrimaryColumn()
  @Index()
  unique_id: string = IdGenerator.generateUniqueId();

  @Column()
  @Index()
  student_id: string;

  @Column()
  @Index()
  course_id: string;
}
