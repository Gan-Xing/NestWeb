import { PrismaClient } from '@prisma/client';
import { fakerZH_CN as faker } from '@faker-js/faker';
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
  await createRoles();
  await createPermissionGroups();
  await createPermissions();
  await createUsers();
  await createArticles();
}

async function createRoles() {
  for (let i = 0; i < 10; i++) {
    const roleName = `role${i}`;
    const existingRole = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: { name: roleName },
      });
    }
  }
}

async function createPermissionGroups() {
  // 创建权限管理顶级菜单
  const authGroup = await prisma.permissionGroup.create({
    data: {
      name: '权限管理',
      path: '/auth',
    },
  });

  // 创建子菜单
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
}

async function createPermissions() {
  const groups = await prisma.permissionGroup.findMany({
    where: {
      path: {
        startsWith: '/auth/',
      },
    },
  });
  const roles = await prisma.role.findMany();

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
        action: 'PUT',
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
            connect: roles.map((role) => ({ id: role.id })),
          },
        },
      });
    }
  }
}

async function createUsers() {
  const roles = await prisma.role.findMany();

  const hashedAdminPassword = await hash('admin123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: {
        password: hashedAdminPassword,
        roles: {
          connect: roles.map((role) => ({ id: role.id })),
        },
      },
    });
  } else {
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
          connect: roles.map((role) => ({ id: role.id })),
        },
      },
    });
  }

  for (let i = 0; i < 100; i++) {
    const plainPassword = faker.internet.password();
    const hashedPassword = await hash(plainPassword, 10);

    await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: hashedPassword,
        username: faker.internet.userName(),
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        departmentId: Math.floor(Math.random() * 10) + 1,
        isAdmin: faker.datatype.boolean(),
        avatar: faker.image.avatar(),
        roles: {
          connect: roles
            .slice(0, Math.floor(Math.random() * roles.length + 1))
            .map((role) => ({ id: role.id })),
        },
      },
    });
  }
}

async function createArticles() {
  const users = await prisma.user.findMany();

  for (let i = 0; i < 10; i++) {
    await prisma.article.create({
      data: {
        title: faker.lorem.words(5),
        description: faker.lorem.sentences(3),
        body: faker.lorem.paragraphs(3),
        published: faker.datatype.boolean(),
        authorId: users[Math.floor(Math.random() * users.length)].id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 