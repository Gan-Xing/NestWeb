import { LoginLog, Role, User } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/articles/entities/article.entity';

export class UserEntity implements User {
	constructor(partial: Partial<UserEntity>) {
		Object.assign(this, partial);
	}

	@ApiProperty()
	id: number;

	@ApiProperty()
	email: string;

	@Exclude()
	password: string;

	@Exclude()
	hashedRt: string;

	@ApiProperty()
	status: string | null;

	@ApiProperty()
	username: string | null;

	@ApiProperty()
	avatar: string | null;

	@ApiProperty()
	gender: string | null;

	@ApiProperty()
	isAdmin: boolean;

	@ApiProperty()
	departmentId: number | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiPropertyOptional()
	lastLoginAt: Date | null;

	@ApiPropertyOptional()
	lastLoginIp: string | null;

	@ApiPropertyOptional()
	passwordUpdatedAt: Date | null;

	@ApiPropertyOptional({ isArray: true, description: '角色对象数组' })
	roles?: Role[];

	@ApiPropertyOptional({ isArray: true, description: '用户文章数组' })
	articles?: ArticleEntity[];

	@ApiPropertyOptional({ isArray: true, description: '用户登录日志' })
	loginLogs?: LoginLog[];

	@ApiProperty()
	phoneNumber: string | null; // 使用 ? 使属性变为可选

	@ApiProperty()
	firstName: string | null;

	@ApiProperty()
	lastName: string | null;

	@ApiProperty()
	wechatId: string | null;

	@ApiProperty()
	miniWechatId: string | null;
}
