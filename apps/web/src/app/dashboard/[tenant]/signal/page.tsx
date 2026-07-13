"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Bot = {
  id: string;
  name: string;
  status: string;
  phone?: string | null;
  groups?: Array<{ id: string; name: string; members: number }> | null;
};

export default function SignalPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [bots, setBots] = useState<Bot[]>([]);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tenants/${tenant}/signal`)
      .then((r) => r.json())
      .then(setBots)
      .catch(() => setBots([]));
  }, [tenant]);

  async function announce(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`${API_BASE}/tenants/${tenant}/signal/announce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: fd.get("message"),
        groupId: fd.get("groupId") || undefined,
      }),
    });
    setResult(JSON.stringify(await res.json(), null, 2));
  }

  const groups =
    bots.flatMap((b) => (Array.isArray(b.groups) ? b.groups : [])) ?? [];

  return (
    <div>
      <div className="dash-header">
        <h1>Signal</h1>
      </div>
      <div className="panel">
        <h2>Bots</h2>
        {bots.length === 0 ? (
          <p>No Signal bots yet. Included on M/L plans; optional add-on for S.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.phone ?? "—"}</td>
                  <td>
                    <span className="status-pill">{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel">
        <h2>Announce</h2>
        <form onSubmit={announce}>
          <div className="form-row">
            <select name="groupId" defaultValue="">
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.members})
                </option>
              ))}
            </select>
            <textarea name="message" required rows={4} placeholder="Announcement message" />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Queue announcement
          </button>
        </form>
        {result ? (
          <pre style={{ marginTop: "1rem", overflow: "auto" }}>{result}</pre>
        ) : null}
      </div>
    </div>
  );
}
