# OpenClaw Dashboard

Live: https://nanorisk6.github.io/openclaw-dashboard (login "openclaw")

Metrics: SOL price, pipeline health (6/11 OK), treasury % to target.

Tweet button + cards for cron/queue/tweet:* filter (10s refresh).

Local: http://127.0.0.1:5173/index.html (python3 -m http.server 5173)

## Setup
```bash
cd treasury-dashboard
npm i
npm run dev  # Vite 5173
```

## Data
- pipeline_status.json (signals)
- treasury-state.json (balance)
- cron_health.json (jobs/errors)
- queue_depth.json (sessions)

## GitHub Pages
Settings > Pages > main / / (root)

Last update: $(date)


