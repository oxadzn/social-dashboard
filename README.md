# Social Media Dashboard

Course project: React + Vite social analytics dashboard. Local mock JSON powers platforms that are not connected. YouTube can be connected through a server-side Google OAuth flow.

```bash
npm install
npm run dev
```

## Connect YouTube

1. In Google Cloud Console, select a project and enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Create an API key restricted to YouTube Data API v3 and an OAuth client ID with application type **Web application**.
3. In the dashboard, choose **Connect YouTube** and enter the API key, OAuth client ID, and client secret. Add the exact authorized redirect URI shown by the form to the OAuth client in Google Cloud.

4. Configure the OAuth consent screen. While the app is in Testing, add the Google account that owns the channel as a test user.
5. Copy `.env.example` to `.env`, generate a random encryption key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it as `YOUTUBE_TOKEN_ENCRYPTION_KEY`. This key is required to encrypt the credentials and tokens saved by the backend; do not change it after setup. `FRONTEND_ORIGINS` is an exact comma-separated origin allowlist for credential changes and disconnect requests; add the origin you use if Vite selects another port.
6. Run `npm run dev` and connect. Google asks for read-only access to the channel and YouTube Analytics. Credentials and tokens are encrypted on the server in `.data/`.

The credentials entered in the dashboard are sent to the backend over the local connection, never saved in browser storage or returned by the API. The credential-configuration endpoint accepts only loopback clients and exact allowlisted frontend origins. Existing `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_REDIRECT_URI` values in `.env` remain supported as a fallback; credentials saved through the form take precedence.

The dashboard uses YouTube Data API v3 for channel details, totals, and statistics for all uploaded videos, regardless of the selected date range. Per-video views, likes, and comment counts come from `videos.list(part=statistics)` and are current lifetime totals. The dashboard requests fresh data on page load and every five minutes; API responses are marked non-cacheable. YouTube Analytics API supplies daily views, likes, comments, subscriber changes, watch time, and average view duration for the selected date range. Analytics can lag behind current video statistics; the engagement chart shows the report's latest date and when the dashboard checked it. No values are fabricated when YouTube does not provide a statistic. Subscriber growth shows daily net subscribers; absolute subscriber count comes from the channel API.

Google OAuth refresh tokens require offline access. During OAuth consent screen Testing, Google can expire refresh tokens after seven days. Publishing the consent app or reconnecting after expiration may be needed. Google may also require OAuth verification before allowing users beyond the configured test users.

This is a single-account local college-project setup, not a multi-user production service. Keep the backend bound to localhost. Localhost HTTP traffic stays on this computer, but it is not encrypted against local malware or a compromised computer. Do not expose the app publicly or to a LAN as-is; before deployment, add application-level authentication and per-user credential/token storage, use HTTPS, set a persistent private encryption key, and host the server and frontend behind one trusted origin.

Official guides:

- [YouTube Data API](https://developers.google.com/youtube/v3)
- [YouTube Analytics API reports](https://developers.google.com/youtube/analytics/reference/reports/query)
- [Google OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## Structure

- `src/api/client.js` – Axios client and API endpoint functions
- `src/hooks/` – data fetching and date range hooks
- `src/components/` – reusable cards, charts, tables, calendar, and connection controls
- `src/pages/Dashboard.jsx` – composes dashboard widgets and live/mock data
- `server/` – OAuth, YouTube API integration, and encrypted token storage

## Build-out checklist

- [ ] Loading/error states for metric cards
- [ ] Sortable + paginated posts table
- [ ] Real month-grid schedule calendar
- [ ] Date presets (7d / 30d / 90d)
- [ ] Platform filter (YouTube / X / LinkedIn)
- [x] Optional YouTube channel connection; local JSON remains the fallback
