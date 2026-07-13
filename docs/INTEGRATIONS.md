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

Set `INTEGRATION_MODE=live`. Adapters currently passthrough to mock until suite containers and credentials are configured per tenant.

## Signal

`signal-cli` REST sidecar is available under Compose profile `suite` (`bbernhard/signal-cli-rest-api`). The API exposes announce endpoints that queue messages in mock/live stub form today.

## Native tools

- **CRM** — contacts, tags, activity timeline  
- **Short URLs** — `GET /r/:code` redirect with click counting  
- **QR** — SVG generated with PolRev navy (`#04243E`)
