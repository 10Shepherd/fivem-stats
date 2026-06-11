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

const REFRESH_MS = 30_000;
const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };
const toDateInput = (d) => d.toISOString().split("T")[0];

function fmtChartLabel(isoString, bucket, userTz) {
  const d = new Date(isoString);
  if (bucket === "minute" || bucket === "hour")
    return d.toLocaleTimeString("en-US", {
      timeZone: userTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return d.toLocaleDateString("en-US", {
    timeZone: userTz,
    month: "short",
    day: "numeric",
  });
}

function fmtTooltipLabel(isoString, userTz) {
  return new Date(isoString).toLocaleString("en-US", {
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

const PRESETS = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 168 },
];

export default function HistoryPage({ activeServer: propServer = "3lamjz" }) {
  const [userTz, setUserTz] = useState("UTC");
  const [todayStr, setTodayStr] = useState("");
  const [activeServer, setActiveServer] = useState(propServer);
  const [serverInfo, setServerInfo] = useState(null);
  const [history, setHistory] = useState({
    rows: [],
    summary: {},
    bucket: "hour",
  });
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [filterMode, setFilterMode] = useState("preset");
  const [activePreset, setActivePreset] = useState(24);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeError, setRangeError] = useState("");

  useEffect(() => {
    setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const now = new Date();
    const week = new Date(now);
    week.setDate(now.getDate() - 7);
    setTodayStr(toDateInput(now));
    setFromDate(toDateInput(week));
    setToDate(toDateInput(now));
  }, []);

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

  useEffect(() => {
    const fn = (e) => setActiveServer(e.detail.code);
    window.addEventListener("serverChange", fn);
    return () => window.removeEventListener("serverChange", fn);
  }, []);

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
    setTimedOut(false);
    const timeout = setTimeout(() => setTimedOut(true), 12000);
    const histOpts =
      filterRef.current === "range"
        ? { from: fromRef.current, to: toRef.current }
        : { hours: presetRef.current };
    await Promise.all([fetchHistory(histOpts), fetchServerList()]);
    clearTimeout(timeout);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    setTimedOut(false);
    setHistory({ rows: [], summary: {}, bucket: "hour" });
    refreshAll();
  }, [activeServer, refreshAll]);
  useEffect(() => {
    const iv = setInterval(refreshAll, REFRESH_MS);
    return () => clearInterval(iv);
  }, [refreshAll]);
  useEffect(() => {
    if (filterMode === "preset") fetchHistory({ hours: activePreset });
  }, [activePreset]); // eslint-disable-line

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

  const maxSlots = serverInfo?.max_players ?? 32;
  const summary = history.summary ?? {};
  const bucket = history.bucket ?? "hour";
  const serverName = serverInfo?.name || activeServer;
  const chartData = (history.rows || []).map((r) => ({
    t: fmtChartLabel(r.t, bucket, userTz),
    tFull: fmtTooltipLabel(r.t, userTz),
    count: r.count,
  }));
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
        <title>History — {serverName} — FiveM Stats</title>
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
            HISTORY
          </div>
          <div style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
            {activeServer} · player count over time · {tzShort}
          </div>
        </div>
      </header>
      <main id="main-content" className="page-content">
        <div className="card fade-up d1" style={{ overflow: "hidden" }}>
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
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setRangeError("");
                    }}
                  />
                </div>
                <button
                  onClick={applyRange}
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
          <div style={{ height: 320, padding: "12px 8px 0" }}>
            {loading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ ...MONO, fontSize: 11, color: "var(--muted)" }}>
                  loading...
                </p>
              </div>
            ) : timedOut ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <p style={{ ...MONO, fontSize: 13, color: "var(--red)" }}>
                  data unavailable
                </p>
                <p style={{ ...MONO, fontSize: 11, color: "var(--muted)" }}>
                  could not load chart data
                </p>
                <button className="btn" onClick={refreshAll}>
                  retry
                </button>
              </div>
            ) : chartData.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ ...MONO, fontSize: 11, color: "var(--muted)" }}>
                  no data for this range
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
              { label: "peak", value: summary.peak ?? "—" },
              { label: "avg", value: summary.avg ?? "—" },
              { label: "points", value: summary.dataPoints ?? "—" },
              { label: "capacity", value: `${maxSlots} slots` },
              { label: "timezone", value: tzShort },
            ].map(({ label, value }) => (
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
                    color: "var(--text)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
