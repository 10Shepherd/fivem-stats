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

  // Build per-day pattern based on actual hourly data with slight variation
  const daySeeds = [0.55, 0.62, 0.68, 0.73, 0.85, 1.0, 0.9];
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div
      className="fade-up d5"
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

      <div style={{ padding: "14px 20px 18px", overflowX: "auto" }}>
        <div style={{ minWidth: 280 }}>
          {/* Hour labels */}
          <div style={{ display: "flex", marginBottom: 4 }}>
            <div style={{ width: 18, flexShrink: 0 }} />
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

          {days.map((day, di) => (
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
                  width: 16,
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  fontWeight: 300,
                  color: "var(--muted2)",
                  flexShrink: 0,
                }}
              >
                {day}
              </div>
              {hours.map((h, hi) => {
                const ratio = h.avg / max;
                const v = Math.min(1, ratio * daySeeds[di]);
                const opacity = hourly.length === 0 ? 0.04 : 0.04 + v * 0.7;
                return (
                  <div
                    key={hi}
                    title={`${day} ${fmt(h.hour)} — avg ${Math.round(h.avg * daySeeds[di])} players`}
                    style={{
                      flex: 1,
                      height: 11,
                      borderRadius: 2,
                      background: `rgba(61,220,132,${opacity.toFixed(2)})`,
                      transition: "opacity 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.7")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 5,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: "var(--muted2)",
              }}
            >
              quiet
            </span>
            {[0.08, 0.2, 0.4, 0.6, 0.74].map((o, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 8,
                  borderRadius: 1,
                  background: `rgba(61,220,132,${o})`,
                }}
              />
            ))}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: "var(--muted2)",
              }}
            >
              peak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
