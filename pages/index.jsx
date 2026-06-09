import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import HourlyHeatmap from "../components/HourlyHeatmap";
import DailyPeakBar from "../components/DailyPeakBar";
import UptimeTracker from "../components/UptimeTracker";
import PeakSummary from "../components/PeakSummary";

const REFRESH_MS = 30_000;
const toDateInput = (d) => d.toISOString().split("T")[0];

const fmtAge = (s) => {
  if (s == null) return "—";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
};

// FIX #1 + #2: format chart timestamps in the USER'S local timezone,
// with a label style appropriate to the bucket size
function fmtChartLabel(isoString, bucket, userTz) {
  const d = new Date(isoString);
  const opts = { timeZone: userTz };

  if (bucket === "minute" || bucket === "hour") {
    // Short time — just HH:MM in user's timezone
    return d.toLocaleTimeString("en-US", {
      ...opts,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  // Day bucket — "Jun 7"
  return d.toLocaleDateString("en-US", {
    ...opts,
    month: "short",
    day: "numeric",
  });
}

// Tooltip also shows full local time
function fmtTooltipLabel(isoString, userTz) {
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    timeZone: userTz,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0c0c0c",
        border: "1px solid #202020",
        borderRadius: 10,
        padding: "9px 14px",
        fontFamily: "'DM Mono',monospace",
        fontSize: 11,
        fontWeight: 300,
      }}
    >
      <div style={{ color: "#888", marginBottom: 4, fontSize: 10 }}>
        {label}
      </div>
      <div style={{ color: "var(--green)", fontWeight: 400 }}>
        {payload[0].value}{" "}
        <span style={{ color: "#888", fontWeight: 300 }}>players</span>
      </div>
    </div>
  );
}

// FIX #3: AnimatedNumber now accepts color prop and applies it directly
function AnimatedNumber({ value, large, color }) {
  const [key, setKey] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setKey((k) => k + 1);
    }
  }, [value]);
  return (
    <span
      key={key}
      style={{
        display: "inline-block",
        fontFamily: "var(--font-display)",
        fontSize: large ? "clamp(52px,8vw,88px)" : "clamp(32px,4vw,52px)",
        lineHeight: 0.85,
        letterSpacing: "0.02em",
        color: color || "#ffffff",
        animation: "countUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {value}
    </span>
  );
}

const PRESETS = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 168 },
];

