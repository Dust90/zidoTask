FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果可用)
COPY package.json package-lock.json* ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 这里添加 ARG 指令，允许在构建时传递环境变量
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_GITEA_CLIENT_ID
ARG NEXT_PUBLIC_GITEA_CLIENT_SECRET
ARG NEXT_PUBLIC_GITEA_URL
ARG NEXT_PUBLIC_APP_URL

# 将 ARG 转换为环境变量，供构建过程使用
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_GITEA_CLIENT_ID=$NEXT_PUBLIC_GITEA_CLIENT_ID
ENV NEXT_PUBLIC_GITEA_CLIENT_SECRET=$NEXT_PUBLIC_GITEA_CLIENT_SECRET
ENV NEXT_PUBLIC_GITEA_URL=$NEXT_PUBLIC_GITEA_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# 生产环境
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建 public 目录（如果需要）
RUN mkdir -p ./public

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN chown nextjs:nodejs public

# 复制构建的应用
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
