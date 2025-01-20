# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-slim

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    libvips-dev \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start:prod"]
