import { useRef, useEffect, useState } from "react";

export default function DailyPeakBar({ daily = [], maxSlots = 32 }) {
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(440);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) =>
      setContainerW(entries[0].contentRect.width),
    );
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (daily.length === 0) {
    return (
      <div
        className="fade-up d6"
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "48px 24px",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 300,
          color: "var(--muted)",
          letterSpacing: "0.1em",
        }}
      >
        accumulating data
      </div>
    );
  }

  const PAD_TOP = 24; // FIX: space above bars for peak labels
  const PAD_L = 32;
  const PAD_B = 28;
  const H = 90;
  const n = daily.length;
  const usable = Math.max(containerW - PAD_L - 20, 100);
  const GAP = Math.max(4, Math.min(10, Math.floor((usable / n) * 0.22)));
  const BAR_W = Math.max(12, Math.floor((usable - GAP * (n - 1)) / n));
  const totalH = PAD_TOP + H + PAD_B;
  const totalW = PAD_L + n * (BAR_W + GAP) - GAP + 16;

  const maxVal = Math.max(...daily.map((d) => d.peak), 1);
  const fmt = (d) =>
    new Date(d)
      .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      .slice(0, 3)
      .toUpperCase();

  return (
    <div
      className="fade-up d6"
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            letterSpacing: "0.1em",
            color: "#fff",
          }}
        >
          DAILY PEAK
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { color: "var(--line3)", label: "peak range" },
            { color: "rgba(61,220,132,0.6)", label: "avg" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 10,
                  height: 6,
                  background: color,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fontWeight: 300,
                  color: "var(--muted)",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </span>
            </div>
          ))}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 300,
              color: "var(--muted)",
              letterSpacing: "0.05em",
            }}
          >
            cap {maxSlots}
          </span>
        </div>
      </div>

      <div ref={containerRef} style={{ padding: "4px 20px 20px" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${Math.max(totalW, containerW - 40)} ${totalH}`}
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Y-axis grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD_L}
                y1={PAD_TOP + H - H * pct}
                x2={totalW - 8}
                y2={PAD_TOP + H - H * pct}
                stroke="#161616"
                strokeWidth="1"
              />
              <text
                x={PAD_L - 5}
                y={PAD_TOP + H - H * pct + 3}
                textAnchor="end"
                fill="#282828"
                fontSize="8"
                fontFamily="'DM Mono', monospace"
                fontWeight="300"
              >
                {Math.round(maxVal * pct)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {daily.map((d, i) => {
            const x = PAD_L + i * (BAR_W + GAP);
            const peakH = Math.max(2, (d.peak / maxVal) * H);
            const avgH = Math.max(2, (d.avg / maxVal) * H);
            const inner = Math.max(0, BAR_W - 8);
            const barY = PAD_TOP + H - peakH;

            return (
              <g key={i}>
                {/* Peak background bar */}
                <rect
                  x={x}
                  y={barY}
                  width={BAR_W}
                  height={peakH}
                  fill="var(--line3)"
                  rx="3"
                />
                {/* Avg fill bar */}
                <rect
                  x={x + 4}
                  y={PAD_TOP + H - avgH}
                  width={inner}
                  height={avgH}
                  fill="rgba(61,220,132,0.6)"
                  rx="3"
                />
                {/* FIX: peak label always sits in PAD_TOP space — never clips */}
                <text
                  x={x + BAR_W / 2}
                  y={barY - 5}
                  textAnchor="middle"
                  fill="#3ddc84"
                  fontSize="9"
                  fontFamily="'DM Mono', monospace"
                  fontWeight="400"
                >
                  {d.peak}
                </text>
                {/* Day label */}
                <text
                  x={x + BAR_W / 2}
                  y={PAD_TOP + H + 18}
                  textAnchor="middle"
                  fill="#777777"
                  fontSize="9"
                  fontFamily="'DM Sans', sans-serif"
                  fontWeight="400"
                  letterSpacing="0.04em"
                >
                  {fmt(d.day)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
