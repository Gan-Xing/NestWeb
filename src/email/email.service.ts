// email.service.ts
import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { RedisService } from "src/redis/redis.service";
import { getRandomByte } from "src/common";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly redisService: RedisService) {
    // 配置 nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: "gmail", // 使用 Gmail 服务
      auth: {
        user: process.env.GMAIL_USER, // Gmail 邮箱地址
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail 应用专用密码
      },
    });
  }

  async sendEmailVerificationCode(email: string): Promise<string> {
    const emailVerificationCode = getRandomByte(3);
    const expirationTime = 15; // 验证码有效期，单位为分钟

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4F8A10;">验证您的邮箱</h2>
        <p>您好，</p>
        <p>您正在访问<strong>“TRAVAUX D’AMÉNAGEMENT ET REVÊTEMENT DE LA ROUTE BONDOUKOU – SOKO – FRONTIÈRE DU GHANA (11 KM)”有趣实验室的项目后台管理系统</strong>。</p>
        <p>为了完成注册，请使用以下验证码：</p>
        <p style="font-size: 20px; color: #0000FF; font-weight: bold;">${emailVerificationCode}</p>
        <p>请注意，该验证码将在 <strong>${expirationTime}</strong> 分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
        <p style="margin-top: 20px;">此致<br>有趣实验室团队</p>
      </div>
    `;

    // 构建邮件内容
    const mailOptions = {
      from: process.env.MAIL_FROM, // 发件人地址
      to: email, // 收件人地址
      subject: "邮箱验证 - 有趣实验室项目后台管理系统", // 邮件主题
      text: `您正在访问“TRAVAUX D’AMÉNAGEMENT ET REVÊTEMENT DE LA ROUTE BONDOUKOU – SOKO – FRONTIÈRE DU GHANA (11 KM)”有趣实验室的项目后台管理系统。为了完成注册，请使用以下验证码：${emailVerificationCode}。该验证码将在${expirationTime}分钟后失效。如果您没有请求此验证码，请忽略此邮件。`, // 纯文本内容
      html: htmlContent, // HTML 内容
    };

    // 发送邮件
    //TODO 该处应该添加Kafka进行队列消息发布，之后再改。
    this.transporter.sendMail(mailOptions);

    // 可选：保存验证码到 Redis 或数据库

    const token = `emailVerification:${email}_${getRandomByte(8)}`;
    console.log(
      "token, emailVerificationCode, expirationTime * 60",
      token,
      emailVerificationCode,
      expirationTime * 60
    );
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
    return token; // 返回 token
  }
}
