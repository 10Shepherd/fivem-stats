import { useState } from 'react'

function pingColor(ping) {
  if (!ping || ping === 0) return 'var(--muted)'
  if (ping < 80)  return 'var(--green)'
  if (ping < 150) return 'var(--yellow)'
  return 'var(--accent2)'
}

export default function PlayerList({ players = [], loading }) {
  const [search, setSearch] = useState('')

  const filtered = players.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
        }}>
          Active roster
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--muted)',
        }}>
          {players.length} connected
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search players..."
          style={{
            width: '100%',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            padding: '5px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text)',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* List */}
      <div style={{ maxHeight: 300, overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            {search ? 'no match' : 'no players online'}
          </div>
        ) : (
          filtered.map((p, i) => (
            <div
              key={p.id ?? i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '7px 16px',
                borderBottom: '1px solid rgba(27,58,86,0.4)',
                transition: 'background 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,200,240,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--muted)',
                width: 28,
                flexShrink: 0,
              }}>
                {p.id}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginLeft: 8,
              }}>
                {p.name || 'Unknown'}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: pingColor(p.ping),
                marginLeft: 8,
                flexShrink: 0,
              }}>
                {p.ping ? `${p.ping}ms` : '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
