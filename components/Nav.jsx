import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav({ online, countdown, onSync }) {
  return (
    <nav
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
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 19,
            letterSpacing: "0.14em",
            color: "#fff",
          }}
        >
          NOPIXEL
        </span>
        <span className="pill">stats</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {online != null && (
          <>
            <div
              className={`pill ${online ? "pill-green" : ""}`}
              style={{ gap: 6 }}
            >
              <div
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
              {online ? "online" : "offline"}
            </div>
            {countdown != null && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 300,
                  fontSize: 9,
                  color: "var(--muted2)",
                  letterSpacing: "0.06em",
                }}
              >
                ↻ {countdown}s
              </span>
            )}
            {onSync && (
              <button className="btn" onClick={onSync}>
                sync
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
