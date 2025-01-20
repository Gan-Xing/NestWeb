import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function deleteAllData() {
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permissionGroup.deleteMany();
}

async function main() {
  await deleteAllData();
  const adminRole = await createAdminRole();
  const { authGroup, logsGroup, resourcesGroup, imagesGroup } = await createPermissionGroups();
  await createPermissions(adminRole, authGroup, logsGroup, resourcesGroup, imagesGroup);
  await createAdminUser(adminRole);
}

async function createAdminRole() {
  return await prisma.role.create({
    data: { name: 'admin' },
  });
}

async function createPermissionGroups() {
  // 创建权限管理顶级菜单
  const authGroup = await prisma.permissionGroup.create({
    data: {
      name: '权限管理',
      path: '/auth',
    },
  });

  // 创建日志管理顶级菜单
  const logsGroup = await prisma.permissionGroup.create({
    data: {
      name: '日志管理',
      path: '/logs',
    },
  });

  // 创建资源管理顶级菜单
  const resourcesGroup = await prisma.permissionGroup.create({
    data: {
      name: '资源管理',
      path: '/resources',
    },
  });

  // 创建权限管理子菜单
  await prisma.permissionGroup.create({
    data: {
      name: '用户管理',
      path: '/auth/users',
      parentId: authGroup.id,
    },
  });

  await prisma.permissionGroup.create({
    data: {
      name: '角色管理',
      path: '/auth/roles',
      parentId: authGroup.id,
    },
  });

  await prisma.permissionGroup.create({
    data: {
      name: '权限管理',
      path: '/auth/permissions',
      parentId: authGroup.id,
    },
  });

  await prisma.permissionGroup.create({
    data: {
      name: '菜单管理',
      path: '/auth/menus',
      parentId: authGroup.id,
    },
  });

  // 创建图片管理子菜单
  const imagesGroup = await prisma.permissionGroup.create({
    data: {
      name: '图片管理',
      path: '/resources/images',
      parentId: resourcesGroup.id,
    },
  });

  return { authGroup, logsGroup, resourcesGroup, imagesGroup };
}

async function createPermissions(adminRole: any, authGroup: any, logsGroup: any, resourcesGroup: any, imagesGroup: any) {
  // 创建权限管理相关权限
  const groups = await prisma.permissionGroup.findMany({
    where: {
      path: {
        startsWith: '/auth/',
      },
    },
  });

  // 为每个权限组创建对应的权限
  for (const group of groups) {
    const basePath = group.path.replace('/auth/', '');
    const permissions = [
      {
        name: `查看${group.name.replace('管理', '')}`,
        action: 'GET',
        path: `/${basePath}`,
      },
      {
        name: `新增${group.name.replace('管理', '')}`,
        action: 'POST',
        path: `/${basePath}`,
      },
      {
        name: `编辑${group.name.replace('管理', '')}`,
        action: 'PATCH',
        path: `/${basePath}/:id`,
      },
      {
        name: `删除${group.name.replace('管理', '')}`,
        action: 'DELETE',
        path: `/${basePath}`,
      }
    ];

    for (const perm of permissions) {
      await prisma.permission.create({
        data: {
          ...perm,
          permissionGroupId: group.id,
          roles: {
            connect: [{ id: adminRole.id }],
          },
        },
      });
    }
  }

  // 创建图片管理相关权限
  const imagesPermissions = [
    {
      name: '上传图片管理图片',
      action: 'POST',
      path: '/images/upload',
    },
    {
      name: '查看图片管理列表',
      action: 'GET',
      path: '/images',
    },
    {
      name: '查看图片管理详情',
      action: 'GET',
      path: '/images/:id',
    },
    {
      name: '新增图片管理',
      action: 'POST',
      path: '/images',
    },
    {
      name: '更新图片管理',
      action: 'PATCH',
      path: '/images/:id',
    },
    {
      name: '删除图片管理',
      action: 'DELETE',
      path: '/images/:id',
    }
  ];

  for (const perm of imagesPermissions) {
    await prisma.permission.create({
      data: {
        ...perm,
        permissionGroupId: imagesGroup!.id,
        roles: {
          connect: [{ id: adminRole.id }],
        },
      },
    });
  }
}

async function createAdminUser(adminRole: any) {
  const hashedAdminPassword = await hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedAdminPassword,
      username: 'admin',
      gender: 'Male',
      departmentId: 1,
      isAdmin: true,
      avatar: 'https://gravatar.com/avatar/0000?d=mp&f=y',
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 