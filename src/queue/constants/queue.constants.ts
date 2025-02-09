export const QUEUE_NAMES = {
  EMAIL: {
    VERIFICATION: 'email.verification',
    NOTIFICATION: 'email.notification',
    DLX: 'email.dlx', // 死信队列
  },
};

export const EXCHANGE_NAMES = {
  EMAIL: {
    DIRECT: 'email.direct',
    DLX: 'email.dlx', // 死信交换机
  },
};

export const ROUTING_KEYS = {
  EMAIL: {
    VERIFICATION: 'email.verification',
    NOTIFICATION: 'email.notification',
    DLX: 'email.dlx',
  },
};

// 队列配置
export const QUEUE_CONFIG = {
  EMAIL: {
    // 消息过期时间 (15分钟)
    messageTtl: 15 * 60 * 1000,
    // 最大重试次数
    maxRetries: 3,
    // 重试间隔 (秒)
    retryIntervals: [30, 120, 300],
  },
};

// 监控阈值
export const MONITORING_THRESHOLDS = {
  EMAIL: {
    // 队列长度警告阈值
    queueLengthWarning: 1000,
    // 队列长度严重警告阈值
    queueLengthCritical: 5000,
    // 处理时间警告阈值（毫秒）
    processingTimeWarning: 5000,
    // 错误率警告阈值（百分比）
    errorRateWarning: 5,
  },
};

// 添加系统日志相关常量
export const SYSTEM_LOG_QUEUE = 'system-log';
export const SYSTEM_LOG_CREATE_JOB = 'create'; 