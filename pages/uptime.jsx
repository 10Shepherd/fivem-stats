import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import UptimeTracker from "../components/UptimeTracker";

const REFRESH_MS = 30_000;
const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function UptimePage({ activeServer: propServer = "3lamjz" }) {
  const [activeServer, setActiveServer] = useState(propServer);
  const [uptime, setUptime] = useState({});
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const serverRef = useRef(activeServer);

  useEffect(() => {
    serverRef.current = activeServer;
  }, [activeServer]);

  useEffect(() => {
    const fn = (e) => setActiveServer(e.detail.code);
    window.addEventListener("serverChange", fn);
    return () => window.removeEventListener("serverChange", fn);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [u, list] = await Promise.all([
        fetch(`/api/uptime?server=${serverRef.current}&days=7`).then((r) =>
          r.json(),
        ),
        fetch("/api/servers").then((r) => r.json()),
      ]);
      if (!u.error) setUptime(u);
      if (Array.isArray(list)) {
        const sv = list.find((s) => s.code === serverRef.current);
        if (sv) setServerInfo(sv);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [activeServer, refresh]);

  useEffect(() => {
    const iv = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(iv);
  }, [refresh]);

  const serverName = serverInfo?.name || activeServer;

  return (
    <>
      <Head>
        <title>Uptime — {serverName} — FiveM Stats</title>
      </Head>

      <header className="topbar">
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              letterSpacing: "0.08em",
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            UPTIME
          </div>
          <div style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
            {activeServer} · 7-day availability
          </div>
        </div>
      </header>

      <main id="main-content" className="page-content">
        {loading ? (
          <div
            className="card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              ...MONO,
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            loading...
          </div>
        ) : (
          <UptimeTracker uptime={uptime} />
        )}
      </main>
    </>
  );
}
