import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function AddServer() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    color: "#3ddc84",
    adminKey: "",
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function checkServer() {
    if (!form.code.trim()) {
      setError("enter a server code");
      return;
    }
    setChecking(true);
    setError("");
    setPreview(null);
    try {
      const r = await fetch(
        `https://frontend.cfx-services.net/api/servers/single/${form.code.trim()}`,
      );
      if (!r.ok) throw new Error("Server not found");
      const data = await r.json();
      const sv = data.Data || data;
      setPreview({
        hostname: sv.hostname || form.code,
        players: (sv.players || []).length,
        max: sv.svMaxclients || 32,
      });
      if (!form.name) set("name", sv.hostname || form.code);
    } catch {
      setError("Could not find server — check the CFX code");
    }
    setChecking(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code || !form.name) {
      setError("code and name required");
      return;
    }
    if (!form.adminKey) {
      setError("admin key required to add a server");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      const r = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": form.adminKey,
        },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          color: form.color,
          tags: [],
        }),
      });
      if (r.status === 401) {
        setError("Wrong admin key — check your CRON_SECRET value");
        setStatus(null);
        return;
      }
      const d = await r.json();
      if (d.ok) {
        setStatus("done");
        setTimeout(() => router.push("/"), 1200);
      } else {
        setError(d.error || "Failed to add server");
        setStatus(null);
      }
    } catch {
      setError("Network error");
      setStatus(null);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "var(--bg3)",
    border: "1px solid var(--line2)",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 300,
    color: "var(--text)",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    ...MONO,
    fontSize: 9,
    letterSpacing: "0.14em",
    color: "var(--muted)",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  };

  return (
    <>
      <Head>
        <title>Add Server — FiveM Stats</title>
      </Head>

      <header className="topbar">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            letterSpacing: "0.08em",
            color: "#fff",
          }}
        >
          ADD SERVER
        </span>
      </header>

      <main
        id="main-content"
        className="page-content"
        style={{ maxWidth: 560 }}
      >
        <div className="card fade-up d1" style={{ padding: "28px 28px 32px" }}>
          <p
            style={{
              ...MONO,
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            Enter the CFX server code (the part after cfx.re/join/) to add a new
            server to your tracker. The server must be publicly listed on the
            FiveM server browser.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            {/* Code + check */}
            <div>
              <label htmlFor="sv-code" style={labelStyle}>
                CFX Server Code
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="sv-code"
                  type="text"
                  placeholder="e.g. 3lamjz"
                  value={form.code}
                  onChange={(e) => {
                    set("code", e.target.value);
                    setPreview(null);
                    setError("");
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--line2)")}
                />
                <button
                  type="button"
                  onClick={checkServer}
                  disabled={checking}
                  className="btn"
                  style={{ padding: "8px 16px", flexShrink: 0 }}
                >
                  {checking ? "..." : "check"}
                </button>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div
                style={{
                  background: "rgba(61,220,132,0.05)",
                  border: "1px solid rgba(61,220,132,0.2)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    ...MONO,
                    fontSize: 10,
                    color: "var(--green)",
                    marginBottom: 4,
                  }}
                >
                  ✓ server found
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: 2,
                  }}
                >
                  {preview.hostname}
                </div>
                <div style={{ ...MONO, fontSize: 11, color: "var(--muted)" }}>
                  {preview.players}/{preview.max} players
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="sv-name" style={labelStyle}>
                Display Name
              </label>
              <input
                id="sv-name"
                type="text"
                placeholder="e.g. NoPixel Whitelisted"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line2)")}
              />
            </div>

            {/* Color */}
            <div>
              <label htmlFor="sv-color" style={labelStyle}>
                Accent Color
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="sv-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  style={{
                    width: 40,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--line2)",
                    background: "var(--bg3)",
                    cursor: "pointer",
                    padding: 2,
                  }}
                />
                <span style={{ ...MONO, fontSize: 12, color: "var(--muted)" }}>
                  {form.color}
                </span>
              </div>
            </div>

            {/* Admin key */}
            <div>
              <label htmlFor="sv-key" style={labelStyle}>
                Admin Key
              </label>
              <input
                id="sv-key"
                type="password"
                placeholder="your CRON_SECRET value"
                value={form.adminKey}
                onChange={(e) => set("adminKey", e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--line2)")}
              />
              <p
                style={{
                  ...MONO,
                  fontSize: 9,
                  color: "var(--muted)",
                  marginTop: 6,
                  lineHeight: 1.6,
                }}
              >
                Adding a server is an admin action. Enter the same value you set
                for CRON_SECRET in Vercel.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                style={{ ...MONO, fontSize: 11, color: "var(--red)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "saving" || status === "done"}
              style={{
                background:
                  status === "done" ? "rgba(61,220,132,0.2)" : "var(--green)",
                border: "none",
                borderRadius: 10,
                color: status === "done" ? "var(--green)" : "#060606",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 500,
                padding: "12px 28px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {status === "saving"
                ? "adding..."
                : status === "done"
                  ? "✓ added!"
                  : "add server"}
            </button>
          </form>
        </div>

        <p
          style={{
            ...MONO,
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 16,
            lineHeight: 1.7,
          }}
        >
          Note: the poll API automatically polls all active servers on every
          cron tick, so no extra cron job is needed for new servers.
        </p>
      </main>
    </>
  );
}
