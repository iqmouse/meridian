# Meridian — Personal Operating System

Your complete personal OS: habits, goals, journal, calendar, analytics, and WHOOP integration.

## Deploy to Vercel (recommended)

1. Unzip this folder
2. Go to [vercel.com](https://vercel.com) → New Project → "Import" → drag this folder in, or connect via GitHub
3. Vercel auto-detects the static site — click **Deploy**
4. Your Meridian URL will be `https://your-project.vercel.app`

> **Important for WHOOP**: Once deployed, copy your Vercel URL and add it to your WHOOP app's redirect URIs at [developer.whoop.com](https://developer.whoop.com) before connecting.

## Run locally on your laptop

**Option A — simplest (double-click):**
Open `public/index.html` directly in Chrome or Safari.
- All features work except WHOOP OAuth (OAuth redirects require a real URL)
- All data saves to your browser's localStorage

**Option B — local server (enables WHOOP):**
```bash
# Python (built into macOS/Linux)
cd meridian-vercel
python3 -m http.server 8080 --directory public

# Then open: http://localhost:8080
# Add http://localhost:8080 as a redirect URI in your WHOOP app
```

**Option C — Node (if you have it):**
```bash
npx serve public -p 8080
# Then open: http://localhost:8080
```

## What works locally (file://)
- ✅ All 8 screens (Today, Goals, Habits, Journal, Analytics, Calendar, AI Coach, Settings)
- ✅ Add / edit / delete goals, milestones, habits, journal entries, calendar events
- ✅ All data persists in localStorage
- ✅ Export to JSON/CSV
- ✅ Sunset artwork, life wheel, all charts
- ✅ Notification preferences
- ⚠️ WHOOP OAuth — requires a real URL (use Option B or Vercel)
- ⚠️ AI Coach responses are demo replies (real Claude integration requires a backend API key)

## WHOOP Setup
1. Go to [developer.whoop.com](https://developer.whoop.com) → Create app
2. Add your site URL as a redirect URI (e.g. `https://your-project.vercel.app` or `http://localhost:8080`)
3. In Meridian → Settings → WHOOP → paste Client ID + Secret → Connect

## Data
All data is stored in your browser's `localStorage` under `mer_*` keys.  
Use Settings → Export to download backups anytime.
