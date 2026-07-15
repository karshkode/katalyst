# Local development

Katalyst is designed to sync to OneDrive and run on a laptop.

## Prerequisites

- Node 22+
- pnpm 9+ (via Corepack)
- Docker (for Postgres/Redis/Keycloak/edge)

## Install

```bash
cp .env.example .env
pnpm install
pnpm --filter @katalyst/config build
pnpm --filter @katalyst/ui build
pnpm --filter @katalyst/integrations build
pnpm --filter @katalyst/db generate
```

## Core infra

```bash
docker compose -f docker/compose.yml --profile core up -d postgres redis keycloak
```

Migrate and seed:

```bash
export DATABASE_URL=postgresql://katalyst:katalyst@localhost:5432/katalyst?schema=public
pnpm --filter @katalyst/db exec prisma migrate dev --name init
pnpm db:seed
```

## Run apps

```bash
pnpm --filter @katalyst/api dev
pnpm --filter @katalyst/web dev
```

Demo tenant slug: **demo** → http://localhost:3000/dashboard/demo

## Compose profiles

| Profile | Services |
|---------|----------|
| `core` | postgres, redis, keycloak, api, web, caddy |
| `edge` | crowdsec, anubis |
| `suite` | signal-cli (+ future suite containers) |
| `full` | all of the above |

```bash
docker compose -f docker/compose.yml --profile core up --build
```

Caddy listens on **:8088** → proxies to web/api.

## Windows / OneDrive notes

- Prefer cloning outside aggressive OneDrive sync for `node_modules`, or exclude `node_modules` and `.next` from sync.
- Use WSL2 Docker for best Postgres/Keycloak experience on Windows.
