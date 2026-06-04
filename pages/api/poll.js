import sql from "../../lib/db";

const SERVER_CODE = "3lamjz";
const FIVEM_API = `https://servers-frontend.fivem.net/api/servers/single/${SERVER_CODE}`;

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") return res.status(405).end();

  // Protect with a secret header so random people can't spam your DB
  // Set CRON_SECRET in Vercel env vars, and the same in cron-job.org request headers
  // const secret = process.env.CRON_SECRET
  // if (secret && req.headers['x-cron-secret'] !== secret) {
  //   return res.status(401).json({ error: 'Unauthorized' })
  // }

  try {
    const response = await fetch(FIVEM_API, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      // 8 second timeout
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`FiveM API returned ${response.status}`);
    }

    const data = await response.json();
    const sv = data.Data || data;
    const players = sv.players || [];
    const playerCount = players.length;
    const maxPlayers = sv.svMaxclients || 32;

    // Store snapshot — only save player names + ids (not full objects) to keep JSON small
    const playersJson = players.map((p) => ({
      id: p.id,
      name: p.name,
      ping: p.ping,
    }));

    await sql`
      INSERT INTO snapshots (ts, player_count, max_players, players_json)
      VALUES (NOW(), ${playerCount}, ${maxPlayers}, ${JSON.stringify(playersJson)})
    `;

    return res.status(200).json({
      ok: true,
      count: playerCount,
      max: maxPlayers,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[poll] error:", err.message);
    // Still return 200 so cron-job.org doesn't flag it as down
    // but log the error
    return res.status(200).json({ ok: false, error: err.message });
  }
}
