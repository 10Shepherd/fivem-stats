import sql from "../../lib/db";

// Gap threshold — if two consecutive snapshots are more than N minutes apart,
// we consider that a potential downtime/restart window
const GAP_MINUTES = 5;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // How many days back to scan (default 7, max 30)
  const days = Math.min(parseInt(req.query.days) || 7, 30);

  try {
    // Fetch all snapshots in window, ordered by time
    const rows = await sql`
      SELECT ts, player_count
      FROM snapshots
      WHERE ts > NOW() - (${days} || ' days')::interval
      ORDER BY ts ASC
    `;

    if (rows.length === 0) {
      return res
        .status(200)
        .json({ events: [], uptimePct: null, totalDowntimeMinutes: 0 });
    }

    const events = [];
    let totalDowntimeMs = 0;
    const windowMs = days * 24 * 60 * 60 * 1000;
    const windowStart = new Date(rows[0].ts);
    const windowEnd = new Date(rows[rows.length - 1].ts);

    for (let i = 1; i < rows.length; i++) {
      const prev = new Date(rows[i - 1].ts);
      const curr = new Date(rows[i].ts);
      const gapMs = curr - prev;
      const gapMins = gapMs / 60000;

      if (gapMins >= GAP_MINUTES) {
        totalDowntimeMs += gapMs;
        events.push({
          type: "downtime",
          start: rows[i - 1].ts,
          end: rows[i].ts,
          durationMinutes: Math.round(gapMins),
        });
      }

      // Detect restarts: player count drops to 0 or near 0 then jumps back up
      if (i >= 2) {
        const prevCount = rows[i - 1].player_count;
        const currCount = rows[i].player_count;
        const prevPrev = rows[i - 2].player_count;
        if (prevPrev > 10 && prevCount <= 2 && currCount > 5) {
          events.push({
            type: "restart",
            ts: rows[i - 1].ts,
            beforeCount: prevPrev,
            afterCount: currCount,
          });
        }
      }
    }

    const trackedMs = windowEnd - windowStart;
    const uptimePct =
      trackedMs > 0
        ? Math.max(
            0,
            Math.round(((trackedMs - totalDowntimeMs) / trackedMs) * 1000) / 10,
          )
        : null;

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate");
    return res.status(200).json({
      events: events.slice(-50), // last 50 events
      uptimePct,
      totalDowntimeMinutes: Math.round(totalDowntimeMs / 60000),
      trackedFrom: rows[0].ts,
      trackedTo: rows[rows.length - 1].ts,
      snapshotCount: rows.length,
    });
  } catch (err) {
    console.error("[uptime] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
