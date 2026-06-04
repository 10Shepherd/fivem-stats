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

const SERVER_CODE = "3lamjz";
const REFRESH_MS = 30_000;

function toDateInput(d) {
  return d.toISOString().split("T")[0];
}
function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function fmtAge(s) {
  if (s == null) return "—";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 8,
        padding: "8px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        fontWeight: 300,
      }}
    >
      <div style={{ color: "#333", marginBottom: 4, letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div style={{ color: "#3ddc84", letterSpacing: "0.04em" }}>
        {payload[0].value} players
      </div>
    </div>
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
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  // Chart filter state
  const [filterMode, setFilterMode] = useState("preset"); // 'preset' | 'range'
  const [activePreset, setActivePreset] = useState(24);
  const [fromDate, setFromDate] = useState(toDateInput(weekAgo));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [rangeError, setRangeError] = useState("");
  const [countdown, setCountdown] = useState(30);

  const timerRef = useRef(null);

  const fetchLive = useCallback(async () => {
    try {
      const r = await fetch("/api/live");
      const d = await r.json();
      setLive(d);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async (opts = {}) => {
    try {
      let url;
      if (opts.from && opts.to) {
        url = `/api/history?from=${opts.from}&to=${opts.to}`;
      } else {
        url = `/api/history?hours=${opts.hours || 24}`;
      }
      const r = await fetch(url);
      const d = await r.json();
      if (!d.error) setHistory(d);
    } catch {}
  }, []);

  const fetchPeakStats = useCallback(async () => {
    try {
      const r = await fetch("/api/peakstats");
      const d = await r.json();
      if (!d.error) setPeakStats(d);
    } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    const histOpts =
      filterMode === "range"
        ? { from: fromDate, to: toDate }
        : { hours: activePreset };
    await Promise.all([fetchLive(), fetchHistory(histOpts), fetchPeakStats()]);
    setLastSync(new Date());
    setLoading(false);
  }, [
    fetchLive,
    fetchHistory,
    fetchPeakStats,
    filterMode,
    fromDate,
    toDate,
    activePreset,
  ]);

  useEffect(() => {
    refreshAll();
    timerRef.current = setInterval(refreshAll, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  // Re-fetch chart when filter changes
  useEffect(() => {
    if (filterMode === "preset") {
      fetchHistory({ hours: activePreset });
    }
  }, [activePreset, filterMode]); // eslint-disable-line

  useEffect(() => {
    setCountdown(30);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 30;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [lastSync]);

  function applyDateRange() {
    if (!fromDate || !toDate) {
      setRangeError("select both dates");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setRangeError("start must be before end");
      return;
    }
    const diffDays =
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      setRangeError("max range is 90 days");
      return;
    }
    setRangeError("");
    setFilterMode("range");
    fetchHistory({ from: fromDate, to: toDate });
  }

  function selectPreset(hours) {
    setFilterMode("preset");
    setActivePreset(hours);
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

  // Capacity bar width
  const capPct = `${fillPct}%`;

  const cardStyle = {
    background: "var(--bg2)",
    border: "1px solid var(--line)",
    borderRadius: 12,
  };

  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fontWeight: 300,
    letterSpacing: "0.18em",
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 14,
  };

  return (
    <>
      <Head>
        <title>NoPixel Whitelisted — Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Live server statistics for NoPixel Whitelisted"
        />
      </Head>

      {/* ── Nav ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid var(--line)",
          background: "rgba(8,8,8,0.95)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              letterSpacing: "0.12em",
              color: "#fff",
            }}
          >
            NOPIXEL
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 300,
              color: "var(--muted)",
              letterSpacing: "0.15em",
              border: "1px solid var(--line2)",
              borderRadius: 100,
              padding: "3px 10px",
            }}
          >
            stats
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: online ? "var(--green)" : "#dc3d3d",
                animation: "blink 2.5s infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 300,
                color: "var(--muted)",
                letterSpacing: "0.08em",
              }}
            >
              {online ? "online" : "offline"} · {SERVER_CODE}
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 300,
              color: "#222",
              letterSpacing: "0.06em",
            }}
          >
            {lastSync ? `next sync ${countdown}s` : "connecting..."}
          </span>
          <button
            onClick={refreshAll}
            style={{
              background: "none",
              border: "1px solid var(--line2)",
              borderRadius: 100,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: "0.1em",
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--green)";
              e.target.style.color = "var(--green)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--line2)";
              e.target.style.color = "var(--muted)";
            }}
          >
            ↻ sync
          </button>
        </div>
      </nav>

      <main
        style={{ padding: "28px 32px 56px", maxWidth: 1280, margin: "0 auto" }}
      >
        {/* ── Hero stats row ── */}
        <div
          className="fade-up d1"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 1,
            background: "var(--line)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {/* Live count */}
          <div
            style={{
              background: "var(--bg2)",
              padding: "36px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={labelStyle}>players online</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 96,
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "var(--green)",
              }}
            >
              {loading ? "—" : count}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 300,
                color: "var(--muted)",
                marginTop: 14,
                letterSpacing: "0.05em",
              }}
            >
              of {maxSlots} slots · {fillPct}% capacity
            </div>
            <div
              style={{
                marginTop: 14,
                height: 2,
                background: "var(--line2)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: capPct,
                  background: "var(--green)",
                  borderRadius: 1,
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>

          {/* 24h peak */}
          <div
            style={{
              background: "var(--bg2)",
              padding: "32px 28px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div style={labelStyle}>
              {filterMode === "range"
                ? "range peak"
                : `${activePreset >= 24 ? `${activePreset / 24}d` : `${activePreset}h`} peak`}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 60,
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "#fff",
              }}
            >
              {loading ? "—" : (summary.peak ?? "—")}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 300,
                color: "var(--muted)",
                marginTop: 14,
                letterSpacing: "0.05em",
              }}
            >
              highest recorded
            </div>
          </div>

          {/* All-time peak */}
          <div
            style={{
              background: "var(--bg2)",
              padding: "32px 28px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div style={labelStyle}>all-time peak</div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 60,
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "#fff",
              }}
            >
              {loading ? "—" : peakStats.allTimePeak || "—"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 300,
                color: "var(--muted)",
                marginTop: 14,
                letterSpacing: "0.05em",
              }}
            >
              {peakStats.trackingSince
                ? `since ${new Date(peakStats.trackingSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "since tracking began"}
            </div>
          </div>
        </div>

        {/* ── Chart ── */}
        <div
          className="fade-up d3"
          style={{ ...cardStyle, marginBottom: 16, overflow: "hidden" }}
        >
          {/* Chart header */}
          <div
            style={{
              padding: "18px 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                letterSpacing: "0.1em",
                color: "#fff",
              }}
            >
              PLAYER COUNT
            </span>

            {/* Filter controls */}
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
                    style={{
                      background:
                        filterMode === "preset" && activePreset === p.hours
                          ? "#fff"
                          : "none",
                      border: `1px solid ${filterMode === "preset" && activePreset === p.hours ? "#fff" : "var(--line2)"}`,
                      color:
                        filterMode === "preset" && activePreset === p.hours
                          ? "#080808"
                          : "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 300,
                      letterSpacing: "0.08em",
                      padding: "4px 12px",
                      borderRadius: 100,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div
                style={{ width: 1, height: 16, background: "var(--line2)" }}
              />

              {/* Date pickers */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setRangeError("");
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 300,
                  }}
                >
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
                  style={{
                    background:
                      filterMode === "range" ? "var(--green)" : "none",
                    border: `1px solid ${filterMode === "range" ? "var(--green)" : "var(--line2)"}`,
                    color: filterMode === "range" ? "#080808" : "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: filterMode === "range" ? 400 : 300,
                    letterSpacing: "0.08em",
                    padding: "5px 14px",
                    borderRadius: 100,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (filterMode !== "range") {
                      e.target.style.borderColor = "var(--green)";
                      e.target.style.color = "var(--green)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterMode !== "range") {
                      e.target.style.borderColor = "var(--line2)";
                      e.target.style.color = "var(--muted)";
                    }
                  }}
                >
                  apply
                </button>
              </div>

              {rangeError && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 300,
                    color: "#dc3d3d",
                    letterSpacing: "0.04em",
                  }}
                >
                  {rangeError}
                </span>
              )}
            </div>
          </div>

          {/* Chart */}
          <div style={{ height: 200, padding: "16px 8px 0" }}>
            {chartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 300,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                }}
              >
                {loading ? "loading..." : "no data for this range"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#3ddc84"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3ddc84"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="1 6"
                    stroke="#161616"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    tick={{
                      fill: "#2a2a2a",
                      fontSize: 9,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "#161616" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "#2a2a2a",
                      fontSize: 9,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 300,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, maxSlots]}
                    width={24}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine
                    y={maxSlots}
                    stroke="rgba(61,220,132,0.1)"
                    strokeDasharray="3 6"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3ddc84"
                    strokeWidth={1.5}
                    fill="url(#greenGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#3ddc84", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status bar */}
          <div
            style={{
              display: "flex",
              gap: 32,
              padding: "12px 28px 16px",
              borderTop: "1px solid var(--line)",
              marginTop: 8,
            }}
          >
            {[
              {
                label: "status",
                value: online ? "online" : "offline",
                color: online ? "var(--green)" : "#dc3d3d",
              },
              { label: "last update", value: fmtAge(live?.ageSeconds) },
              { label: "data points", value: summary.dataPoints ?? "—" },
              { label: "avg", value: summary.avg ?? "—" },
              { label: "max slots", value: maxSlots },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    fontWeight: 300,
                    letterSpacing: "0.16em",
                    color: "#222",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 300,
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

        {/* ── Bottom row ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div className="fade-up d5">
            <HourlyHeatmap hourly={peakStats.hourly} />
          </div>
          <div className="fade-up d6">
            <DailyPeakBar daily={peakStats.daily} maxSlots={maxSlots} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 300,
              color: "#1e1e1e",
              letterSpacing: "0.1em",
            }}
          >
            data via cfx.re public api · polls every 60s
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 300,
              color: "#1e1e1e",
              letterSpacing: "0.1em",
            }}
          >
            nopixel whitelisted · {SERVER_CODE}
          </span>
        </div>
      </main>
    </>
  );
}
