import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateDictItemDto } from "./create-dict-item.dto";

export class UpdateDictItemDto extends PartialType(
  OmitType(CreateDictItemDto, ["dictTypeId", "code"] as const),
) {}
