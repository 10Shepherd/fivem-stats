import sql from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // ?hours=24 (default) or ?hours=168 (7 days) etc.
  const hours = Math.min(parseInt(req.query.hours) || 24, 720) // cap at 30 days

  // For longer ranges, bucket into larger intervals to reduce data points
  // < 25h → per-minute buckets | < 73h → 5-min | else → 15-min
  let bucket
  if (hours <= 24) bucket = '1 minute'
  else if (hours <= 72) bucket = '5 minutes'
  else bucket = '15 minutes'

  try {
    const rows = await sql`
      SELECT
        date_trunc('minute', ts) AS t,
        ROUND(AVG(player_count))::int AS count,
        MAX(player_count) AS peak,
        MAX(max_players) AS max_slots
      FROM snapshots
      WHERE ts > NOW() - (${hours} || ' hours')::interval
      GROUP BY date_trunc('minute', ts)
      ORDER BY 1 ASC
    `

    // Summary stats
    const counts = rows.map(r => r.count)
    const summary = counts.length > 0 ? {
      current: counts[counts.length - 1],
      peak: Math.max(...counts),
      avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
      maxSlots: rows[rows.length - 1]?.max_slots ?? 32,
      dataPoints: counts.length,
    } : {
      current: 0, peak: 0, avg: 0, maxSlots: 32, dataPoints: 0,
    }

    res.setHeader('Cache-Control', 's-maxage=55, stale-while-revalidate')
    return res.status(200).json({ rows, summary })
  } catch (err) {
    console.error('[history] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
