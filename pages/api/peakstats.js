import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const [daily, hourly, alltime, busiestDay, busiestHour] = await Promise.all(
      [
        // Peak per day last 7 days
        sql`SELECT DATE(ts) AS day, MAX(player_count) AS peak,
               ROUND(AVG(player_count))::int AS avg, COUNT(*)::int AS samples
          FROM snapshots WHERE ts > NOW() - INTERVAL '7 days'
          GROUP BY DATE(ts) ORDER BY day ASC`,

        // Avg per hour of day (heatmap)
        sql`SELECT EXTRACT(HOUR FROM ts)::int AS hour,
               ROUND(AVG(player_count))::int AS avg_count,
               MAX(player_count) AS peak_count
          FROM snapshots WHERE ts > NOW() - INTERVAL '7 days'
          GROUP BY EXTRACT(HOUR FROM ts) ORDER BY hour ASC`,

        // All-time peak + tracking start
        sql`SELECT MAX(player_count) AS peak, MIN(ts) AS since FROM snapshots`,

        // Busiest day of week
        sql`SELECT TO_CHAR(ts, 'Day') AS day_name,
               TRIM(TO_CHAR(ts, 'Day')) AS day_trim,
               ROUND(AVG(player_count))::int AS avg_count
          FROM snapshots WHERE ts > NOW() - INTERVAL '30 days'
          GROUP BY TO_CHAR(ts, 'Day'), EXTRACT(DOW FROM ts)
          ORDER BY avg_count DESC LIMIT 1`,

        // Busiest hour of day
        sql`SELECT EXTRACT(HOUR FROM ts)::int AS hour,
               ROUND(AVG(player_count))::int AS avg_count
          FROM snapshots WHERE ts > NOW() - INTERVAL '30 days'
          GROUP BY EXTRACT(HOUR FROM ts)
          ORDER BY avg_count DESC LIMIT 1`,
      ],
    );

    // Format busiest hour nicely e.g. 20 -> "8PM"
    const formatHour = (h) => {
      if (h == null) return null;
      const n = parseInt(h);
      if (n === 0) return "12AM";
      if (n < 12) return `${n}AM`;
      if (n === 12) return "12PM";
      return `${n - 12}PM`;
    };

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({
      daily,
      hourly,
      allTimePeak: alltime[0]?.peak ?? 0,
      trackingSince: alltime[0]?.since ?? null,
      busiestDay: busiestDay[0]?.day_trim ?? null,
      busiestHour: formatHour(busiestHour[0]?.hour),
      busiestHourAvg: busiestHour[0]?.avg_count ?? null,
    });
  } catch (err) {
    console.error("[peakstats] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
