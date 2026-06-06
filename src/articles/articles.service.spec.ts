import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';

describe('ArticlesService', () => {
  let service: ArticlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        mockProviderFactories.prismaService(),
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
