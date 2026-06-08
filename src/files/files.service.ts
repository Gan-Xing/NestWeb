import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as path from "path";
import { IStorageService } from "src/storage/storage.interface";
import { PrismaService } from "src/prisma/prisma.service";
import { QueryFileAssetDto, UploadFileAssetDto } from "./dto";

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("IStorageService")
    private readonly storageService: IStorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadFileAssetDto,
    uploaderId?: number,
  ) {
    const uploaded = await this.storageService.uploadFile(file);
    const filename = path.basename(uploaded.path);
    const extension = path.extname(file.originalname).replace(/^\./, "") || null;

    return this.prisma.fileAsset.create({
      data: {
        originalName: file.originalname,
        filename,
        storagePath: uploaded.path,
        url: uploaded.url,
        mimeType: file.mimetype,
        size: file.size,
        extension,
        category: dto.category,
        description: dto.description,
        uploaderId,
      },
      include: this.fileAssetInclude(),
    });
  }

  async findAll(query: QueryFileAssetDto) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.FileAssetWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { originalName: { contains: query.keyword, mode: "insensitive" } },
        { filename: { contains: query.keyword, mode: "insensitive" } },
        { description: { contains: query.keyword, mode: "insensitive" } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.mimeType) {
      where.mimeType = { contains: query.mimeType, mode: "insensitive" };
    }

    if (query.startTime || query.endTime) {
      where.createdAt = {
        ...(query.startTime ? { gte: new Date(query.startTime) } : {}),
        ...(query.endTime ? { lte: new Date(query.endTime) } : {}),
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.fileAsset.count({ where }),
      this.prisma.fileAsset.findMany({
        where,
        include: this.fileAssetInclude(),
        orderBy: { createdAt: "desc" },
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
    const file = await this.prisma.fileAsset.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: this.fileAssetInclude(),
    });

    if (!file) {
      throw new NotFoundException("文件不存在");
    }

    return file;
  }

  async getDownloadUrl(id: number) {
    const file = await this.findOne(id);
    const url = await this.storageService.getPresignedUrl(file.storagePath);
    return {
      id: file.id,
      originalName: file.originalName,
      url,
    };
  }

  async remove(id: number) {
    const file = await this.findOne(id);
    const deleted = await this.storageService.deleteFile(file.storagePath);

    if (!deleted) {
      throw new BadRequestException("文件存储对象删除失败");
    }

    return this.prisma.fileAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: this.fileAssetInclude(),
    });
  }

  private fileAssetInclude() {
    return {
      uploader: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
    } satisfies Prisma.FileAssetInclude;
  }
}
