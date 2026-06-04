import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Peak per day for last 7 days
    const daily = await sql`
      SELECT
        DATE(ts) AS day,
        MAX(player_count) AS peak,
        ROUND(AVG(player_count))::int AS avg,
        COUNT(*)::int AS samples
      FROM snapshots
      WHERE ts > NOW() - INTERVAL '7 days'
      GROUP BY DATE(ts)
      ORDER BY day ASC
    `;

    // Peak per hour-of-day (activity heatmap)
    const hourly = await sql`
      SELECT
        EXTRACT(HOUR FROM ts)::int AS hour,
        ROUND(AVG(player_count))::int AS avg_count,
        MAX(player_count) AS peak_count
      FROM snapshots
      WHERE ts > NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM ts)
      ORDER BY hour ASC
    `;

    // All-time peak
    const alltime = await sql`
      SELECT MAX(player_count) AS peak, MIN(ts) AS since FROM snapshots
    `;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({
      daily,
      hourly,
      allTimePeak: alltime[0]?.peak ?? 0,
      trackingSince: alltime[0]?.since ?? null,
    });
  } catch (err) {
    console.error("[peakstats] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
