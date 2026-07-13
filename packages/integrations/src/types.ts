import type { ServiceName } from "@katalyst/config";

export type HealthStatus = "healthy" | "degraded" | "down";
export type LinkState = "linked" | "pending" | "error";

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
  status: LinkState;
  meta?: Record<string, unknown>;
}

export interface VerifyResult {
  service: ServiceName;
  ok: boolean;
  detail: string;
  checkedUrl?: string;
}

export interface ServiceAdapter {
  readonly service: ServiceName;
  readonly mode: "mock" | "live";
  provision(tenant: TenantRef): Promise<ServiceHandle>;
  linkCampaign(tenant: TenantRef, campaign: CampaignRef): Promise<RemoteLink>;
  sync(tenant: TenantRef, campaign: CampaignRef): Promise<void>;
  health(tenant: TenantRef): Promise<{ status: HealthStatus; detail?: string }>;
  /** Re-check that a previously created remote resource still exists. */
  verify(tenant: TenantRef, campaign: CampaignRef, link: RemoteLink): Promise<VerifyResult>;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
