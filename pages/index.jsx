import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import StatCard from '../components/StatCard'
import PlayerList from '../components/PlayerList'
import HourlyHeatmap from '../components/HourlyHeatmap'
import DailyPeakBar from '../components/DailyPeakBar'

const SERVER_CODE  = '3lamjz'
const SERVER_NAME  = 'NoPixel Whitelisted'
const REFRESH_MS   = 60_000

// ─── tiny helpers ────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtAge(seconds) {
  if (seconds < 60)  return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  return `${Math.round(seconds / 3600)}h ago`
}

// ─── custom recharts tooltip ─────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: 4,
      padding: '8px 12px',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text)',
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)' }}>{payload[0].value} players</div>
    </div>
  )
}

// ─── range buttons ────────────────────────────────────────────
const RANGES = [
  { label: '1H',  hours: 1  },
  { label: '6H',  hours: 6  },
  { label: '24H', hours: 24 },
  { label: '7D',  hours: 168 },
]

// ─── main component ───────────────────────────────────────────
export default function Dashboard() {
  const [live, setLive]         = useState(null)
  const [history, setHistory]   = useState({ rows: [], summary: {} })
  const [peakStats, setPeakStats] = useState({ daily: [], hourly: [], allTimePeak: 0 })
  const [range, setRange]       = useState(24)
  const [loading, setLoading]   = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const timerRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      const r = await fetch('/api/live')
      const d = await r.json()
      setLive(d)
    } catch {}
  }, [])

  const fetchHistory = useCallback(async (h) => {
    try {
      const r = await fetch(`/api/history?hours=${h}`)
      const d = await r.json()
      if (!d.error) setHistory(d)
    } catch {}
  }, [])

  const fetchPeakStats = useCallback(async () => {
    try {
      const r = await fetch('/api/peakstats')
      const d = await r.json()
      if (!d.error) setPeakStats(d)
    } catch {}
  }, [])

  const refreshAll = useCallback(async (h = range) => {
    await Promise.all([fetchLive(), fetchHistory(h), fetchPeakStats()])
    setLastSync(new Date())
    setLoading(false)
  }, [fetchLive, fetchHistory, fetchPeakStats, range])

  // Initial load + interval
  useEffect(() => {
    refreshAll()
    timerRef.current = setInterval(() => refreshAll(), REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, []) // eslint-disable-line

  // Range change
  useEffect(() => {
    fetchHistory(range)
  }, [range, fetchHistory])

  const online    = live?.online ?? false
  const count     = live?.playerCount ?? 0
  const maxSlots  = live?.maxPlayers ?? 32
  const fillPct   = maxSlots > 0 ? Math.round((count / maxSlots) * 100) : 0
  const summary   = history.summary ?? {}

  // Format chart data
  const chartData = (history.rows || []).map(r => ({
    t: new Date(r.t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    count: r.count,
  }))

  return (
    <>
      <Head>
        <title>{SERVER_NAME} — Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={`Live player stats for ${SERVER_NAME} FiveM server`} />
      </Head>

      {/* ── Top bar ── */}
      <header style={{
        background: 'rgba(11,21,32,0.96)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Status dot */}
          <div style={{ position: 'relative', width: 12, height: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: online ? 'var(--green)' : 'var(--accent2)',
              position: 'absolute', top: 1, left: 1,
              boxShadow: online ? '0 0 6px var(--green)' : '0 0 6px var(--accent2)',
            }} />
            {online && (
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1px solid var(--green)',
                position: 'absolute', top: 1, left: 1,
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
            )}
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 16,
              fontWeight: 700,
              color: '#e8f4ff',
              letterSpacing: '0.08em',
              lineHeight: 1.1,
            }}>
              {SERVER_NAME}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--muted)',
              letterSpacing: '0.15em',
            }}>
              CFX · {SERVER_CODE} · {online ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            synced {lastSync ? fmtTime(lastSync) : '--'}
          </div>
          <button
            onClick={() => refreshAll()}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '5px 14px',
              borderRadius: 3,
              cursor: 'pointer',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(0,200,240,0.08)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'none' }}
          >
            ↻ REFRESH
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── KPI row ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          <StatCard
            label="Players online"
            value={loading ? '...' : count}
            sub={`of ${maxSlots} slots`}
            accent="var(--green)"
            delay={0.05}
            large
          />
          <StatCard
            label="Fill rate"
            value={loading ? '...' : `${fillPct}%`}
            sub={fillPct >= 80 ? 'nearly full' : fillPct >= 50 ? 'moderate' : 'low population'}
            accent="var(--yellow)"
            delay={0.10}
          />
          <StatCard
            label={`${range <= 24 ? range + 'h' : Math.round(range / 24) + 'd'} peak`}
            value={loading ? '...' : (summary.peak ?? '--')}
            sub="max players seen"
            accent="var(--accent)"
            delay={0.15}
          />
          <StatCard
            label={`${range <= 24 ? range + 'h' : Math.round(range / 24) + 'd'} avg`}
            value={loading ? '...' : (summary.avg ?? '--')}
            sub="average concurrents"
            accent="var(--accent)"
            delay={0.20}
          />
          <StatCard
            label="All-time peak"
            value={loading ? '...' : (peakStats.allTimePeak || '--')}
            sub={peakStats.trackingSince ? `since ${new Date(peakStats.trackingSince).toLocaleDateString()}` : 'tracked'}
            accent="var(--accent2)"
            delay={0.25}
          />
          <StatCard
            label="Last update"
            value={live?.lastUpdate ? fmtAge(live.ageSeconds) : '--'}
            sub="data freshness"
            accent="var(--muted)"
            delay={0.30}
          />
        </div>

        {/* ── Chart + Player list ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 12,
          marginBottom: 12,
        }}>
          {/* Chart panel */}
          <div
            className="fade-up fade-up-5"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: '0.2em', color: 'var(--accent)', textTransform: 'uppercase',
              }}>
                Player count history
              </span>

              {/* Range selector */}
              <div style={{ display: 'flex', gap: 4 }}>
                {RANGES.map(r => (
                  <button
                    key={r.hours}
                    onClick={() => setRange(r.hours)}
                    style={{
                      background: range === r.hours ? 'rgba(0,200,240,0.15)' : 'none',
                      border: `1px solid ${range === r.hours ? 'var(--accent)' : 'var(--border)'}`,
                      color: range === r.hours ? 'var(--accent)' : 'var(--muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      padding: '3px 10px',
                      borderRadius: 3,
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 8px 8px', height: 260 }}>
              {chartData.length === 0 ? (
                <div style={{
                  height: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: 'var(--font-mono)',
                  fontSize: 12, color: 'var(--muted)',
                }}>
                  {loading ? 'loading...' : 'no data yet — cron will populate this'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00c8f0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00c8f0" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(27,58,86,0.6)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="t"
                      tick={{ fill: '#4a7a9b', fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#4a7a9b', fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, maxSlots]}
                      width={28}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Max capacity reference line */}
                    <ReferenceLine
                      y={maxSlots}
                      stroke="rgba(255,107,43,0.4)"
                      strokeDasharray="4 4"
                      label={{ value: 'cap', fill: '#4a7a9b', fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#00c8f0"
                      strokeWidth={1.5}
                      fill="url(#areaGrad)"
                      dot={false}
                      activeDot={{ r: 3, fill: '#00c8f0', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Player list */}
          <div className="fade-up fade-up-6">
            <PlayerList players={live?.players ?? []} loading={loading} />
          </div>
        </div>

        {/* ── Bottom row: heatmap + daily bars ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}>
          <HourlyHeatmap hourly={peakStats.hourly} />
          <DailyPeakBar daily={peakStats.daily} maxSlots={maxSlots} />
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            data sourced from fivem public api · refreshes every 60s via cron
          </span>
          <a
            href={`https://cfx.re/join/${SERVER_CODE}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--accent)',
              textDecoration: 'none',
              letterSpacing: '0.1em',
              border: '1px solid var(--border)',
              padding: '4px 12px',
              borderRadius: 3,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
          >
            CONNECT TO SERVER →
          </a>
        </div>
      </main>
    </>
  )
}