export default function Dashboard({ activeServer: propServer = "3lamjz" }) {
  // FIX #1: detect user's timezone once on mount.
  // Dates are initialized on the client too (not during render) to avoid a
  // server/client hydration mismatch (React errors #418/#423/#425).
  const [userTz, setUserTz] = useState("UTC");
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const now = new Date();
    const week = new Date(now);
    week.setDate(now.getDate() - 7);
    setTodayStr(toDateInput(now));
    setFromDate(toDateInput(week));
    setToDate(toDateInput(now));
  }, []);

  const [activeServer, setActiveServer] = useState(propServer);
  const [serverInfo, setServerInfo] = useState(null);
  const [live, setLive] = useState(null);
  const [history, setHistory] = useState({
    rows: [],
    summary: {},
    bucket: "hour",
  });
  const [peakStats, setPeakStats] = useState({
    daily: [],
    hourly: [],
    allTimePeak: 0,
  });
  const [uptime, setUptime] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [filterMode, setFilterMode] = useState("preset");
  const [activePreset, setActivePreset] = useState(24);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeError, setRangeError] = useState("");

  // Refs for stale-closure-safe interval
  const serverRef = useRef(activeServer);
  const filterRef = useRef("preset");
  const presetRef = useRef(24);
  const fromRef = useRef("");
  const toRef = useRef("");
  useEffect(() => {
    serverRef.current = activeServer;
  }, [activeServer]);
  useEffect(() => {
    filterRef.current = filterMode;
  }, [filterMode]);
  useEffect(() => {
    presetRef.current = activePreset;
  }, [activePreset]);
  useEffect(() => {
    fromRef.current = fromDate;
  }, [fromDate]);
  useEffect(() => {
    toRef.current = toDate;
  }, [toDate]);

  // Listen for sidebar server changes
  useEffect(() => {
    const fn = (e) => setActiveServer(e.detail.code);
    window.addEventListener("serverChange", fn);
    return () => window.removeEventListener("serverChange", fn);
  }, []);

  // Reset + re-fetch when server changes
  useEffect(() => {
    setLoading(true);
    setLive(null);
    setHistory({ rows: [], summary: {}, bucket: "hour" });
    refreshAll();
  }, [activeServer]); // eslint-disable-line

  const fetchLive = async () => {
    try {
      const r = await fetch(`/api/live?server=${serverRef.current}`);
      const d = await r.json();
      setLive(d);
    } catch {}
  };

  const fetchHistory = async (opts = {}) => {
    try {
      const url =
        opts.from && opts.to
          ? `/api/history?server=${serverRef.current}&from=${opts.from}&to=${opts.to}`
          : `/api/history?server=${serverRef.current}&hours=${opts.hours || 24}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.error) setHistory(d);
    } catch {}
  };

  const fetchPeakStats = async () => {
    try {
      const r = await fetch(`/api/peakstats?server=${serverRef.current}`);
      const d = await r.json();
      if (!d.error) setPeakStats(d);
    } catch {}
  };

  const fetchUptime = async () => {
    try {
      const r = await fetch(`/api/uptime?server=${serverRef.current}&days=7`);
      const d = await r.json();
      if (!d.error) setUptime(d);
    } catch {}
  };

  const fetchServerList = async () => {
    try {
      const r = await fetch("/api/servers");
      const d = await r.json();
      if (Array.isArray(d)) {
        const sv = d.find((s) => s.code === serverRef.current);
        if (sv) setServerInfo(sv);
      }
    } catch {}
  };

  const refreshAll = useCallback(async () => {
    const histOpts =
      filterRef.current === "range"
        ? { from: fromRef.current, to: toRef.current }
        : { hours: presetRef.current };
    await Promise.all([
      fetchLive(),
      fetchHistory(histOpts),
      fetchPeakStats(),
      fetchUptime(),
      fetchServerList(),
    ]);
    setLastSync(new Date());
    setLoading(false);
    setCountdown(Math.round(REFRESH_MS / 1000));
  }, []);

  useEffect(() => {
    refreshAll();
    const iv = setInterval(refreshAll, REFRESH_MS);
    return () => clearInterval(iv);
  }, [refreshAll]);

  useEffect(() => {
    if (filterMode === "preset") fetchHistory({ hours: activePreset });
  }, [activePreset]); // eslint-disable-line

  useEffect(() => {
    setCountdown(Math.round(REFRESH_MS / 1000));
    const tick = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(tick);
  }, [lastSync]);

  function applyRange() {
    if (!fromDate || !toDate) {
      setRangeError("select both");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setRangeError("start before end");
      return;
    }
    if ((new Date(toDate) - new Date(fromDate)) / 86400000 > 90) {
      setRangeError("max 90 days");
      return;
    }
    setRangeError("");
    setFilterMode("range");
    fetchHistory({ from: fromDate, to: toDate });
  }
  function selectPreset(h) {
    setFilterMode("preset");
    setActivePreset(h);
    setRangeError("");
  }

  const online = live?.online ?? false;
  const count = live?.playerCount ?? 0;
  const maxSlots = live?.maxPlayers ?? 32;
  const fillPct = maxSlots > 0 ? Math.round((count / maxSlots) * 100) : 0;
  const summary = history.summary ?? {};
  const bucket = history.bucket ?? "hour";

  // FIX #1 + #2: format using user's detected timezone + bucket-aware labels
  // Store raw ISO strings alongside formatted labels so tooltip can use them too
  const chartData = (history.rows || []).map((r) => ({
    t: fmtChartLabel(r.t, bucket, userTz),
    tFull: fmtTooltipLabel(r.t, userTz), // was: fmtTooltipLabel(r.t, bucket, userTz)
    count: r.count,
  }));

  // 7d avg from daily peakStats
  const sevenDayAvg = peakStats.daily.length
    ? Math.round(
        peakStats.daily.reduce((a, d) => a + d.avg, 0) / peakStats.daily.length,
      )
    : null;

  const serverName = serverInfo?.name || activeServer;

  const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
  const LABEL = {
    ...MONO,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 10,
  };

  // Timezone display name (short)
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
        <title>FiveM Stats — {serverName}</title>
        <meta
          name="description"
          content={`Live server statistics — ${serverName}`}
        />
        <meta property="og:title" content={`FiveM Stats — ${serverName}`} />
        <meta property="og:image" content={`/api/og?server=${activeServer}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`/api/og?server=${activeServer}`} />
      </Head>

      {/* ── Topbar ── */}
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              {serverName}
            </div>
            <div style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
              {activeServer} · {online ? "online" : "offline"} · {tzShort}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "5px 12px",
              ...MONO,
              fontSize: 11,
              color: online ? "var(--green)" : "var(--muted)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: online ? "var(--green)" : "var(--red)",
                animation: online
                  ? "pulseGreen 2s infinite"
                  : "blink 2.5s infinite",
              }}
            />
            <span>{count} online</span>
          </div>
          <span
            aria-hidden="true"
            style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}
          >
            ↻ {countdown}s
          </span>
          <button
            onClick={refreshAll}
            aria-label="Sync data"
            style={{
              background: "none",
              border: "1px solid var(--line2)",
              borderRadius: 20,
              color: "var(--muted)",
              ...MONO,
              fontSize: 10,
              padding: "5px 14px",
              cursor: "pointer",
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
            sync
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <main id="main-content" className="page-content">
        {/* KPI row */}
        <div className="kpi-grid fade-up d1">
          {/* FIX #3: pass color directly to AnimatedNumber — no more broken <style> injection */}
          <div className="card" style={{ padding: "18px 18px 16px" }}>
            <p style={LABEL}>Players online</p>
            <AnimatedNumber
              value={loading ? "—" : count}
              large
              color="var(--green)"
            />
            <p
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 8,
              }}
            >
              of {maxSlots} · {fillPct}%
            </p>
            <div
              aria-hidden="true"
              style={{
                marginTop: 10,
                height: 2,
                background: "var(--line2)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${fillPct}%`,
                  background:
                    "linear-gradient(90deg,var(--green),rgba(61,220,132,0.5))",
                  borderRadius: 1,
                  transition: "width 1.2s ease",
                }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: "18px 18px 16px" }}>
            <p style={LABEL}>
              {filterMode === "range"
                ? "Range peak"
                : activePreset >= 24
                  ? `${activePreset / 24}d peak`
                  : `${activePreset}h peak`}
            </p>
            <AnimatedNumber
              value={loading ? "—" : (summary.peak ?? "—")}
              color="#ffffff"
            />
            <p
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 8,
              }}
            >
              highest recorded
            </p>
          </div>

          <div className="card" style={{ padding: "18px 18px 16px" }}>
            <p style={LABEL}>7d avg</p>
            <AnimatedNumber
              value={loading ? "—" : (sevenDayAvg ?? "—")}
              color="#ffffff"
            />
            <p
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 8,
              }}
            >
              daily average
            </p>
          </div>

          <div className="card" style={{ padding: "18px 18px 16px" }}>
            <p style={LABEL}>Uptime</p>
            <AnimatedNumber
              value={uptime.uptimePct != null ? `${uptime.uptimePct}%` : "—"}
              color={
                uptime.uptimePct >= 99
                  ? "var(--green)"
                  : uptime.uptimePct >= 95
                    ? "#f5a623"
                    : uptime.uptimePct != null
                      ? "var(--red)"
                      : "#fff"
              }
            />
            <p
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 8,
              }}
            >
              7 days
            </p>
          </div>
        </div>

        {/* Chart */}
        <div
          className="card fade-up d2"
          style={{ marginBottom: 14, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "16px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  color: "#fff",
                }}
              >
                PLAYER COUNT
              </span>
              {/* FIX #1: show timezone in chart header */}
              <span style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
                {tzShort}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                role="group"
                aria-label="Time range"
                style={{ display: "flex", gap: 3 }}
              >
                {PRESETS.map((p) => (
                  <button
                    key={p.hours}
                    onClick={() => selectPreset(p.hours)}
                    aria-pressed={
                      filterMode === "preset" && activePreset === p.hours
                    }
                    className={`btn ${filterMode === "preset" && activePreset === p.hours ? "btn-active" : ""}`}
                    style={{ padding: "4px 10px", fontSize: 10 }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div
                aria-hidden="true"
                style={{ width: 1, height: 14, background: "var(--line2)" }}
              />

              <div
                className="date-row"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <label
                    htmlFor="date-from"
                    style={{
                      ...MONO,
                      fontSize: 8,
                      letterSpacing: "0.12em",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    From
                  </label>
                  <input
                    id="date-from"
                    type="date"
                    value={fromDate}
                    max={toDate}
                    aria-label="Start date"
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setRangeError("");
                    }}
                  />
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    ...MONO,
                    fontSize: 10,
                    color: "var(--muted)",
                    paddingBottom: 8,
                  }}
                >
                  →
                </span>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <label
                    htmlFor="date-to"
                    style={{
                      ...MONO,
                      fontSize: 8,
                      letterSpacing: "0.12em",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    To
                  </label>
                  <input
                    id="date-to"
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={todayStr}
                    aria-label="End date"
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setRangeError("");
                    }}
                  />
                </div>
                <button
                  onClick={applyRange}
                  aria-label="Apply range"
                  className={`btn ${filterMode === "range" ? "btn-green" : ""}`}
                  style={{ padding: "5px 12px", fontSize: 10, marginBottom: 0 }}
                >
                  apply
                </button>
                {rangeError && (
                  <span
                    role="alert"
                    style={{ ...MONO, fontSize: 10, color: "var(--red)" }}
                  >
                    {rangeError}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: 210, padding: "12px 8px 0" }}>
            {chartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p style={{ ...MONO, fontSize: 11, color: "var(--muted)" }}>
                  {loading ? "loading..." : "no data for this range"}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3ddc84"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#3ddc84"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="1 5"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    tick={{
                      fill: "#888",
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "#1a1a1a" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "#888",
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, maxSlots]}
                    width={26}
                  />
                  {/* FIX #2: use tFull for tooltip label (full datetime) */}
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "rgba(61,220,132,0.15)", strokeWidth: 1 }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.tFull || ""
                    }
                  />
                  <ReferenceLine
                    y={maxSlots}
                    stroke="rgba(61,220,132,0.06)"
                    strokeDasharray="4 6"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3ddc84"
                    strokeWidth={1.5}
                    fill="url(#grad)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#3ddc84",
                      stroke: "rgba(61,220,132,0.3)",
                      strokeWidth: 4,
                    }}
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status strip */}
          <div
            className="status-bar"
            style={{
              display: "flex",
              gap: 24,
              padding: "10px 22px 14px",
              borderTop: "1px solid var(--line)",
              marginTop: 8,
              overflowX: "auto",
            }}
          >
            {[
              {
                label: "status",
                value: online ? "online" : "offline",
                color: online ? "var(--green)" : "var(--red)",
              },
              { label: "updated", value: fmtAge(live?.ageSeconds) },
              { label: "points", value: summary.dataPoints ?? "—" },
              { label: "avg", value: summary.avg ?? "—" },
              { label: "capacity", value: `${maxSlots} slots` },
              { label: "timezone", value: tzShort },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flexShrink: 0 }}>
                <div
                  style={{
                    ...MONO,
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    ...MONO,
                    fontSize: 11,
                    color: color || "var(--text)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak insights */}
        <PeakSummary peakStats={peakStats} summary={summary} />

        {/* Bottom grid */}
        <div className="bottom-grid" style={{ marginBottom: 14 }}>
          <HourlyHeatmap hourly={peakStats.hourly} />
          <DailyPeakBar daily={peakStats.daily} maxSlots={maxSlots} />
        </div>

        {/* Uptime */}
        <UptimeTracker uptime={uptime} />

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.08em",
            }}
          >
            data via cfx.re public api · polls every 30s · times shown in{" "}
            {userTz} · independent tracker, not affiliated with the servers
            listed
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                style={{
                  ...MONO,
                  fontSize: 9,
                  color: "var(--muted)",
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
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
