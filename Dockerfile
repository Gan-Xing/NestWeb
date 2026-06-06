FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    ca-certificates \
    imagemagick \
    libvips42 \
    libheif1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g pnpm@9.15.4 && npm cache clean --force

FROM base AS builder

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY prisma ./prisma
RUN pnpm exec prisma generate \
    && rm -rf /root/.local/share/pnpm/store /root/.cache

COPY src/i18n ./src/i18n
COPY --from=builder /app/dist ./dist

EXPOSE 3030

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]
