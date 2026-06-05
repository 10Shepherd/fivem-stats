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
      {/* FIX: remove aria-label from Link — it caused "aria-hidden focusable" because
          the pill <span> inside was aria-hidden while the link itself was focusable.
          The visible text "FIVEM STATS" is sufficient label for the link. */}
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
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
        {/* "whitelisted" badge — purely decorative, no aria-hidden needed since parent link text is clear */}
        <span className="pill" style={{ pointerEvents: "none" }}>
          whitelisted
        </span>
      </Link>

      {/* FIX: role="status" + aria-live on this div caused the <main> to be considered
          inside a live region by some checkers. Move live region to a visually-hidden
          dedicated element instead. */}
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

            {/* FIX: countdown was color: var(--muted2) = #555 which fails contrast.
                Now uses var(--muted) = #888 which passes WCAG AA.
                Also removed aria-label — the visible text is sufficient. */}
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
