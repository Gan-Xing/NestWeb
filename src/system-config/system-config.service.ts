import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { QuerySystemConfigDto, UpdateSystemConfigDto } from "./dto";

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySystemConfigDto) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SystemConfigWhereInput = {};

    if (query.group) {
      where.group = query.group;
    }

    if (query.keyword) {
      where.OR = [
        { key: { contains: query.keyword, mode: "insensitive" } },
        { name: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    const [total, data] = await Promise.all([
      this.prisma.systemConfig.count({ where }),
      this.prisma.systemConfig.findMany({
        where,
        orderBy: [{ group: "asc" }, { sort: "asc" }, { id: "asc" }],
        skip: (current - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      pagination: {
        current,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const config = await this.prisma.systemConfig.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException("系统参数不存在");
    }

    return config;
  }

  async update(id: number, dto: UpdateSystemConfigDto) {
    const config = await this.findOne(id);

    if (!config.editable) {
      throw new BadRequestException("该系统参数不可编辑");
    }

    return this.prisma.systemConfig.update({
      where: { id },
      data: {
        value: dto.value,
      },
    });
  }
}
