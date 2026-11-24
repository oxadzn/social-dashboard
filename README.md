# Social Media Dashboard

Course project: React + Vite social analytics dashboard. Local mock JSON powers platforms that are not connected. YouTube can be connected through a server-side Google OAuth flow.

```bash
npm install
npm run dev
```

## Connect YouTube

1. In Google Cloud Console, select a project and enable **YouTube Data API v3** and **YouTube Analytics API**.
2. Create an OAuth client ID with application type **Web application**. Add this exact authorized redirect URI:

   `http://localhost:5173/api/youtube/callback`

3. Configure the OAuth consent screen. While the app is in Testing, add the Google account that owns the channel as a test user.
4. Copy `.env.example` to `.env` and set `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`, and `YOUTUBE_CLIENT_SECRET`. Restrict the API key to YouTube Data API v3 in Google Cloud. The key and OAuth secret are used only by the backend.
5. Keep `YOUTUBE_REDIRECT_URI` exactly matched to the OAuth client redirect above. Generate a random encryption key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and set it as `YOUTUBE_TOKEN_ENCRYPTION_KEY`. Do not change it after a token is saved.
6. Run `npm run dev`, then select **Connect YouTube**. Google asks for read-only access to the channel and YouTube Analytics. The callback stores tokens encrypted in `.data/youtube.enc.json`.

The dashboard uses YouTube Data API v3 for channel details, totals, and statistics for all uploaded videos, regardless of the selected date range. Per-video views, likes, and comments are current lifetime totals. YouTube Analytics API supplies daily views, likes, comments, subscriber changes, watch time, and average view duration for the selected date range. No values are fabricated when YouTube does not provide a statistic. Subscriber growth shows daily net subscribers; absolute subscriber count comes from the channel API.

Google OAuth refresh tokens require offline access. During OAuth consent screen Testing, Google can expire refresh tokens after seven days. Publishing the consent app or reconnecting after expiration may be needed. Google may also require OAuth verification before allowing users beyond the configured test users.

This is a single-account local college-project setup, not a multi-user production service. Before deploying publicly, add application-level user authentication and per-user token storage, use HTTPS, set a persistent private encryption key, and host the server and frontend behind one trusted origin.

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
