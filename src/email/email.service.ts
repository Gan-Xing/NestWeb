// email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { RedisService } from 'src/redis/redis.service';
import { MyRandom } from 'src/common/utils/random.utils';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor(private readonly redisService: RedisService) {
		// 配置 nodemailer transporter
		this.transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST, // 您的 SMTP 服务器地址
			port: parseInt(process.env.MAIL_PORT || '587'), // SMTP 端口，默认 587
			secure: true, // 如果端口是 465，设置为 true；对于 587 或其他端口，设置为 false
			auth: {
				user: process.env.MAIL_USER, // SMTP 用户名
				pass: process.env.MAIL_PASSWORD // SMTP 密码
			}
		});
	}

	async sendEmailVerificationCode(email: string): Promise<string> {
		const emailVerificationCode = MyRandom.hex();
		const expirationTime = 15; // 验证码有效期，单位为分钟

		const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4F8A10;">甘意咨询邮箱验证</h2>
      <p>您好，</p>
      <p>您的甘意咨询验证码是：<strong style="color: #0000FF;">${emailVerificationCode}</strong>。</p>
      <p>请注意，该验证码将在 <strong>${expirationTime}</strong> 分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
      <p style="margin-top: 20px;">此致<br>甘意咨询团队</p>
    </div>
  `;

		// 构建邮件内容
		const mailOptions = {
			from: process.env.MAIL_FROM, // 发件人地址
			to: email, // 收件人地址
			subject: '甘意咨询邮箱验证', // 主题
			text: `您的甘意咨询验证码是：${emailVerificationCode}。该验证码将在${expirationTime}分钟后失效。`, // 纯文本内容
			html: htmlContent
		};

		// 发送邮件
		//TODO 该处应该添加Kafka进行队列消息发布，之后再改。
		this.transporter.sendMail(mailOptions);

		// 可选：保存验证码到 Redis 或数据库

		const token = `emailVerification:${email}_${MyRandom.hex(8)}`;
		console.log(
			'token, emailVerificationCode, expirationTime * 60',
			token,
			emailVerificationCode,
			expirationTime * 60
		);
		await this.redisService.set(token, emailVerificationCode, expirationTime * 60);
		await this.redisService.set(
			`emailRefresh:${email}`,
			emailVerificationCode,
			expirationTime * 60
		);
		return token; // 返回 token
	}
}
