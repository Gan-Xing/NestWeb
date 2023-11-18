import { Role, User } from '@prisma/client';
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
  status: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  departmentId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ isArray: true, description: '角色对象数组' })
  roles?: Role[];

  @ApiPropertyOptional({ isArray: true, description: '用户文章数组' })
  articles?: ArticleEntity[];
}
