import { z } from "zod";

export const plans = {
  S: {
    id: "S",
    name: "Local",
    priceMonthly: 49,
    priceAnnual: 490,
    seats: 5,
    domains: 1,
    contacts: 5_000,
    emailsPerMonth: 10_000,
    storageGb: 50,
    signal: "optional",
    description: "School board, local DSA chapters, neighborhood orgs",
  },
  M: {
    id: "M",
    name: "District",
    priceMonthly: 129,
    priceAnnual: 1290,
    seats: 25,
    domains: 3,
    contacts: 50_000,
    emailsPerMonth: 100_000,
    storageGb: 250,
    signal: "included",
    description: "City council, state house, 50501 hubs",
  },
  L: {
    id: "L",
    name: "Statewide / Federal",
    priceMonthly: 349,
    priceAnnual: 3490,
    seats: 100,
    domains: 10,
    contacts: 250_000,
    emailsPerMonth: 500_000,
    storageGb: 1024,
    signal: "included",
    description: "Congressional, statewide, multi-chapter networks",
  },
} as const;

export type PlanId = keyof typeof plans;

export const serviceNames = [
  "wordpress",
  "mobilizon",
  "sendy",
  "openproject",
  "nextcloud",
  "jitsi",
  "keycloak",
] as const;

export type ServiceName = (typeof serviceNames)[number];

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .default("postgresql://katalyst:katalyst@localhost:5432/katalyst?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  // Comma-separated list of services to run in live mode regardless of INTEGRATION_MODE.
  // e.g. LIVE_SERVICES=wordpress,nextcloud,keycloak,jitsi
  LIVE_SERVICES: z.string().default(""),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  API_ORIGIN: z.string().default("http://localhost:4000"),
  DEMO_TENANT_SLUG: z.string().default("demo"),
  SHORT_URL_BASE: z.string().default("http://localhost:4000/r"),

  // WordPress (live)
  WORDPRESS_URL: z.string().default("http://localhost:8081"),
  WORDPRESS_USER: z.string().default("admin"),
  WORDPRESS_APP_PASSWORD: z.string().default(""),

  // Nextcloud (live)
  NEXTCLOUD_URL: z.string().default("http://localhost:8082"),
  NEXTCLOUD_USER: z.string().default("admin"),
  NEXTCLOUD_PASSWORD: z.string().default("katalyst-admin"),

  // Keycloak (live)
  KEYCLOAK_URL: z.string().default("http://localhost:8083"),
  KEYCLOAK_ADMIN_USER: z.string().default("admin"),
  KEYCLOAK_ADMIN_PASSWORD: z.string().default("admin"),
  KEYCLOAK_REALM: z.string().default("master"),
  KEYCLOAK_CLIENT_ID: z.string().default("katalyst-web"),

  // Jitsi (live = real room URLs on a configurable instance)
  JITSI_BASE_URL: z.string().default("https://meet.jit.si"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(raw);
}

/** Returns the set of services that should use live adapters given env config. */
export function liveServiceSet(env: Env): Set<ServiceName> {
  const explicit = env.LIVE_SERVICES.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) as ServiceName[];
  if (env.INTEGRATION_MODE === "live" && explicit.length === 0) {
    return new Set(serviceNames);
  }
  return new Set(explicit.filter((s) => (serviceNames as readonly string[]).includes(s)));
}

export const brand = {
  name: "Katalyst",
  org: "Political Revolution PAC",
  domain: "katalyst.pol-rev.com",
  colors: {
    primary: "#04243E",
    secondary: "#339999",
    success: "#3e8d63",
    danger: "#BC3F41",
    warning: "#945707",
    ink: "#13101c",
    light: "#f8f9fa",
  },
} as const;
