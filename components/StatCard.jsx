export default function StatCard({ label, value, sub, accent = '#00c8f0', delay = 0, large = false }) {
  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${delay}s`,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: accent, opacity: 0.5,
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.2em',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: large ? 36 : 28,
        color: accent,
        lineHeight: 1,
        fontWeight: 400,
      }}>
        {value ?? '--'}
      </div>

      {sub && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 5,
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}
