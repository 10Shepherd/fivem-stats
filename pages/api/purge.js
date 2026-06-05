import sql from "../../lib/db";

// Called by a separate weekly cron-job.org entry
// Deletes snapshots older than KEEP_DAYS to stay within Neon free tier (0.5 GB)
const KEEP_DAYS = 60;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["x-cron-secret"] !== secret)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await sql`
      DELETE FROM snapshots
      WHERE ts < NOW() - (${KEEP_DAYS} || ' days')::interval
    `;
    // Get current row count after purge
    const countResult = await sql`SELECT COUNT(*)::int AS total FROM snapshots`;
    const total = countResult[0]?.total ?? 0;

    console.log(`[purge] deleted old rows, ${total} remaining`);
    return res
      .status(200)
      .json({ ok: true, remaining: total, keepDays: KEEP_DAYS });
  } catch (err) {
    console.error("[purge] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
