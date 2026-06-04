export default function StatCard({
  label,
  value,
  sub,
  highlight = false,
  delay = 0,
}) {
  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${delay}s`,
        background: highlight ? "var(--gold-bg)" : "var(--bg2)",
        border: `1px solid ${highlight ? "rgba(201,168,76,0.25)" : "var(--border)"}`,
        borderRadius: 2,
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.3s, background 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = highlight
          ? "rgba(201,168,76,0.5)"
          : "var(--border2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = highlight
          ? "rgba(201,168,76,0.25)"
          : "var(--border)";
      }}
    >
      {/* Top gold line on highlight */}
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, var(--gold), transparent)",
            opacity: 0.8,
          }}
        />
      )}

      <div
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.18em",
          color: highlight ? "var(--gold-dim)" : "var(--text3)",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: highlight ? 52 : 40,
          fontWeight: 300,
          color: highlight ? "var(--gold2)" : "var(--white)",
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {value ?? "—"}
      </div>

      {sub && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 300,
            color: "var(--text3)",
            marginTop: 10,
            letterSpacing: "0.05em",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
