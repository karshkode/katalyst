import Link from "next/link";
import { plans } from "@katalyst/config";

export default function PricingPage() {
  return (
    <div className="site-shell">
      <nav className="site-nav">
        <Link href="/" className="brand-mark">
          Katalyst <span>by PolRev</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/signup">Start free trial</Link>
          <Link href="/dashboard/demo">Demo</Link>
        </div>
      </nav>

      <section className="section" style={{ paddingTop: "3rem" }}>
        <h2>T-shirt sized plans for every scale of fight</h2>
        <p className="lead">
          Priced under NationBuilder&apos;s mid-market while packing files, meetings, project
          management, identity, and anti-abuse edge into every tier. Annual billing saves two
          months. 14-day trial on Local (S).
        </p>

        <div className="pricing-grid">
          {Object.values(plans).map((plan) => (
            <article key={plan.id} className={`price-card ${plan.id === "M" ? "featured" : ""}`}>
              <div className="k-badge">Plan {plan.id}</div>
              <h3>{plan.name}</h3>
              <div className="price">
                ${plan.priceMonthly}
                <span>/mo</span>
              </div>
              <p style={{ color: "var(--katalyst-muted)" }}>
                or ${plan.priceAnnual}/yr · {plan.description}
              </p>
              <ul>
                <li>{plan.seats} seats</li>
                <li>{plan.domains} custom domain{plan.domains > 1 ? "s" : ""}</li>
                <li>{plan.contacts.toLocaleString()} CRM contacts</li>
                <li>{plan.emailsPerMonth.toLocaleString()} emails / month</li>
                <li>{plan.storageGb >= 1024 ? "1 TB" : `${plan.storageGb} GB`} files</li>
                <li>Signal bot: {plan.signal}</li>
                <li>QR + short URLs included</li>
                <li>Full suite: Nextcloud, Mobilizon, Jitsi, Sendy, OpenProject, WordPress, Keycloak</li>
              </ul>
              <Link className="k-btn k-btn-primary" href={`/signup?plan=${plan.id}`}>
                Start with {plan.id}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        Comparable market anchor: NationBuilder Starter ~$34 / Pro ~$160. Katalyst packages more
        infrastructure per dollar for progressive campaigns.
      </footer>
    </div>
  );
}
