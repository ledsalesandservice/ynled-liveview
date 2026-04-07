# YNLED LiveView

Camera stream management platform for You Need LED LLC.

Hikvision/LTS cameras → EHome → nginx-rtmp → YouTube Live → embedded on client websites.

## Repository Structure

```
api/          Phase 2 — REST API (Node.js/Express, port 3001, SQLite)
vps/          Phase 1 — VPS setup scripts (nginx-rtmp, ehome-listener, systemd)
dashboard/    Phase 3 — Next.js dashboard (Vercel)
```

## Phase 2 — REST API Quick Start

```bash
cd api
npm install

# Set up environment
cp .env.example .env
# Edit .env — set API_TOKEN to output of: openssl rand -hex 32

node server.js
```

### Endpoints

All routes require `Authorization: Bearer <API_TOKEN>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/cameras | List all cameras |
| POST | /api/v1/cameras | Provision new camera |
| GET | /api/v1/cameras/:id | Get camera details |
| PUT | /api/v1/cameras/:id | Update camera |
| DELETE | /api/v1/cameras/:id | Remove camera |
| POST | /api/v1/cameras/:id/restart | Restart HIKPusher stream |
| GET | /api/v1/cameras/:id/embed | Get YouTube iframe embed code |
| GET | /api/v1/activity | Recent activity log |
| GET | /api/v1/stats | Aggregate stats |
| GET | /api/v1/clients | List clients |
| POST | /api/v1/clients | Add client |
| GET | /api/v1/health | VPS CPU, RAM, uptime, stream count |

### Provision a Camera (Example)

```bash
curl -X POST https://stream.ynled.com/api/v1/cameras \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "YNLED0001",
    "name": "Front Entrance",
    "client": "Margate Boardwalk",
    "yt_key": "xxxx-xxxx-xxxx-xxxx",
    "yt_url": "https://www.youtube.com/watch?v=VIDEOID",
    "destination": "youtube"
  }'
```

### VPS Deployment

```bash
# Copy api/ to VPS
scp -r api/ user@YOUR_VPS_IP:/opt/ynled/api

# On VPS
cd /opt/ynled/api
npm install --production
cp .env.example /opt/ynled/.env
# Edit /opt/ynled/.env — set API_TOKEN, VPS_DOMAIN

# Install systemd service
sudo cp systemd/liveview-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable liveview-api
sudo systemctl start liveview-api
```

## Phase 1 — VPS Build

> Blocked pending: VPS IP, domain name, VPS provider, HIKPusher SDK path.
> See issue YOU-21.

## Phase 3 — Next.js Dashboard

> Starts after Phase 1 & 2 are deployed to VPS.
> See issue YOU-23.
