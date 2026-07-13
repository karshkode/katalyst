import type { ServiceName } from "@katalyst/config";
import { serviceNames } from "@katalyst/config";
import { MockAdapter } from "./mock-adapter";
import type {
  CampaignRef,
  RemoteLink,
  ServiceAdapter,
  ServiceHandle,
  TenantRef,
} from "./types";

export type IntegrationMode = "mock" | "live";

/** Live adapters currently delegate to mock until suite services are provisioned. */
class LivePassthroughAdapter extends MockAdapter {
  async health(tenant: TenantRef) {
    const base = await super.health(tenant);
    return { ...base, detail: `live mode passthrough for ${this.service}` };
  }
}

export class IntegrationBus {
  private readonly adapters: Map<ServiceName, ServiceAdapter>;

  constructor(mode: IntegrationMode = "mock") {
    this.adapters = new Map(
      serviceNames.map((service) => [
        service,
        mode === "mock" ? new MockAdapter(service) : new LivePassthroughAdapter(service),
      ]),
    );
  }

  get(service: ServiceName): ServiceAdapter {
    const adapter = this.adapters.get(service);
    if (!adapter) throw new Error(`Unknown service adapter: ${service}`);
    return adapter;
  }

  async provisionTenant(tenant: TenantRef): Promise<ServiceHandle[]> {
    return Promise.all(serviceNames.map((s) => this.get(s).provision(tenant)));
  }

  async linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink[]> {
    const campaignServices = serviceNames.filter((s) => s !== "keycloak");
    return Promise.all(campaignServices.map((s) => this.get(s).linkCampaign(tenant, campaign)));
  }

  async syncCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<void> {
    await Promise.all(serviceNames.map((s) => this.get(s).sync(tenant, campaign)));
  }

  async healthAll(tenant: TenantRef) {
    const entries = await Promise.all(
      serviceNames.map(async (service) => {
        const result = await this.get(service).health(tenant);
        return [service, result] as const;
      }),
    );
    return Object.fromEntries(entries);
  }
}

export * from "./types";
export { MockAdapter } from "./mock-adapter";
