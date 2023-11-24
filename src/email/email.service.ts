// email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { RedisService } from 'src/redis/redis.service';

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
		const emailVerificationCode = this.generateEmailVerificationCode();

		// 构建邮件内容
		const mailOptions = {
			from: process.env.MAIL_FROM, // 发件人地址
			to: email, // 收件人地址
			subject: 'Email Verification Code', // 主题
			text: `Your verification code is: ${emailVerificationCode}`, // 纯文本内容
			html: `<p>Your verification code is: <b>${emailVerificationCode}</b></p>` // HTML 内容
		};

		// 发送邮件
		await this.transporter.sendMail(mailOptions);

		// 可选：保存验证码到 Redis 或数据库
		const token = `emailVerification:${email}_${randomBytes(8).toString('hex')}`; // 加入随机字符串
		await this.redisService.set(token, emailVerificationCode, 15 * 60);
		return token; // 返回 token
	}

	async validateEmailVerificationCode(token: string, inputCode: string): Promise<boolean> {
		const storedCode = await this.redisService.get(token);
		return storedCode === inputCode;
	}

	private generateEmailVerificationCode(): string {
		// 使用 crypto 生成更安全的验证码
		return randomBytes(3).toString('hex');
	}
}
