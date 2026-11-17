# Social Media Dashboard

Course starter: React + Vite dashboard. Data comes from static JSON in `public/api/` via axios, so no backend is needed yet.

```bash
npm install
npm run dev
```

## Structure

- `src/api/client.js` – axios instance + one function per endpoint
- `src/hooks/` – `useFetch`, `useDateRange` (shared logic; replaces "mixins")
- `src/hoc/withLoading.jsx` – shared loading/error handling (also replaces "mixins")
- `src/components/` – reusable widgets: cards, charts, tables, calendar, common
- `src/pages/Dashboard.jsx` – composes everything
- Class components `LastUpdated` and `ErrorBoundary` demonstrate lifecycle methods

## Build-out checklist

- [ ] Loading/error states for metric cards
- [ ] Sortable + paginated posts table
- [ ] Real month-grid schedule calendar
- [ ] Date presets (7d / 30d / 90d)
- [ ] Platform filter (Instagram / X / YouTube / LinkedIn)
- [ ] Swap static JSON for a real API
