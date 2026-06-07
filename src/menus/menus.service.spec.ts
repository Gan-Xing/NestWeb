import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { mockProviderFactories } from '../../test/unit-provider-mocks';
import { PrismaService } from 'src/prisma/prisma.service';

describe('MenusService', () => {
  let service: MenusService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        mockProviderFactories.prismaService(),
        mockProviderFactories.usersService(),
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hides atomic permission maintenance from runtime navigation', async () => {
    (prisma.permissionGroup.findMany as jest.Mock).mockResolvedValue([]);

    await service.findAll();

    expect(prisma.permissionGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          visible: true,
          code: { notIn: ['auth.permissions'] },
        }),
        include: expect.objectContaining({
          children: expect.objectContaining({
            where: expect.objectContaining({
              visible: true,
              code: { notIn: ['auth.permissions'] },
            }),
          }),
        }),
      }),
    );
  });
});
