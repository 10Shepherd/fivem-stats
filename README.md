# FiveM Server Stats — NoPixel Whitelisted

Live player count tracker for FiveM server `3lamjz`.  
Deployed on Vercel, database on Neon (free tier), polling via cron-job.org.

---

## Stack

| Layer                 | Service                    | Cost          |
| --------------------- | -------------------------- | ------------- |
| Frontend + API routes | Vercel                     | Free          |
| Database              | Neon (serverless Postgres) | Free (0.5 GB) |
| Cron trigger          | cron-job.org               | Free          |

---

## Setup — step by step

### 1. Create Neon database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project → choose the closest region
3. Go to **SQL Editor** and run the contents of `setup.sql`
4. Copy your **DATABASE_URL** connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)

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

| Variable       | Value                                      |
| -------------- | ------------------------------------------ |
| `DATABASE_URL` | your Neon connection string                |
| `CRON_SECRET`  | any random string, e.g. `hw_secret_abc123` |

### 4. Set up cron-job.org

1. Sign up at [cron-job.org](https://cron-job.org)
2. **New cronjob**:
   - **URL**: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/poll`
   - **Schedule**: every 1 minute
   - **Request method**: GET
   - **Headers** → Add header:
     - Name: `x-cron-secret`
     - Value: the same `CRON_SECRET` you set in Vercel
3. Save and enable

That's it. Data will start populating within a minute. The charts will fill in over the next few hours.

---

## File structure

```
pages/
  index.jsx         ← main dashboard
  api/
    poll.js         ← called by cron-job.org every 60s
    live.js         ← returns most recent snapshot
    history.js      ← time-series data for charts
    peakstats.js    ← daily peaks + hourly heatmap data
components/
  StatCard.jsx
  PlayerList.jsx
  HourlyHeatmap.jsx
  DailyPeakBar.jsx
lib/
  db.js             ← Neon SQL client
styles/
  globals.css
setup.sql           ← run once in Neon SQL editor
```

---

## Customisation

- Change `SERVER_CODE` in `pages/index.jsx` and `pages/api/poll.js` to track a different server
- Change `SERVER_NAME` in `pages/index.jsx` for the display name
- Adjust `REFRESH_MS` in `pages/index.jsx` to change how often the frontend auto-refreshes (default 60s)
- The database auto-grows — optionally add a cleanup job in Neon to delete rows older than 30 days:
  ```sql
  DELETE FROM snapshots WHERE ts < NOW() - INTERVAL '30 days';
  ```
