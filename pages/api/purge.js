import sql from "../../lib/db";

// Called by a separate weekly cron-job.org entry
// 180 days (~6 months) keeps rich history while staying within Neon's free tier
// at ~86,400 rows/server/month → ~15M rows/server at 180 days.
// With 2-3 servers that's comfortably within 0.5GB. Monitor your Neon dashboard
// storage usage and dial back to 90 if you add many servers.
const KEEP_DAYS = 180;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["x-cron-secret"] !== secret)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`
      DELETE FROM snapshots
      WHERE ts < NOW() - (${KEEP_DAYS} || ' days')::interval
    `;
    const countResult = await sql`SELECT COUNT(*)::int AS total FROM snapshots`;
    const total = countResult[0]?.total ?? 0;

    console.log(
      `[purge] deleted snapshots older than ${KEEP_DAYS} days, ${total} rows remaining`,
    );
    return res
      .status(200)
      .json({ ok: true, remaining: total, keepDays: KEEP_DAYS });
  } catch (err) {
    console.error("[purge] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
