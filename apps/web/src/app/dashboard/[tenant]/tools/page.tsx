"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type ShortUrl = { id: string; code: string; targetUrl: string; clicks: number; shortUrl?: string };
type QrAsset = { id: string; label: string; targetUrl: string; svg: string };

export default function ToolsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [shorts, setShorts] = useState<ShortUrl[]>([]);
  const [qrs, setQrs] = useState<QrAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [s, q] = await Promise.all([
      fetch(`${API_BASE}/tenants/${tenant}/tools/short-urls`),
      fetch(`${API_BASE}/tenants/${tenant}/tools/qr`),
    ]);
    if (!s.ok || !q.ok) {
      setError("Failed to load tools");
      return;
    }
    setShorts(await s.json());
    setQrs(await q.json());
  }

  useEffect(() => {
    load();
  }, [tenant]);

  async function createShort(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`${API_BASE}/tenants/${tenant}/tools/short-urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUrl: fd.get("targetUrl"),
        code: fd.get("code") || undefined,
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  async function createQr(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`${API_BASE}/tenants/${tenant}/tools/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: fd.get("label"),
        targetUrl: fd.get("targetUrl"),
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
        <h1>Tools</h1>
      </div>
      {error ? <p style={{ color: "var(--katalyst-danger)" }}>{error}</p> : null}

      <div className="panel">
        <h2>Short URL generator</h2>
        <form onSubmit={createShort}>
          <div className="form-row">
            <input name="targetUrl" required placeholder="https://…" />
            <input name="code" placeholder="optional custom code" />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Create short link
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Target</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {shorts.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={`${API_BASE}/r/${s.code}`} target="_blank" rel="noreferrer">
                    {s.code}
                  </a>
                </td>
                <td>{s.targetUrl}</td>
                <td>{s.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>QR code generator</h2>
        <form onSubmit={createQr}>
          <div className="form-row">
            <input name="label" required placeholder="Label" />
            <input name="targetUrl" required placeholder="https://…" />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Generate QR
          </button>
        </form>
        <div className="grid-3" style={{ marginTop: "1rem" }}>
          {qrs.map((q) => (
            <article key={q.id} className="service-tile">
              <h3>{q.label}</h3>
              <div dangerouslySetInnerHTML={{ __html: q.svg }} style={{ maxWidth: 160 }} />
              <p>{q.targetUrl}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
