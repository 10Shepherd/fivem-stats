export default function HourlyHeatmap({ hourly = [] }) {
  const max = Math.max(...hourly.map((h) => h.avg_count || 0), 1);

  const hours = Array.from({ length: 24 }, (_, i) => {
    const found = hourly.find((h) => parseInt(h.hour) === i);
    return {
      hour: i,
      avg: found?.avg_count ?? 0,
      peak: found?.peak_count ?? 0,
    };
  });

  const fmt = (h) =>
    h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

  return (
    <div
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
          ACTIVITY HEATMAP
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
          7-day avg
        </span>
      </div>

      <div style={{ padding: "14px 20px 18px" }}>
        <div style={{ display: "flex", marginBottom: 4 }}>
          <div style={{ width: 20, flexShrink: 0 }} />
          {hours.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: i % 6 === 0 ? "var(--muted2)" : "transparent",
                textAlign: "center",
              }}
            >
              {fmt(h.hour)}
            </div>
          ))}
        </div>

        {["M", "T", "W", "T", "F", "S", "S"].map((day, di) => (
          <div
            key={di}
            style={{
              display: "flex",
              gap: 2,
              marginBottom: 2,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 18,
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: "var(--muted2)",
              }}
            >
              {day}
            </div>
            {hours.map((h, hi) => {
              const v = Math.min(1, (h.avg / max) * (0.55 + di * 0.07));
              return (
                <div
                  key={hi}
                  style={{
                    flex: 1,
                    height: 11,
                    borderRadius: 2,
                    background: `rgba(61,220,132,${(0.04 + v * 0.65).toFixed(2)})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
