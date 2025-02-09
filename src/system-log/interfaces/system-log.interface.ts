export interface SystemLogData {
  userId: number | null;
  username: string;
  requestUrl: string;
  method: string;
  status: number;
  ip: string;
  userAgent?: string;
  duration: number;
  errorMsg?: string | null;
} 