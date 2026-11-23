# Project Plan

**Status**: Approved
**Created**: 2026-11-23
**Mode**: AUGMENT

---

## 1. Project Overview

**Goal**: Augment the existing React/Vite social media analytics dashboard with clear post engagement and follower-growth reporting, date-range selection, and a usable post-scheduling calendar. Keep the application independently testable and use realistic local mock data.

**App Type**: Static SPA (frontend only; no API)

**API Login**: No

**Mode**: AUGMENT

**Deployment Plan**: Not in scope

---

## 2. Architecture

The application is a client-side React/Vite SPA with no application backend or persistent datastore. Use Axios with the existing local mock JSON files and Recharts for analytics visualizations. The overview dashboard contains the metrics, date range controls, follower and engagement charts, post performance table, and scheduled-post calendar. Do not introduce authentication or replace the current data-generation and mock-data files.

---

## 3. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | JavaScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | Not currently configured |
| **Mocking Library** | Not currently configured |
| **Verification Command** | npm run build |

Retain the current Vite/React application, its Recharts visualizations, Axios-based data access, and local mock JSON. Use React hooks (`useState`, `useEffect`) for date filters, fetching/lifecycle behavior, and calendar interaction. Keep the project client-only: no backend, database, external authentication, or real social-platform credentials. Treat `generate-data.mjs`, existing `public/api/*.json` (including `public/api/platforms.json`), and all other current user files as user-owned; preserve them and do not overwrite or delete them.

---

## 4. External Services

No external services, authentication, or persistent data store are required. Dashboard and schedule data remain in the existing local mock JSON files, and the app runs with the existing Vite development server.

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | frontend | Present in development environment; version not verified | — |
| npm | frontend | Present in development environment; version not verified | — |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Microsoft Edge | frontend | Optional; availability not verified | — |

Double-check any unconfirmed versions before using the browser debugger. No container runtime or Azure dependency emulator is needed for this frontend-only project.

---

## 6. Design System & UI

**Component Library**: Keep existing dependencies; do not add a component library
**Style Direction**: A restrained, professional analytics workspace with warm cream surfaces, sage/olive navigation and chart accents, and subtle brown highlights. Favor compact, scannable information hierarchy and crisp dividers. Avoid ornamental effects, oversized rounding, and excessive shadows.
**Typography**: Inter, system-ui, Segoe UI, sans-serif

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#66775B` | Olive actions, selected navigation, and growth chart |
| `accent` | `#A57955` | Warm brown highlights and secondary engagement series |
| `surface` | `#F6F4ED` | Cream dashboard canvas |
| `text` | `#2D342B` | Main headings, post names, and metric values |
| `muted` | `#77796F` | Supporting labels, dates, and secondary counts |
| `border` | `#E4E0D5` | Card, table, and calendar dividers |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Overview | `/` | Review engagement metrics, follower growth, and recent post performance across a selected date range. | `header, nav, main, grid, two-column(card-list+table)` |
| Scheduling calendar | `/` | Review queued posts and open calendar slots alongside analytics on the dashboard. | `dashboard grid, calendar widget` |

### Sample Content

Overview — post performance:
| Post | Platform | Likes | Comments | Shares | Engagement |
|------|----------|------:|---------:|-------:|-----------:|
| “A slower Sunday, by the garden” | Instagram | 1,284 | 86 | 42 | 6.8% |
| “Three ways we reuse our packaging” | Facebook | 642 | 54 | 71 | 5.2% |
| “Studio notes: the new spring palette” | Instagram | 978 | 63 | 28 | 5.9% |

Follower growth:
| Period | Followers | Net growth |
|--------|----------:|-----------:|
| Nov 10–16 | 24,380 | +214 |
| Nov 17–23 | 24,612 | +232 |
| Current total | 24,612 | +1.0% |

Queued posts:
| Post | Platform | Scheduled | Status |
|------|----------|-----------|--------|
| “Behind the scenes: winter studio” | Instagram | Nov 24, 10:30 AM | Ready |
| “Small rituals for a calmer desk” | Facebook | Nov 25, 1:00 PM | Draft |
| “Meet the makers: Lina’s process” | Instagram | Nov 27, 9:15 AM | Ready |

Calendar focus: show scheduled posts and indicate open days as available slots.

---

## 7. Project Structure

Keep the existing project layout and augment its current `src/` React application. Organize additions into reusable components and page-level views without relocating existing files. Existing local mock data under `public/api/`, `generate-data.mjs`, and all user changes remain intact.

```text
social-dashboard/
├── .azure/
│   └── project-plan.md
├── public/
│   └── api/                         # Preserve existing mock JSON files
├── src/
│   ├── components/                  # Reusable metric cards, charts, tables, widgets
│   ├── pages/
│   │   └── Dashboard.jsx
│   └── ...                          # Retain existing source files and structure
├── generate-data.mjs                # Preserve existing user file
├── index.html
├── package.json
└── vite.config.js
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/` | Render overview metrics, follower trend, and post performance from local mock data | — | Overview SPA view | 200 |
These are client-side SPA routes; no application API endpoints are planned. The schedule calendar is part of the existing dashboard, not a separate required page.

---

## 9. Next Steps

1. After explicit plan approval, run **azure-project-scaffold** to augment the existing frontend according to this plan without replacing user-owned files.
2. Verify the dashboard and schedule against the existing local mock JSON and run the frontend tests.
3. Use **azure-debug-plan** → **azure-debug-generate** if a local VS Code debugging setup is needed.
4. Deployment is outside the scope of this college project.
