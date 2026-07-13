"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { API_BASE } from "@/lib/api";

function SignupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const defaultPlan = params.get("plan") || "S";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug")),
      plan: String(fd.get("plan")),
      adminEmail: String(fd.get("adminEmail")),
      adminName: String(fd.get("adminName")),
      domain: String(fd.get("domain") || "") || undefined,
    };
    try {
      const res = await fetch(`${API_BASE}/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const tenant = await res.json();
      router.push(`/dashboard/${tenant.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setPending(false);
    }
  }

  return (
    <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
      <h2>Create your Katalyst workspace</h2>
      <div className="form-row">
        <label>
          Organization name
          <input name="name" required placeholder="Sunrise DSA Chapter" />
        </label>
        <label>
          Workspace slug
          <input name="slug" required pattern="[a-z0-9-]+" placeholder="sunrise-dsa" />
        </label>
        <label>
          Plan
          <select name="plan" defaultValue={defaultPlan}>
            <option value="S">S — Local ($49/mo)</option>
            <option value="M">M — District ($129/mo)</option>
            <option value="L">L — Statewide / Federal ($349/mo)</option>
          </select>
        </label>
        <label>
          Admin name
          <input name="adminName" required placeholder="Alex Organizer" />
        </label>
        <label>
          Admin email
          <input name="adminEmail" type="email" required placeholder="alex@example.org" />
        </label>
        <label>
          Custom domain (optional)
          <input name="domain" placeholder="organize.example.org" />
        </label>
      </div>
      {error ? <p style={{ color: "var(--katalyst-danger)" }}>{error}</p> : null}
      <button className="k-btn k-btn-primary" type="submit" disabled={pending}>
        {pending ? "Provisioning…" : "Provision workspace"}
      </button>
      <p style={{ color: "var(--katalyst-muted)", marginTop: "1rem" }}>
        Or open the <Link href="/dashboard/demo">seeded demo tenant</Link>.
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="site-shell">
      <nav className="site-nav">
        <Link href="/" className="brand-mark">
          Katalyst <span>by PolRev</span>
        </Link>
        <div className="nav-links">
          <Link href="/pricing">Pricing</Link>
        </div>
      </nav>
      <section className="section">
        <Suspense fallback={<div className="panel">Loading…</div>}>
          <SignupForm />
        </Suspense>
      </section>
    </div>
  );
}
