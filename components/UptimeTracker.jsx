import { useState } from "react";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

function fmtDuration(mins) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ${mins % 60}m`;
  return `${Math.floor(mins / 1440)}d ${Math.round((mins % 1440) / 60)}h`;
}
function fmtTs(ts) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UptimeTracker({ uptime = {} }) {
  const [expanded, setExpanded] = useState(false);
  const { events = [], uptimePct, totalDowntimeMinutes = 0 } = uptime;

  const downtimes = events.filter((e) => e.type === "downtime");
  const restarts = events.filter((e) => e.type === "restart");

  // FIX #8: 7-day timeline = 168 hourly blocks in a SINGLE scrollable row
  // Each block represents one hour. Green = online, red = gap detected.
  const blocks = Array.from({ length: 168 }, (_, i) => {
    const blockStart = new Date(Date.now() - (167 - i) * 3600000);
    const blockEnd = new Date(blockStart.getTime() + 3600000);
    const hasDown = downtimes.some((d) => {
      const s = new Date(d.start),
        e = new Date(d.end);
      return s < blockEnd && e > blockStart;
    });
    return { i, ts: blockStart, down: hasDown };
  });

  // Group into 7 rows of 24 (one row per day) for readable layout
  const days = Array.from({ length: 7 }, (_, d) => {
    const dayBlocks = blocks.slice(d * 24, (d + 1) * 24);
    const dayDate = dayBlocks[0]?.ts;
    return { dayDate, blocks: dayBlocks };
  });

  const uptimeColor =
    uptimePct == null
      ? "var(--muted)"
      : uptimePct >= 99
        ? "var(--green)"
        : uptimePct >= 95
          ? "#f5a623"
          : "var(--red)";

  return (
    <div className="card fade-up d4">
      <div className="card-head">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            letterSpacing: "0.1em",
            color: "#fff",
          }}
        >
          SERVER STATUS
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {uptimePct != null && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                letterSpacing: "0.06em",
                color: uptimeColor,
              }}
            >
              {uptimePct}%
            </span>
          )}
          <span style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
            7-day uptime
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        {/* FIX #8: 7 rows of 24 hourly blocks — readable on all screen sizes */}
        <div
          role="img"
          aria-label="7-day uptime timeline, one row per day"
          style={{ marginBottom: 14 }}
        >
          <div
            style={{
              ...MONO,
              fontSize: 9,
              color: "var(--muted)",
              marginBottom: 8,
              letterSpacing: "0.08em",
            }}
          >
            168h timeline — each cell = 1 hour
          </div>
          {days.map((day, di) => (
            <div
              key={di}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginBottom: 3,
              }}
            >
              {/* Day label */}
              <div
                style={{
                  ...MONO,
                  fontSize: 8,
                  color: "var(--muted)",
                  width: 28,
                  flexShrink: 0,
                  letterSpacing: "0.04em",
                }}
              >
                {day.dayDate
                  ? day.dayDate
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .toUpperCase()
                  : "—"}
              </div>
              {/* 24 hourly blocks */}
              {day.blocks.map((b, bi) => (
                <div
                  key={bi}
                  title={`${fmtTs(b.ts)} — ${b.down ? "offline/gap" : "online"}`}
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: 16,
                    borderRadius: 2,
                    background: b.down
                      ? "rgba(224,85,85,0.55)"
                      : "rgba(61,220,132,0.3)",
                    transition: "opacity 0.15s, transform 0.1s",
                    cursor: "default",
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.65";
                    e.currentTarget.style.transform = "scaleY(1.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "scaleY(1)";
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
          }}
        >
          {[
            {
              label: "downtime",
              value:
                totalDowntimeMinutes > 0
                  ? fmtDuration(totalDowntimeMinutes)
                  : "0m",
              color: totalDowntimeMinutes > 0 ? "var(--red)" : "var(--green)",
            },
            {
              label: "incidents",
              value: downtimes.length,
              color: downtimes.length > 0 ? "#f5a623" : "var(--green)",
            },
            {
              label: "restarts",
              value: restarts.length,
              color: restarts.length > 0 ? "#f5a623" : "var(--green)",
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div
                style={{
                  ...MONO,
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  letterSpacing: "0.04em",
                  color,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: events.length > 0 ? 12 : 0,
          }}
        >
          {[
            { color: "rgba(61,220,132,0.3)", label: "online" },
            { color: "rgba(224,85,85,0.55)", label: "offline / gap" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 8,
                  background: color,
                  borderRadius: 2,
                }}
              />
              <span style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Incident log */}
        {events.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                background: "none",
                border: "none",
                ...MONO,
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.08em",
                cursor: "pointer",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <span
                style={{
                  display: "inline-block",
                  transition: "transform 0.2s",
                  transform: expanded ? "rotate(90deg)" : "none",
                }}
              >
                ▶
              </span>
              incident log ({events.length})
            </button>

            {expanded && (
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                }}
              >
                {[...events].reverse().map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 14px",
                      borderBottom:
                        i < events.length - 1
                          ? "1px solid var(--line)"
                          : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: 3,
                        background:
                          ev.type === "restart" ? "#f5a623" : "var(--red)",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          ...MONO,
                          fontSize: 10,
                          color:
                            ev.type === "restart" ? "#f5a623" : "var(--red)",
                          letterSpacing: "0.06em",
                          marginBottom: 2,
                        }}
                      >
                        {ev.type === "restart"
                          ? "RESTART DETECTED"
                          : "OFFLINE / GAP"}
                      </div>
                      <div
                        style={{ ...MONO, fontSize: 9, color: "var(--muted)" }}
                      >
                        {ev.type === "downtime"
                          ? `${fmtTs(ev.start)} — ${fmtTs(ev.end)} · ${fmtDuration(ev.durationMinutes)}`
                          : `${fmtTs(ev.ts)} · ${ev.beforeCount}→${ev.afterCount} players`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
