import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const server = req.query.server || "3lamjz";

  try {
    const [daily, hourly, alltime, busiestDay, busiestHour] = await Promise.all(
      [
        sql`SELECT DATE(ts) AS day,MAX(player_count) AS peak,ROUND(AVG(player_count))::int AS avg,COUNT(*)::int AS samples FROM snapshots WHERE server_code=${server} AND ts>NOW()-INTERVAL '7 days' GROUP BY DATE(ts) ORDER BY day ASC`,
        sql`SELECT EXTRACT(HOUR FROM ts)::int AS hour,ROUND(AVG(player_count))::int AS avg_count,MAX(player_count) AS peak_count FROM snapshots WHERE server_code=${server} AND ts>NOW()-INTERVAL '7 days' GROUP BY EXTRACT(HOUR FROM ts) ORDER BY hour ASC`,
        sql`SELECT MAX(player_count) AS peak,MIN(ts) AS since FROM snapshots WHERE server_code=${server}`,
        sql`SELECT TRIM(TO_CHAR(ts,'Day')) AS day_trim,ROUND(AVG(player_count))::int AS avg_count FROM snapshots WHERE server_code=${server} AND ts>NOW()-INTERVAL '30 days' GROUP BY TO_CHAR(ts,'Day'),EXTRACT(DOW FROM ts) ORDER BY avg_count DESC LIMIT 1`,
        sql`SELECT EXTRACT(HOUR FROM ts)::int AS hour,ROUND(AVG(player_count))::int AS avg_count FROM snapshots WHERE server_code=${server} AND ts>NOW()-INTERVAL '30 days' GROUP BY EXTRACT(HOUR FROM ts) ORDER BY avg_count DESC LIMIT 1`,
      ],
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json({
      daily,
      hourly,
      allTimePeak: alltime[0]?.peak ?? 0,
      trackingSince: alltime[0]?.since ?? null,
      busiestDay: busiestDay[0]?.day_trim ?? null,
      // Raw UTC hour (0-23) — PeakSummary converts to local tz client-side
      busiestHourUtc: busiestHour[0]?.hour ?? null,
      busiestHourAvg: busiestHour[0]?.avg_count ?? null,
    });
  } catch (err) {
    console.error("[peakstats]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
