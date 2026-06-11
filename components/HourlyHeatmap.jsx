import { useMemo } from "react";

// Convert a UTC hour to the local hour in the given timezone
function utcHourToLocal(utcHour, tz) {
  try {
    const d = new Date();
    d.setUTCHours(utcHour, 0, 0, 0);
    return parseInt(
      d.toLocaleString("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      }),
    );
  } catch {
    return utcHour;
  }
}

// PostgreSQL DOW: 0=Sun, 1=Mon, ..., 6=Sat
// Display order: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6), Sun(0)
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function HourlyHeatmap({ hourlyByDay = [], userTz = "UTC" }) {
  const { grid, maxVal } = useMemo(() => {
    // Build lookup: dow → localHour → avg_count
    const lookup = {};
    DOW_ORDER.forEach((dow) => {
      lookup[dow] = Array(24).fill(0);
    });

    hourlyByDay.forEach(({ dow, hour, avg_count }) => {
      const localH = utcHourToLocal(parseInt(hour), userTz);
      if (localH >= 0 && localH < 24) {
        // Use max so overlapping UTC hours don't sum
        lookup[dow][localH] = Math.max(lookup[dow][localH], avg_count ?? 0);
      }
    });

    let max = 0;
    DOW_ORDER.forEach((dow) => {
      lookup[dow].forEach((v) => {
        if (v > max) max = v;
      });
    });

    return { grid: lookup, maxVal: max || 1 };
  }, [hourlyByDay, userTz]);

  const fmt = (h) =>
    h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

  const tzLabel = (() => {
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

  const hasData = hourlyByDay.length > 0;

  return (
    <div className="card fade-up d5">
      <div className="card-head">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
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
          30-day avg · {tzLabel}
        </span>
      </div>
      <div style={{ padding: "16px 20px 20px", overflowX: "auto" }}>
        <div style={{ minWidth: 260 }}>
          {/* Hour labels */}
          <div style={{ display: "flex", marginBottom: 5, paddingLeft: 30 }}>
            {Array.from({ length: 24 }, (_, i) => (
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
                {fmt(i)}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DOW_ORDER.map((dow, di) => (
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
                  width: 28,
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  fontWeight: 300,
                  color: "var(--muted)",
                  flexShrink: 0,
                  letterSpacing: "0.04em",
                }}
              >
                {DAY_LABELS[di]}
              </div>
              {grid[dow].map((val, hi) => {
                const intensity = val / maxVal;
                const opacity = !hasData
                  ? 0.04
                  : Math.max(0.04, 0.04 + intensity * 0.72);
                return (
                  <div
                    key={hi}
                    title={`${DAY_LABELS[di]} ${fmt(hi)} — avg ${Math.round(val)} players`}
                    style={{
                      flex: 1,
                      height: 12,
                      borderRadius: 2,
                      background: `rgba(61,220,132,${opacity.toFixed(2)})`,
                      transition: "transform 0.1s, opacity 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scaleY(1.3)";
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scaleY(1)";
                      e.currentTarget.style.opacity = "1";
                    }}
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
              gap: 4,
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: "var(--muted)",
                marginRight: 2,
              }}
            >
              quiet
            </span>
            {[0.06, 0.18, 0.36, 0.55, 0.76].map((o, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 8,
                  borderRadius: 2,
                  background: `rgba(61,220,132,${o})`,
                }}
              />
            ))}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                fontWeight: 300,
                color: "var(--muted)",
                marginLeft: 2,
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
