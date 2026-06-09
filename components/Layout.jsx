import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Sidebar";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState("3lamjz");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    if (mq.matches) setCollapsed(true);
    const fn = (e) => {
      setIsMobile(e.matches);
      if (e.matches) setCollapsed(true);
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const fetchServers = useCallback(async () => {
    try {
      const r = await fetch("/api/servers");
      const d = await r.json();
      if (Array.isArray(d)) setServers(d);
    } catch {}
  }, []);

  useEffect(() => {
    fetchServers();
    const iv = setInterval(fetchServers, 30000);
    return () => clearInterval(iv);
  }, [fetchServers]);

  function handleToggle() {
    if (isMobile) setSidebarOpen((o) => !o);
    else setCollapsed((o) => !o);
  }

  function handleServerChange(code) {
    setActiveServer(code);
    if (isMobile) setSidebarOpen(false);
    // Dispatch custom event so pages can listen
    window.dispatchEvent(new CustomEvent("serverChange", { detail: { code } }));
  }

  return (
    <div className="app-shell">
      <div
        className={isMobile && sidebarOpen ? "open" : ""}
        style={{ display: "contents" }}
      >
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 39,
            }}
          />
        )}
        <div
          style={{
            ...(isMobile
              ? {
                  position: "fixed",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 40,
                  transform: sidebarOpen
                    ? "translateX(0)"
                    : "translateX(-100%)",
                  transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
                }
              : {}),
          }}
        >
          <Sidebar
            servers={servers}
            activeServer={activeServer}
            onServerChange={handleServerChange}
            collapsed={collapsed && !isMobile}
            onToggle={handleToggle}
          />
        </div>
      </div>

      <div className="app-main">
        {/* Mobile topbar hamburger */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderBottom: "1px solid var(--line)",
              background: "rgba(6,6,6,0.95)",
              position: "sticky",
              top: 0,
              zIndex: 30,
            }}
          >
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Open navigation"
              style={{
                background: "none",
                border: "none",
                color: "var(--text)",
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
                padding: 2,
              }}
            >
              ☰
            </button>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                letterSpacing: "0.1em",
                color: "#fff",
              }}
            >
              FIVEM STATS
            </span>
          </div>
        )}

        {/* Page content — pass activeServer via context-like prop */}
        {typeof children === "function"
          ? children({ activeServer, servers })
          : children}
      </div>
    </div>
  );
}
