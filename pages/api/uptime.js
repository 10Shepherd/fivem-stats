import sql from "../../lib/db";
const GAP_MINUTES = 5;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const days = Math.min(parseInt(req.query.days) || 7, 30);
  const server = req.query.server || "3lamjz";

  try {
    const rows =
      await sql`SELECT ts,player_count FROM snapshots WHERE server_code=${server} AND ts>NOW()-(${days}||' days')::interval ORDER BY ts ASC`;
    if (rows.length === 0)
      return res
        .status(200)
        .json({ events: [], uptimePct: null, totalDowntimeMinutes: 0 });

    const events = [];
    let totalDowntimeMs = 0;
    const windowEnd = new Date(rows[rows.length - 1].ts);
    const windowStart = new Date(rows[0].ts);

    for (let i = 1; i < rows.length; i++) {
      const prev = new Date(rows[i - 1].ts),
        curr = new Date(rows[i].ts);
      const gapMs = curr - prev,
        gapMins = gapMs / 60000;
      if (gapMins >= GAP_MINUTES) {
        totalDowntimeMs += gapMs;
        events.push({
          type: "downtime",
          start: rows[i - 1].ts,
          end: rows[i].ts,
          durationMinutes: Math.round(gapMins),
        });
      }
      if (i >= 2) {
        const pp = rows[i - 2].player_count,
          pc = rows[i - 1].player_count,
          cc = rows[i].player_count;
        if (pp > 10 && pc <= 2 && cc > 5)
          events.push({
            type: "restart",
            ts: rows[i - 1].ts,
            beforeCount: pp,
            afterCount: cc,
          });
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
      events: events.slice(-50),
      uptimePct,
      totalDowntimeMinutes: Math.round(totalDowntimeMs / 60000),
      trackedFrom: rows[0].ts,
      trackedTo: rows[rows.length - 1].ts,
      snapshotCount: rows.length,
    });
  } catch (err) {
    console.error("[uptime]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
