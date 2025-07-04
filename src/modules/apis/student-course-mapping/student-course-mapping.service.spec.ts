import { Test, TestingModule } from '@nestjs/testing';
import { StudentCourseMappingService } from './student-course-mapping.service';

describe('StudentCourseMappingService', () => {
  let service: StudentCourseMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentCourseMappingService],
    }).compile();

    service = module.get<StudentCourseMappingService>(StudentCourseMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
