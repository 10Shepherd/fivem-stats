import sql from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  let code = req.query.server;
  const label = req.query.label || "players";

  // If no server specified, use the first active server
  if (!code) {
    try {
      const servers =
        await sql`SELECT code FROM servers WHERE active = TRUE ORDER BY id LIMIT 1`;
      if (!servers.length)
        return res.status(404).json({ error: "no servers tracked" });
      code = servers[0].code;
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const rows = await sql`
      SELECT player_count, max_players, ts
      FROM snapshots WHERE server_code = ${code}
      ORDER BY ts DESC LIMIT 1
    `;
    const count = rows[0]?.player_count ?? 0;
    const max = rows[0]?.max_players ?? 0;
    const age = rows[0]
      ? Math.round((Date.now() - new Date(rows[0].ts).getTime()) / 1000)
      : 999;
    const online = age < 180;
    const color = online ? (count > 0 ? "#3ddc84" : "#888") : "#e05555";
    const text = online ? `${count}/${max}` : "offline";

    const labelW = label.length * 7 + 12;
    const valueW = text.length * 7.5 + 12;
    const totalW = labelW + valueW;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${text}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="14">${text}</text>
  </g>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate");
    return res.status(200).send(svg);
  } catch (err) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res
      .status(200)
      .send(
        `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><rect width="80" height="20" rx="3" fill="#555"/><text x="40" y="14" fill="#fff" text-anchor="middle" font-family="Verdana" font-size="11">error</text></svg>`,
      );
  }
}
