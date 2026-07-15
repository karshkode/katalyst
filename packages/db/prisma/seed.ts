import { PrismaClient, PlanId, CampaignStatus, LinkStatus, ServiceName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Progressive Campaign",
      slug: "demo",
      plan: PlanId.M,
      users: {
        create: {
          email: "admin@demo.katalyst.local",
          name: "Demo Admin",
          role: "admin",
        },
      },
      domains: {
        create: {
          hostname: "demo.katalyst.localhost",
          status: "ACTIVE",
          tlsStatus: "active",
        },
      },
      signalBots: {
        create: {
          name: "Katalyst Announcer",
          phone: "+15555550100",
          status: "ready",
          groups: [
            { id: "grp-1", name: "Volunteers", members: 42 },
            { id: "grp-2", name: "Canvass Captains", members: 12 },
          ],
        },
      },
      invoices: {
        create: {
          amount: 12900,
          periodLabel: "2026-07",
          status: "paid",
        },
      },
    },
  });

  const services: ServiceName[] = [
    ServiceName.wordpress,
    ServiceName.mobilizon,
    ServiceName.sendy,
    ServiceName.openproject,
    ServiceName.nextcloud,
    ServiceName.jitsi,
    ServiceName.keycloak,
  ];

  for (const service of services) {
    await prisma.tenantService.upsert({
      where: { tenantId_service: { tenantId: tenant.id, service } },
      update: { status: "healthy" },
      create: {
        tenantId: tenant.id,
        service,
        status: "healthy",
        baseUrl: `https://${service}.demo.katalyst.localhost`,
        externalId: `${service}-demo-1`,
      },
    });
  }

  const campaign = await prisma.campaign.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "summer-canvass" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Summer Canvass Blitz",
      slug: "summer-canvass",
      description: "Door-to-door and event turnout for the progressive slate.",
      status: CampaignStatus.ACTIVE,
      startsAt: new Date("2026-06-01"),
      endsAt: new Date("2026-11-03"),
    },
  });

  const linkDefs: Array<{ service: ServiceName; externalId: string; url: string }> = [
    {
      service: ServiceName.wordpress,
      externalId: "wp-campaign-12",
      url: "https://wordpress.demo.katalyst.localhost/campaigns/summer-canvass",
    },
    {
      service: ServiceName.mobilizon,
      externalId: "mz-group-44",
      url: "https://mobilizon.demo.katalyst.localhost/@summer-canvass",
    },
    {
      service: ServiceName.sendy,
      externalId: "sendy-list-9",
      url: "https://sendy.demo.katalyst.localhost/list?i=9",
    },
    {
      service: ServiceName.openproject,
      externalId: "op-project-3",
      url: "https://openproject.demo.katalyst.localhost/projects/summer-canvass",
    },
    {
      service: ServiceName.nextcloud,
      externalId: "nc-folder-summer",
      url: "https://nextcloud.demo.katalyst.localhost/apps/files/?dir=/Campaigns/summer-canvass",
    },
    {
      service: ServiceName.jitsi,
      externalId: "jitsi-summer-standup",
      url: "https://jitsi.demo.katalyst.localhost/summer-canvass",
    },
  ];

  for (const link of linkDefs) {
    await prisma.campaignLink.upsert({
      where: { campaignId_service: { campaignId: campaign.id, service: link.service } },
      update: { status: LinkStatus.LINKED, url: link.url },
      create: {
        campaignId: campaign.id,
        service: link.service,
        externalId: link.externalId,
        url: link.url,
        status: LinkStatus.LINKED,
      },
    });
  }

  const volunteer = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "volunteer" } },
    update: {},
    create: { tenantId: tenant.id, name: "volunteer" },
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      email: "jordan@example.org",
      firstName: "Jordan",
      lastName: "Rivera",
      city: "Portland",
      state: "OR",
      notes: "Weekend canvasser",
      tags: { create: [{ tagId: volunteer.id }] },
      activities: {
        create: {
          type: "signup",
          summary: "Signed up via landing page",
          campaignId: campaign.id,
        },
      },
    },
  });

  await prisma.shortUrl.upsert({
    where: { code: "canvass" },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "canvass",
      targetUrl: "https://wordpress.demo.katalyst.localhost/campaigns/summer-canvass",
    },
  });

  await prisma.qrAsset.create({
    data: {
      tenantId: tenant.id,
      label: "Canvass QR",
      targetUrl: "https://wordpress.demo.katalyst.localhost/campaigns/summer-canvass",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#04243E"/><text x="50" y="55" fill="#339999" text-anchor="middle" font-size="12">QR</text></svg>`,
    },
  });

  console.log("Seeded tenant", tenant.slug, "contact", contact.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
