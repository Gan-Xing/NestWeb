import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser, Permissions } from "src/common";
import { FileAssetEntity, FileDownloadEntity } from "./entities";
import { FilesService } from "./files.service";
import { QueryFileAssetDto, UploadFileAssetDto } from "./dto";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Controller("api/files")
@ApiTags("files")
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        category: {
          type: "string",
        },
        description: {
          type: "string",
        },
      },
      required: ["file"],
    },
  })
  @ApiCreatedResponse({ type: FileAssetEntity })
  @Permissions("system.files.upload")
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileAssetDto,
    @CurrentUser("id") userId: number,
  ) {
    if (!file) {
      throw new BadRequestException("未找到上传的文件");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException("文件大小超过限制");
    }

    return new FileAssetEntity(await this.filesService.upload(file, dto, userId));
  }

  @Get()
  @ApiOkResponse({ type: [FileAssetEntity] })
  @Permissions("system.files.view")
  findAll(@Query() query: QueryFileAssetDto) {
    return this.filesService.findAll(query);
  }

  @Get(":id/download")
  @ApiOkResponse({ type: FileDownloadEntity })
  @Permissions("system.files.download")
  getDownloadUrl(@Param("id", ParseIntPipe) id: number) {
    return this.filesService.getDownloadUrl(id);
  }

  @Get(":id")
  @ApiOkResponse({ type: FileAssetEntity })
  @Permissions("system.files.view")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return new FileAssetEntity(await this.filesService.findOne(id));
  }

  @Delete(":id")
  @ApiOkResponse({ type: FileAssetEntity })
  @Permissions("system.files.delete")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return new FileAssetEntity(await this.filesService.remove(id));
  }
}
