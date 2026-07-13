import { apiGet } from "@/lib/api";

type Billing = {
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
    seats: number;
    contacts: number;
    emailsPerMonth: number;
    storageGb: number;
  };
  usage: {
    seats: number;
    contacts: number;
    emailsThisMonth: number;
    storageGbUsed: number;
  };
  invoices: Array<{ id: string; amount: number; periodLabel: string; status: string }>;
  stripeEnabled: boolean;
};

export default async function BillingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  let data: Billing | null = null;
  try {
    data = await apiGet<Billing>(`/tenants/${tenant}/billing`);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div>
        <div className="dash-header">
          <h1>Billing</h1>
        </div>
        <div className="panel">API unavailable.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-header">
        <h1>Billing</h1>
      </div>
      <div className="panel">
        <h2>
          Plan {data.plan.id} — {data.plan.name}
        </h2>
        <p>
          ${data.plan.priceMonthly}/mo · Stripe checkout stubbed for localhost (
          {data.stripeEnabled ? "enabled" : "disabled"}).
        </p>
        <div className="tiles">
          <div className="tile">
            <span>Seats</span>
            <strong>
              {data.usage.seats}/{data.plan.seats}
            </strong>
          </div>
          <div className="tile">
            <span>Contacts</span>
            <strong>
              {data.usage.contacts}/{data.plan.contacts.toLocaleString()}
            </strong>
          </div>
          <div className="tile">
            <span>Email</span>
            <strong>
              {data.usage.emailsThisMonth.toLocaleString()}/
              {data.plan.emailsPerMonth.toLocaleString()}
            </strong>
          </div>
          <div className="tile">
            <span>Storage</span>
            <strong>
              {data.usage.storageGbUsed}/{data.plan.storageGb} GB
            </strong>
          </div>
        </div>
      </div>
      <div className="panel">
        <h2>Invoices</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.periodLabel}</td>
                <td>${(inv.amount / 100).toFixed(2)}</td>
                <td>
                  <span className="status-pill">{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
