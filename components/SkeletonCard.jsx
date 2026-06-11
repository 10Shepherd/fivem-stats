export function SkeletonCard({ height = 80, style = {} }) {
  return (
    <div
      className="skeleton-card"
      style={{ height, borderRadius: 16, ...style }}
    />
  );
}

export function SkeletonKpiGrid() {
  return (
    <div className="kpi-grid" style={{ marginBottom: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} height={110} />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <SkeletonCard height={18} style={{ width: 120, borderRadius: 6 }} />
        <SkeletonCard height={18} style={{ width: 200, borderRadius: 6 }} />
      </div>
      <SkeletonCard height={210} style={{ borderRadius: 0, border: "none" }} />
    </div>
  );
}
