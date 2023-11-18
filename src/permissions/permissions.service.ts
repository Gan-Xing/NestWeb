import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.prisma.permission.create({
      data: {
        ...createPermissionDto,
      },
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      include: {
        permissionGroup: {
          include: {
            parent: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Permission | null> {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...updatePermissionDto,
      },
    });
  }

  async removeMany(ids: number[]) {
    return this.prisma.permission.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async remove(id: number): Promise<Permission> {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
