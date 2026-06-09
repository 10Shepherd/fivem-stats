import sql from "../../lib/db";

// GET  /api/servers          — list all active servers
// POST /api/servers          — add a server (protected)
// DELETE /api/servers?code=  — remove a server (protected)

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT s.code, s.name, s.tags, s.color, s.added_at,
               snap.player_count, snap.max_players, snap.ts AS last_seen,
               EXTRACT(EPOCH FROM (NOW() - snap.ts))::int AS age_seconds
        FROM servers s
        LEFT JOIN LATERAL (
          SELECT player_count, max_players, ts
          FROM snapshots
          WHERE server_code = s.code
          ORDER BY ts DESC LIMIT 1
        ) snap ON TRUE
        WHERE s.active = TRUE
        ORDER BY snap.player_count DESC NULLS LAST
      `;
      res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
      return res.status(200).json(rows);
    } catch (err) {
      console.error("[servers GET]", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // Protected writes
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["x-cron-secret"] !== secret)
    return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    const { code, name, tags = [], color = "#3ddc84" } = req.body || {};
    if (!code || !name)
      return res.status(400).json({ error: "code and name required" });
    try {
      await sql`
        INSERT INTO servers (code, name, tags, color)
        VALUES (${code}, ${name}, ${tags}, ${color})
        ON CONFLICT (code) DO UPDATE SET name=${name}, tags=${tags}, color=${color}, active=TRUE
      `;
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "code required" });
    try {
      await sql`UPDATE servers SET active=FALSE WHERE code=${code}`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}
