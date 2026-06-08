import {
  SystemLogDetailResponseDto,
  SystemLogResponseDto,
} from '../dto/system-log-response.dto';
import { API_ROUTES_MAP } from '../constants/api-routes';
import {
  redactSensitiveObject,
  redactSensitiveText,
  redactSensitiveUrl,
} from 'src/common/utils/sensitive-data';

export function transformSystemLog(log: any): SystemLogResponseDto {
  // 处理 URL，移除查询参数
  const urlWithoutParams = log.requestUrl.split('?')[0];
  
  // 构造请求方法和基础路径的组合键
  const routeKey = `${log.method} ${urlWithoutParams}`;
  
  return {
    id: log.id,
    username: log.username,
    country: log.location?.country || '未知',
    city: log.location?.city || '未知',
    isp: log.location?.isp || '未知',
    requestDescription: API_ROUTES_MAP[routeKey] || `${log.method} ${urlWithoutParams}`,
    duration: log.duration,
    success: log.status >= 200 && log.status < 300,
    createdAt: log.createdAt,
  };
}

export function transformSystemLogDetail(log: any): SystemLogDetailResponseDto {
  return {
    ...transformSystemLog(log),
    userId: log.userId,
    requestUrl: redactSensitiveUrl(log.requestUrl),
    method: log.method,
    status: log.status,
    ip: log.ip,
    userAgent: log.userAgent,
    requestData: redactSensitiveObject(log.requestData),
    errorMsg: redactSensitiveText(log.errorMsg),
  };
}
