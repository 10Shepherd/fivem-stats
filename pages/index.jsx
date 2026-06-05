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
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const SERVER_CODE = "3lamjz";
const REFRESH_MS = 30_000;

const toDateInput = (d) => d.toISOString().split("T")[0];

const fmtAge = (s) => {
  if (s == null) return "—";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0c0c0c",
        border: "1px solid #202020",
        borderRadius: 10,
        padding: "9px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        fontWeight: 300,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ color: "#444", marginBottom: 4, fontSize: 10 }}>
        {label}
      </div>
      <div style={{ color: "#3ddc84", fontWeight: 400 }}>
        {payload[0].value}{" "}
        <span style={{ color: "#444", fontWeight: 300 }}>players</span>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, large }) {
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
        fontSize: large ? "clamp(60px, 10vw, 100px)" : "clamp(38px, 5vw, 62px)",
        lineHeight: 0.85,
        letterSpacing: "0.02em",
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

export default function Dashboard() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const [live, setLive] = useState(null);
  const [history, setHistory] = useState({ rows: [], summary: {} });
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
  const [fromDate, setFromDate] = useState(toDateInput(weekAgo));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [rangeError, setRangeError] = useState("");

  // Refs for stale-closure-safe interval
  const filterModeRef = useRef("preset");
  const activePresetRef = useRef(24);
  const fromDateRef = useRef(toDateInput(weekAgo));
  const toDateRef = useRef(toDateInput(today));
  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);
  useEffect(() => {
    activePresetRef.current = activePreset;
  }, [activePreset]);
  useEffect(() => {
    fromDateRef.current = fromDate;
  }, [fromDate]);
  useEffect(() => {
    toDateRef.current = toDate;
  }, [toDate]);

  const fetchLive = async () => {
    try {
      const r = await fetch("/api/live");
      const d = await r.json();
      setLive(d);
    } catch {}
  };
  const fetchHistory = async (opts = {}) => {
    try {
      const url =
        opts.from && opts.to
          ? `/api/history?from=${opts.from}&to=${opts.to}`
          : `/api/history?hours=${opts.hours || 24}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.error) setHistory(d);
    } catch {}
  };
  const fetchPeakStats = async () => {
    try {
      const r = await fetch("/api/peakstats");
      const d = await r.json();
      if (!d.error) setPeakStats(d);
    } catch {}
  };
  const fetchUptime = async () => {
    try {
      const r = await fetch("/api/uptime?days=7");
      const d = await r.json();
      if (!d.error) setUptime(d);
    } catch {}
  };

  const refreshAll = useCallback(async () => {
    const histOpts =
      filterModeRef.current === "range"
        ? { from: fromDateRef.current, to: toDateRef.current }
        : { hours: activePresetRef.current };
    await Promise.all([
      fetchLive(),
      fetchHistory(histOpts),
      fetchPeakStats(),
      fetchUptime(),
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

  function applyDateRange() {
    if (!fromDate || !toDate) {
      setRangeError("select both dates");
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

  const chartData = (history.rows || []).map((r) => ({
    t: new Date(r.t).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    count: r.count,
  }));

  const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

  return (
    <>
      <Head>
        <title>NoPixel Whitelisted — Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Live server statistics for NoPixel Whitelisted FiveM server — player count, uptime, peak hours and more."
        />
        {/* OG / Social preview */}
        <meta property="og:title" content="NoPixel Whitelisted — Live Stats" />
        <meta
          property="og:description"
          content={`${count} players online right now · ${fillPct}% capacity`}
        />
        <meta property="og:image" content="/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NoPixel Whitelisted — Live Stats" />
        <meta
          name="twitter:description"
          content={`${count} players online right now`}
        />
        <meta name="twitter:image" content="/api/og" />
      </Head>

      <Nav
        online={online}
        countdown={lastSync ? countdown : null}
        onSync={refreshAll}
      />

      <main
        className="main-wrap"
        style={{ padding: "20px 28px 56px", maxWidth: 1300, margin: "0 auto" }}
      >
        {/* ── Hero: 3 stat boxes ── */}
        <div className="hero-grid fade-up d1">
          {/* BIG: live count */}
          <div
            className="hero-main hero-cell"
            style={{
              background: "var(--bg2)",
              padding: "32px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(61,220,132,0.07) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div className="stat-label">players online</div>
            <AnimatedNumber
              value={loading ? "—" : count}
              large
              style={{ color: "var(--green)" }}
            />
            <div
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 14,
                letterSpacing: "0.05em",
              }}
            >
              of {maxSlots} slots · {fillPct}% capacity
            </div>
            {/* Capacity bar */}
            <div
              aria-hidden="true"
              style={{
                marginTop: 12,
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
                  background: `linear-gradient(90deg, var(--green), rgba(61,220,132,0.6))`,
                  borderRadius: 1,
                  transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
          </div>

          {/* Period peak */}
          <div
            className="hero-cell"
            style={{
              background: "var(--bg2)",
              padding: "28px 24px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div className="stat-label">
              {filterMode === "range"
                ? "range peak"
                : activePreset >= 24
                  ? `${activePreset / 24}d peak`
                  : `${activePreset}h peak`}
            </div>
            <AnimatedNumber value={loading ? "—" : (summary.peak ?? "—")} />
            <div
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 12,
                letterSpacing: "0.05em",
              }}
            >
              highest recorded
            </div>
            {/* Mini sparkline indicator */}
            {summary.avg != null && summary.peak != null && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    ...MONO,
                    fontSize: 8,
                    color: "var(--muted2)",
                    letterSpacing: "0.1em",
                    marginBottom: 4,
                  }}
                >
                  avg / peak
                </div>
                <div
                  style={{
                    height: 2,
                    background: "var(--line2)",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round((summary.avg / summary.peak) * 100)}%`,
                      background: "var(--line3)",
                      borderRadius: 1,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* All-time peak */}
          <div
            className="hero-cell"
            style={{
              background: "var(--bg2)",
              padding: "28px 24px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div className="stat-label">all-time peak</div>
            <AnimatedNumber
              value={loading ? "—" : peakStats.allTimePeak || "—"}
            />
            <div
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 12,
                letterSpacing: "0.05em",
              }}
            >
              {peakStats.trackingSince
                ? `since ${new Date(peakStats.trackingSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}`
                : "since tracking began"}
            </div>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="card fade-up d3" style={{ marginBottom: 12 }}>
          {/* Header row */}
          <div
            className="filter-row"
            style={{
              padding: "18px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                letterSpacing: "0.1em",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              PLAYER COUNT
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {/* Preset tabs */}
              <div style={{ display: "flex", gap: 3 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.hours}
                    onClick={() => selectPreset(p.hours)}
                    className={`btn ${filterMode === "preset" && activePreset === p.hours ? "btn-active" : ""}`}
                    style={{ padding: "4px 10px", fontSize: 10 }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div
                style={{
                  width: 1,
                  height: 14,
                  background: "var(--line2)",
                  flexShrink: 0,
                }}
              />

              {/* Date range */}
              <div
                className="date-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setRangeError("");
                  }}
                />
                <span style={{ ...MONO, fontSize: 10, color: "var(--muted2)" }}>
                  →
                </span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={toDateInput(new Date())}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setRangeError("");
                  }}
                />
                <button
                  onClick={applyDateRange}
                  className={`btn ${filterMode === "range" ? "btn-green" : ""}`}
                  style={{ padding: "5px 12px", fontSize: 10 }}
                >
                  apply
                </button>
                {rangeError && (
                  <span
                    style={{
                      ...MONO,
                      fontSize: 10,
                      color: "var(--red)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {rangeError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chart canvas */}
          <div style={{ height: 210, padding: "14px 8px 0" }}>
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
                <div
                  style={{
                    ...MONO,
                    fontSize: 11,
                    color: "var(--muted)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {loading ? "loading..." : "no data for this range"}
                </div>
                {!loading && (
                  <div
                    style={{
                      ...MONO,
                      fontSize: 9,
                      color: "var(--muted2)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    data accumulates over time via cron
                  </div>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3ddc84" stopOpacity={0.2} />
                      <stop
                        offset="100%"
                        stopColor="#3ddc84"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="1 5"
                    stroke="#141414"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    tick={{
                      fill: "var(--muted2)",
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "#161616" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "var(--muted2)",
                      fontSize: 9,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, maxSlots]}
                    width={26}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: "rgba(61,220,132,0.15)", strokeWidth: 1 }}
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
                    animationEasing="ease-out"
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
              padding: "12px 22px 14px",
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
              {
                label: "avg",
                value: summary.avg != null ? `${summary.avg}` : "—",
              },
              { label: "capacity", value: `${maxSlots} slots` },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flexShrink: 0 }}>
                <div
                  style={{
                    ...MONO,
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    color: "var(--muted2)",
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
                    color: color || "var(--muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Peak insights ── */}
        <PeakSummary peakStats={peakStats} summary={summary} />

        {/* ── Bottom: heatmap + daily bars + uptime ── */}
        <div className="bottom-grid" style={{ marginBottom: 12 }}>
          <HourlyHeatmap hourly={peakStats.hourly} />
          <DailyPeakBar daily={peakStats.daily} maxSlots={maxSlots} />
        </div>

        {/* ── Uptime tracker — full width ── */}
        <UptimeTracker uptime={uptime} />

        <Footer />
      </main>
    </>
  );
}
