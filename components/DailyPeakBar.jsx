export default function DailyPeakBar({ daily = [], maxSlots = 32 }) {
  if (daily.length === 0) {
    return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 4, padding: 32,
        textAlign: 'center', fontFamily: 'var(--font-mono)',
        fontSize: 12, color: 'var(--muted)',
      }}>
        collecting data...
      </div>
    )
  }

  const BAR_W = 28
  const GAP = 10
  const H = 120
  const PAD_L = 32
  const PAD_B = 28

  const maxVal = Math.max(...daily.map(d => d.peak), 1)
  const totalW = daily.length * (BAR_W + GAP) - GAP + PAD_L + 16

  const fmt = d => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 4, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase',
        }}>Daily peak — last 7 days</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
          cap {maxSlots}
        </span>
      </div>

      <div style={{ padding: '16px 16px 8px', overflowX: 'auto' }}>
        <svg width={totalW} height={H + PAD_B} style={{ display: 'block' }}>
          {/* Y-axis grid lines */}
          {[0.25, 0.5, 0.75, 1].map(pct => {
            const y = H - H * pct
            return (
              <g key={pct}>
                <line
                  x1={PAD_L} y1={y} x2={totalW - 8} y2={y}
                  stroke="rgba(27,58,86,0.6)" strokeWidth="0.5" strokeDasharray="3 3"
                />
                <text
                  x={PAD_L - 4} y={y + 4}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize="8"
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {Math.round(maxVal * pct)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {daily.map((d, i) => {
            const x = PAD_L + i * (BAR_W + GAP)
            const peakH = (d.peak / maxVal) * H
            const avgH  = (d.avg  / maxVal) * H

            return (
              <g key={i}>
                {/* Peak bar (lighter) */}
                <rect
                  x={x} y={H - peakH}
                  width={BAR_W} height={peakH}
                  fill="rgba(0,200,240,0.18)"
                  rx="2"
                />
                {/* Avg bar (solid) */}
                <rect
                  x={x + 4} y={H - avgH}
                  width={BAR_W - 8} height={avgH}
                  fill="rgba(0,200,240,0.7)"
                  rx="2"
                />
                {/* Peak label */}
                <text
                  x={x + BAR_W / 2} y={H - peakH - 4}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="8"
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {d.peak}
                </text>
                {/* Day label */}
                <text
                  x={x + BAR_W / 2} y={H + 16}
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="9"
                  fontFamily="'Share Tech Mono', monospace"
                >
                  {fmt(d.day)}
                </text>
              </g>
            )
          })}
        </svg>

        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          {[
            { color: 'rgba(0,200,240,0.18)', label: 'peak' },
            { color: 'rgba(0,200,240,0.7)',  label: 'avg' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 8, background: color, borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
