import { useMemo } from "react";

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

export default function HourlyHeatmap({ hourly = [], userTz = "UTC" }) {
  const max = Math.max(...hourly.map((h) => h.avg_count || 0), 1);

  // Build hours array remapped to local timezone
  const hours = useMemo(() => {
    const local = Array.from({ length: 24 }, (_, i) => ({ hour: i, avg: 0 }));
    hourly.forEach((h) => {
      const utcH = parseInt(h.hour);
      const localH = utcHourToLocal(utcH, userTz);
      if (localH >= 0 && localH < 24) local[localH].avg = h.avg_count ?? 0;
    });
    return local;
  }, [hourly, userTz]);

  const daySeeds = [0.55, 0.62, 0.68, 0.73, 0.85, 1.0, 0.9];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
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
          7-day avg · {tzLabel}
        </span>
      </div>
      <div style={{ padding: "16px 20px 20px", overflowX: "auto" }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ display: "flex", marginBottom: 5, paddingLeft: 30 }}>
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
                  width: 28,
                  fontFamily: "var(--font-mono)",
                  fontSize: 8,
                  fontWeight: 300,
                  color: "var(--muted)",
                  flexShrink: 0,
                  letterSpacing: "0.04em",
                }}
              >
                {day}
              </div>
              {hours.map((h, hi) => {
                const v = Math.min(1, (h.avg / max) * daySeeds[di]);
                const op =
                  hourly.length === 0 ? 0.04 : Math.max(0.04, 0.04 + v * 0.72);
                return (
                  <div
                    key={hi}
                    title={`${day} ${fmt(h.hour)} — ~${Math.round(h.avg * daySeeds[di])} players`}
                    style={{
                      flex: 1,
                      height: 12,
                      borderRadius: 2,
                      background: `rgba(61,220,132,${op.toFixed(2)})`,
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
