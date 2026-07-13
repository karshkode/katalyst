import type { ServiceName } from "@katalyst/config";

export type HealthStatus = "healthy" | "degraded" | "down";

export interface TenantRef {
  id: string;
  slug: string;
  name: string;
}

export interface CampaignRef {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export interface ServiceHandle {
  service: ServiceName;
  externalId: string;
  baseUrl: string;
  status: HealthStatus;
}

export interface RemoteLink {
  service: ServiceName;
  externalId: string;
  url: string;
  status: "linked" | "pending" | "error";
  meta?: Record<string, unknown>;
}

export interface ServiceAdapter {
  readonly service: ServiceName;
  provision(tenant: TenantRef): Promise<ServiceHandle>;
  linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink>;
  sync(tenant: TenantRef, campaign: CampaignRef): Promise<void>;
  health(tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }>;
}
