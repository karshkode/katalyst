# Testing the campaign feature across services

Katalyst is tested in three layers, from fastest/offline to fully live.

## Layer 1 — Mock mode (default, offline)

Every adapter returns deterministic links, so you can exercise the whole
campaign fan-out and UI with no external services.

```bash
INTEGRATION_MODE=mock   # default
```

Create a campaign in the dashboard (or via API) and you immediately get linked
resources for WordPress, Mobilizon, Sendy, OpenProject, Nextcloud, Jitsi, and
Keycloak. The **Verify links** button reports every service as `mock · ok`.

Good for: UI work, fan-out logic, CI, demos.

## Layer 2 — Live mode for the light, API-rich services

Bring up real WordPress, Nextcloud, and Keycloak (Jitsi rooms are just URLs).
This proves the integration actually creates real remote resources.

```bash
docker compose -f docker/compose.live.yml up -d
```

Then opt those services into live mode (keep the heavy ones mock):

```bash
LIVE_SERVICES=nextcloud,keycloak,jitsi,wordpress
```

with the matching creds in `.env` (see `.env.example`).

Create a campaign, then hit **Verify links** (or `POST
/tenants/:slug/campaigns/:id/verify`). Live services are re-checked against the
real API:

- **Nextcloud** — `PROPFIND` confirms `/Campaigns/<slug>` folder exists
- **Keycloak** — admin API confirms the `campaign-<slug>` group exists
- **Jitsi** — confirms the generated room URL
- **WordPress** — `GET /wp-json/wp/v2/pages/<id>` confirms the page exists

Independent spot-checks:

```bash
# Nextcloud folder
curl -u admin:katalyst-admin -X PROPFIND -H 'Depth: 0' \
  http://localhost:8082/remote.php/dav/files/admin/Campaigns/<slug> -o /dev/null -w '%{http_code}\n'

# Keycloak group
TOKEN=$(curl -s -X POST http://localhost:8083/realms/master/protocol/openid-connect/token \
  -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin | jq -r .access_token)
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8083/admin/realms/master/groups?search=campaign-<slug>'
```

### WordPress application password

The REST API needs an Application Password:

1. Open http://localhost:8081, finish the install wizard.
2. Users -> Profile -> Application Passwords -> add "katalyst-api".
3. Put it in `.env` as `WORDPRESS_APP_PASSWORD` and add `wordpress` to `LIVE_SERVICES`.

## Layer 3 — Full suite (heavy)

Mobilizon, OpenProject, and Sendy are heavier (and Sendy is licensed). They stay
mock by default. Add live adapters + Compose services when you have the RAM and
credentials; the `ServiceAdapter` interface is already in place.

## macOS notes

- Use Docker Desktop; ports `8081/8082/8083` map exactly as above.
- The repo does not pin any storage driver — Docker Desktop's default is fine
  and fast (the CI sandbox used `vfs`, which is slow for WordPress; you won't hit
  that on your Mac).
- Run the app on the host: `pnpm --filter @katalyst/api dev` and
  `pnpm --filter @katalyst/web dev`, pointing at the containers via `localhost`.
