import type {
  CampaignRef,
  HealthStatus,
  RemoteLink,
  ServiceAdapter,
  ServiceHandle,
  TenantRef,
  VerifyResult,
} from "../types";
import { slugify } from "../types";

export interface KeycloakConfig {
  url: string;
  adminUser: string;
  adminPassword: string;
  realm: string;
}

/**
 * Live Keycloak adapter using the admin REST API.
 * Creates a group per campaign in the configured realm and verifies via lookup.
 */
export class KeycloakAdapter implements ServiceAdapter {
  readonly service = "keycloak" as const;
  readonly mode = "live" as const;

  constructor(private readonly cfg: KeycloakConfig) {}

  private async token(): Promise<string> {
    const res = await fetch(
      `${this.cfg.url}/realms/master/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "password",
          client_id: "admin-cli",
          username: this.cfg.adminUser,
          password: this.cfg.adminPassword,
        }),
      },
    );
    if (!res.ok) throw new Error(`keycloak token ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  async provision(tenant: TenantRef): Promise<ServiceHandle> {
    const health = await this.health(tenant);
    return {
      service: this.service,
      externalId: `keycloak-${tenant.slug}`,
      baseUrl: this.cfg.url,
      status: health.status,
    };
  }

  async linkCampaign(_tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink> {
    const name = `campaign-${slugify(campaign.slug)}`;
    try {
      const token = await this.token();
      const res = await fetch(
        `${this.cfg.url}/admin/realms/${this.cfg.realm}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );
      const ok = res.status === 201 || res.status === 409; // 409 = exists
      return {
        service: this.service,
        externalId: name,
        url: `${this.cfg.url}/admin/master/console/#/${this.cfg.realm}/groups`,
        status: ok ? "linked" : "error",
        meta: { mode: "live", createStatus: res.status },
      };
    } catch (e) {
      return {
        service: this.service,
        externalId: name,
        url: `${this.cfg.url}/admin/master/console/`,
        status: "error",
        meta: { error: e instanceof Error ? e.message : "unreachable" },
      };
    }
  }

  async sync(_tenant: TenantRef, _campaign: CampaignRef): Promise<void> {
    return;
  }

  async health(_tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }> {
    try {
      const res = await fetch(`${this.cfg.url}/realms/${this.cfg.realm}`);
      return { status: res.ok ? "healthy" : "degraded", detail: `realm ${res.status}` };
    } catch (e) {
      return { status: "down", detail: e instanceof Error ? e.message : "unreachable" };
    }
  }

  async verify(
    _tenant: TenantRef,
    _campaign: CampaignRef,
    link: RemoteLink,
  ): Promise<VerifyResult> {
    try {
      const token = await this.token();
      const res = await fetch(
        `${this.cfg.url}/admin/realms/${this.cfg.realm}/groups?search=${encodeURIComponent(link.externalId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        return { service: this.service, ok: false, detail: `lookup ${res.status}` };
      }
      const groups = (await res.json()) as Array<{ name: string }>;
      const found = groups.some((g) => g.name === link.externalId);
      return {
        service: this.service,
        ok: found,
        detail: found ? "group exists" : "group not found",
        checkedUrl: link.url,
      };
    } catch (e) {
      return {
        service: this.service,
        ok: false,
        detail: e instanceof Error ? e.message : "unreachable",
      };
    }
  }
}
