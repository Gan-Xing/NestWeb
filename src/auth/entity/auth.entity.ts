//src/auth/entity/auth.entity.ts
import { ApiProperty } from "@nestjs/swagger";

export class AuthEntity {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  accessExpiresIn: number;
  @ApiProperty()
  refreshExpiresIn: number;
}
