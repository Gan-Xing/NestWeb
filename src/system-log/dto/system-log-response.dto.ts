export class SystemLogResponseDto {
  id: number;
  username: string;
  country: string;
  city: string;
  isp: string;
  requestDescription: string;
  duration: number;
  success: boolean;
  createdAt: Date;
}

export class SystemLogDetailResponseDto extends SystemLogResponseDto {
  userId: number;
  requestUrl: string;
  method: string;
  status: number;
  ip: string;
  userAgent?: string | null;
  requestData?: unknown;
  errorMsg?: string | null;
}
