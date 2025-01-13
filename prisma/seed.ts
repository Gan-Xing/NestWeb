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
  const { authGroup, logsGroup } = await createPermissionGroups();
  await createPermissions(adminRole, authGroup, logsGroup);
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

  // 创建图文日志子菜单
  const photoLogsGroup = await prisma.permissionGroup.create({
    data: {
      name: '图文日志',
      path: '/logs/photo-logs',
      parentId: logsGroup.id,
    },
  });

  return { authGroup, logsGroup, photoLogsGroup };
}

async function createPermissions(adminRole: any, authGroup: any, logsGroup: any) {
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

  // 创建图文日志相关权限
  const photoLogsGroup = await prisma.permissionGroup.findFirst({
    where: {
      path: '/logs/photo-logs',
    },
  });

  const photoLogsPermissions = [
    {
      name: '上传图文日志图片',
      action: 'POST',
      path: '/photo-logs/upload',
    },
    {
      name: '查看图文日志列表',
      action: 'GET',
      path: '/photo-logs',
    },
    {
      name: '查看图文日志详情',
      action: 'GET',
      path: '/photo-logs/:id',
    },
    {
      name: '新增图文日志',
      action: 'POST',
      path: '/photo-logs',
    },
    {
      name: '更新图文日志',
      action: 'PATCH',
      path: '/photo-logs/:id',
    },
    {
      name: '删除图文日志',
      action: 'DELETE',
      path: '/photo-logs/:id',
    }
  ];

  for (const perm of photoLogsPermissions) {
    await prisma.permission.create({
      data: {
        ...perm,
        permissionGroupId: photoLogsGroup!.id,
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