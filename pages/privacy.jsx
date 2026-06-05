import Head from "next/head";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 18,
        letterSpacing: "0.1em",
        color: "#fff",
        marginBottom: 14,
      }}
    >
      {title}
    </h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  </div>
);

const P = ({ children }) => (
  <p
    style={{
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: 300,
      color: "var(--text)",
      lineHeight: 1.75,
      letterSpacing: "0.01em",
    }}
  >
    {children}
  </p>
);

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — FiveM Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Nav />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 28px 0" }}>
        {/* Header */}
        <div className="fade-up d1" style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span className="pill">Legal</span>
            <span style={{ ...MONO, fontSize: 9, color: "var(--muted2)" }}>
              Last updated: June 2026
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 6vw, 52px)",
              letterSpacing: "0.08em",
              color: "#fff",
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            PRIVACY POLICY
          </h1>
          <P>
            This Privacy Policy explains how FiveM Stats ("we", "our", or "the
            site") collects, uses, and protects information when you visit this
            website. We are an independent, community-run statistics tracker and
            are not affiliated with NoPixel Studios Pty Ltd.
          </P>
        </div>

        {/* Divider */}
        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 48 }}
        />

        <div className="fade-up d2">
          <Section title="INFORMATION WE COLLECT">
            <P>
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                Server data:
              </strong>{" "}
              We periodically fetch publicly available server information from
              the CFX.re public API, including player count, server capacity,
              and publicly visible player names. This data is sourced entirely
              from FiveM's own public endpoints and is available to anyone.
            </P>
            <P>
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                Usage data:
              </strong>{" "}
              We do not use analytics tracking, cookies, or any third-party
              tracking scripts. Standard server logs (IP addresses, request
              timestamps) may be retained temporarily by our hosting provider
              (Vercel) in accordance with their own privacy policy.
            </P>
            <P>
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                Contact form:
              </strong>{" "}
              If you contact us via the contact page, your name, email address,
              and message content are collected solely to respond to your
              enquiry.
            </P>
          </Section>

          <Section title="HOW WE USE YOUR INFORMATION">
            <P>
              We use the data we collect exclusively to operate this website —
              displaying live and historical server statistics. We do not sell,
              rent, or share any data with third parties. We do not use your
              data for advertising or marketing purposes.
            </P>
          </Section>

          <Section title="DATA STORAGE">
            <P>
              Server snapshots (player count, timestamp, max slots) are stored
              in a serverless PostgreSQL database hosted on Neon (neon.tech).
              Data older than 90 days may be periodically purged to manage
              storage. Player names visible in snapshots are sourced from
              FiveM's public API and reflect names players have chosen to
              display publicly on the server browser.
            </P>
          </Section>

          <Section title="COOKIES">
            <P>
              This website does not use cookies. No tracking cookies, analytics
              cookies, or advertising cookies are placed on your device. Your
              browser's local storage is not used either.
            </P>
          </Section>

          <Section title="THIRD-PARTY SERVICES">
            <P>
              This site is hosted on Vercel and uses the following third-party
              infrastructure:
            </P>
            <ul
              style={{
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                "Vercel (hosting & serverless functions) — vercel.com/privacy",
                "Neon (PostgreSQL database) — neon.tech/privacy",
                "CFX.re / FiveM (public server data source) — cfx.re",
                "Google Fonts (typography) — loaded from fonts.googleapis.com",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 300,
                    color: "var(--text)",
                    lineHeight: 1.7,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="YOUR RIGHTS">
            <P>
              Since we do not collect personal data beyond what is described
              above, there is limited personal data to access, correct, or
              delete. If you have concerns about data relating to you (for
              example, your in-game name appearing in our records), please
              contact us and we will address your request promptly.
            </P>
          </Section>

          <Section title="CHANGES TO THIS POLICY">
            <P>
              We may update this Privacy Policy from time to time. Changes will
              be reflected by updating the "last updated" date at the top of
              this page. Continued use of the site after changes constitutes
              acceptance of the updated policy.
            </P>
          </Section>

          <Section title="CONTACT">
            <P>
              For privacy-related questions, please use the{" "}
              <a
                href="/contact"
                style={{ color: "var(--green)", textDecoration: "none" }}
              >
                contact page
              </a>
              .
            </P>
          </Section>
        </div>
      </main>

      <Footer />
    </>
  );
}
