export default function HourlyHeatmap({ hourly = [] }) {
  const max = Math.max(...hourly.map(h => h.avg_count || 0), 1)

  // Build a full 24-hour array, filling gaps with 0
  const hours = Array.from({ length: 24 }, (_, i) => {
    const found = hourly.find(h => parseInt(h.hour) === i)
    return { hour: i, avg: found?.avg_count ?? 0, peak: found?.peak_count ?? 0 }
  })

  function cellColor(avg) {
    const ratio = avg / max
    if (ratio === 0) return 'rgba(27,58,86,0.3)'
    if (ratio < 0.25) return 'rgba(0,200,240,0.15)'
    if (ratio < 0.5)  return 'rgba(0,200,240,0.35)'
    if (ratio < 0.75) return 'rgba(0,200,240,0.6)'
    return 'rgba(0,200,240,0.85)'
  }

  const fmt = h => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase',
        }}>
          Activity by hour
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
          7-day avg · UTC
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Hour labels — every 3 hours */}
        <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 0 }}>
          {hours.map((h, i) => (
            <div key={i} style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: i % 3 === 0 ? 'var(--muted)' : 'transparent',
              textAlign: 'center',
            }}>
              {fmt(h.hour)}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'flex', gap: 2 }}>
          {hours.map((h, i) => (
            <div
              key={i}
              title={`${fmt(h.hour)} — avg ${h.avg} players, peak ${h.peak}`}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 2,
                background: cellColor(h.avg),
                transition: 'transform 0.1s',
                cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>low</span>
          {[0.15, 0.35, 0.6, 0.85].map((o, i) => (
            <div key={i} style={{ width: 14, height: 10, borderRadius: 2, background: `rgba(0,200,240,${o})` }} />
          ))}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>high</span>
        </div>
      </div>
    </div>
  )
}
