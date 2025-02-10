export interface SystemLogData {
  userId: number;
  username: string;
  requestUrl: string;
  method: string;
  status: number;
  ip: string;
  userAgent?: string;
  duration: number;
  errorMsg?: string | null;
  location?: any;  // IP地理位置信息
  requestData?: any;  // 请求的额外信息
} 