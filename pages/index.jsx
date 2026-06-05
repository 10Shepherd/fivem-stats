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
        background: "#0d0d0d",
        border: "1px solid #1e1e1e",
        borderRadius: 8,
        padding: "8px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        fontWeight: 300,
      }}
    >
      <div style={{ color: "#444", marginBottom: 4, letterSpacing: "0.04em" }}>
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

// Animated number component
function AnimatedNumber({ value, style }) {
  const [display, setDisplay] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setAnimKey((k) => k + 1);
      setDisplay(value);
    }
  }, [value]);

  return (
    <span
      key={animKey}
      style={{
        ...style,
        display: "inline-block",
        animation: "countUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {display}
    </span>
  );
}

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
  const [countdown, setCountdown] = useState(30);

  // FIX: use refs for filter state so interval closure always sees latest values
  const [filterMode, setFilterMode] = useState("preset");
  const [activePreset, setActivePreset] = useState(24);
  const [fromDate, setFromDate] = useState(toDateInput(weekAgo));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [rangeError, setRangeError] = useState("");

  const filterModeRef = useRef("preset");
  const activePresetRef = useRef(24);
  const fromDateRef = useRef(toDateInput(weekAgo));
  const toDateRef = useRef(toDateInput(today));

  // Keep refs in sync
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

  // FIX: reads from refs, safe to call from interval
  const refreshAll = useCallback(async () => {
    const histOpts =
      filterModeRef.current === "range"
        ? { from: fromDateRef.current, to: toDateRef.current }
        : { hours: activePresetRef.current };
    await Promise.all([fetchLive(), fetchHistory(histOpts), fetchPeakStats()]);
    setLastSync(new Date());
    setLoading(false);
    // FIX: reset countdown after each actual refresh
    setCountdown(30);
  }, []); // stable — no deps needed since we use refs

  // Mount: initial fetch + set up interval
  useEffect(() => {
    refreshAll();
    const iv = setInterval(refreshAll, REFRESH_MS);
    return () => clearInterval(iv);
  }, [refreshAll]);

  // Re-fetch chart when preset changes
  useEffect(() => {
    if (filterMode === "preset") fetchHistory({ hours: activePreset });
  }, [activePreset]); // eslint-disable-line

  // FIX: countdown tied to REFRESH_MS, resets when lastSync changes
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
      setRangeError("start must be before end");
      return;
    }
    const diffDays = (new Date(toDate) - new Date(fromDate)) / 86400000;
    if (diffDays > 90) {
      setRangeError("max 90 days");
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

  const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
  const LABEL = {
    ...MONO,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: 14,
  };

  const TabBtn = ({ preset }) => {
    const active = filterMode === "preset" && activePreset === preset.hours;
    return (
      <button
        onClick={() => selectPreset(preset.hours)}
        style={{
          background: active ? "#fff" : "none",
          border: `1px solid ${active ? "#fff" : "var(--line2)"}`,
          color: active ? "#080808" : "var(--muted)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 300,
          letterSpacing: "0.08em",
          padding: "4px 10px",
          borderRadius: 100,
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {preset.label}
      </button>
    );
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
        className="nav-pad"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--line)",
          background: "rgba(8,8,8,0.96)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="slide-in d1"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
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
              ...MONO,
              fontSize: 9,
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

        <div
          className="nav-right fade-in d2"
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
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
            <span
              style={{
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ display: "none" }} className="mobile-hide">
                {online ? "online" : "offline"} ·{" "}
              </span>
              {SERVER_CODE}
            </span>
          </div>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: "var(--muted2)",
              letterSpacing: "0.06em",
            }}
          >
            {lastSync ? `↻ ${countdown}s` : "..."}
          </span>
          <button
            onClick={refreshAll}
            style={{
              background: "none",
              border: "1px solid var(--line2)",
              borderRadius: 100,
              color: "var(--muted)",
              ...MONO,
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "6px 14px",
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
      </nav>

      <main className="main-pad" style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* ── Hero stats ── */}
        <div className="hero-grid fade-up d1" style={{ marginBottom: 16 }}>
          {/* Live count */}
          <div
            className="hero-main-cell"
            style={{
              background: "var(--bg2)",
              padding: "32px 28px",
              position: "relative",
            }}
          >
            <div style={LABEL}>players online</div>
            <AnimatedNumber
              value={loading ? "—" : count}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(56px, 10vw, 96px)",
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "var(--green)",
              }}
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
                  width: `${fillPct}%`,
                  background: "var(--green)",
                  borderRadius: 1,
                  transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
                  transformOrigin: "left",
                }}
              />
            </div>
          </div>

          {/* Period peak */}
          <div
            style={{
              background: "var(--bg2)",
              padding: "28px 24px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div style={LABEL}>
              {filterMode === "range"
                ? "range peak"
                : activePreset >= 24
                  ? `${activePreset / 24}d peak`
                  : `${activePreset}h peak`}
            </div>
            <AnimatedNumber
              value={loading ? "—" : (summary.peak ?? "—")}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 6vw, 60px)",
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "#fff",
              }}
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
              highest recorded
            </div>
          </div>

          {/* All-time peak */}
          <div
            style={{
              background: "var(--bg2)",
              padding: "28px 24px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            <div style={LABEL}>all-time peak</div>
            <AnimatedNumber
              value={loading ? "—" : peakStats.allTimePeak || "—"}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 6vw, 60px)",
                lineHeight: 0.85,
                letterSpacing: "0.02em",
                color: "#fff",
              }}
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
                ? `since ${new Date(peakStats.trackingSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "since tracking began"}
            </div>
          </div>
        </div>

        {/* ── Chart ── */}
        <div
          className="fade-up d3"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {/* Chart header */}
          <div
            className="chart-filter-row"
            style={{
              padding: "18px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
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
                  <TabBtn key={p.hours} preset={p} />
                ))}
              </div>

              <div
                style={{
                  width: 1,
                  height: 16,
                  background: "var(--line2)",
                  flexShrink: 0,
                }}
              />

              {/* Date range */}
              <div
                className="date-picker-row"
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
                  style={{ width: 140 }}
                />
                <span style={{ ...MONO, fontSize: 10, color: "var(--muted)" }}>
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
                  style={{ width: 140 }}
                />
                <button
                  onClick={applyDateRange}
                  style={{
                    background:
                      filterMode === "range" ? "var(--green)" : "none",
                    border: `1px solid ${filterMode === "range" ? "var(--green)" : "var(--line2)"}`,
                    color: filterMode === "range" ? "#080808" : "var(--muted)",
                    ...MONO,
                    fontSize: 10,
                    fontWeight: filterMode === "range" ? 400 : 300,
                    letterSpacing: "0.08em",
                    padding: "5px 12px",
                    borderRadius: 100,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (filterMode !== "range") {
                      e.currentTarget.style.borderColor = "var(--green)";
                      e.currentTarget.style.color = "var(--green)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterMode !== "range") {
                      e.currentTarget.style.borderColor = "var(--line2)";
                      e.currentTarget.style.color = "var(--muted)";
                    }
                  }}
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

          {/* Chart body */}
          <div style={{ height: 200, padding: "16px 8px 0" }}>
            {chartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...MONO,
                  fontSize: 10,
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
                  margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
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
                    stroke="rgba(61,220,132,0.08)"
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
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status bar */}
          <div
            className="status-bar"
            style={{
              display: "flex",
              gap: 28,
              padding: "12px 24px 16px",
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
              { label: "last update", value: fmtAge(live?.ageSeconds) },
              { label: "data pts", value: summary.dataPoints ?? "—" },
              { label: "avg", value: summary.avg ?? "—" },
              { label: "max slots", value: maxSlots },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flexShrink: 0 }}>
                <div
                  style={{
                    ...MONO,
                    fontSize: 8,
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

        {/* ── Bottom row ── */}
        <div className="bottom-grid">
          <HourlyHeatmap hourly={peakStats.hourly} />
          <DailyPeakBar daily={peakStats.daily} maxSlots={maxSlots} />
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 18,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: "#1e1e1e",
              letterSpacing: "0.08em",
            }}
          >
            data via cfx.re public api · polls every 30s · not affiliated with
            NoPixel
          </span>
          <span
            style={{
              ...MONO,
              fontSize: 9,
              color: "#1e1e1e",
              letterSpacing: "0.08em",
            }}
          >
            {SERVER_CODE}
          </span>
        </div>
      </main>
    </>
  );
}
