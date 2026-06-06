FROM node:18-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    imagemagick \
    libvips42 \
    libheif1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@9.15.4

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3030

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]
