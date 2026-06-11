import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const code = req.query.server;
  if (!code) return res.status(400).json({ error: "server param required" });

  try {
    const rows = await sql`
      SELECT ts, player_count, max_players, players_json
      FROM snapshots
      WHERE server_code = ${code}
      ORDER BY ts DESC LIMIT 1
    `;
    if (rows.length === 0)
      return res.status(200).json({ online: false, message: "No data yet" });

    const row = rows[0];
    const ageSeconds = Math.round(
      (Date.now() - new Date(row.ts).getTime()) / 1000,
    );
    const online = ageSeconds < 180;

    res.setHeader("Cache-Control", "s-maxage=25, stale-while-revalidate");
    return res.status(200).json({
      online,
      playerCount: row.player_count,
      maxPlayers: row.max_players,
      players: row.players_json || [],
      lastUpdate: row.ts,
      ageSeconds,
    });
  } catch (err) {
    console.error("[live]", err.message);
    return res.status(500).json({ error: err.message });
  }
}
