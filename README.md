# Katalyst

SaaS control plane for progressive campaigns and movement orgs — by **Political Revolution PAC**.

Public site (planned): **katalyst.pol-rev.com**

Katalyst unifies open-source organizing tools behind one PolRev-branded dashboard:

| Service | Role |
|---------|------|
| Nextcloud | Files, collaboration, chat |
| Mobilizon | Events |
| Jitsi | Meetings |
| Sendy | Mass email |
| OpenProject | Project management |
| Keycloak | Identity |
| WordPress | Public website |
| Native | CRM, QR codes, short URLs, Signal bots |

Campaigns are the spine: create one campaign and Katalyst links WordPress, Mobilizon, Sendy, OpenProject, Nextcloud, and Jitsi automatically (mock adapters by default for localhost).

## Quick start (localhost / OneDrive)

```bash
cp .env.example .env
pnpm install
pnpm --filter @katalyst/config build
pnpm --filter @katalyst/ui build
pnpm --filter @katalyst/integrations build

# Infra
docker compose -f docker/compose.yml --profile core up -d postgres redis keycloak

# Database
export DATABASE_URL=postgresql://katalyst:katalyst@localhost:5432/katalyst?schema=public
pnpm --filter @katalyst/db generate
pnpm --filter @katalyst/db exec prisma migrate dev --name init
pnpm --filter @katalyst/db seed

# Apps (two terminals)
pnpm --filter @katalyst/api dev
pnpm --filter @katalyst/web dev
```

Open:

- Marketing: http://localhost:3000  
- Demo dashboard: http://localhost:3000/dashboard/demo  
- API health: http://localhost:4000/health  
- Edge (Caddy): http://localhost:8088 (compose profile)

## Plans

| | S Local | M District | L Statewide / Federal |
|--|---------|------------|------------------------|
| Price | $49/mo | $129/mo | $349/mo |

See [docs/PRICING.md](docs/PRICING.md).

## Live service testing

Bring up real WordPress, Nextcloud, and Keycloak and prove the campaign fan-out
creates real resources:

```bash
docker compose -f docker/compose.live.yml up -d
# then run the API with:
#   LIVE_SERVICES=nextcloud,keycloak,jitsi,wordpress
```

Create a campaign and click **Verify links** in the dashboard (or
`POST /tenants/:slug/campaigns/:id/verify`). See [docs/TESTING.md](docs/TESTING.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Local development](docs/LOCAL_DEV.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Testing the campaign feature](docs/TESTING.md)
- [Pricing](docs/PRICING.md)

## Edge (Cloudflare-free)

Caddy reverse proxy + CrowdSec + Anubis protect the main site and per-tenant entrypoints without Cloudflare. See `apps/edge/`.

## License

Proprietary control plane and branding · upstream tools retain their own open-source licenses.
