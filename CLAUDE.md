# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start both frontend and backend (development)
npm run dev

# Start backend only (port 3000)
cd server && node server.js

# Start frontend only (port 5173, proxies /api to localhost:3000)
cd client && npx vite

# Build frontend for production
cd client && npx vite build

# Production start
cd server && NODE_ENV=production node server.js
```

No test framework is configured. Verification is done manually via API calls and browser.

## Architecture

Monorepo with two sub-projects: `client/` (Vue 3 frontend) and `server/` (Express backend). The root `package.json` uses `concurrently` to run both.

### Backend: Three-Layer Pattern

`routes/` → `services/` → `models/` — Routes are thin Express routers that delegate entirely to service functions. Services contain all business logic. Models are thin CRUD wrappers over the storage layer.

### Storage: JSON File (Not a Database)

Current storage is a single JSON file at `data/db.json`, implemented in `server/config/jsonStore.js`. It provides generic CRUD with filtering, sorting, pagination, and auto-increment IDs. **CRUD write operations (create/update/remove) persist immediately** to disk (no debounce), while other writes use a microtask debounce. Atomic writes use temp-file + rename pattern. The original plan was Sequelize + SQLite/PostgreSQL — `server/config/database.js` is a remnant kept for future PostgreSQL migration. To migrate, only the model layer needs replacement.

**Rate limiting** (`server/services/authService.js`) persists to `data/ratelimit.json` (file-based), supporting multi-process deployments. Expired entries are auto-cleaned on each check.

### Report Generation Engine

`server/services/reportService.js` contains the core engine:
- Compares current week vs. previous week per-module per-field
- Anomaly thresholds: >30% for general modules, >20% for cheat module
- Produces two HTML outputs: `summary_content` (key metrics + highlights + alerts) and `detail_content` (full 7-module analysis)
- Field keys are mapped to Chinese labels via `TemplateConfig` table using `getFieldLabelMap()`

### Frontend Data Flow

`src/api/` (Axios wrappers) → `src/stores/` (Pinia) → `src/views/` (pages).

**Auth & API (`src/api/index.js`)**: The Axios instance reads JWT directly from `localStorage` (NOT from Pinia store) to avoid a circular dependency between `api/index.js` ↔ `stores/auth.js`. On 401 responses or expired tokens, it clears localStorage and redirects to `/login` via `window.location.href`. A `isRedirecting` flag prevents duplicate redirects from concurrent 401 responses.

**App startup (`src/App.vue`)**: On mount, if a token exists in localStorage, it calls `GET /api/auth/me` to validate the token. If invalid, clears auth and redirects to `/login` to avoid a flash of the Dashboard.

**Draft save (`src/utils/draft.js`)**: Uses `fetch` + `keepalive: true` in `beforeunload` handler to reliably send draft data even when the page closes. Regular auto-save uses `setInterval` (30s).

### Weekly Period Calculation

Weeks run **Thursday 00:00 to Wednesday 23:59**. This logic is duplicated in `server/utils/weekHelper.js` and `client/src/utils/weekCalc.js` — changes must be synced to both. The cron job (`server/services/cronService.js`) creates new empty reports every Wednesday at 16:00.

## Technical Constraints

- **No TypeScript** anywhere — all `.js` and `.vue` files must be pure JavaScript
- **No UI component library** — TailwindCSS + Font Awesome 4.7 only (matching PRD HTML)
- Custom colors in TailwindCSS: primary (`#2563eb`), success (`#10b981`), warning (`#f59e0b`), danger (`#ef4444`)
- API response format: `{ code: 0, msg: 'success', data: {} }` with pagination as `{ list, total, page, page_size, total_pages }`

## Key Business Rules

- **Report states**: `draft` → `submitted` → `generated` → `published` (can re-edit from generated)
- **RBAC permissions**: admin gets all 7 perms (fill/generate/export/query/manage_user/view_log/config), manager gets 4 (fill/generate/export/query), viewer gets 2 (export/query)
- **Drafts**: 30-second frontend auto-save via `client/src/utils/draft.js`, cleared on submit
- **7 business modules**: road, poi, cheat, speed, camera, value, team — field definitions are in `template_configs` table, not hardcoded

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | System admin |
| manager | manager123 | Production manager |
| viewer | viewer123 | Read-only viewer |

## Important Notes

- **Token flow**: Login → token saved to localStorage by AuthStore → `api/index.js` reads token from localStorage (NOT Pinia) → attaches `Bearer` header → server verifies. This breaks the original circular dependency.
- **JWT dev secret**: Fixed string `weekly-report-dev-secret-key-fixed` (not dependent on `process.pid`), so tokens survive server restarts in dev.
- **RBAC permissions**: Single source of truth at `shared/permissions.json`. Both `client/src/router/index.js` and `server/middleware/auth.js` contain a local copy with sync comments.
- `server/config/database.js` exists but is **unused** — the active storage is `server/config/jsonStore.js`
- `data/db.json` is the live database; ensure gitignore covers it to avoid committing sensitive data
- Operation logging uses `res.on('finish')` in the middleware, which runs after auth middleware sets `req.user`
- The report generation engine writes HTML content (not Markdown) into `summary_content` and `detail_content` fields
