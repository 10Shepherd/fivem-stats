import Head from "next/head";
import Link from "next/link";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 — FiveM Stats</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(80px, 15vw, 160px)",
            letterSpacing: "0.08em",
            color: "var(--green)",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          404
        </div>
        <p
          style={{
            ...MONO,
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: 32,
            letterSpacing: "0.08em",
          }}
        >
          this page could not be found
        </p>
        <Link
          href="/"
          style={{
            background: "var(--green)",
            border: "none",
            borderRadius: 10,
            color: "#060606",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 500,
            padding: "12px 28px",
            textDecoration: "none",
            transition: "transform 0.15s",
          }}
        >
          back to dashboard
        </Link>
      </div>
    </>
  );
}
