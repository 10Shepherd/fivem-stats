import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import HourlyHeatmap from "../components/HourlyHeatmap";
import ErrorBoundary from "../components/ErrorBoundary";

const REFRESH_MS = 60_000;
const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function HeatmapPage({ activeServer: propServer = "" }) {
  const [activeServer, setActiveServer] = useState(propServer);
  const [hourlyByDay, setHourlyByDay] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [userTz, setUserTz] = useState("UTC");
  const serverRef = useRef(activeServer);

  useEffect(() => {
    setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    serverRef.current = activeServer;
  }, [activeServer]);

  useEffect(() => {
    const fn = (e) => setActiveServer(e.detail.code);
    window.addEventListener("serverChange", fn);
    return () => window.removeEventListener("serverChange", fn);
  }, []);

  const refresh = useCallback(async () => {
    if (!serverRef.current) return;
    setTimedOut(false);
    const timeout = setTimeout(() => setTimedOut(true), 12000);
    try {
      const [p, list] = await Promise.all([
        fetch(`/api/peakstats?server=${serverRef.current}`).then((r) =>
          r.json(),
        ),
        fetch("/api/servers").then((r) => r.json()),
      ]);
      clearTimeout(timeout);
      if (!p.error) setHourlyByDay(p.hourlyByDay || []);
      if (Array.isArray(list)) {
        const sv = list.find((s) => s.code === serverRef.current);
        if (sv) setServerInfo(sv);
      }
    } catch {
      clearTimeout(timeout);
      setTimedOut(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    setHourlyByDay([]);
    refresh();
  }, [activeServer, refresh]);

  useEffect(() => {
    const iv = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(iv);
  }, [refresh]);

  const serverName = serverInfo?.name || activeServer;
  const tzShort = (() => {
    try {
      return new Date()
        .toLocaleTimeString("en-US", {
          timeZone: userTz,
          timeZoneName: "short",
        })
        .split(" ")
        .pop();
    } catch {
      return "UTC";
    }
  })();

  return (
    <>
      <Head>
        <title>Heatmap — {serverName} — FiveM Stats</title>
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
            ACTIVITY HEATMAP
          </div>
          <div style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
            {activeServer} · weekly pattern · {tzShort}
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
        ) : timedOut ? (
          <div
            className="card"
            style={{ padding: "48px 24px", textAlign: "center" }}
          >
            <div
              style={{
                ...MONO,
                fontSize: 13,
                color: "var(--red)",
                marginBottom: 12,
              }}
            >
              data unavailable
            </div>
            <p
              style={{
                ...MONO,
                fontSize: 11,
                color: "var(--muted)",
                marginBottom: 20,
              }}
            >
              could not load heatmap data — try refreshing
            </p>
            <button className="btn" onClick={refresh}>
              retry
            </button>
          </div>
        ) : (
          <ErrorBoundary>
            <HourlyHeatmap hourlyByDay={hourlyByDay} userTz={userTz} />
          </ErrorBoundary>
        )}
      </main>
    </>
  );
}
