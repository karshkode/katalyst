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

export interface WordPressConfig {
  url: string;
  user: string;
  appPassword: string;
}

/**
 * Live WordPress adapter using the REST API (wp/v2).
 * Creates a page per campaign under /campaigns/<slug> and verifies it exists.
 * Requires an Application Password (Users -> Profile -> Application Passwords).
 */
export class WordPressAdapter implements ServiceAdapter {
  readonly service = "wordpress" as const;
  readonly mode = "live" as const;

  constructor(private readonly cfg: WordPressConfig) {}

  private authHeader(): string {
    const token = Buffer.from(`${this.cfg.user}:${this.cfg.appPassword}`).toString("base64");
    return `Basic ${token}`;
  }

  async provision(tenant: TenantRef): Promise<ServiceHandle> {
    const health = await this.health(tenant);
    return {
      service: this.service,
      externalId: `wordpress-${tenant.slug}`,
      baseUrl: this.cfg.url,
      status: health.status,
    };
  }

  async linkCampaign(_tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink> {
    const slug = slugify(campaign.slug);
    const res = await fetch(`${this.cfg.url}/wp-json/wp/v2/pages`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: campaign.name,
        slug: `campaign-${slug}`,
        status: "publish",
        content: `<h2>${campaign.name}</h2><p>${campaign.description ?? ""}</p>`,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        service: this.service,
        externalId: "",
        url: `${this.cfg.url}/?p=campaign-${slug}`,
        status: "error",
        meta: { error: `WP ${res.status}: ${text.slice(0, 200)}` },
      };
    }
    const page = (await res.json()) as { id: number; link: string };
    return {
      service: this.service,
      externalId: String(page.id),
      url: page.link,
      status: "linked",
      meta: { mode: "live", pageId: page.id },
    };
  }

  async sync(_tenant: TenantRef, _campaign: CampaignRef): Promise<void> {
    return;
  }

  async health(_tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }> {
    try {
      const res = await fetch(`${this.cfg.url}/wp-json/`, { method: "GET" });
      return {
        status: res.ok ? "healthy" : "degraded",
        detail: `wp-json ${res.status}`,
      };
    } catch (e) {
      return { status: "down", detail: e instanceof Error ? e.message : "unreachable" };
    }
  }

  async verify(
    _tenant: TenantRef,
    _campaign: CampaignRef,
    link: RemoteLink,
  ): Promise<VerifyResult> {
    if (!link.externalId) {
      return { service: this.service, ok: false, detail: "no page id recorded" };
    }
    try {
      const res = await fetch(`${this.cfg.url}/wp-json/wp/v2/pages/${link.externalId}`);
      return {
        service: this.service,
        ok: res.ok,
        detail: res.ok ? "page exists" : `page missing (${res.status})`,
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
