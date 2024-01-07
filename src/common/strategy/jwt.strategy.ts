//src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { JwtConfig, JwtDto } from 'src/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		private readonly userService: UsersService,
		readonly configService: ConfigService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get<JwtConfig>('jwt').accessSecret
		});
	}

	async validate(payload: JwtDto): Promise<User> {
		const user = await this.userService.findOne(payload.userId);

		if (!user) {
			throw new UnauthorizedException();
		}

		return user;
	}
}
