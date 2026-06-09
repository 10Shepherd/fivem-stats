# FiveM Stats

Live multi-server player count tracker for FiveM servers. RPStats-style sidebar layout with real-time charts, uptime tracking, peak analytics, and date range filtering. All times displayed in the visitor's local timezone.

**Live demo:** your Vssercel URL  
**Tracking:** server `3lamjz` (NoPixel Whitelisted) by default

---

## Stack

| Layer                 | Service                        | Cost          |
| --------------------- | ------------------------------ | ------------- |
| Frontend + API routes | Vercel                         | Free          |
| Database              | Neon (serverless Postgres)     | Free (0.5 GB) |
| Polling cron          | cron-job.org                   | Free          |
| Discord bot           | Self-hosted (Railway / Render) | Free tier     |

---

## Features

- **Multi-server** — track unlimited servers; switch between them in the sidebar
- **Sidebar layout** — collapsible on desktop, slide-in overlay on mobile
- **Live player count** — polls every 30 seconds
- **Player count chart** — 1H / 6H / 24H / 7D presets + custom date range
- **Timezone-aware** — all chart times shown in the visitor's local timezone
- **Uptime tracker** — 7-day hourly heatmap (7 rows × 24 cells), incident log
- **Peak insights** — busiest day, peak hour, all-time peak
- **Daily peak bar chart** — 7-day overview
- **Hourly activity heatmap** — weekly pattern visualization
- **Auto-purge** — removes snapshots older than 60 days (weekly cron)
- **OG image** — dynamic social preview with live player count
- **SEO** — sitemap.xml, robots.txt
- **Discord bot** — hourly embed with capacity bar + player count in bot presence

---

## Setup

### 1. Neon database

1. Sign up at [neon.tech](https://neon.tech) → create a project
2. Open **SQL Editor** → paste and run `setup.sql`
3. Copy your `DATABASE_URL` (pooler connection string)

### 2. Deploy to Vercel

```bash
npm install
vercel
```

Or push to GitHub → import at [vercel.com/new](https://vercel.com/new).

### 3. Environment variables

Add these in Vercel → Settings → Environment Variables:

| Variable             | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| `DATABASE_URL`       | Neon pooler connection string                         |
| `CRON_SECRET`        | Any random string e.g. `hw_abc123`                    |
| `NEXT_PUBLIC_DOMAIN` | Your Vercel URL e.g. `https://fivem-stats.vercel.app` |

### 4. cron-job.org — poll (every 1 minute)

1. Sign up at [cron-job.org](https://cron-job.org)
2. New cronjob:
   - **URL:** `https://your-site.vercel.app/api/poll`
   - **Schedule:** every 1 minute
   - **Method:** GET
   - **Header:** `x-cron-secret: your_CRON_SECRET_value`

### 5. cron-job.org — purge (weekly)

Add a second cronjob:

- **URL:** `https://your-site.vercel.app/api/purge`
- **Schedule:** every Monday at 00:00
- **Header:** same `x-cron-secret`

---

## Multi-server

### Add a server via the UI

Visit `/add-server` on your site. Enter the CFX code, verify it's reachable, set a display name, and submit.

### Add a server via SQL (Neon SQL Editor)

```sql
INSERT INTO servers (code, name, tags, color)
VALUES ('CFXCODE', 'Server Display Name', ARRAY['tag1'], '#3ddc84');
```

### Remove a server

```sql
UPDATE servers SET active = FALSE WHERE code = 'CFXCODE';
```

The poll API automatically polls all `active = TRUE` servers on every cron tick.

---

## Discord bot

```bash
cd discord-bot
cp .env.example .env
# Fill in DISCORD_TOKEN, DISCORD_CHANNEL_ID, SITE_URL
npm install
npm start
```

Host free on [Railway](https://railway.app) or [Render](https://render.com).

**Setup:**

1. Create a bot at [discord.com/developers](https://discord.com/developers)
2. Add bot to your server with `Send Messages` permission
3. Right-click your stats channel → Copy Channel ID → paste in `.env`

---

## File structure

```
pages/
  index.jsx              ← main dashboard
  add-server.jsx         ← add a new server to track
  contact.jsx
  privacy.jsx
  terms.jsx
  sitemap.xml.jsx
  api/
    poll.js              ← cron target: polls all active servers
    live.js              ← most recent snapshot for one server
    history.js           ← time-series data with bucket-aware labels
    peakstats.js         ← daily peaks + hourly heatmap + busiest day/hour
    uptime.js            ← gap detection + 7-day uptime %
    servers.js           ← list / add / remove servers
    purge.js             ← weekly cleanup of old snapshots
    og.js                ← dynamic OG image with live count

components/
  Layout.jsx             ← app shell with sidebar + mobile hamburger
  Sidebar.jsx            ← collapsible sidebar with server switcher
  HourlyHeatmap.jsx
  DailyPeakBar.jsx
  UptimeTracker.jsx      ← 7×24 uptime grid + incident log
  PeakSummary.jsx
  Footer.jsx
  Nav.jsx                ← used by legal/contact standalone pages

lib/
  db.js                  ← Neon SQL client

discord-bot/
  bot.js                 ← hourly Discord embed poster
  package.json
  .env.example

public/
  robots.txt

setup.sql                ← run once in Neon: creates tables, indexes, seeds server
```

---

## API reference

| Endpoint                    | Params                                         | Description                                   |
| --------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `GET /api/servers`          | —                                              | List all active servers with live counts      |
| `POST /api/servers`         | `{code,name,tags,color}` + secret header       | Add a server                                  |
| `DELETE /api/servers?code=` | secret header                                  | Deactivate a server                           |
| `GET /api/live`             | `?server=CODE`                                 | Latest snapshot for one server                |
| `GET /api/history`          | `?server=CODE&hours=N` or `&from=DATE&to=DATE` | Time-series data                              |
| `GET /api/peakstats`        | `?server=CODE`                                 | Daily peaks, hourly heatmap, busiest day/hour |
| `GET /api/uptime`           | `?server=CODE&days=N`                          | Gap detection, uptime %, incident log         |
| `GET /api/poll`             | secret header                                  | Trigger a manual poll of all servers          |
| `GET /api/purge`            | secret header                                  | Delete snapshots older than 60 days           |
| `GET /api/og`               | `?server=CODE`                                 | Dynamic SVG OG image                          |

---

## Timezone

All chart timestamps are converted to the **visitor's local timezone** using `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client. The database stores everything in UTC. The current timezone is shown in the chart header and status bar.

## Data retention

Snapshots older than **60 days** are deleted by the weekly purge cron. With one server polled every 60 seconds, that's ~86,400 rows/month — well within Neon's 0.5 GB free tier.

## Contact form

In `pages/contact.jsx`, replace `YOUR_EMAIL@gmail.com` with your actual email at:

```js
"https://formsubmit.co/ajax/YOUR_EMAIL@gmail.com";
```
