import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	private readonly logger = new Logger(JwtAuthGuard.name);

	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		const contextType = context.getType();
		
		// 明确列出允许的非HTTP上下文类型
		const allowedNonHttpContexts = ['rmq', 'rpc', 'ws'];
		
		if (contextType !== 'http') {
			if (allowedNonHttpContexts.includes(contextType)) {
				this.logger.debug(`Skipping authentication for ${contextType} context`);
				return true;
			} else {
				this.logger.warn(`Unexpected context type: ${contextType}, proceeding with authentication`);
			}
		}

		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		return super.canActivate(context);
	}
}
