import { apiGet } from "@/lib/api";

type Overview = {
  tenant: { name: string; slug: string; plan: string; planDetails: { name: string; priceMonthly: number } };
  counts: { contacts: number; shortUrls: number; qrAssets: number };
  services: Array<{
    service: string;
    status: string;
    baseUrl?: string | null;
    health?: { status: string; detail?: string; mode?: string };
  }>;
  campaigns: Array<{ id: string; name: string; status: string; links: unknown[] }>;
};

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  let data: Overview | null = null;
  let error: string | null = null;
  try {
    data = await apiGet<Overview>(`/tenants/${tenant}/overview`);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  if (error || !data) {
    return (
      <div>
        <div className="dash-header">
          <h1>Overview</h1>
        </div>
        <div className="panel">
          <p>Could not reach the API ({error}). Is the control plane running on :4000?</p>
          <p>For local demo: start Postgres, run migrations/seed, then `pnpm --filter @katalyst/api dev`.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1>{data.tenant.name}</h1>
          <p style={{ margin: 0, color: "var(--katalyst-muted)" }}>
            Plan {data.tenant.plan} · {data.tenant.planDetails.name} · $
            {data.tenant.planDetails.priceMonthly}/mo
          </p>
        </div>
      </div>

      <div className="tiles" style={{ marginBottom: "1rem" }}>
        <div className="tile">
          <span>Contacts</span>
          <strong>{data.counts.contacts}</strong>
        </div>
        <div className="tile">
          <span>Campaigns</span>
          <strong>{data.campaigns.length}</strong>
        </div>
        <div className="tile">
          <span>Short URLs</span>
          <strong>{data.counts.shortUrls}</strong>
        </div>
        <div className="tile">
          <span>QR assets</span>
          <strong>{data.counts.qrAssets}</strong>
        </div>
      </div>

      <div className="panel">
        <h2>Suite health</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Endpoint</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((s) => (
              <tr key={s.service}>
                <td>{s.service}</td>
                <td>
                  <span
                    className="status-pill"
                    style={
                      s.health?.mode === "live"
                        ? { background: "rgba(51,153,153,0.18)", color: "var(--katalyst-primary)" }
                        : { background: "rgba(90,97,107,0.12)", color: "var(--katalyst-muted)" }
                    }
                  >
                    {s.health?.mode ?? "mock"}
                  </span>
                </td>
                <td>
                  <span className="status-pill">{s.health?.status ?? s.status}</span>
                </td>
                <td>
                  {s.baseUrl ? (
                    <a href={s.baseUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
