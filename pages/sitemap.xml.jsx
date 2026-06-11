const DOMAIN =
  process.env.NEXT_PUBLIC_DOMAIN || "https://fivem-stats.vercel.app";

const pages = [
  { path: "/", priority: "1.0", freq: "always" },
  { path: "/uptime", priority: "0.7", freq: "hourly" },
  { path: "/history", priority: "0.7", freq: "hourly" },
  { path: "/heatmap", priority: "0.6", freq: "daily" },
  { path: "/peaks", priority: "0.6", freq: "daily" },
  { path: "/privacy", priority: "0.3", freq: "monthly" },
  { path: "/terms", priority: "0.3", freq: "monthly" },
  { path: "/contact", priority: "0.5", freq: "monthly" },
];

export async function getServerSideProps({ res }) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${DOMAIN}${p.path}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
