FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --filter @katalyst/api... --frozen-lockfile=false
RUN pnpm --filter @katalyst/db generate
RUN pnpm --filter @katalyst/config build
RUN pnpm --filter @katalyst/integrations build
RUN pnpm --filter @katalyst/db build
RUN pnpm --filter @katalyst/api build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
