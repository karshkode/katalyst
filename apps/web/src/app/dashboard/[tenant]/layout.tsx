import Link from "next/link";

const links = [
  { href: "", label: "Overview" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/people", label: "People" },
  { href: "/tools", label: "Tools" },
  { href: "/signal", label: "Signal" },
  { href: "/domains", label: "Domains" },
  { href: "/billing", label: "Billing" },
];

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  return (
    <DashboardShell params={params}>{children}</DashboardShell>
  );
}

async function DashboardShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="brand-mark" style={{ marginBottom: "1.25rem", padding: "0 0.5rem" }}>
          Katalyst
        </div>
        <p style={{ opacity: 0.7, padding: "0 0.85rem", marginTop: 0, fontSize: "0.85rem" }}>
          {tenant}
        </p>
        {links.map((l) => (
          <Link key={l.href} href={`/dashboard/${tenant}${l.href}`}>
            {l.label}
          </Link>
        ))}
        <Link href="/" style={{ marginTop: "1.5rem", opacity: 0.7 }}>
          ← Marketing site
        </Link>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  );
}
