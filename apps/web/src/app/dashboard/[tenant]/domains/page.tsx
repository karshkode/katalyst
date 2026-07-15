"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Domain = {
  id: string;
  hostname: string;
  status: string;
  tlsStatus: string;
};

export default function DomainsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [domains, setDomains] = useState<Domain[]>([]);

  async function load() {
    const res = await fetch(`${API_BASE}/tenants/${tenant}/domains`);
    if (res.ok) setDomains(await res.json());
  }

  useEffect(() => {
    load();
  }, [tenant]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`${API_BASE}/tenants/${tenant}/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: fd.get("hostname") }),
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div>
      <div className="dash-header">
        <h1>Domains &amp; TLS</h1>
      </div>
      <div className="panel">
        <h2>Bring your own domain</h2>
        <p style={{ color: "var(--katalyst-muted)" }}>
          Production uses Caddy on-demand TLS. Locally, map hosts under
          *.katalyst.localhost. Edge protection (CrowdSec + Anubis) sits in front of each
          tenant entrypoint.
        </p>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <input name="hostname" required placeholder="organize.example.org" />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Add domain
          </button>
        </form>
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>DNS / status</th>
              <th>TLS</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.id}>
                <td>{d.hostname}</td>
                <td>
                  <span className="status-pill">{d.status}</span>
                </td>
                <td>{d.tlsStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
