# Architecture

## Control plane

Katalyst is a multi-tenant control plane:

1. **Marketing + dashboard** (`apps/web`) — Next.js  
2. **API** (`apps/api`) — NestJS  
3. **Postgres** — tenants, campaigns, CRM, tools, billing stubs  
4. **Integration bus** (`packages/integrations`) — typed adapters per suite service  
5. **Edge** (`apps/edge`) — Caddy + CrowdSec + Anubis  

## Campaign spine

```
Campaign create
  → WordPress campaign page
  → Mobilizon group / event series
  → Sendy list
  → OpenProject project
  → Nextcloud folder
  → Jitsi room
Links stored as campaign_links(service, external_id, url, status)
```

## Tenancy

Each signup creates a `Tenant` with plan S/M/L, optional custom domain, provisioned `TenantService` rows, and admin user. Keycloak is the identity target (local Compose runs `start-dev`; realm wiring is staged for production OIDC login).

## Modes

- `INTEGRATION_MODE=mock` (default) — deterministic URLs/IDs so localhost works without the full suite  
- `INTEGRATION_MODE=live` — same interfaces; adapters currently passthrough until suite profiles are fully wired  

## Recommended optional services

Documented for later Compose profiles: Matrix/Element, Listmonk, Vaultwarden, Etherpad, BigBlueButton, Umami, Decidim, Loomio, PeerTube.
