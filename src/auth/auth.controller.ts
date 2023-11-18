// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Public } from '../common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto, Token } from './dto';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOkResponse({ type: Token })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid password' })
  @ApiNotFoundResponse({ description: 'No user found for email' })
  login(@Body() { email, password }: LoginDto) {
    return this.auth.login(email, password);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  logout(@Request() req): Promise<boolean> {
    const id = req.user.id;
    return this.auth.logout(id);
  }

  @Public()
  @Post('register')
  @ApiCreatedResponse({ type: Token })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async register(@Body() createUserDto: RegisterDto) {
    return this.auth.register(createUserDto);
  }
  @Post('refresh')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Refresh user token.' })
  async refresh(@Body('refreshToken') { refreshToken }: RefreshTokenDto) {
    return this.auth.refreshToken(refreshToken);
  }
}
