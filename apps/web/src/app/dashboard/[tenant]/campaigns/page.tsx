"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Link = { service: string; url?: string | null; status: string; externalId: string };
type Campaign = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  links: Link[];
};

export default function CampaignsPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenant}/campaigns`);
      if (!res.ok) throw new Error(await res.text());
      setCampaigns(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  useEffect(() => {
    load();
  }, [tenant]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`${API_BASE}/tenants/${tenant}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        slug: fd.get("slug"),
        description: fd.get("description"),
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  return (
    <div>
      <div className="dash-header">
        <h1>Campaigns</h1>
      </div>
      <div className="panel">
        <h2>Create campaign</h2>
        <p style={{ color: "var(--katalyst-muted)" }}>
          Creating a campaign fans out linked resources across WordPress, Mobilizon, Sendy,
          OpenProject, Nextcloud, and Jitsi.
        </p>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <input name="name" required placeholder="Campaign name" />
            <input name="slug" required pattern="[a-z0-9-]+" placeholder="slug" />
            <textarea name="description" placeholder="Description" rows={3} />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Create &amp; link suite
          </button>
        </form>
        {error ? <p style={{ color: "var(--katalyst-danger)" }}>{error}</p> : null}
      </div>

      {campaigns.map((c) => (
        <div className="panel" key={c.id}>
          <h2>
            {c.name} <span className="status-pill">{c.status}</span>
          </h2>
          <p style={{ color: "var(--katalyst-muted)" }}>{c.description}</p>
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>External ID</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {c.links.map((l) => (
                <tr key={l.service}>
                  <td>{l.service}</td>
                  <td>{l.externalId}</td>
                  <td>
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      l.status
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
