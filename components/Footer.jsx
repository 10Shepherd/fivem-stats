import Link from "next/link";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function Footer() {
  return (
    <footer
      aria-label="Site footer"
      style={{
        borderTop: "1px solid var(--line)",
        padding: "24px 28px 32px",
        marginTop: 32,
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              letterSpacing: "0.14em",
              color: "var(--muted)",
            }}
          >
            FIVEM STATS
          </span>
          <span
            aria-hidden="true"
            style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}
          >
            ·
          </span>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.08em",
            }}
          >
            not affiliated with nopixel studios · independent tracker
          </span>
        </div>

        <nav
          aria-label="Legal and contact links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms" },
            { href: "/contact", label: "Contact" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.08em",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
