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

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms & Conditions — FiveM Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Nav />

      <main
        id="main-content"
        style={{ maxWidth: 760, margin: "0 auto", padding: "48px 28px 0" }}
      >
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
            <span style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
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
            TERMS & CONDITIONS
          </h1>
          <P>
            By accessing or using FiveM Stats ("the site"), you agree to be
            bound by these Terms and Conditions. If you do not agree, please do
            not use the site. These terms apply to all visitors and users of the
            website.
          </P>
        </div>

        <div
          style={{ height: 1, background: "var(--line)", marginBottom: 48 }}
        />

        <div className="fade-up d2">
          <Section title="ABOUT THIS SITE">
            <P>
              FiveM Stats is an independent, community-built tool that displays
              publicly available server statistics for the NoPixel FiveM server.
              This site is{" "}
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                not affiliated with, endorsed by, or connected to NoPixel
                Studios Pty Ltd
              </strong>{" "}
              in any way. All trademarks and brand names belong to their
              respective owners.
            </P>
          </Section>

          <Section title="USE OF THE SITE">
            <P>
              You may use this site for lawful, personal, and non-commercial
              purposes only. You agree not to:
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
                "Attempt to scrape, crawl, or automatically harvest data from this site at a rate that places undue load on our infrastructure",
                "Use the site for any unlawful purpose or in violation of any applicable laws or regulations",
                "Attempt to gain unauthorised access to any part of the site or its underlying infrastructure",
                "Misrepresent this site as an official NoPixel product or service",
                "Redistribute or resell data from this site without permission",
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

          <Section title="DATA ACCURACY">
            <P>
              All statistics displayed on this site are sourced from the CFX.re
              public API and are provided on an{" "}
              <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                "as is" basis
              </strong>
              . We make no guarantees regarding the accuracy, completeness, or
              timeliness of the data. Server statistics are polled periodically
              and may not reflect real-time conditions. Do not rely on this data
              for any critical or commercial decision-making.
            </P>
          </Section>

          <Section title="INTELLECTUAL PROPERTY">
            <P>
              The source code, design, and content of FiveM Stats (excluding
              third-party trademarks and API data) are the property of the
              site's creator. You may not copy, reproduce, or redistribute the
              site's design or codebase without express permission. The NoPixel
              name, logo, and associated branding are the property of NoPixel
              Studios Pty Ltd.
            </P>
          </Section>

          <Section title="DISCLAIMER OF WARRANTIES">
            <P>
              This site is provided without warranties of any kind, express or
              implied. We do not warrant that the site will be uninterrupted,
              error-free, or free of harmful components. Your use of the site is
              entirely at your own risk.
            </P>
          </Section>

          <Section title="LIMITATION OF LIABILITY">
            <P>
              To the fullest extent permitted by law, FiveM Stats and its
              creator shall not be liable for any indirect, incidental, special,
              or consequential damages arising from your use of, or inability to
              use, this site or the data it presents.
            </P>
          </Section>

          <Section title="EXTERNAL LINKS">
            <P>
              This site may contain links to third-party websites including
              CFX.re, Vercel, and Neon. We have no control over these sites and
              accept no responsibility for their content, privacy practices, or
              terms of service.
            </P>
          </Section>

          <Section title="CHANGES TO THESE TERMS">
            <P>
              We reserve the right to update these Terms and Conditions at any
              time. Changes take effect immediately upon posting to this page.
              Continued use of the site constitutes your acceptance of any
              revised terms.
            </P>
          </Section>

          <Section title="GOVERNING LAW">
            <P>
              These terms are governed by the laws of India. Any disputes
              arising from use of this site shall be subject to the jurisdiction
              of courts in Mumbai, Maharashtra.
            </P>
          </Section>

          <Section title="CONTACT">
            <P>
              Questions about these terms? Please use the{" "}
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
