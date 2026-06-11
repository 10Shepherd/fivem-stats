import Link from "next/link";

export default function Nav({ online, countdown, onSync }) {
  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: "1px solid var(--line)",
        background: "rgba(6,6,6,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img
          src="/assets/icon-192.png"
          alt=""
          width={24}
          height={24}
          style={{ borderRadius: 6 }}
        />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 19,
            letterSpacing: "0.14em",
            color: "#fff",
          }}
        >
          FIVEM STATS
        </span>
        <span className="pill" style={{ pointerEvents: "none" }}>
          multi-server
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {online != null && (
          <>
            <div
              className={`pill ${online ? "pill-green" : ""}`}
              style={{ gap: 6 }}
              aria-label={`Server is ${online ? "online" : "offline"}`}
              role="status"
            >
              <div
                aria-hidden="true"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: online ? "var(--green)" : "var(--red)",
                  animation: online
                    ? "pulseGreen 2s infinite"
                    : "blink 2.5s infinite",
                  flexShrink: 0,
                }}
              />
              <span aria-hidden="true">{online ? "online" : "offline"}</span>
            </div>
            {countdown != null && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 300,
                  fontSize: 9,
                  color: "var(--muted)",
                  letterSpacing: "0.06em",
                }}
              >
                ↻ {countdown}s
              </span>
            )}
            {onSync && (
              <button
                className="btn"
                onClick={onSync}
                aria-label="Sync latest server data"
              >
                sync
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
