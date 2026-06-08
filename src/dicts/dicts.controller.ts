import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Permissions } from "src/common";
import {
  CreateDictItemDto,
  CreateDictTypeDto,
  QueryDictItemDto,
  QueryDictTypeDto,
  UpdateDictItemDto,
  UpdateDictTypeDto,
} from "./dto";
import { DictItemEntity, DictTypeEntity } from "./entities";
import { DictsService } from "./dicts.service";

@Controller("api/dicts")
@ApiTags("dicts")
@ApiBearerAuth()
export class DictsController {
  constructor(private readonly dictsService: DictsService) {}

  @Post("types")
  @ApiCreatedResponse({ type: DictTypeEntity })
  @Permissions("system.dicts.create")
  async createType(@Body() dto: CreateDictTypeDto) {
    return new DictTypeEntity(await this.dictsService.createType(dto));
  }

  @Get("types")
  @ApiOkResponse({ type: [DictTypeEntity] })
  @Permissions("system.dicts.view")
  findTypes(@Query() query: QueryDictTypeDto) {
    return this.dictsService.findTypes(query);
  }

  @Get("types/:id")
  @ApiOkResponse({ type: DictTypeEntity })
  @Permissions("system.dicts.view")
  async findType(@Param("id", ParseIntPipe) id: number) {
    return new DictTypeEntity(await this.dictsService.findType(id));
  }

  @Patch("types/:id")
  @ApiOkResponse({ type: DictTypeEntity })
  @Permissions("system.dicts.update")
  async updateType(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDictTypeDto,
  ) {
    return new DictTypeEntity(await this.dictsService.updateType(id, dto));
  }

  @Delete("types/:id")
  @ApiOkResponse({ type: DictTypeEntity })
  @Permissions("system.dicts.delete")
  async removeType(@Param("id", ParseIntPipe) id: number) {
    return new DictTypeEntity(await this.dictsService.removeType(id));
  }

  @Post("items")
  @ApiCreatedResponse({ type: DictItemEntity })
  @Permissions("system.dicts.create")
  async createItem(@Body() dto: CreateDictItemDto) {
    return new DictItemEntity(await this.dictsService.createItem(dto));
  }

  @Get("items")
  @ApiOkResponse({ type: [DictItemEntity] })
  @Permissions("system.dicts.view")
  async findItems(@Query() query: QueryDictItemDto) {
    const items = await this.dictsService.findItems(query);
    return items.map((item) => new DictItemEntity(item));
  }

  @Get(":code/items")
  @ApiOkResponse({ type: [DictItemEntity] })
  async findItemsByTypeCode(@Param("code") code: string) {
    const items = await this.dictsService.findItemsByTypeCode(code);
    return items.map((item) => new DictItemEntity(item));
  }

  @Patch("items/:id")
  @ApiOkResponse({ type: DictItemEntity })
  @Permissions("system.dicts.update")
  async updateItem(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDictItemDto,
  ) {
    return new DictItemEntity(await this.dictsService.updateItem(id, dto));
  }

  @Delete("items/:id")
  @ApiOkResponse({ type: DictItemEntity })
  @Permissions("system.dicts.delete")
  async removeItem(@Param("id", ParseIntPipe) id: number) {
    return new DictItemEntity(await this.dictsService.removeItem(id));
  }
}
