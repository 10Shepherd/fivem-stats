import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const server = req.query.server;
  if (!server) return res.status(400).json({ error: "server param required" });

  try {
    const [daily, hourlyByDay, alltime, busiestDay, busiestHour] =
      await Promise.all([
        // 7-day daily peaks for the bar chart
        sql`
          SELECT DATE(ts) AS day,
                 MAX(player_count) AS peak,
                 ROUND(AVG(player_count))::int AS avg,
                 COUNT(*)::int AS samples
          FROM snapshots
          WHERE server_code = ${server} AND ts > NOW() - INTERVAL '7 days'
          GROUP BY DATE(ts)
          ORDER BY day ASC
        `,

        // 30-day real per-dow-per-hour data for the heatmap
        // DOW: 0=Sunday, 1=Monday, ..., 6=Saturday (PostgreSQL convention)
        sql`
          SELECT EXTRACT(DOW FROM ts)::int AS dow,
                 EXTRACT(HOUR FROM ts)::int AS hour,
                 ROUND(AVG(player_count))::int AS avg_count
          FROM snapshots
          WHERE server_code = ${server} AND ts > NOW() - INTERVAL '30 days'
          GROUP BY EXTRACT(DOW FROM ts), EXTRACT(HOUR FROM ts)
          ORDER BY dow, hour
        `,

        sql`
          SELECT MAX(player_count) AS peak, MIN(ts) AS since
          FROM snapshots
          WHERE server_code = ${server}
        `,

        sql`
          SELECT TRIM(TO_CHAR(ts, 'Day')) AS day_trim,
                 ROUND(AVG(player_count))::int AS avg_count
          FROM snapshots
          WHERE server_code = ${server} AND ts > NOW() - INTERVAL '30 days'
          GROUP BY TO_CHAR(ts, 'Day'), EXTRACT(DOW FROM ts)
          ORDER BY avg_count DESC
          LIMIT 1
        `,

        sql`
          SELECT EXTRACT(HOUR FROM ts)::int AS hour,
                 ROUND(AVG(player_count))::int AS avg_count
          FROM snapshots
          WHERE server_code = ${server} AND ts > NOW() - INTERVAL '30 days'
          GROUP BY EXTRACT(HOUR FROM ts)
          ORDER BY avg_count DESC
          LIMIT 1
        `,
      ]);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({
      daily,
      hourlyByDay, // replaces old `hourly` — real (dow, hour) pairs
      allTimePeak: alltime[0]?.peak ?? 0,
      trackingSince: alltime[0]?.since ?? null,
      busiestDay: busiestDay[0]?.day_trim ?? null,
      busiestHourUtc: busiestHour[0]?.hour ?? null,
      busiestHourAvg: busiestHour[0]?.avg_count ?? null,
    });
  } catch (err) {
    console.error("[peakstats]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
