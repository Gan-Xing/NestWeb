// 邮件消息接口
export interface IEmailMessage {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  messageId?: string;
}

// 队列消息接口
export interface IQueueMessage<T = any> {
  data: T;
  attempts?: number;
  timestamp?: number;
  messageId?: string;
}

// 邮件验证码消息
export interface IEmailVerificationMessage extends IEmailMessage {
  verificationCode: string;
  expirationTime: number;
}

// 邮件通知消息
export interface IEmailNotificationMessage extends IEmailMessage {
  notificationType: string;
  priority?: 'high' | 'normal' | 'low';
}

// 死信消息
export interface IDeadLetterMessage<T = any> {
  originalMessage: IQueueMessage<T>;
  error: {
    message: string;
    stack?: string;
  };
  failedAttempts: number;
  lastAttemptAt: number;
} 