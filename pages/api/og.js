// Dynamic OG image generated as SVG, served as PNG via Vercel
// Returns an SVG that Discord/Twitter/etc renders as the preview image

import sql from "../../lib/db";

export default async function handler(req, res) {
  try {
    const row = await sql`
      SELECT player_count, max_players FROM snapshots ORDER BY ts DESC LIMIT 1
    `;
    const count = row[0]?.player_count ?? 0;
    const maxSlots = row[0]?.max_players ?? 32;
    const fillPct = maxSlots > 0 ? Math.round((count / maxSlots) * 100) : 0;
    const barW = Math.round((fillPct / 100) * 460);

    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060606"/>
      <stop offset="100%" stop-color="#0c0c0c"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3ddc84"/>
      <stop offset="100%" stop-color="rgba(61,220,132,0.5)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Grid lines -->
  ${Array.from({ length: 8 }, (_, i) => `<line x1="${150 * i}" y1="0" x2="${150 * i}" y2="630" stroke="#161616" stroke-width="1"/>`).join("")}
  ${Array.from({ length: 5 }, (_, i) => `<line x1="0" y1="${126 * i}" x2="1200" y2="${126 * i}" stroke="#161616" stroke-width="1"/>`).join("")}

  <!-- Top accent line -->
  <defs>
    <linearGradient id="topline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="30%" stop-color="#3ddc84"/>
      <stop offset="70%" stop-color="#3ddc84"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="2" fill="url(#topline)" opacity="0.6"/>

  <!-- Brand -->
  <text x="80" y="110" font-family="Arial Black, sans-serif" font-size="48" font-weight="900"
    fill="white" letter-spacing="8">FIVEM STATS</text>
  <rect x="80" y="122" width="140" height="1" fill="#202020"/>
  <text x="80" y="148" font-family="'Courier New', monospace" font-size="13" font-weight="300"
    fill="#4a4a4a" letter-spacing="4">STATS · LIVE TRACKER</text>

  <!-- Big number -->
  <text x="80" y="360" font-family="Arial Black, sans-serif" font-size="220" font-weight="900"
    fill="#3ddc84" opacity="0.95" filter="url(#glow)" letter-spacing="-4">${count}</text>

  <!-- Label -->
  <text x="82" y="410" font-family="'Courier New', monospace" font-size="16" font-weight="300"
    fill="#4a4a4a" letter-spacing="6">PLAYERS ONLINE</text>

  <!-- Capacity bar track -->
  <rect x="80" y="450" width="460" height="4" rx="2" fill="#1e1e1e"/>
  <!-- Capacity bar fill -->
  <rect x="80" y="450" width="${barW}" height="4" rx="2" fill="url(#bar)"/>

  <!-- Capacity label -->
  <text x="80" y="482" font-family="'Courier New', monospace" font-size="13" font-weight="300"
    fill="#2a2a2a" letter-spacing="3">of ${maxSlots} slots · ${fillPct}% capacity</text>

  <!-- Right side decoration -->
  <text x="900" y="300" font-family="Arial Black, sans-serif" font-size="120" font-weight="900"
    fill="#111111" letter-spacing="-2">${fillPct}%</text>
  <text x="900" y="340" font-family="'Courier New', monospace" font-size="14"
    fill="#222222" letter-spacing="4">CAPACITY</text>

  <!-- Server code pill -->
  <rect x="80" y="540" width="120" height="30" rx="15" fill="#111111" stroke="#202020" stroke-width="1"/>
  <text x="140" y="560" font-family="'Courier New', monospace" font-size="12"
    fill="#4a4a4a" letter-spacing="3" text-anchor="middle">3lamjz</text>

  <!-- CFX pill -->
  <rect x="216" y="540" width="90" height="30" rx="15" fill="#111111" stroke="#202020" stroke-width="1"/>
  <text x="261" y="560" font-family="'Courier New', monospace" font-size="12"
    fill="#4a4a4a" letter-spacing="2" text-anchor="middle">cfx.re</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).send(svg);
  } catch (err) {
    // Fallback static OG if DB fails
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=3600");
    return res.status(200)
      .send(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#060606"/>
      <text x="80" y="200" font-family="Arial Black" font-size="72" fill="white" letter-spacing="8">FIVEM STATS</text>
      <text x="80" y="280" font-family="Courier New" font-size="20" fill="#4a4a4a" letter-spacing="4">LIVE SERVER STATISTICS</text>
    </svg>`);
  }
}
