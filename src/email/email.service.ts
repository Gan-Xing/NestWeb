// email.service.ts
import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { RedisService } from "src/redis/redis.service";
import { getRandomByte } from "src/common";
import { EmailProducer } from "../queue/producers/email.producer";
import { IEmailMessage } from "../queue/interfaces/email-queue.interface";
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly redisService: RedisService,
    private readonly emailProducer: EmailProducer,
    private readonly i18n: I18nService,
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
  async sendEmailVerificationCode(email: string, country: string = 'CN'): Promise<string> {
    const emailVerificationCode = getRandomByte(3);
    const expirationTime = 15; // 验证码有效期，单位为分钟

    // 根据国家选择语言
    const lang = country === 'CN' ? 'zh' : 'fr';

    // 获取翻译后的文本
    const subject = await this.i18n.translate('email.verification.subject', { lang });
    const title = await this.i18n.translate('email.verification.title', { lang });
    const hello = await this.i18n.translate('email.verification.hello', { lang });
    const intro = await this.i18n.translate('email.verification.intro', { lang });
    const instruction = await this.i18n.translate('email.verification.instruction', { lang });
    const expiryNotice = await this.i18n.translate('email.verification.expiry_notice', { 
      lang,
      args: { minutes: expirationTime }
    });
    const regards = await this.i18n.translate('email.verification.regards', { lang });
    const team = await this.i18n.translate('email.verification.team', { lang });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4F8A10;">${title}</h2>
        <p>${hello}</p>
        <p>${intro}</p>
        <p>${instruction}</p>
        <p style="font-size: 20px; color: #0000FF; font-weight: bold;">${emailVerificationCode}</p>
        <p>${expiryNotice}</p>
        <p style="margin-top: 20px;">${regards}<br>${team}</p>
      </div>
    `;

    // 构建邮件内容
    const mailOptions: IEmailMessage = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: subject,
      text: `${hello}\n\n${intro}\n\n${instruction}\n\n${emailVerificationCode}\n\n${expiryNotice}\n\n${regards}\n${team}`,
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
