# Meridian — Personal Operating System

A personal operating system for people pursuing extraordinary goals. Track habits, goals, tasks, reflections, and health data — all in one place, with an AI coach that knows your full history.

Built with React + Vite. Runs entirely in your browser. All data stored locally.

---

## What's inside

- **Today** — Daily command center: habits, tasks, recovery, intentions
- **Goals** — Vision → Year → Quarter → Month hierarchy with progress tracking
- **Habits** — 27-day heatmaps, streaks, completion rates, goal links
- **Tasks** — Eisenhower Matrix + list view, energy tagging, goal links
- **Journal** — Morning & evening reflections with mood/energy tracking
- **Health** — Real WHOOP API integration + manual entry, history charts, correlations
- **Insights** — Goal progress, habit rates, mood trends, life balance wheel
- **AI Coach** — Claude-powered coach with full context of your data
- **Identity** — Mission, ideal self, core values, alignment tracking

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/meridian.git
cd meridian
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

### 2. WHOOP Integration (optional but recommended)

Meridian connects directly to the WHOOP API v1 to pull your real recovery, sleep, HRV, strain, and resting heart rate.

**How to get your WHOOP access token:**

1. Go to [app.whoop.com](https://app.whoop.com) → Profile → Integrations → Developer API
2. Create a new app
3. Generate a Personal Access Token
4. In Meridian → Health → click **Connect WHOOP** → paste your token

Your token is stored only in your browser's localStorage. It never leaves your device.

**What gets pulled:**
- Recovery score
- Sleep duration
- HRV (rmssd)
- Resting heart rate
- Strain score
- 7-day history for each metric

---

### 3. AI Coach

The AI Coach uses the Claude API (Anthropic). It's pre-configured in the app and works out of the box when accessed through Claude.ai.

If you're running this standalone and want the AI Coach to work:

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
2. The app calls `https://api.anthropic.com/v1/messages` directly from the browser

> **Note:** Calling the Anthropic API directly from the browser exposes your API key. For a production deployment, proxy the request through a serverless function (see below).

**Secure API proxy (recommended for self-hosting):**

```js
// api/chat.js (Vercel serverless function)
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
}
```

Then update the fetch URL in `src/App.jsx` (CoachScreen, `send` function):
```js
// Change:
const res = await fetch("https://api.anthropic.com/v1/messages", { ... })
// To:
const res = await fetch("/api/chat", { ... })
// And remove the Content-Type header (keep only the body)
```

Add to your Vercel environment variables:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Deploy

### Vercel (recommended, free)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) — it auto-deploys on every push.

### Netlify

```bash
npm run build
# Drag the `dist/` folder to app.netlify.com/drop
```

Or connect your GitHub repo at [netlify.com](https://netlify.com).

### GitHub Pages

```bash
npm run build
# Push the dist/ folder to the gh-pages branch
# Or use: npx gh-pages -d dist
```

---

## Data & Privacy

- **All data is stored in your browser's `localStorage`** — nothing is sent to any server
- WHOOP tokens stay on your device
- Reflections, habits, goals, and tasks never leave your browser
- The only external calls are: WHOOP API (with your token) and Anthropic API (for the AI coach)

To export your data: open browser DevTools → Application → Local Storage → copy `meridian_v2`

To reset: click your name in the sidebar → Reset

---

## Project structure

```
meridian/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Full application (all screens + logic)
```

---

## Tech stack

- **React 18** — UI
- **Vite 5** — Build tool
- **localStorage** — Persistence (no backend needed)
- **WHOOP API v1** — Health data
- **Anthropic Claude API** — AI coach
- **Google Fonts** — Playfair Display + Inter + DM Mono

---

## Roadmap ideas

- [ ] Export data to JSON/CSV
- [ ] WHOOP webhook auto-sync
- [ ] Weekly email digest (via Resend)
- [ ] PWA / mobile app shell
- [ ] iCloud / Google Drive backup
- [ ] Shared accountability partner view

---

## License

MIT — use it, modify it, make it yours.
