import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EmailService } from '../../email/email.service';
import { QUEUE_NAMES, QUEUE_CONFIG } from '../constants/queue.constants';
import { 
  IEmailMessage, 
  IQueueMessage 
} from '../interfaces/email-queue.interface';
import { EmailProducer } from '../producers/email.producer';
import { PrometheusService } from '../../monitoring/prometheus.service';
import { ConsumeMessage } from 'amqplib';
import { Public } from '../../common/decorators/public.decorator';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly emailProducer: EmailProducer,
    private readonly prometheusService: PrometheusService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async onModuleInit() {
    this.logger.log('EmailConsumer initialized');
    this.logger.log(`Listening to queue: ${QUEUE_NAMES.EMAIL.VERIFICATION}`);
    this.logger.log(`Listening to queue: ${QUEUE_NAMES.EMAIL.NOTIFICATION}`);
  }

  @Public()
  @RabbitSubscribe({
    exchange: 'email.direct',
    routingKey: 'email.verification',
    queue: QUEUE_NAMES.EMAIL.VERIFICATION,
    queueOptions: {
      durable: true,
      deadLetterExchange: 'email.dlx',
      deadLetterRoutingKey: 'email.dlx',
      messageTtl: QUEUE_CONFIG.EMAIL.messageTtl,
    }
  })
  async handleVerificationEmail(message: IQueueMessage<IEmailMessage>, amqpMsg: ConsumeMessage): Promise<void> {
    try {
      console.log('【开始处理验证邮件】- 消息ID:', message?.messageId);
      
      // 安全地记录消息内容，避免循环引用
      const safeAmqpMsg = {
        fields: amqpMsg.fields,
        properties: amqpMsg.properties,
        content: amqpMsg.content.toString()
      };
      
      console.log('【原始消息内容】:', JSON.stringify(safeAmqpMsg, null, 2));
      
      // 安全地记录解析后的消息
      const safeMessage = {
        messageId: message?.messageId,
        data: message?.data,
        timestamp: message?.timestamp,
        attempts: message?.attempts
      };
      console.log('【解析后的消息】:', JSON.stringify(safeMessage, null, 2));

      if (!message || !message.data) {
        this.logger.error('消息格式错误: 缺少必要字段');
        console.error('【消息格式错误】:', {
          messageId: message?.messageId,
          amqpMsg: safeAmqpMsg
        });
        return;
      }

      this.logger.log(`Processing verification email message: ${message.messageId}`);
      const startTime = Date.now();
      
      // 检查重试次数
      if (message.attempts && message.attempts >= QUEUE_CONFIG.EMAIL.maxRetries) {
        this.logger.warn(`Max retries reached for message ${message.messageId}, moving to DLX`);
        await this.emailProducer.sendToDeadLetter(message, new Error('Max retries reached'));
        return;
      }

      // 更新监控指标 - 接收消息计数
      this.prometheusService.incrementEmailReceived('verification');

      // 处理邮件发送
      await this.processEmail(message);

      // 更新监控指标 - 处理时间和成功计数
      const processingTime = Date.now() - startTime;
      this.prometheusService.observeEmailProcessingTime('verification', processingTime);
      this.prometheusService.incrementEmailSuccess('verification');
      
      this.logger.log(`Successfully processed verification email: ${message.messageId}`);
    } catch (error) {
      // 安全地记录错误信息
      const safeError = {
        message: error.message,
        stack: error.stack,
        messageId: message?.messageId,
        messageData: {
          to: message?.data?.to,
          subject: message?.data?.subject,
          timestamp: message?.timestamp,
          attempts: message?.attempts
        }
      };

      console.error('【处理验证邮件时发生错误】:', safeError);
      this.logger.error('处理验证邮件时发生错误:', safeError);

      // 更新失败计数
      this.prometheusService.incrementEmailFailure('verification');

      // 增加重试次数并重新抛出错误，让 RabbitMQ 装饰器处理重试
      message.attempts = (message.attempts || 0) + 1;
      throw error;
    }
  }

  @Public()
  @RabbitSubscribe({
    exchange: 'email.direct',
    routingKey: 'email.notification',
    queue: QUEUE_NAMES.EMAIL.NOTIFICATION,
    queueOptions: {
      durable: true,
      deadLetterExchange: 'email.dlx',
      deadLetterRoutingKey: 'email.dlx',
      messageTtl: QUEUE_CONFIG.EMAIL.messageTtl,
    }
  })
  async handleNotificationEmail(message: IQueueMessage<IEmailMessage>, amqpMsg: ConsumeMessage): Promise<void> {
    try {
      console.log('【开始处理通知邮件】- 消息ID:', message?.messageId);
      
      // 安全地记录消息内容
      const safeAmqpMsg = {
        fields: amqpMsg.fields,
        properties: amqpMsg.properties,
        content: amqpMsg.content.toString()
      };
      
      const safeMessage = {
        messageId: message?.messageId,
        data: message?.data,
        timestamp: message?.timestamp,
        attempts: message?.attempts
      };
      
      this.logger.log(`Processing notification email: ${message.messageId}`, safeMessage);
      const startTime = Date.now();

      if (!message || !message.data) {
        this.logger.error('消息格式错误: 缺少必要字段');
        console.error('【消息格式错误】:', {
          messageId: message?.messageId,
          amqpMsg: safeAmqpMsg
        });
        return;
      }

      // 检查重试次数
      if (message.attempts && message.attempts >= QUEUE_CONFIG.EMAIL.maxRetries) {
        this.logger.warn(`Max retries reached for message ${message.messageId}, moving to DLX`);
        await this.emailProducer.sendToDeadLetter(message, new Error('Max retries reached'));
        return;
      }

      // 更新监控指标 - 接收消息计数
      this.prometheusService.incrementEmailReceived('notification');

      // 处理邮件发送
      await this.processEmail(message);

      // 更新监控指标
      const processingTime = Date.now() - startTime;
      this.prometheusService.observeEmailProcessingTime('notification', processingTime);
      this.prometheusService.incrementEmailSuccess('notification');

      this.logger.log(`Successfully processed notification email: ${message.messageId}`);
    } catch (error) {
      // 安全地记录错误信息
      const safeError = {
        message: error.message,
        stack: error.stack,
        messageId: message?.messageId,
        messageData: {
          to: message?.data?.to,
          subject: message?.data?.subject,
          timestamp: message?.timestamp,
          attempts: message?.attempts
        }
      };

      console.error('【处理通知邮件时发生错误】:', safeError);
      this.logger.error('处理通知邮件时发生错误:', safeError);

      // 更新监控指标 - 失败计数
      this.prometheusService.incrementEmailFailure('notification');

      // 增加重试次数并重新抛出错误，让 RabbitMQ 装饰器处理重试
      message.attempts = (message.attempts || 0) + 1;
      throw error;
    }
  }

  private async processEmail(message: IQueueMessage<IEmailMessage>) {
    const { data } = message;

    try {
      this.logger.log(`开始处理邮件消息: ${JSON.stringify({
        to: data.to,
        subject: data.subject,
        messageId: message.messageId,
        attempts: message.attempts,
        from: data.from || process.env.MAIL_FROM
      })}`);
      
      // 确保邮件选项中包含了发件人
      if (!data.from) {
        data.from = process.env.MAIL_FROM;
      }

      // 添加消息ID到邮件头部
      data.messageId = message.messageId;
      
      await this.emailService.sendMail(data);
      this.logger.log(`邮件发送成功: ${message.messageId} -> ${data.to}`);
    } catch (error) {
      this.logger.error(`邮件发送失败 (第 ${message.attempts || 0} 次尝试): ${message.messageId}`, {
        error: error.message,
        stack: error.stack,
        messageData: {
          to: data.to,
          subject: data.subject,
          from: data.from
        }
      });
      throw error; // 重新抛出错误，让上层处理重试逻辑
    }
  }

  private async handleError(
    message: IQueueMessage<IEmailMessage>,
    error: Error,
  ): Promise<boolean> {
    const attempts = (message.attempts || 0) + 1;

    if (attempts >= QUEUE_CONFIG.EMAIL.maxRetries) {
      // 发送到死信队列
      await this.emailProducer.sendToDeadLetter(message, error);
      this.logger.error(
        `Message moved to dead letter queue after ${attempts} attempts: ${message.messageId}`,
      );
      return false; // 不需要重试
    }

    this.logger.warn(
      `Will retry message: ${message.messageId}, attempt ${attempts} of ${QUEUE_CONFIG.EMAIL.maxRetries}`,
    );
    return true; // 需要重试
  }
} 