import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { hours, from, to, server } = req.query;
  if (!server) return res.status(400).json({ error: "server param required" });

  try {
    let rows;

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setUTCHours(23, 59, 59, 999);

      if (isNaN(fromDate) || isNaN(toDate))
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });

      const diffH = (toDate - fromDate) / 3600000;

      if (diffH <= 6) {
        rows =
          await sql`SELECT date_trunc('minute',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>=${fromDate.toISOString()} AND ts<=${toDate.toISOString()} GROUP BY 1 ORDER BY 1`;
      } else if (diffH <= 72) {
        rows =
          await sql`SELECT date_trunc('hour',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>=${fromDate.toISOString()} AND ts<=${toDate.toISOString()} GROUP BY 1 ORDER BY 1`;
      } else {
        rows =
          await sql`SELECT date_trunc('day',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>=${fromDate.toISOString()} AND ts<=${toDate.toISOString()} GROUP BY 1 ORDER BY 1`;
      }
    } else {
      const h = Math.min(parseInt(hours) || 24, 720);

      if (h <= 2) {
        rows =
          await sql`SELECT date_trunc('minute',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>NOW()-(${h}||' hours')::interval GROUP BY 1 ORDER BY 1`;
      } else if (h <= 48) {
        rows =
          await sql`SELECT date_trunc('hour',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>NOW()-(${h}||' hours')::interval GROUP BY 1 ORDER BY 1`;
      } else {
        rows =
          await sql`SELECT date_trunc('day',ts) AS t, ROUND(AVG(player_count))::int AS count, MAX(player_count) AS peak, MAX(max_players) AS max_slots FROM snapshots WHERE server_code=${server} AND ts>NOW()-(${h}||' hours')::interval GROUP BY 1 ORDER BY 1`;
      }
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

    const bucket = (() => {
      if (from && to) {
        const diffH = (new Date(to) - new Date(from)) / 3600000;
        return diffH <= 6 ? "minute" : diffH <= 72 ? "hour" : "day";
      }
      const h = parseInt(hours) || 24;
      return h <= 2 ? "minute" : h <= 48 ? "hour" : "day";
    })();

    res.setHeader("Cache-Control", "s-maxage=55, stale-while-revalidate");
    return res.status(200).json({ rows, summary, bucket });
  } catch (err) {
    console.error("[history]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
