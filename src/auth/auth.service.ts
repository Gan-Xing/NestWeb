//src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  JwtConfig,
  SecurityConfig,
  getRandomByte,
  RegisterDto,
  Token,
} from "src/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PasswordService } from "src/password/password.service";
import { RedisService } from "src/redis/redis.service";
import { CaptchaService } from "src/captcha/captcha.service";
import { EmailService } from "src/email/email.service";
import { SmsService } from "src/sms/sms.service";
import { WechatService } from "src/wechat/wechat.service";
import { UsersService } from "src/users/users.service";
import { HttpService } from "@nestjs/axios";
import { RegisterByEmailDto, SignUpFormData, ValidateTokenDto } from "./dto";
import { jwtDecode } from "jwt-decode";
import { isUserActive } from "src/users/constants/user-status";

export interface LoginContext {
  ip?: string | null;
  userAgent?: string | null;
}

export type IssuedToken = Token & {
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly captchaService: CaptchaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly wechatService: WechatService,
    private readonly httpService: HttpService,
    private readonly userService: UsersService,
  ) {}

  async generateQRCode(): Promise<{ qrCodeData: Buffer }> {
    const scene = getRandomByte(16); // 生成16字节长度的随机scene
    console.log("===========扫描后，获取到的唯一用户IDscene值", scene);

    await this.redisService.set(scene, scene, 300); // 存储在Redis中，5分钟过期
    try {
      const qrCodeData = await this.getMiniProgramQRCode(scene); // 请求微信接口获取二维码
      return { qrCodeData }; // 返回二维码的二进制数据
    } catch {
      throw new Error("Error generating QR code");
    }
  }

  async getMiniProgramAccessToken(): Promise<string> {
    const existingToken = await this.redisService.get(
      "wechat_miniprogram_access_token",
    );
    if (existingToken) return existingToken;

    try {
      const response = await this.wechatService.getMiniProgramAccessToken();
      const { access_token, expires_in } = response.data;
      await this.redisService.set(
        "wechat_miniprogram_access_token",
        access_token,
        expires_in,
      );
      return access_token;
    } catch {
      throw new Error("Unable to fetch access token from WeChat");
    }
  }

  async getMiniProgramQRCode(scene: string): Promise<Buffer> {
    const accessToken = await this.getMiniProgramAccessToken();
    const params = {
      scene: scene,
      page: "pages/login/login",
      env_version: "develop",
    };

    try {
      const response = await this.wechatService.getUnlimitedMiniProgramiQRCode(
        params,
        accessToken,
        {
          responseType: "arraybuffer", // 确保返回的是二进制数据
        },
      );
      return response.data;
    } catch {
      throw new Error("Unable to fetch QR code from WeChat");
    }
  }

  async exchangeCodeForUserId(code: string): Promise<any> {
    const appid = this.configService.get<string>("MINIPROGRAM_APPID");
    const secret = this.configService.get<string>("MINIPROGRAM_SECRET");
    const url = `https://api.weixin.qq.com/sns/jscode2session`;

    try {
      const response = await this.httpService.axiosRef.get(url, {
        params: {
          appid,
          secret,
          js_code: code,
          grant_type: "authorization_code",
        },
      });
      return response.data;

      // 这里返回的数据包含 openid 和 unionid（如果有）
    } catch {
      throw new Error("Unable to fetch user info from WeChat");
    }
  }

  async miniprogramLogin(code: string): Promise<IssuedToken> {
    const { unionid } = await this.wechatService.getUnionIdByCode(code);
    let user = await this.userService.findOneByWechatId(unionid);
    if (!user) {
      user = await this.userService.createUserWithUnionId(unionid);
    }
    // Return a JWT
    const tokens = await this.generateTokens({ userId: user.id });
    await this.updateRtHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateCaptcha(
    signupData: SignUpFormData,
  ): Promise<{ isValid: boolean }> {
    const { captchaToken, captcha, phoneNumber } = signupData;

    // 使用 CaptchaService 验证验证码
    const isCaptchaValid = await this.captchaService.validateCaptcha(
      captchaToken,
      captcha,
    );
    if (isCaptchaValid) {
      await this.redisService.set(
        `userRegistration:${phoneNumber}`,
        signupData,
        60 * 60,
      );
      return { isValid: isCaptchaValid };
    } else {
      return { isValid: isCaptchaValid };
    }
  }

  async getUserFromRedis(key: string) {
    const value = await this.redisService.get(key);
    return value;
  }

  async sendEmailVerificationCode(
    email: string,
    country: string,
  ): Promise<string> {
    return await this.emailService.sendEmailVerificationCode(email, country);
  }

  async validateEmailVerificationCode(
    token: string,
    inputCode: string,
  ): Promise<boolean> {
    return this.redisService.compareToken(token, inputCode);
  }

  async sendSMSVerificationCode(phone: string): Promise<string> {
    const expirationTime = 15; // 短信验证码有效期，单位为分钟
    const smsToken = getRandomByte(3);

    try {
      const res = await this.smsService.sendSMSVerificationCode(phone);

      if (res) {
        const key = `smsVerification:${phone}_${getRandomByte(8)}`;
        await this.redisService.set(key, smsToken, expirationTime * 60);
        return key;
      } else {
        return "failed";
      }
    } catch {
      return "failed";
    }
  }

  async validateSMSVerificationCode(ValidateToken: ValidateTokenDto) {
    return await this.smsService.validateSMSVerificationCode(
      ValidateToken.phone,
      ValidateToken.code,
    );
  }

  async register(registerUser: RegisterDto): Promise<IssuedToken> {
    const user = await this.userService.createUserByWeb(registerUser);
    const tokens = await this.generateTokens({ userId: user.id });
    await this.updateRtHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<IssuedToken> {
    if (!email || !password) {
      await this.recordLoginLog({
        email,
        success: false,
        failureCode: "missing_credentials",
        failureReason: "Email and password are required",
        ...context,
      });
      throw new UnauthorizedException("Email and password are required");
    }
    // Step 1: Fetch a user with the given email
    const normalizedEmail = email.toLowerCase();
    const user = await this.userService.findOneByEmail(normalizedEmail);

    // If no user is found, throw an error
    if (!user) {
      await this.recordLoginLog({
        email: normalizedEmail,
        success: false,
        failureCode: "invalid_credentials",
        failureReason: "Invalid credentials",
        ...context,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!isUserActive(user.status)) {
      await this.recordLoginLog({
        user,
        email: normalizedEmail,
        success: false,
        failureCode: "user_disabled",
        failureReason: "User is disabled or resigned",
        ...context,
      });
      throw new UnauthorizedException("User is disabled");
    }

    // Step 2: Check if the password is correct
    const isPasswordValid = user.password
      ? await this.passwordService.validatePassword(password, user.password)
      : false;

    // If password does not match, throw an error
    if (!isPasswordValid) {
      await this.recordLoginLog({
        user,
        email: normalizedEmail,
        success: false,
        failureCode: "invalid_password",
        failureReason: "Invalid password",
        ...context,
      });
      throw new UnauthorizedException("Invalid password");
    }

    // Step 3: Generate a JWT containing the user's ID and return it
    const tokens = await this.generateTokens({ userId: user.id });
    await this.updateRtHash(user.id, tokens.refreshToken);
    await this.userService.recordSuccessfulLogin(user.id, context.ip);
    await this.recordLoginLog({
      user,
      email: normalizedEmail,
      success: true,
      ...context,
    });
    return tokens;
  }

  async logout(userId: number): Promise<boolean> {
    await this.userService.clearUserToken(userId);
    return true;
  }

  async logoutByRefreshToken(token?: string | null): Promise<boolean> {
    if (!token) {
      return true;
    }

    try {
      const jwtConfig = this.configService.get<JwtConfig>("jwt");
      const { userId } = this.jwtService.verify<{ userId: number }>(token, {
        secret: jwtConfig.refreshSecret,
      });
      const user = await this.userService.findOne(userId);
      if (!user?.hashedRt) {
        return true;
      }
      const isCurrentRefreshToken = await this.passwordService.validatePassword(
        token,
        user.hashedRt,
      );
      if (isCurrentRefreshToken) {
        await this.userService.clearUserToken(userId);
      }
    } catch {
      return true;
    }

    return true;
  }

  private generateAccessToken(payload: { userId: number }) {
    const token = this.jwtService.sign(payload);
    const decoded = jwtDecode<{ exp: number }>(token);
    return {
      token,
      expiresIn: decoded.exp * 1000, // 将秒转换为毫秒
    };
  }

  private generateRefreshToken(payload: { userId: number }) {
    const jwtConfig = this.configService.get<JwtConfig>("jwt");
    const securityConfig = this.configService.get<SecurityConfig>("security");
    const token = this.jwtService.sign(
      {
        ...payload,
        jti: randomUUID(),
      },
      {
        secret: jwtConfig.refreshSecret,
        expiresIn: securityConfig.refreshIn as JwtSignOptions["expiresIn"],
      },
    );
    const decoded = jwtDecode<{ exp: number }>(token);
    return {
      token,
      expiresIn: decoded.exp * 1000, // 将秒转换为毫秒
    };
  }

  async refreshToken(token?: string | null): Promise<IssuedToken> {
    if (!token) {
      throw new UnauthorizedException();
    }
    const jwtConfig = this.configService.get<JwtConfig>("jwt");
    const { userId } = this.jwtService.verify<{ userId: number }>(token, {
      secret: jwtConfig.refreshSecret,
    });
    const user = await this.userService.findOne(userId);
    if (!user?.hashedRt) {
      throw new UnauthorizedException();
    }
    if (!isUserActive(user.status)) {
      await this.userService.clearUserToken(userId);
      throw new UnauthorizedException();
    }
    const isJwtValid = await this.passwordService.validatePassword(
      token,
      user.hashedRt,
    );
    if (!isJwtValid) {
      await this.userService.clearUserToken(userId);
      throw new UnauthorizedException("Refresh token reuse detected");
    }
    const tokens = await this.generateTokens({ userId });
    await this.updateRtHash(userId, tokens.refreshToken);
    return tokens;
  }

  getUserFromToken(token: string): Promise<User> {
    const id = this.jwtService.decode(token)["userId"];
    return this.userService.findOne(id);
  }

  toTokenResponse(tokens: IssuedToken): Token {
    return {
      accessToken: tokens.accessToken,
      accessExpiresIn: tokens.accessExpiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    };
  }

  generateTokens(payload: { userId: number }): IssuedToken {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessExpiresIn: accessToken.expiresIn,
      refreshExpiresIn: refreshToken.expiresIn,
    };
  }

  private async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await this.passwordService.hashPassword(rt);
    await this.userService.updateUserToken(userId, hash);
  }

  private async recordLoginLog(data: {
    user?: User | null;
    email?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    success: boolean;
    failureCode?: string | null;
    failureReason?: string | null;
  }) {
    try {
      await this.prisma.loginLog.create({
        data: {
          userId: data.user?.id,
          username: data.user?.username,
          email: data.email ?? data.user?.email,
          ip: data.ip,
          userAgent: data.userAgent,
          success: data.success,
          failureCode: data.failureCode,
          failureReason: data.failureReason,
        },
      });
    } catch {
      return;
    }
  }

  /**
   * 验证邮箱验证码 -> 检查用户是否已存在 -> 已存在则登录，否则注册 -> 返回 Token
   */
  async registerByEmail(data: RegisterByEmailDto): Promise<IssuedToken> {
    // 1. 验证邮箱验证码
    const isValid = await this.validateEmailVerificationCode(
      data.token,
      data.code,
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid email verification code");
    }

    // 2. 检查用户是否已存在
    const user = await this.userService.findOneByEmail(data.email);

    if (user) {
      // 3. 如果用户存在，直接登录
      return this.login(data.email, data.password);
    } else {
      // 4. 如果用户不存在，创建新用户并返回token
      const registerDto: RegisterDto = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        country: data.country,
        username: data.lastName + data.firstName,
      };

      return this.register(registerDto);
    }
  }
}
