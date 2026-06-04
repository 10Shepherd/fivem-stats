import sql from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    // Get the most recent snapshot
    const rows = await sql`
      SELECT ts, player_count, max_players, players_json
      FROM snapshots
      ORDER BY ts DESC
      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(200).json({ online: false, message: 'No data yet — wait for first poll' })
    }

    const row = rows[0]
    const ageSeconds = (Date.now() - new Date(row.ts).getTime()) / 1000

    // If the last snapshot is older than 3 minutes, server might be down
    const online = ageSeconds < 180

    res.setHeader('Cache-Control', 's-maxage=55, stale-while-revalidate')
    return res.status(200).json({
      online,
      playerCount: row.player_count,
      maxPlayers: row.max_players,
      players: row.players_json || [],
      lastUpdate: row.ts,
      ageSeconds: Math.round(ageSeconds),
    })
  } catch (err) {
    console.error('[live] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
