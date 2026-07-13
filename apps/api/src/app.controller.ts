import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { plans, type PlanId } from "@katalyst/config";
import { CampaignStatus, LinkStatus, ServiceName } from "@katalyst/db";
import { IntegrationsService } from "./integrations.service";
import { PrismaService } from "./prisma.service";

function shortCode(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrations: IntegrationsService,
  ) {}

  @Get("health")
  health() {
    return {
      ok: true,
      service: "katalyst-api",
      mode: this.integrations.env.INTEGRATION_MODE,
    };
  }

  @Get("meta/plans")
  listPlans() {
    return Object.values(plans);
  }

  @Get("tenants/:slug")
  async getTenant(@Param("slug") slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        users: true,
        domains: true,
        serviceLinks: true,
        signalBots: true,
        invoices: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return {
      ...tenant,
      planDetails: plans[tenant.plan as PlanId],
    };
  }

  @Post("tenants")
  async createTenant(
    @Body()
    body: {
      name: string;
      slug: string;
      plan?: PlanId;
      adminEmail: string;
      adminName: string;
      domain?: string;
    },
  ) {
    const plan = body.plan ?? "S";
    const tenant = await this.prisma.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        plan,
        users: {
          create: {
            email: body.adminEmail,
            name: body.adminName,
            role: "admin",
          },
        },
        domains: body.domain
          ? {
              create: {
                hostname: body.domain,
                status: "PENDING",
                tlsStatus: "pending",
              },
            }
          : undefined,
      },
    });

    const handles = await this.integrations.bus.provisionTenant({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    });

    for (const handle of handles) {
      await this.prisma.tenantService.create({
        data: {
          tenantId: tenant.id,
          service: handle.service as ServiceName,
          status: handle.status,
          baseUrl: handle.baseUrl,
          externalId: handle.externalId,
        },
      });
    }

    if (plan !== "S") {
      await this.prisma.signalBot.create({
        data: {
          tenantId: tenant.id,
          name: `${tenant.name} Signal Bot`,
          status: "ready",
          groups: [],
        },
      });
    }

    return this.getTenant(tenant.slug);
  }

  @Get("tenants/:slug/overview")
  async overview(@Param("slug") slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        serviceLinks: true,
        campaigns: { include: { links: true } },
        _count: { select: { contacts: true, shortUrls: true, qrAssets: true } },
      },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const health = await this.integrations.bus.healthAll({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        planDetails: plans[tenant.plan as PlanId],
      },
      counts: tenant._count,
      services: tenant.serviceLinks.map((s) => ({
        ...s,
        health: health[s.service],
      })),
      campaigns: tenant.campaigns,
    };
  }

  @Get("tenants/:slug/campaigns")
  async listCampaigns(@Param("slug") slug: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.campaign.findMany({
      where: { tenantId: tenant.id },
      include: { links: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Post("tenants/:slug/campaigns")
  async createCampaign(
    @Param("slug") slug: string,
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    const tenant = await this.requireTenant(slug);
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: body.name,
        slug: body.slug,
        description: body.description,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        status: CampaignStatus.ACTIVE,
      },
    });

    const links = await this.integrations.bus.linkCampaign(
      { id: tenant.id, slug: tenant.slug, name: tenant.name },
      {
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        description: campaign.description,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
      },
    );

    for (const link of links) {
      await this.prisma.campaignLink.create({
        data: {
          campaignId: campaign.id,
          service: link.service as ServiceName,
          externalId: link.externalId,
          url: link.url,
          status: LinkStatus.LINKED,
          meta: (link.meta ?? {}) as object,
        },
      });
    }

    return this.prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { links: true },
    });
  }

  @Patch("tenants/:slug/campaigns/:campaignId")
  async updateCampaign(
    @Param("slug") slug: string,
    @Param("campaignId") campaignId: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      status: CampaignStatus;
      startsAt: string;
      endsAt: string;
    }>,
  ) {
    const tenant = await this.requireTenant(slug);
    const existing = await this.prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: tenant.id },
    });
    if (!existing) throw new NotFoundException("Campaign not found");

    const campaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      },
    });

    await this.integrations.bus.syncCampaign(
      { id: tenant.id, slug: tenant.slug, name: tenant.name },
      campaign,
    );

    return this.prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { links: true },
    });
  }

  @Get("tenants/:slug/contacts")
  async listContacts(@Param("slug") slug: string, @Query("q") q?: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.contact.findMany({
      where: {
        tenantId: tenant.id,
        OR: q
          ? [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  @Post("tenants/:slug/contacts")
  async createContact(
    @Param("slug") slug: string,
    @Body()
    body: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      notes?: string;
      tags?: string[];
    },
  ) {
    const tenant = await this.requireTenant(slug);
    const tagIds: string[] = [];
    for (const name of body.tags ?? []) {
      const tag = await this.prisma.tag.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name },
      });
      tagIds.push(tag.id);
    }

    return this.prisma.contact.create({
      data: {
        tenantId: tenant.id,
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        city: body.city,
        state: body.state,
        notes: body.notes,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        activities: {
          create: { type: "created", summary: "Contact created in Katalyst CRM" },
        },
      },
      include: {
        tags: { include: { tag: true } },
        activities: true,
      },
    });
  }

  @Get("tenants/:slug/tools/short-urls")
  async listShortUrls(@Param("slug") slug: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.shortUrl.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("tenants/:slug/tools/short-urls")
  async createShortUrl(
    @Param("slug") slug: string,
    @Body() body: { targetUrl: string; code?: string },
  ) {
    const tenant = await this.requireTenant(slug);
    const code = body.code?.trim() || shortCode(8);
    const row = await this.prisma.shortUrl.create({
      data: {
        tenantId: tenant.id,
        code,
        targetUrl: body.targetUrl,
      },
    });
    return {
      ...row,
      shortUrl: `${this.integrations.env.SHORT_URL_BASE}/${row.code}`,
    };
  }

  @Get("r/:code")
  async resolveShort(@Param("code") code: string, @Res() res: Response) {
    const row = await this.prisma.shortUrl.findUnique({ where: { code } });
    if (!row) throw new NotFoundException("Short URL not found");
    await this.prisma.shortUrl.update({
      where: { id: row.id },
      data: { clicks: { increment: 1 } },
    });
    return res.redirect(row.targetUrl);
  }

  @Get("tenants/:slug/tools/qr")
  async listQr(@Param("slug") slug: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.qrAsset.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("tenants/:slug/tools/qr")
  async createQr(
    @Param("slug") slug: string,
    @Body() body: { label: string; targetUrl: string },
  ) {
    const tenant = await this.requireTenant(slug);
    const svg = await QRCode.toString(body.targetUrl, {
      type: "svg",
      color: { dark: "#04243E", light: "#FFFFFF" },
      margin: 1,
    });
    return this.prisma.qrAsset.create({
      data: {
        tenantId: tenant.id,
        label: body.label,
        targetUrl: body.targetUrl,
        svg,
      },
    });
  }

  @Get("tenants/:slug/signal")
  async getSignal(@Param("slug") slug: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.signalBot.findMany({ where: { tenantId: tenant.id } });
  }

  @Post("tenants/:slug/signal/announce")
  async announce(
    @Param("slug") slug: string,
    @Body() body: { message: string; groupId?: string },
  ) {
    const tenant = await this.requireTenant(slug);
    const bots = await this.prisma.signalBot.findMany({ where: { tenantId: tenant.id } });
    if (!bots.length) {
      return {
        ok: false,
        detail: "No Signal bot provisioned for this plan/tenant (enable on M/L or add manually).",
      };
    }
    return {
      ok: true,
      mode: this.integrations.env.INTEGRATION_MODE,
      deliveredTo: body.groupId ?? "all-groups",
      botId: bots[0].id,
      message: body.message,
      queuedAt: new Date().toISOString(),
    };
  }

  @Get("tenants/:slug/domains")
  async listDomains(@Param("slug") slug: string) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.domain.findMany({ where: { tenantId: tenant.id } });
  }

  @Post("tenants/:slug/domains")
  async addDomain(
    @Param("slug") slug: string,
    @Body() body: { hostname: string },
  ) {
    const tenant = await this.requireTenant(slug);
    return this.prisma.domain.create({
      data: {
        tenantId: tenant.id,
        hostname: body.hostname,
        status: "PENDING",
        tlsStatus: "pending",
      },
    });
  }

  @Get("tenants/:slug/billing")
  async billing(@Param("slug") slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { invoices: { orderBy: { createdAt: "desc" } }, _count: { select: { contacts: true, users: true } } },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    const plan = plans[tenant.plan as PlanId];
    return {
      plan,
      usage: {
        seats: tenant._count.users,
        contacts: tenant._count.contacts,
        emailsThisMonth: Math.min(plan.emailsPerMonth, Math.round(plan.emailsPerMonth * 0.18)),
        storageGbUsed: Math.round(plan.storageGb * 0.12),
      },
      invoices: tenant.invoices,
      stripeEnabled: false,
    };
  }

  private async requireTenant(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }
}
