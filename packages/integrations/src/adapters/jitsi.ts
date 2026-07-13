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

export interface JitsiConfig {
  baseUrl: string;
}

/**
 * Live Jitsi adapter. A Jitsi room exists simply by visiting its URL, so this
 * adapter composes a real, clickable room URL on a configurable instance
 * (defaults to meet.jit.si) and verifies the instance is reachable.
 */
export class JitsiAdapter implements ServiceAdapter {
  readonly service = "jitsi" as const;
  readonly mode = "live" as const;

  constructor(private readonly cfg: JitsiConfig) {}

  private room(tenant: TenantRef, campaign: CampaignRef): string {
    return `katalyst-${slugify(tenant.slug)}-${slugify(campaign.slug)}`;
  }

  async provision(tenant: TenantRef): Promise<ServiceHandle> {
    const health = await this.health(tenant);
    return {
      service: this.service,
      externalId: `jitsi-${tenant.slug}`,
      baseUrl: this.cfg.baseUrl,
      status: health.status,
    };
  }

  async linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink> {
    const room = this.room(tenant, campaign);
    return {
      service: this.service,
      externalId: room,
      url: `${this.cfg.baseUrl}/${room}`,
      status: "linked",
      meta: { mode: "live", room },
    };
  }

  async sync(_tenant: TenantRef, _campaign: CampaignRef): Promise<void> {
    return;
  }

  async health(_tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }> {
    try {
      const res = await fetch(this.cfg.baseUrl, { method: "HEAD" });
      return { status: res.ok ? "healthy" : "degraded", detail: `HEAD ${res.status}` };
    } catch (e) {
      return { status: "down", detail: e instanceof Error ? e.message : "unreachable" };
    }
  }

  async verify(
    tenant: TenantRef,
    campaign: CampaignRef,
    link: RemoteLink,
  ): Promise<VerifyResult> {
    const expected = this.room(tenant, campaign);
    return {
      service: this.service,
      ok: link.externalId === expected,
      detail: link.externalId === expected ? "room url valid" : "room mismatch",
      checkedUrl: link.url,
    };
  }
}
