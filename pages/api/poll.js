import sql from "../../lib/db";

// Polls ALL active servers — cron-job.org hits this every 60s
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers["x-cron-secret"] !== secret)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    // Fetch all active servers
    const servers =
      await sql`SELECT code, name FROM servers WHERE active = TRUE`;
    if (servers.length === 0)
      return res.status(200).json({ ok: true, results: [] });

    const results = await Promise.allSettled(
      servers.map(async (sv) => {
        const r = await fetch(
          `https://frontend.cfx-services.net/api/servers/single/${sv.code}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!r.ok) throw new Error(`FiveM API ${r.status} for ${sv.code}`);

        const data = await r.json();
        const d = data.Data || data;
        const players = d.players || [];
        const count = players.length;
        const max = d.svMaxclients || 32;
        const pj = players.map((p) => ({
          id: p.id,
          name: p.name,
          ping: p.ping,
        }));

        await sql`
          INSERT INTO snapshots (ts, server_code, player_count, max_players, players_json)
          VALUES (NOW(), ${sv.code}, ${count}, ${max}, ${JSON.stringify(pj)})
        `;
        return { code: sv.code, count, max };
      }),
    );

    const summary = results.map((r, i) =>
      r.status === "fulfilled"
        ? { ...r.value, ok: true }
        : { code: servers[i].code, ok: false, error: r.reason?.message },
    );

    return res
      .status(200)
      .json({ ok: true, results: summary, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[poll] error:", err.message);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
