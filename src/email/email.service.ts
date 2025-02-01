// email.service.ts
import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { RedisService } from "src/redis/redis.service";
import { getRandomByte } from "src/common";
import { EmailProducer } from "../queue/producers/email.producer";
import { IEmailMessage } from "../queue/interfaces/email-queue.interface";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly redisService: RedisService,
    private readonly emailProducer: EmailProducer,
  ) {
    // 验证必要的环境变量
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      this.logger.error('Missing required environment variables: GMAIL_USER and/or GMAIL_APP_PASSWORD');
      throw new Error('Email service configuration error: Missing Gmail credentials');
    }

    // 配置 nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 验证transporter配置
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Failed to initialize email transporter:', error);
      } else {
        this.logger.log('Email transporter is ready to send emails');
      }
    });
  }

  /**
   * 发送邮件的底层方法
   */
  async sendMail(mailOptions: IEmailMessage): Promise<void> {
    try {
      this.logger.log(`Attempting to send email to: ${mailOptions.to}`);
      this.logger.debug('Mail options:', { 
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from || process.env.MAIL_FROM
      });

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${mailOptions.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to: ${mailOptions.to}`, {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command
      });
      throw error;
    }
  }

  /**
   * 发送验证码邮件
   */
  async sendEmailVerificationCode(email: string): Promise<string> {
    const emailVerificationCode = getRandomByte(3);
    const expirationTime = 15; // 验证码有效期，单位为分钟

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4F8A10;">验证您的邮箱</h2>
        <p>您好，</p>
        <p>您正在访问<strong>"TRAVAUX D'AMÉNAGEMENT ET REVÊTEMENT DE LA ROUTE BONDOUKOU – SOKO – FRONTIÈRE DU GHANA (11 KM)"有趣实验室的项目后台管理系统</strong>。</p>
        <p>为了完成注册，请使用以下验证码：</p>
        <p style="font-size: 20px; color: #0000FF; font-weight: bold;">${emailVerificationCode}</p>
        <p>请注意，该验证码将在 <strong>${expirationTime}</strong> 分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
        <p style="margin-top: 20px;">此致<br>有趣实验室团队</p>
      </div>
    `;

    // 构建邮件内容
    const mailOptions: IEmailMessage = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: "邮箱验证 - 有趣实验室项目后台管理系统",
      text: `您正在访问"TRAVAUX D'AMÉNAGEMENT ET REVÊTEMENT DE LA ROUTE BONDOUKOU – SOKO – FRONTIÈRE DU GHANA (11 KM)"有趣实验室的项目后台管理系统。为了完成注册，请使用以下验证码：${emailVerificationCode}。该验证码将在${expirationTime}分钟后失效。如果您没有请求此验证码，请忽略此邮件。`,
      html: htmlContent,
    };

    try {
      // 将邮件发送任务添加到队列
      await this.emailProducer.sendVerificationEmail(mailOptions);
      this.logger.log(`Verification email queued for: ${email}`);

      // 生成并保存验证码
      const token = `emailVerification:${email}_${getRandomByte(8)}`;
      await this.redisService.set(
        token,
        emailVerificationCode,
        expirationTime * 60
      );
      await this.redisService.set(
        `emailRefresh:${email}`,
        emailVerificationCode,
        expirationTime * 60
      );

      return token;
    } catch (error) {
      this.logger.error(
        `Failed to queue verification email for: ${email}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * 发送通知邮件
   */
  async sendNotification(
    to: string,
    subject: string,
    content: { text: string; html: string }
  ): Promise<void> {
    const mailOptions: IEmailMessage = {
      from: process.env.MAIL_FROM,
      to,
      subject,
      text: content.text,
      html: content.html,
    };

    try {
      await this.emailProducer.sendNotificationEmail(mailOptions);
      this.logger.log(`Notification email queued for: ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue notification email for: ${to}`,
        error.stack
      );
      throw error;
    }
  }
}
