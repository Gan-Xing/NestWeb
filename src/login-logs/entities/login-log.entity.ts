import { LoginLog } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LoginLogEntity implements LoginLog {
  constructor(partial: Partial<LoginLogEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  userId: number | null;

  @ApiPropertyOptional()
  username: string | null;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  ip: string | null;

  @ApiPropertyOptional()
  userAgent: string | null;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  failureCode: string | null;

  @ApiPropertyOptional()
  failureReason: string | null;

  @ApiProperty()
  createdAt: Date;
}
