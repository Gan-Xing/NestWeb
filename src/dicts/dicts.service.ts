import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import {
  CreateDictItemDto,
  CreateDictTypeDto,
  QueryDictItemDto,
  QueryDictTypeDto,
  UpdateDictItemDto,
  UpdateDictTypeDto,
} from "./dto";

@Injectable()
export class DictsService {
  constructor(private readonly prisma: PrismaService) {}

  async createType(dto: CreateDictTypeDto) {
    return this.prisma.dictType.create({
      data: {
        ...dto,
        enabled: dto.enabled ?? true,
        sort: dto.sort ?? 0,
      },
    });
  }

  async findTypes(query: QueryDictTypeDto) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.DictTypeWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { code: { contains: query.keyword, mode: "insensitive" } },
        { name: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    const [total, data] = await Promise.all([
      this.prisma.dictType.count({ where }),
      this.prisma.dictType.findMany({
        where,
        orderBy: [{ sort: "asc" }, { id: "asc" }],
        skip: (current - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            orderBy: [{ sort: "asc" }, { id: "asc" }],
          },
        },
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

  async findType(id: number) {
    const dictType = await this.prisma.dictType.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ sort: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!dictType) {
      throw new NotFoundException("字典类型不存在");
    }

    return dictType;
  }

  async updateType(id: number, dto: UpdateDictTypeDto) {
    await this.assertTypeExists(id);
    return this.prisma.dictType.update({
      where: { id },
      data: dto,
    });
  }

  async removeType(id: number) {
    await this.assertTypeExists(id);
    return this.prisma.dictType.delete({ where: { id } });
  }

  async createItem(dto: CreateDictItemDto) {
    await this.assertTypeExists(dto.dictTypeId);
    return this.prisma.dictItem.create({
      data: {
        ...dto,
        enabled: dto.enabled ?? true,
        sort: dto.sort ?? 0,
      },
      include: {
        dictType: true,
      },
    });
  }

  async findItems(query: QueryDictItemDto) {
    const dictTypeId = await this.resolveDictTypeId(query);
    const where: Prisma.DictItemWhereInput = {};

    if (dictTypeId) {
      where.dictTypeId = dictTypeId;
    }

    if (query.keyword) {
      where.OR = [
        { code: { contains: query.keyword, mode: "insensitive" } },
        { label: { contains: query.keyword, mode: "insensitive" } },
        { value: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    return this.prisma.dictItem.findMany({
      where,
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      include: {
        dictType: true,
      },
    });
  }

  async findItemsByTypeCode(typeCode: string) {
    const dictType = await this.prisma.dictType.findUnique({
      where: { code: typeCode },
      include: {
        items: {
          where: {
            enabled: true,
          },
          orderBy: [{ sort: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!dictType || !dictType.enabled) {
      throw new NotFoundException("字典类型不存在或已停用");
    }

    return dictType.items;
  }

  async updateItem(id: number, dto: UpdateDictItemDto) {
    await this.assertItemExists(id);
    return this.prisma.dictItem.update({
      where: { id },
      data: dto,
      include: {
        dictType: true,
      },
    });
  }

  async removeItem(id: number) {
    await this.assertItemExists(id);
    return this.prisma.dictItem.delete({ where: { id } });
  }

  private async assertTypeExists(id: number) {
    const count = await this.prisma.dictType.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException("字典类型不存在");
    }
  }

  private async assertItemExists(id: number) {
    const count = await this.prisma.dictItem.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException("字典项不存在");
    }
  }

  private async resolveDictTypeId(query: QueryDictItemDto) {
    if (query.dictTypeId) {
      return query.dictTypeId;
    }

    if (!query.typeCode) {
      return undefined;
    }

    const dictType = await this.prisma.dictType.findUnique({
      where: { code: query.typeCode },
      select: { id: true },
    });

    if (!dictType) {
      throw new BadRequestException("字典类型编码不存在");
    }

    return dictType.id;
  }
}
