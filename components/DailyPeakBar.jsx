import { useRef, useEffect, useState } from "react";

export default function DailyPeakBar({ daily = [], maxSlots = 32 }) {
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setContainerW(entries[0].contentRect.width);
    });
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
          borderRadius: 12,
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

  // Responsive bar sizing based on actual container width
  const PAD_L = 28;
  const PAD_B = 24;
  const H = 100;
  const n = daily.length;
  const usable = Math.max(containerW - PAD_L - 16, 100);
  const GAP = Math.max(3, Math.min(8, Math.floor((usable / n) * 0.2)));
  const BAR_W = Math.max(10, Math.floor((usable - GAP * (n - 1)) / n));
  const totalW = PAD_L + n * (BAR_W + GAP) - GAP + 16;

  const maxVal = Math.max(...daily.map((d) => d.peak), 1);
  const fmt = (d) =>
    new Date(d)
      .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className="fade-up d6"
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            letterSpacing: "0.1em",
            color: "#fff",
          }}
        >
          DAILY PEAK
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 300,
            color: "var(--muted)",
            letterSpacing: "0.06em",
          }}
        >
          cap {maxSlots}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{ padding: "16px 20px 20px", overflowX: "auto" }}
      >
        <svg
          width={Math.max(totalW, containerW - 40)}
          height={H + PAD_B}
          style={{ display: "block", minWidth: 180 }}
        >
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD_L}
                y1={H - H * pct}
                x2={totalW - 8}
                y2={H - H * pct}
                stroke="#161616"
                strokeWidth="1"
              />
              <text
                x={PAD_L - 4}
                y={H - H * pct + 3}
                textAnchor="end"
                fill="#2a2a2a"
                fontSize="8"
                fontFamily="'DM Mono', monospace"
                fontWeight="300"
              >
                {Math.round(maxVal * pct)}
              </text>
            </g>
          ))}
          {daily.map((d, i) => {
            const x = PAD_L + i * (BAR_W + GAP);
            const peakH = (d.peak / maxVal) * H;
            const avgH = (d.avg / maxVal) * H;
            const inner = Math.max(0, BAR_W - 10);
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={H - peakH}
                  width={BAR_W}
                  height={peakH}
                  fill="#161616"
                  rx="3"
                />
                <rect
                  x={x + 5}
                  y={H - avgH}
                  width={inner}
                  height={avgH}
                  fill="rgba(61,220,132,0.55)"
                  rx="3"
                />
                {BAR_W > 14 && (
                  <text
                    x={x + BAR_W / 2}
                    y={H - peakH - 4}
                    textAnchor="middle"
                    fill="#2a2a2a"
                    fontSize="8"
                    fontFamily="'DM Mono', monospace"
                    fontWeight="300"
                  >
                    {d.peak}
                  </text>
                )}
                <text
                  x={x + BAR_W / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fill="#2a2a2a"
                  fontSize="9"
                  fontFamily="'DM Sans', sans-serif"
                  fontWeight="300"
                >
                  {fmt(d.day)}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 14, marginTop: 2 }}>
          {[
            { color: "#161616", label: "peak" },
            { color: "rgba(61,220,132,0.55)", label: "avg" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 12,
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
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
