FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --filter @katalyst/web... --frozen-lockfile=false
RUN pnpm --filter @katalyst/config build
RUN pnpm --filter @katalyst/ui build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @katalyst/web build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
