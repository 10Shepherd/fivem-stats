# FiveM Server Stats — NoPixel Whitelisted

Live player-count tracker for the FiveM server `3lamjz`.
A Next.js dashboard deployed on Vercel, backed by a Neon serverless Postgres
database, with data collected by a cron-driven poller. An optional Discord bot
posts hourly snapshots to a channel.

> **Disclaimer:** This is an independent, community-built tracker. It is **not
> affiliated with, endorsed by, or connected to NoPixel Studios Pty Ltd**. All
> data comes from FiveM's public CFX.re server API.

---

## Stack

| Layer                 | Service                    | Cost          |
| --------------------- | -------------------------- | ------------- |
| Frontend + API routes | Vercel (Next.js 14)        | Free          |
| Database              | Neon (serverless Postgres) | Free (0.5 GB) |
| Cron trigger          | cron-job.org               | Free          |
| Charts                | Recharts                   | —             |
| Discord bot (opt.)    | Railway / Render / Oracle  | Free tier     |

---

## How it works

1. **cron-job.org** hits `/api/poll` on a fixed schedule (every 60s recommended).
2. `/api/poll` fetches the live server data from the CFX.re public API and writes
   a snapshot row into the `snapshots` table in Neon.
3. The dashboard (`pages/index.jsx`) reads from `/api/live`, `/api/history`,
   `/api/peakstats`, and `/api/uptime` and auto-refreshes every 30s.
4. A second weekly cron-job.org entry hits `/api/purge` to delete old rows and
   stay within the Neon free tier.
5. (Optional) the Discord bot in `discord-bot/` posts an hourly embed with the
   current player count and capacity bar.

---

## Setup — step by step

### 1. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech).
2. Create a new project → choose the closest region.
3. Open the **SQL Editor** and run the contents of `setup.sql` to create the
   `snapshots` table.
4. Copy your **DATABASE_URL** connection string. It looks like:
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# In this project folder
npm install
vercel
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).

### 3. Set environment variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Variable             | Value                                               |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | your Neon connection string                         |
| `CRON_SECRET`        | any random string, e.g. `hw_secret_abc123`          |
| `NEXT_PUBLIC_DOMAIN` | your deployed URL (used by `sitemap.xml`), optional |

### 4. Set up the polling cron job

1. Sign up at [cron-job.org](https://cron-job.org).
2. **New cronjob**:
   - **URL**: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/poll`
   - **Schedule**: every 1 minute (60s)
   - **Request method**: GET
   - **Headers** → add a header:
     - Name: `x-cron-secret`
     - Value: the same `CRON_SECRET` you set in Vercel
3. Save and enable.

### 5. Set up the weekly purge cron job

Create a **second** cron-job.org entry to keep the database small:

- **URL**: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/purge`
- **Schedule**: once a week
- **Request method**: GET
- **Headers**: same `x-cron-secret` header as above

`/api/purge` deletes snapshots older than `KEEP_DAYS` (currently **60 days**,
configurable at the top of `pages/api/purge.js`).

Data will start populating within a minute of enabling the poll job. The charts
and heatmaps fill in over the next few hours and days.

---

## Optional: Discord bot

The `discord-bot/` folder contains a standalone bot that posts the live player
count to a Discord channel once an hour.

```bash
cd discord-bot
npm install
cp .env.example .env   # then fill in the values
node bot.js
```

`.env` values:

| Variable             | Where to get it                                      |
| -------------------- | ---------------------------------------------------- |
| `DISCORD_TOKEN`      | Discord Developer Portal → your bot → Token          |
| `DISCORD_CHANNEL_ID` | Right-click the channel in Discord → Copy Channel ID |
| `SITE_URL`           | your deployed Vercel URL                             |

Host it for free on Railway, Render, or the Oracle Cloud Free Tier.

> **Security:** never commit your real `.env`. Only `.env.example` should be in
> version control. Make sure `.env` is listed in `.gitignore`. If a token is
> ever pushed, regenerate it immediately in the Discord Developer Portal.

---

## File structure

```
pages/
  index.jsx              ← main dashboard
  contact.jsx            ← contact form (FormSubmit.co)
  privacy.jsx            ← privacy policy
  terms.jsx              ← terms & conditions
  sitemap.xml.jsx        ← dynamically served sitemap
  _app.js
  _document.js           ← includes skip-to-content link
  api/
    poll.js              ← called by cron-job.org (writes a snapshot)
    purge.js             ← weekly cron — deletes old rows (KEEP_DAYS)
    live.js              ← most recent snapshot + online status
    history.js           ← time-series data for the chart (presets or date range)
    peakstats.js         ← daily peaks, hourly heatmap, busiest day/hour, all-time peak
    uptime.js            ← gap/restart detection + uptime %
    og.js                ← dynamic OG preview image (SVG)
components/
  Nav.jsx
  Footer.jsx
  StatCard.jsx
  PlayerList.jsx
  HourlyHeatmap.jsx
  DailyPeakBar.jsx
  PeakSummary.jsx
  UptimeTracker.jsx
lib/
  db.js                  ← Neon SQL client
styles/
  globals.css
public/
  robots.txt
setup.sql                ← run once in the Neon SQL editor
discord-bot/             ← optional hourly Discord poster (separate package)
  bot.js
  package.json
  .env.example
```

---

## API routes

| Route            | Method | Auth            | Purpose                                          |
| ---------------- | ------ | --------------- | ------------------------------------------------ |
| `/api/poll`      | GET    | `x-cron-secret` | Fetch live data, insert a snapshot               |
| `/api/purge`     | GET    | `x-cron-secret` | Delete snapshots older than `KEEP_DAYS`          |
| `/api/live`      | GET    | —               | Latest snapshot + online flag (stale after 3min) |
| `/api/history`   | GET    | —               | Time-series; `?hours=` or `?from=&to=`           |
| `/api/peakstats` | GET    | —               | Daily/hourly aggregates, busiest day/hour        |
| `/api/uptime`    | GET    | —               | `?days=` (default 7, max 30); uptime % + events  |
| `/api/og`        | GET    | —               | Dynamic OG image as SVG                          |

---

## Customisation

- **Track a different server:** change `SERVER_CODE` in `pages/api/poll.js`,
  `pages/index.jsx`, and `discord-bot/bot.js`.
- **Display name:** change `SITE_NAME` in `pages/index.jsx`.
- **Frontend refresh rate:** adjust `REFRESH_MS` in `pages/index.jsx`
  (default 30000ms / 30s).
- **Data retention:** change `KEEP_DAYS` in `pages/api/purge.js` (default 60).
- **Uptime sensitivity:** change `GAP_MINUTES` in `pages/api/uptime.js`
  (default 5 — gaps larger than this count as downtime).
- **Discord post frequency:** change `POST_INTERVAL_MS` in `discord-bot/bot.js`
  (default 1 hour).

If you'd rather purge in the database directly instead of via the cron route:

```sql
DELETE FROM snapshots WHERE ts < NOW() - INTERVAL '60 days';
```
