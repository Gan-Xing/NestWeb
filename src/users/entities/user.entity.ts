import { LoginLog, User } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { LoginLogEntity } from 'src/login-logs/entities/login-log.entity';
import { PermissionEntity } from 'src/permissions/entities/permission.entity';

export class UserRoleEntity {
	@ApiProperty()
	id: number;

	@ApiProperty()
	code: string;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	description: string | null;

	@ApiProperty()
	sort: number;

	@ApiProperty()
	enabled: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiPropertyOptional({ type: () => [PermissionEntity], description: '权限对象数组' })
	permissions?: PermissionEntity[];
}

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

	@ApiPropertyOptional({ type: () => [UserRoleEntity], description: '角色对象数组' })
	roles?: UserRoleEntity[];

	@ApiPropertyOptional({
		type: 'array',
		items: { type: 'object' },
		description: '用户文章数组'
	})
	articles?: unknown[];

	@ApiPropertyOptional({ type: () => [LoginLogEntity], description: '用户登录日志' })
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
