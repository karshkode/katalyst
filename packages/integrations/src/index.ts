import type { Env, ServiceName } from "@katalyst/config";
import { serviceNames, liveServiceSet } from "@katalyst/config";
import { MockAdapter } from "./mock-adapter";
import { WordPressAdapter } from "./adapters/wordpress";
import { NextcloudAdapter } from "./adapters/nextcloud";
import { KeycloakAdapter } from "./adapters/keycloak";
import { JitsiAdapter } from "./adapters/jitsi";
import type {
  CampaignRef,
  RemoteLink,
  ServiceAdapter,
  ServiceHandle,
  TenantRef,
  VerifyResult,
} from "./types";

export type IntegrationMode = "mock" | "live";

function buildLiveAdapter(service: ServiceName, env: Env): ServiceAdapter | null {
  switch (service) {
    case "wordpress":
      if (!env.WORDPRESS_APP_PASSWORD) return null;
      return new WordPressAdapter({
        url: env.WORDPRESS_URL,
        user: env.WORDPRESS_USER,
        appPassword: env.WORDPRESS_APP_PASSWORD,
      });
    case "nextcloud":
      return new NextcloudAdapter({
        url: env.NEXTCLOUD_URL,
        user: env.NEXTCLOUD_USER,
        password: env.NEXTCLOUD_PASSWORD,
      });
    case "keycloak":
      return new KeycloakAdapter({
        url: env.KEYCLOAK_URL,
        adminUser: env.KEYCLOAK_ADMIN_USER,
        adminPassword: env.KEYCLOAK_ADMIN_PASSWORD,
        realm: env.KEYCLOAK_REALM,
      });
    case "jitsi":
      return new JitsiAdapter({ baseUrl: env.JITSI_BASE_URL });
    default:
      // mobilizon, sendy, openproject have no light live adapter yet
      return null;
  }
}

export class IntegrationBus {
  private readonly adapters: Map<ServiceName, ServiceAdapter>;
  readonly liveServices: ServiceName[];

  constructor(env?: Env) {
    const live = env ? liveServiceSet(env) : new Set<ServiceName>();
    const active: ServiceName[] = [];
    this.adapters = new Map(
      serviceNames.map((service) => {
        if (env && live.has(service)) {
          const adapter = buildLiveAdapter(service, env);
          if (adapter) {
            active.push(service);
            return [service, adapter] as const;
          }
        }
        return [service, new MockAdapter(service)] as const;
      }),
    );
    this.liveServices = active;
  }

  get(service: ServiceName): ServiceAdapter {
    const adapter = this.adapters.get(service);
    if (!adapter) throw new Error(`Unknown service adapter: ${service}`);
    return adapter;
  }

  modeOf(service: ServiceName): "mock" | "live" {
    return this.get(service).mode;
  }

  async provisionTenant(tenant: TenantRef): Promise<ServiceHandle[]> {
    return Promise.all(serviceNames.map((s) => this.get(s).provision(tenant)));
  }

  async linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink[]> {
    return Promise.all(serviceNames.map((s) => this.get(s).linkCampaign(tenant, campaign)));
  }

  async syncCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<void> {
    await Promise.all(serviceNames.map((s) => this.get(s).sync(tenant, campaign)));
  }

  async verifyCampaign(
    tenant: TenantRef,
    campaign: CampaignRef,
    links: RemoteLink[],
  ): Promise<VerifyResult[]> {
    return Promise.all(
      links.map((link) => this.get(link.service).verify(tenant, campaign, link)),
    );
  }

  async healthAll(tenant: TenantRef) {
    const entries = await Promise.all(
      serviceNames.map(async (service) => {
        const adapter = this.get(service);
        const result = await adapter.health(tenant);
        return [service, { ...result, mode: adapter.mode }] as const;
      }),
    );
    return Object.fromEntries(entries);
  }
}

export * from "./types";
export { MockAdapter } from "./mock-adapter";
export { WordPressAdapter } from "./adapters/wordpress";
export { NextcloudAdapter } from "./adapters/nextcloud";
export { KeycloakAdapter } from "./adapters/keycloak";
export { JitsiAdapter } from "./adapters/jitsi";
