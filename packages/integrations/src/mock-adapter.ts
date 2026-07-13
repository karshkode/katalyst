import type { ServiceName } from "@katalyst/config";
import type {
  CampaignRef,
  RemoteLink,
  ServiceAdapter,
  ServiceHandle,
  TenantRef,
} from "./types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export class MockAdapter implements ServiceAdapter {
  constructor(public readonly service: ServiceName) {}

  async provision(tenant: TenantRef): Promise<ServiceHandle> {
    return {
      service: this.service,
      externalId: `${this.service}-${tenant.slug}`,
      baseUrl: `https://${this.service}.${tenant.slug}.katalyst.localhost`,
      status: "healthy",
    };
  }

  async linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink> {
    const code = slugify(campaign.slug);
    const paths: Record<ServiceName, string> = {
      wordpress: `/campaigns/${code}`,
      mobilizon: `/@${code}`,
      sendy: `/list?campaign=${code}`,
      openproject: `/projects/${code}`,
      nextcloud: `/apps/files/?dir=/Campaigns/${code}`,
      jitsi: `/${code}`,
      keycloak: `/realms/${tenant.slug}`,
    };

    return {
      service: this.service,
      externalId: `${this.service}-${code}`,
      url: `https://${this.service}.${tenant.slug}.katalyst.localhost${paths[this.service]}`,
      status: "linked",
      meta: {
        mode: "mock",
        campaignName: campaign.name,
        linkedAt: new Date().toISOString(),
      },
    };
  }

  async sync(_tenant: TenantRef, _campaign: CampaignRef): Promise<void> {
    return;
  }

  async health(_tenant: TenantRef) {
    return { status: "healthy" as const, detail: "mock adapter online" };
  }
}
