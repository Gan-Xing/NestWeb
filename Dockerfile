# 使用官方 Node.js 18 图像作为基础图像
FROM node:18

# 定义构建时的变量
ARG DATABASE_URL

# 创建应用程序目录
WORKDIR /usr/src/app

# 安装应用程序依赖项
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# 拷贝应用代码
COPY . .

# 在执行 Prisma 命令前检查 DATABASE_URL 环境变量
RUN if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL not set"; exit 1; fi

# 生成 Prisma 客户端和运行迁移
RUN npx prisma generate
RUN npx prisma migrate deploy

# 编译 NestJS 项目
RUN pnpm run build

# 开放端口
EXPOSE 3030

# 设置启动命令
CMD ["pnpm", "run", "start:prod"]
