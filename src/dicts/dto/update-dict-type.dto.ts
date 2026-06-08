import { PartialType } from "@nestjs/mapped-types";
import { OmitType } from "@nestjs/swagger";
import { CreateDictTypeDto } from "./create-dict-type.dto";

export class UpdateDictTypeDto extends PartialType(
  OmitType(CreateDictTypeDto, ["code"] as const),
) {}
