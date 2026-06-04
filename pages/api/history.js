import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { hours, from, to } = req.query;

  let rows;

  try {
    if (from && to) {
      // Date range mode: from=2024-01-01 to=2024-01-07
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // include full end day

      // Validate
      if (isNaN(fromDate) || isNaN(toDate)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const diffMs = toDate - fromDate;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Bucket size based on range
      let bucket;
      if (diffHours <= 24) bucket = "5 minutes";
      else if (diffHours <= 72) bucket = "15 minutes";
      else if (diffHours <= 336) bucket = "1 hour";
      else bucket = "3 hours";

      rows = await sql`
        SELECT
          date_trunc(${bucket.split(" ")[1]}, ts) AS t,
          ROUND(AVG(player_count))::int AS count,
          MAX(player_count) AS peak,
          MAX(max_players) AS max_slots
        FROM snapshots
        WHERE ts >= ${fromDate.toISOString()}
          AND ts <= ${toDate.toISOString()}
        GROUP BY date_trunc(${bucket.split(" ")[1]}, ts)
        ORDER BY 1 ASC
      `;
    } else {
      // Hours mode (legacy presets)
      const h = Math.min(parseInt(hours) || 24, 720);

      rows = await sql`
        SELECT
          date_trunc('minute', ts) AS t,
          ROUND(AVG(player_count))::int AS count,
          MAX(player_count) AS peak,
          MAX(max_players) AS max_slots
        FROM snapshots
        WHERE ts > NOW() - (${h} || ' hours')::interval
        GROUP BY date_trunc('minute', ts)
        ORDER BY 1 ASC
      `;
    }

    const counts = rows.map((r) => r.count);
    const summary =
      counts.length > 0
        ? {
            current: counts[counts.length - 1],
            peak: Math.max(...counts),
            avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
            maxSlots: rows[rows.length - 1]?.max_slots ?? 32,
            dataPoints: counts.length,
          }
        : { current: 0, peak: 0, avg: 0, maxSlots: 32, dataPoints: 0 };

    res.setHeader("Cache-Control", "s-maxage=55, stale-while-revalidate");
    return res.status(200).json({ rows, summary });
  } catch (err) {
    console.error("[history] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
