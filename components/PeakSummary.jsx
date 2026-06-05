const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function PeakSummary({ peakStats = {}, summary = {} }) {
  const {
    busiestDay,
    busiestHour,
    busiestHourAvg,
    allTimePeak,
    trackingSince,
  } = peakStats;

  const items = [
    {
      label: "Busiest day",
      value: busiestDay || "—",
      sub: "30-day average",
      accent: true,
    },
    {
      label: "Peak hour",
      value: busiestHour || "—",
      sub: busiestHourAvg ? `avg ${busiestHourAvg} players` : "30-day average",
      accent: true,
    },
    {
      label: "All-time peak",
      value: allTimePeak || "—",
      sub: trackingSince
        ? `since ${new Date(trackingSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
        : "since tracking began",
    },
    {
      label: "Avg (range)",
      value: summary.avg ?? "—",
      sub: "current filter avg",
    },
  ];

  return (
    <div className="card fade-up d3" style={{ marginBottom: 12 }}>
      <div className="card-head">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            letterSpacing: "0.1em",
            color: "#fff",
          }}
        >
          PEAK INSIGHTS
        </span>
        <span style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
          30-day analysis
        </span>
      </div>

      <div
        className="peak-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--line)",
        }}
      >
        {items.map(({ label, value, sub, accent }) => (
          <div
            key={label}
            style={{
              background: accent ? "rgba(61,220,132,0.03)" : "var(--bg2)",
              padding: "20px 18px",
              position: "relative",
            }}
          >
            {accent && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg, var(--green), transparent)",
                  opacity: 0.3,
                }}
              />
            )}
            <div
              style={{
                ...MONO,
                fontSize: 8,
                letterSpacing: "0.16em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(20px, 3vw, 28px)",
                letterSpacing: "0.04em",
                color: accent ? "var(--green)" : "#fff",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {value}
            </div>
            <div style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
              {sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
