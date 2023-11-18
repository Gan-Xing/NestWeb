# 使用官方 Node.js 18 图像作为基础图像
FROM node:18

# 创建应用程序目录
WORKDIR /usr/src/app

# 安装应用程序依赖项
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 拷贝应用代码
COPY . .

# 生成 Prisma 客户端和运行迁移
RUN npx prisma generate
RUN npx prisma migrate deploy

# 编译 NestJS 项目
RUN pnpm run build

# 开放端口
EXPOSE 3030

# 设置启动命令
CMD [ "pnpm", "run", "start:prod" ]
