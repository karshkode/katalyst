import Link from "next/link";
import { plans } from "@katalyst/config";

const services = [
  { name: "Nextcloud", blurb: "Files, collaboration, and chat in one workspace." },
  { name: "Mobilizon", blurb: "Events and RSVPs that feed your campaign spine." },
  { name: "Jitsi", blurb: "No-friction meetings for volunteers and staff." },
  { name: "Sendy", blurb: "Self-hosted mass email linked to campaign lists." },
  { name: "OpenProject", blurb: "Tasking and workstreams for canvass and field." },
  { name: "Keycloak", blurb: "Unified identity across every tool in the suite." },
  { name: "WordPress", blurb: "Public campaign site bridged to internal tools." },
  { name: "CRM + Signal", blurb: "Contacts, QR/short links, and Signal announcements." },
];

export default function HomePage() {
  return (
    <div className="site-shell">
      <nav className="site-nav">
        <Link href="/" className="brand-mark">
          Katalyst <span>by PolRev</span>
        </Link>
        <div className="nav-links">
          <Link href="/#suite">Suite</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/signup">Start</Link>
          <Link href="/dashboard/demo">Demo dashboard</Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="k-badge">Political Revolution PAC</div>
          <h1>Katalyst</h1>
          <p>
            The organizing cloud for democratic socialist campaigns—from school board to
            Congress—and for movement orgs like 50501 and DSA chapters. One dashboard,
            unified branding, campaigns that flow across events, email, projects, and files.
          </p>
          <div className="cta-row">
            <Link className="k-btn k-btn-primary" href="/signup">
              Launch your workspace
            </Link>
            <Link className="k-btn k-btn-ghost" href="/pricing">
              See S / M / L plans
            </Link>
          </div>
        </div>
      </header>

      <section className="section section-alt" id="suite">
        <h2>One suite. One campaign spine.</h2>
        <p className="lead">
          Create a campaign once. Katalyst links WordPress pages, Mobilizon events, Sendy
          lists, OpenProject boards, Nextcloud folders, and Jitsi rooms—automatically.
        </p>
        <div className="grid-3">
          {services.map((s) => (
            <article key={s.name} className="service-tile">
              <h3>{s.name}</h3>
              <p>{s.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Built for organizers, not vendors.</h2>
        <p className="lead">
          Bring your own domain. Edge protection without Cloudflare lock-in (Caddy + CrowdSec
          + Anubis). PolRev branding by default. Open-source tools with proprietary glue that
          makes them feel like one product.
        </p>
        <div className="pricing-grid" style={{ marginTop: "2rem" }}>
          {Object.values(plans).map((plan) => (
            <article key={plan.id} className={`price-card ${plan.id === "M" ? "featured" : ""}`}>
              <div className="k-badge">{plan.id}</div>
              <h3>{plan.name}</h3>
              <div className="price">
                ${plan.priceMonthly}
                <span>/mo</span>
              </div>
              <p>{plan.description}</p>
              <Link className="k-btn k-btn-dark" href={`/signup?plan=${plan.id}`}>
                Choose {plan.id}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <strong>Katalyst</strong> · a Political Revolution PAC platform · katalyst.pol-rev.com
      </footer>
    </div>
  );
}
