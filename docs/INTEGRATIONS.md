# Integrations

## Adapter contract

```ts
interface ServiceAdapter {
  provision(tenant): Promise<ServiceHandle>
  linkCampaign(tenant, campaign): Promise<RemoteLink>
  sync(tenant, campaign): Promise<void>
  health(tenant): Promise<{ status, detail? }>
}
```

Implemented for: `wordpress`, `mobilizon`, `sendy`, `openproject`, `nextcloud`, `jitsi`, `keycloak`.

## Mock mode

Default. Returns stable localhost-style URLs:

`https://{service}.{tenant}.katalyst.localhost/...`

Creating a campaign in the dashboard calls the bus and persists `CampaignLink` rows so the UI can deep-link.

## Live mode

Two ways to go live:

- `INTEGRATION_MODE=live` — every service uses its live adapter.
- `LIVE_SERVICES=nextcloud,keycloak,jitsi,wordpress` — opt specific services
  into live while the rest stay mock (recommended for local testing).

Live adapters implemented today (`packages/integrations/src/adapters/`):

| Service | Action on campaign create | Verify |
|---------|---------------------------|--------|
| WordPress | `POST /wp-json/wp/v2/pages` (page per campaign) | `GET pages/:id` |
| Nextcloud | WebDAV `MKCOL /Campaigns/<slug>` | `PROPFIND` folder |
| Keycloak | Admin API create group `campaign-<slug>` | group search |
| Jitsi | Compose real room URL on `JITSI_BASE_URL` | URL match |

Mobilizon, Sendy, and OpenProject remain mock (heavier / licensed) and fall back
to the mock adapter automatically if no live adapter or creds are present.

See [TESTING.md](TESTING.md) for the full local test flow. A campaign can be
re-checked any time via `POST /tenants/:slug/campaigns/:id/verify`, which also
powers the dashboard **Verify links** button.

## Signal

`signal-cli` REST sidecar is available under Compose profile `suite` (`bbernhard/signal-cli-rest-api`). The API exposes announce endpoints that queue messages in mock/live stub form today.

## Native tools

- **CRM** — contacts, tags, activity timeline  
- **Short URLs** — `GET /r/:code` redirect with click counting  
- **QR** — SVG generated with PolRev navy (`#04243E`)
