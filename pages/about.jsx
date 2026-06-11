import Head from "next/head";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
const BODY = { fontFamily: "var(--font-body)", fontWeight: 300 };

const FEATURES = [
  {
    icon: "⊞",
    title: "Live Dashboard",
    desc: "Player counts updated every 30 seconds directly from the CFX.re public API. No guesswork, no delays.",
  },
  {
    icon: "◎",
    title: "Full History",
    desc: "Up to 6 months of historical data with hourly and daily granularity. See exactly when servers peak and dip.",
  },
  {
    icon: "▦",
    title: "Activity Heatmap",
    desc: "7-day hourly heatmap shows you the busiest times of the week at a glance, adjusted to your local timezone.",
  },
  {
    icon: "↑",
    title: "Uptime Tracking",
    desc: "168-hour uptime timeline with automatic gap detection, incident logging, and restart detection.",
  },
  {
    icon: "⋯",
    title: "Peak Insights",
    desc: "Busiest day, peak hour, all-time record, and 30-day averages — all computed from real snapshot data.",
  },
  {
    icon: "⊕",
    title: "Multi-Server",
    desc: "Track unlimited FiveM servers side by side. Switch between them instantly in the sidebar.",
  },
];

const STACK = [
  { name: "Next.js", role: "Frontend & API routes", url: "https://nextjs.org" },
  { name: "Neon", role: "Serverless PostgreSQL", url: "https://neon.tech" },
  { name: "Vercel", role: "Hosting & deployment", url: "https://vercel.com" },
  {
    name: "CFX.re API",
    role: "Live server data source",
    url: "https://cfx.re",
  },
  { name: "Recharts", role: "Data visualisation", url: "https://recharts.org" },
  {
    name: "cron-job.org",
    role: "Polling scheduler",
    url: "https://cron-job.org",
  },
];

export default function About() {
  return (
    <>
      <Head>
        <title>About — FiveM Stats</title>
        <meta
          name="description"
          content="FiveM Stats is a free, independent multi-server statistics tracker for FiveM. Live player counts, uptime, heatmaps, and peak analytics — updated every 30 seconds."
        />
        <meta property="og:title" content="About — FiveM Stats" />
        <meta
          property="og:description"
          content="Free, independent multi-server statistics tracker for FiveM. Built with Next.js, Neon, and Vercel."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Nav />

      <main
        id="main-content"
        style={{ maxWidth: 860, margin: "0 auto", padding: "48px 28px 0" }}
      >
        {/* Hero */}
        <div className="fade-up d1" style={{ marginBottom: 56 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <img
              src="/assets/icon-192.png"
              alt="FiveM Stats logo"
              width={52}
              height={52}
              style={{ borderRadius: 14 }}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(36px, 6vw, 56px)",
                  letterSpacing: "0.08em",
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                FIVEM STATS
              </div>
              <div
                style={{
                  ...MONO,
                  fontSize: 11,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                multi-server tracker · independent · free
              </div>
            </div>
          </div>
          <p
            style={{
              ...BODY,
              fontSize: 16,
              color: "var(--text)",
              lineHeight: 1.8,
              maxWidth: 680,
            }}
          >
            FiveM Stats is a free, independent statistics tracker for FiveM
            multiplayer servers. We pull live data from the public CFX.re API
            every 30 seconds and turn it into clean, actionable dashboards —
            player counts, uptime history, activity heatmaps, and peak
            analytics, all in your local timezone.
          </p>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 56 }}
        />

        {/* What we track */}
        <div className="fade-up d2" style={{ marginBottom: 56 }}>
          <div
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            What we offer
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              letterSpacing: "0.08em",
              color: "#fff",
              marginBottom: 32,
            }}
          >
            EVERYTHING YOU NEED TO KNOW ABOUT YOUR SERVERS
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "20px 18px",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--line2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--line)")
                }
              >
                <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    letterSpacing: "0.06em",
                    color: "var(--green)",
                    marginBottom: 8,
                  }}
                >
                  {title}
                </div>
                <p
                  style={{
                    ...MONO,
                    fontSize: 11,
                    color: "var(--muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 56 }}
        />

        {/* Data policy */}
        <div className="fade-up d3" style={{ marginBottom: 56 }}>
          <div
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Data & privacy
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              letterSpacing: "0.08em",
              color: "#fff",
              marginBottom: 20,
            }}
          >
            NO TRACKING. NO ADS. NO BS.
          </h2>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              {
                label: "Data source",
                value: "CFX.re public API",
                sub: "Only publicly available data",
              },
              {
                label: "Retention",
                value: "180 days",
                sub: "Then automatically purged",
              },
              { label: "Cookies", value: "None", sub: "Zero tracking cookies" },
              { label: "Ads", value: "None", sub: "Always free, always clean" },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "18px 16px",
                }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    letterSpacing: "0.04em",
                    color: "var(--green)",
                    marginBottom: 4,
                  }}
                >
                  {value}
                </div>
                <div style={{ ...MONO, fontSize: 10, color: "var(--muted)" }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 56 }}
        />

        {/* Stack */}
        <div className="fade-up d4" style={{ marginBottom: 56 }}>
          <div
            style={{
              ...MONO,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Built with
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 4vw, 36px)",
              letterSpacing: "0.08em",
              color: "#fff",
              marginBottom: 24,
            }}
          >
            THE STACK
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            {STACK.map(({ name, role, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  textDecoration: "none",
                  transition: "border-color 0.2s, background 0.2s",
                  display: "block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(61,220,132,0.3)";
                  e.currentTarget.style.background = "rgba(61,220,132,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "var(--bg2)";
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    letterSpacing: "0.06em",
                    color: "#fff",
                    marginBottom: 4,
                  }}
                >
                  {name}
                </div>
                <div style={{ ...MONO, fontSize: 10, color: "var(--muted)" }}>
                  {role}
                </div>
              </a>
            ))}
          </div>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 56 }}
        />

        {/* CTA */}
        <div
          className="fade-up d5"
          style={{ marginBottom: 56, textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "0.08em",
              color: "#fff",
              marginBottom: 16,
            }}
          >
            WANT YOUR SERVER LISTED?
          </div>
          <p
            style={{
              ...BODY,
              fontSize: 14,
              color: "var(--muted)",
              lineHeight: 1.75,
              marginBottom: 28,
              maxWidth: 480,
              margin: "0 auto 28px",
            }}
          >
            Any publicly listed FiveM server can be added. Reach out via the
            contact form.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/contact"
              style={{
                background: "none",
                border: "1px solid var(--line2)",
                borderRadius: 10,
                color: "var(--muted)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 400,
                padding: "12px 28px",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--green)";
                e.currentTarget.style.color = "var(--green)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--line2)";
                e.currentTarget.style.color = "var(--muted)";
              }}
            >
              contact us
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
