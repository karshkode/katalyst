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
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  API_ORIGIN: z.string().default("http://localhost:4000"),
  KEYCLOAK_URL: z.string().default("http://localhost:8080"),
  KEYCLOAK_REALM: z.string().default("katalyst"),
  KEYCLOAK_CLIENT_ID: z.string().default("katalyst-web"),
  DEMO_TENANT_SLUG: z.string().default("demo"),
  SHORT_URL_BASE: z.string().default("http://localhost:4000/r"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(raw);
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
