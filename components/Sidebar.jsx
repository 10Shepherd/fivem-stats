import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const MONO = { fontFamily: "var(--font-mono)", fontWeight: 300 };

function fmtAge(s) {
  if (s == null) return "";
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function SidebarLogo({ size = 30 }) {
  return (
    <img
      src="/assets/icon-192.png"
      alt="FiveM Stats"
      width={size}
      height={size}
      style={{ borderRadius: 8, flexShrink: 0, display: "block" }}
    />
  );
}

function NavItem({ href, icon, label, badge }) {
  const router = useRouter();
  const isActive = href
    ? href === "/"
      ? router.pathname === "/"
      : router.pathname.startsWith(href)
    : false;
  const cls = `sidebar-nav-item${isActive ? " active" : ""}`;
  const inner = (
    <>
      <span
        style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 300,
            fontSize: 10,
            color: isActive ? "var(--green)" : "var(--muted)",
            background: isActive
              ? "rgba(61,220,132,0.12)"
              : "rgba(255,255,255,0.05)",
            borderRadius: 5,
            padding: "1px 6px",
          }}
        >
          {badge}
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function NavSection({ label, children }) {
  return (
    <div style={{ padding: "12px 10px 4px" }}>
      <div
        style={{
          ...MONO,
          fontSize: 9,
          color: "var(--sidebar-label)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "0 12px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// Inline remove confirmation panel — shown below the server item
function RemoveModal({ server, onCancel, onRemoved }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!key.trim()) {
      setError("enter admin key");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/servers?code=${server.code}`, {
        method: "DELETE",
        headers: { "x-cron-secret": key },
      });
      if (r.status === 401) {
        setError("wrong admin key");
        setLoading(false);
        return;
      }
      const d = await r.json();
      if (d.ok) onRemoved();
      else {
        setError(d.error || "failed to remove");
        setLoading(false);
      }
    } catch {
      setError("network error");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        margin: "4px 10px 8px",
        padding: "12px 12px",
        background: "rgba(224,85,85,0.06)",
        border: "1px solid rgba(224,85,85,0.2)",
        borderRadius: 8,
      }}
    >
      <div
        style={{ ...MONO, fontSize: 10, color: "var(--red)", marginBottom: 8 }}
      >
        Remove <strong style={{ color: "#fff" }}>{server.name}</strong>?
      </div>
      <input
        type="password"
        placeholder="admin key"
        value={key}
        onChange={(e) => {
          setKey(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        autoFocus
        style={{
          width: "100%",
          background: "var(--bg3)",
          border: `1px solid ${error ? "var(--red)" : "var(--line2)"}`,
          borderRadius: 6,
          padding: "6px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text)",
          outline: "none",
          marginBottom: 6,
        }}
      />
      {error && (
        <div
          style={{
            ...MONO,
            fontSize: 10,
            color: "var(--red)",
            marginBottom: 6,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--red)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            padding: "6px 0",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "removing..." : "confirm"}
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            background: "none",
            border: "1px solid var(--line2)",
            borderRadius: 6,
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            padding: "6px 0",
            cursor: "pointer",
          }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  servers = [],
  activeServer,
  onServerChange,
  collapsed,
  onToggle,
}) {
  const [serversOpen, setServersOpen] = useState(true);
  const [removingCode, setRemovingCode] = useState(null);

  function handleRemoved() {
    setRemovingCode(null);
    window.location.reload();
  }

  const W = collapsed ? 64 : 228;

  return (
    <>
      {!collapsed && (
        <div
          onClick={onToggle}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 39,
          }}
          className="sidebar-overlay"
        />
      )}
      <aside
        aria-label="Sidebar navigation"
        style={{
          width: W,
          minHeight: "100vh",
          flexShrink: 0,
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.22s cubic-bezier(0.22,1,0.36,1)",
          overflow: "hidden",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 40,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "18px 0" : "16px 16px 16px 18px",
            borderBottom: "1px solid var(--sidebar-border)",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <SidebarLogo size={30} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    letterSpacing: "0.1em",
                    color: "#fff",
                    lineHeight: 1.1,
                  }}
                >
                  FIVEM STATS
                </div>
                <div
                  style={{
                    ...MONO,
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  multi-server tracker
                </div>
              </div>
            </Link>
          )}
          {collapsed && <SidebarLogo size={30} />}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 4,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "6px 0",
          }}
        >
          {!collapsed && (
            <>
              <NavSection label="Dashboard">
                <NavItem href="/" icon="⊞" label="Overview" />
                <NavItem href="/uptime" icon="↑" label="Uptime" />
                <NavItem href="/history" icon="◎" label="History" />
              </NavSection>
              <NavSection label="Analytics">
                <NavItem href="/heatmap" icon="▦" label="Heatmap" />
                <NavItem href="/peaks" icon="⋯" label="Peak Stats" />
              </NavSection>
              <NavSection label="Servers">
                <div
                  onClick={() => setServersOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: 12,
                    userSelect: "none",
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    Active servers
                  </span>
                  <span
                    style={{
                      transition: "transform 0.2s",
                      transform: serversOpen ? "rotate(90deg)" : "rotate(0)",
                    }}
                  >
                    ›
                  </span>
                </div>
                {serversOpen &&
                  servers.map((sv) => {
                    const isActive = activeServer === sv.code;
                    const pct =
                      sv.max_players > 0
                        ? Math.round((sv.player_count / sv.max_players) * 100)
                        : 0;
                    const online =
                      sv.age_seconds != null && sv.age_seconds < 180;
                    const isRemoving = removingCode === sv.code;
                    return (
                      <div key={sv.code}>
                        <div
                          onClick={() =>
                            !isRemoving &&
                            onServerChange &&
                            onServerChange(sv.code)
                          }
                          className={`sidebar-server-item${isActive ? " active" : ""}`}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: isActive
                                  ? "var(--green)"
                                  : "var(--text)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 100,
                              }}
                            >
                              {sv.name}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 300,
                                  fontSize: 11,
                                  color: online ? "var(--green)" : "var(--red)",
                                }}
                              >
                                {sv.player_count ?? "—"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRemovingCode(isRemoving ? null : sv.code);
                                }}
                                title={isRemoving ? "Cancel" : "Remove server"}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: isRemoving
                                    ? "var(--red)"
                                    : "var(--muted)",
                                  fontSize: 10,
                                  cursor: "pointer",
                                  padding: "0 2px",
                                  opacity: isRemoving ? 1 : 0.4,
                                  transition: "opacity 0.15s, color 0.15s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.opacity = "1")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.opacity = isRemoving
                                    ? "1"
                                    : "0.4")
                                }
                              >
                                {isRemoving ? "✕" : "✕"}
                              </button>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 2,
                              background: "var(--line2)",
                              borderRadius: 1,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: isActive
                                  ? "var(--green)"
                                  : "var(--muted)",
                                borderRadius: 1,
                                transition: "width 0.8s ease",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 300,
                              fontSize: 9,
                              color: "var(--muted)",
                              marginTop: 3,
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              {sv.code} · {pct}%
                            </span>
                            <span
                              style={{
                                color: online ? "var(--green)" : "var(--muted)",
                              }}
                            >
                              {fmtAge(sv.age_seconds)}
                            </span>
                          </div>
                        </div>
                        {/* Inline remove modal */}
                        {isRemoving && (
                          <RemoveModal
                            server={sv}
                            onCancel={() => setRemovingCode(null)}
                            onRemoved={handleRemoved}
                          />
                        )}
                      </div>
                    );
                  })}
              </NavSection>
              <NavSection label="Other">
                <NavItem href="/about" icon="◈" label="About" />
                <NavItem href="/contact" icon="✉" label="Contact" />
                <NavItem href="/privacy" icon="⚇" label="Privacy" />
                <NavItem href="/terms" icon="§" label="Terms" />
              </NavSection>
            </>
          )}
          {collapsed && (
            <div
              style={{
                padding: "8px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {[
                { href: "/", icon: "⊞", label: "Overview" },
                { href: "/uptime", icon: "↑", label: "Uptime" },
                { href: "/history", icon: "◎", label: "History" },
                { href: "/heatmap", icon: "▦", label: "Heatmap" },
                { href: "/contact", icon: "✉", label: "Contact" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "var(--muted)",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "var(--muted)";
                    }}
                  >
                    {item.icon}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer pulse */}
        {!collapsed && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--sidebar-border)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--green)",
                  animation: "pulseGreen 2s infinite",
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  ...MONO,
                  fontSize: 9,
                  color: "var(--muted)",
                  letterSpacing: "0.06em",
                }}
              >
                live · syncs every 30s
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
