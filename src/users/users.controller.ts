import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	ParseIntPipe,
	Req,
	ParseArrayPipe,
	Query
} from '@nestjs/common';
import {
	ApiTags,
	ApiOkResponse,
	ApiCreatedResponse,
	ApiBearerAuth,
	ApiQuery
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './entities';
import { Permissions } from 'src/common';
import { PermissionEntity } from 'src/permissions/entities';

@Controller('api/users')
@ApiTags('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@ApiBearerAuth()
	@ApiCreatedResponse({ description: 'Create a user.', type: UserEntity })
	@Permissions(new PermissionEntity({ action: 'POST', path: '/users' }))
	async create(@Body() createUserDto: CreateUserDto) {
		return new UserEntity(await this.usersService.create(createUserDto));
	}

	@Get()
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Get all users.', type: [UserEntity] })
	@Permissions(new PermissionEntity({ action: 'GET', path: '/users' }))
	async findAll() {
		const users = await this.usersService.findAll();
		return users.map((user) => new UserEntity(user));
	}

	@Get('page')
	@ApiBearerAuth()
	@ApiQuery({ name: 'current', required: true, type: Number })
	@ApiQuery({ name: 'pageSize', required: true, type: Number })
	@ApiQuery({ name: 'sorter', required: false, type: String })
	@ApiQuery({ name: 'name', required: false, type: String })
	@Permissions(new PermissionEntity({ action: 'GET', path: '/users' }))
	async findAllPaged(
		@Query('current', ParseIntPipe) current: number,
		@Query('pageSize', ParseIntPipe) pageSize: number,
		@Query('sorter') sorter: string,
		@Query() filters: Record<string, any>
	) {
		const sortObject = sorter ? JSON.parse(sorter) : null;

		// 移除已经独立处理的属性，避免冲突
		delete filters.current;
		delete filters.pageSize;
		delete filters.sorter;

		return await this.usersService.findAllPaged(
			{ current, pageSize, ...filters },
			sortObject
		);
	}

	@Get('/current')
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Get current user.', type: UserEntity })
	async findCurrent(@Req() req) {
		const user = await this.usersService.findOneWithRolesAndPermissions(
			req.user.id
		);
		return new UserEntity(user);
	}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Find a user by id.', type: UserEntity }) // 单个User，直接使用type: User
	@Permissions(new PermissionEntity({ action: 'GET', path: '/users' }))
	async findOne(@Param('id', ParseIntPipe) id: number) {
		return new UserEntity(await this.usersService.findOne(id));
	}

	@Patch(':id')
	@ApiBearerAuth()
	@ApiCreatedResponse({ description: 'Update a user by id.', type: UserEntity })
	@Permissions(new PermissionEntity({ action: 'Patch', path: '/users' }))
	async update(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateUserDto: UpdateUserDto
	) {
		return new UserEntity(await this.usersService.updateUser(id, updateUserDto));
	}

	@Delete()
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Delete users by their IDs.' })
	@Permissions(new PermissionEntity({ action: 'DELETE', path: '/users' }))
	async removeByIds(@Body('ids', ParseArrayPipe) ids: number[]) {
		return this.usersService.removeByIds(ids);
	}

	@Delete(':id')
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Delete a user by id.', type: UserEntity })
	@Permissions(new PermissionEntity({ action: 'DELETE', path: '/users' }))
	async remove(@Param('id', ParseIntPipe) id: number) {
		return new UserEntity(await this.usersService.remove(id));
	}
}
