import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGE_NAMES, ROUTING_KEYS } from '../constants/queue.constants';
import { IEmailMessage, IQueueMessage } from '../interfaces/email-queue.interface';
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';

@Injectable()
export class EmailProducer implements OnModuleInit {
  private readonly logger = new Logger(EmailProducer.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    this.logger.log('EmailProducer initialized');
    this.logger.log(`Using exchange: ${EXCHANGE_NAMES.EMAIL.DIRECT}`);
  }

  /**
   * 发送邮件到队列
   */
  async sendEmail(message: IEmailMessage, routingKey: string): Promise<void> {
    const queueMessage: IQueueMessage<IEmailMessage> = {
      data: message,
      attempts: 0,
      timestamp: Date.now(),
      messageId: uuidv4(),
    };

    this.logger.log(`Preparing to send email message: ${JSON.stringify({
      to: message.to,
      subject: message.subject,
      routingKey,
      messageId: queueMessage.messageId,
    })}`);

    try {
      await this.amqpConnection.publish(
        EXCHANGE_NAMES.EMAIL.DIRECT,
        routingKey,
        queueMessage,
        {
          persistent: true, // 消息持久化
          messageId: queueMessage.messageId,
          timestamp: queueMessage.timestamp,
          headers: {
            'x-retry-count': 0,
          },
        },
      );

      this.logger.log(
        `Email message published to exchange: ${EXCHANGE_NAMES.EMAIL.DIRECT}, routingKey: ${routingKey}, messageId: ${queueMessage.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish email message to exchange: ${EXCHANGE_NAMES.EMAIL.DIRECT}, routingKey: ${routingKey}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationEmail(mailOptions: IEmailMessage): Promise<void> {
    this.logger.log('Sending verification email to queue');
    
    const message: IQueueMessage<IEmailMessage> = {
      data: mailOptions,
      timestamp: Date.now(),
      messageId: randomUUID(),
      attempts: 0
    };

    this.logger.debug('完整的队列消息:', JSON.stringify(message, null, 2));

    try {
      await this.amqpConnection.publish(
        'email.direct',
        'email.verification',
        message,
        {
          messageId: message.messageId,
          persistent: true,
        },
      );

      this.logger.log(
        `Email message published to exchange: email.direct, routingKey: email.verification, messageId: ${message.messageId}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish email message to queue:', {
        error: error.message,
        stack: error.stack,
        message: message
      });
      throw error;
    }
  }

  /**
   * 发送通知邮件
   */
  async sendNotificationEmail(message: IEmailMessage): Promise<void> {
    this.logger.log('Sending notification email to queue');
    await this.sendEmail(message, ROUTING_KEYS.EMAIL.NOTIFICATION);
  }

  /**
   * 发送到死信队列
   */
  async sendToDeadLetter(
    message: IQueueMessage<IEmailMessage>,
    error: Error,
  ): Promise<void> {
    this.logger.log(`Sending message to dead letter queue: ${message.messageId}`);
    
    const deadLetterMessage = {
      originalMessage: message,
      error: {
        message: error.message,
        stack: error.stack,
      },
      failedAttempts: message.attempts,
      lastAttemptAt: Date.now(),
    };

    try {
      await this.amqpConnection.publish(
        EXCHANGE_NAMES.EMAIL.DLX,
        ROUTING_KEYS.EMAIL.DLX,
        deadLetterMessage,
        {
          persistent: true,
          messageId: message.messageId,
          timestamp: Date.now(),
        },
      );

      this.logger.warn(
        `Message moved to dead letter queue: ${message.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to dead letter queue: ${message.messageId}`,
        error.stack,
      );
    }
  }
} 