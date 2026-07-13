"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Contact = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  tags: Array<{ tag: { name: string } }>;
  activities: Array<{ summary: string; type: string }>;
};

export default function PeoplePage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`${API_BASE}/tenants/${tenant}/contacts`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setContacts(await res.json());
  }

  useEffect(() => {
    load();
  }, [tenant]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tags = String(fd.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch(`${API_BASE}/tenants/${tenant}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        city: fd.get("city"),
        state: fd.get("state"),
        notes: fd.get("notes"),
        tags,
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
        <h1>People</h1>
      </div>
      <div className="panel">
        <h2>Add contact</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <input name="firstName" placeholder="First name" />
            <input name="lastName" placeholder="Last name" />
            <input name="email" type="email" placeholder="Email" />
            <input name="city" placeholder="City" />
            <input name="state" placeholder="State" />
            <input name="tags" placeholder="Tags (comma-separated)" />
            <textarea name="notes" placeholder="Notes" rows={2} />
          </div>
          <button className="k-btn k-btn-primary" type="submit">
            Save contact
          </button>
        </form>
        {error ? <p style={{ color: "var(--katalyst-danger)" }}>{error}</p> : null}
      </div>
      <div className="panel">
        <h2>CRM directory</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.firstName} {c.lastName}
                </td>
                <td>{c.email}</td>
                <td>
                  {[c.city, c.state].filter(Boolean).join(", ")}
                </td>
                <td>{c.tags.map((t) => t.tag.name).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
