// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  Get,
  Res,
} from "@nestjs/common";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Throttle } from "@nestjs/throttler";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
} from "@nestjs/swagger";
import { Public, RegisterDto, Token } from "src/common";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterByEmailDto,
  SignUpFormData,
  ValidateTokenDto,
  WechatCodeDto,
} from "./dto";
import { buildAuthThrottleRule } from "src/common/configs/runtime-config";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "./auth-cookie";
import type { IssuedToken } from "./auth.service";

@Controller("api/auth")
@ApiTags("auth")
@Throttle({ default: buildAuthThrottleRule() })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get("wechat-miniprogram-qrcode")
  async requestQRCode(): Promise<{ qrCodeData: Buffer }> {
    return await this.auth.generateQRCode();
  }

  @Public()
  @Post("exchange-code-for-user")
  @HttpCode(HttpStatus.OK)
  async exchangeCodeForUserId(@Body() { code }: WechatCodeDto): Promise<any> {
    return await this.auth.exchangeCodeForUserId(code);
  }

  @Public()
  @Post("miniprogram-login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Token })
  async miniprogramLogin(
    @Body() { code }: WechatCodeDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Token> {
    return this.issueTokenResponse(res, await this.auth.miniprogramLogin(code));
  }

  @Public()
  @Post("login")
  @ApiOkResponse({ type: Token })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  async login(
    @Body() { email, password }: LoginDto,
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Token> {
    const tokens = await this.auth.login(email, password, {
      ip: getRequestIp(req),
      userAgent: req.headers?.["user-agent"],
    });
    return this.issueTokenResponse(res, tokens);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<boolean> {
    await this.auth.logoutByRefreshToken(getRefreshTokenFromRequest(req));
    clearRefreshTokenCookie(res);
    return true;
  }

  @Public()
  @Post("validateCaptcha")
  @ApiOkResponse({
    description: "Validate captcha and initiate email verification.",
  })
  async validateCaptchaAndInitiateEmailVerification(
    @Body() signupData: SignUpFormData,
  ): Promise<{ isValid: boolean; token?: string }> {
    const validationResponse = await this.auth.validateCaptcha(signupData);

    if (validationResponse.isValid) {
      const token = await this.auth.sendEmailVerificationCode(
        signupData.email,
        signupData.country,
      );
      return { isValid: true, token };
    } else {
      return { isValid: false };
    }
  }

  @Public()
  @Post("validateEmail")
  @ApiOkResponse({ description: "Validate email token and send SMS code." })
  async validateEmailToken(
    @Body() ValidateTokenDto: ValidateTokenDto,
  ): Promise<{ isValid: boolean; token?: string; code?: string }> {
    const isValid = await this.auth.validateEmailVerificationCode(
      ValidateTokenDto.token,
      ValidateTokenDto.code,
    );
    if (isValid) {
      const token = await this.auth.sendSMSVerificationCode(
        ValidateTokenDto.phone,
      );
      return { isValid, token };
    } else {
      return { isValid: false };
    }
  }

  @Public()
  @Post("validateSMS")
  @ApiOkResponse({ description: "Validate sms token and send Register" })
  async validateSMSToken(
    @Body() ValidateToken: ValidateTokenDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ isValid: boolean; token?: Token; code?: string }> {
    const isValid = await this.auth.validateSMSVerificationCode(ValidateToken);

    if (isValid) {
      const userObj = await this.auth.getUserFromRedis(
        `userRegistration:${ValidateToken.phone}`,
      );
      const { firstName, lastName, email, password, country, phoneNumber } =
        userObj;
      const newUserObj: RegisterDto = {
        firstName,
        lastName,
        username: lastName + firstName,
        email,
        password,
        country,
        phoneNumber,
      };
      const token = this.issueTokenResponse(
        res,
        await this.auth.register(newUserObj),
      );
      return { isValid, token };
    } else {
      return { isValid: false };
    }
  }

  @Public()
  @Post("register")
  @ApiCreatedResponse({ type: Token })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  async register(
    @Body() createUserDto: RegisterDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Token> {
    return this.issueTokenResponse(
      res,
      await this.auth.register(createUserDto),
    );
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: Token,
    description:
      "Refresh access token with the HttpOnly refresh token cookie. The refresh token is rotated on every successful call.",
  })
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Token> {
    return this.issueTokenResponse(
      res,
      await this.auth.refreshToken(getRefreshTokenFromRequest(req)),
    );
  }

  @Public()
  @Post("registerByEmail")
  @ApiOkResponse({
    description: "验证邮箱验证码，若已存在用户则直接登录，否则创建新用户并登录",
    type: Token,
  })
  async registerByEmail(
    @Body() body: RegisterByEmailDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<Token> {
    return this.issueTokenResponse(res, await this.auth.registerByEmail(body));
  }

  private issueTokenResponse(res: ExpressResponse, tokens: IssuedToken): Token {
    setRefreshTokenCookie(res, tokens.refreshToken, tokens.refreshExpiresIn);
    return this.auth.toTokenResponse(tokens);
  }
}

function getRequestIp(req: ExpressRequest): string | null {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0] ?? null;
  }

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return req.ip || req.socket?.remoteAddress || null;
}
