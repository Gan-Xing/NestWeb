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