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

export interface NextcloudConfig {
  url: string;
  user: string;
  password: string;
}

/**
 * Live Nextcloud adapter using WebDAV.
 * Creates /Campaigns/<slug> folder per campaign and verifies via PROPFIND.
 */
export class NextcloudAdapter implements ServiceAdapter {
  readonly service = "nextcloud" as const;
  readonly mode = "live" as const;

  constructor(private readonly cfg: NextcloudConfig) {}

  private authHeader(): string {
    const token = Buffer.from(`${this.cfg.user}:${this.cfg.password}`).toString("base64");
    return `Basic ${token}`;
  }

  private davBase(): string {
    return `${this.cfg.url}/remote.php/dav/files/${this.cfg.user}`;
  }

  private async mkcol(path: string): Promise<Response> {
    return fetch(`${this.davBase()}${path}`, {
      method: "MKCOL",
      headers: { Authorization: this.authHeader() },
    });
  }

  async provision(tenant: TenantRef): Promise<ServiceHandle> {
    await this.mkcol("/Campaigns");
    const health = await this.health(tenant);
    return {
      service: this.service,
      externalId: `nextcloud-${tenant.slug}`,
      baseUrl: this.cfg.url,
      status: health.status,
    };
  }

  async linkCampaign(_tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink> {
    const slug = slugify(campaign.slug);
    await this.mkcol("/Campaigns");
    const res = await this.mkcol(`/Campaigns/${slug}`);
    const ok = res.status === 201 || res.status === 405; // 405 = already exists
    const folderUrl = `${this.cfg.url}/apps/files/?dir=/Campaigns/${slug}`;
    return {
      service: this.service,
      externalId: `/Campaigns/${slug}`,
      url: folderUrl,
      status: ok ? "linked" : "error",
      meta: { mode: "live", mkcolStatus: res.status },
    };
  }

  async sync(_tenant: TenantRef, _campaign: CampaignRef): Promise<void> {
    return;
  }

  async health(_tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }> {
    try {
      const res = await fetch(`${this.cfg.url}/status.php`);
      return { status: res.ok ? "healthy" : "degraded", detail: `status.php ${res.status}` };
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
      const res = await fetch(`${this.davBase()}${link.externalId}`, {
        method: "PROPFIND",
        headers: { Authorization: this.authHeader(), Depth: "0" },
      });
      const ok = res.status === 207 || res.ok;
      return {
        service: this.service,
        ok,
        detail: ok ? "folder exists" : `folder missing (${res.status})`,
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
