import { Test, TestingModule } from '@nestjs/testing';
import { StudentCourseMappingController } from './student-course-mapping.controller';

describe('StudentCourseMappingController', () => {
  let controller: StudentCourseMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentCourseMappingController],
    }).compile();

    controller = module.get<StudentCourseMappingController>(StudentCourseMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
