# Frontend

> **Audience:** developers working on the React single-page application  ·  **Scope:** the `frontend/` workspace: build, routing, authentication state, hooks, dashboard composition, components, charts, constants, and the data adapter

This page describes the Job Tracker frontend as it is built today. It is a Create React App project with no bundler customization, no TypeScript, no charting library, and no state-management library beyond React context. Everything below is cited to a file, and where the code contradicts its own documentation, the code is described and the discrepancy is stated.

## Contents

- [1. Build and toolchain](#1-build-and-toolchain)
- [2. Routing and route protection](#2-routing-and-route-protection)
- [3. Authentication state](#3-authentication-state)
- [4. Custom hooks](#4-custom-hooks)
- [5. Dashboard composition and the settings gate](#5-dashboard-composition-and-the-settings-gate)
- [6. Keyboard shortcuts](#6-keyboard-shortcuts)
- [7. Component inventory](#7-component-inventory)
- [8. Charts without a charting library](#8-charts-without-a-charting-library)
- [9. Constants](#9-constants)
- [10. The data adapter](#10-the-data-adapter)
- [See also](#see-also)

---

## 1. Build and toolchain

The frontend is a Create React App project on `react-scripts` 5. It has not been ejected: `package.json` still declares the four stock scripts (`start`, `build`, `test`, `eject`) and there is no generated webpack or Babel configuration in the workspace (`frontend/package.json:23-28`).

**Table 1.** *Build and runtime facts, each confirmed in the file cited.*

| Fact | Value | Source |
| ---- | ----- | ------ |
| Package name and version | `job-tracking-frontend`, `2.1.0` | `frontend/package.json:2-3` |
| Toolchain | `react-scripts` ^5.0.1, not ejected | `frontend/package.json:21,23-28` |
| React | ^18.2.0 | `frontend/package.json:18` |
| Router | `react-router-dom` ^6.20.1 | `frontend/package.json:20` |
| HTTP client | `axios` ^1.6.2 | `frontend/package.json:17` |
| Charting library | none declared | `frontend/package.json:13-22` |
| Dev proxy | `"proxy": "http://localhost:8080"` | `frontend/package.json:47` |
| Dev dependencies | `jest-axe`, `source-map-explorer` | `frontend/package.json:48-51` |
| Dependency overrides | six pinned transitive packages | `frontend/package.json:5-12` |
| Production image | `node:22-alpine` build stage, `nginx:1.25-alpine` runtime, non-root `USER appuser` | `frontend/Dockerfile:2,19,37` |
| Production API routing | nginx proxies `location /api/` to `http://backend:8080/api/` | `frontend/nginx.conf:45-46` |
| SPA fallback | `try_files $uri $uri/ /index.html` | `frontend/nginx.conf:59` |

### The dev proxy

`frontend/package.json:47` sets `"proxy": "http://localhost:8080"`. That key is honored only by the CRA development server. It lets `npm start` issue same-origin requests to `/api/v1/...` and have them forwarded to a locally running backend, which is why the axios instance never needs an absolute base URL. In production the same relative paths are resolved by nginx instead (`frontend/nginx.conf:45-46`). Nothing in the built bundle knows the backend's host, in either environment.

### The one lazy split point

There is exactly one `React.lazy` call in the application:

```javascript
const JobTracker = lazy(() => import('./Dashboard'));
```

`frontend/src/App.js:16`. It is rendered inside `<Suspense fallback={<DashboardLoader />}>` which is itself inside `<ProtectedRoute>` (`frontend/src/App.js:66-71`), so the dashboard chunk is only requested after the auth gate passes. `DashboardLoader` (`frontend/src/App.js:22-44`) is an inline dark-theme spinner with its `@keyframes spin` injected through a `<style>` tag.

Everything the dashboard imports rides in that chunk: the chart components, `ActivityHeatmap`, `AppTable`, both application modals, `DashboardSettingsModal`, and `useAnalytics`. The public screens (`Home`, `Login`, `Register`), both contexts, `ProtectedRoute`, `services/api.js`, and the constants modules stay in the main bundle. There is no route-level splitting for `/login` or `/register`.

---

## 2. Routing and route protection

`frontend/src/App.js` is the entire shell. Providers nest outside in: `AuthProvider` (`:56`), `KeyboardShortcutProvider` (`:57`), `BrowserRouter` (`:58`), then `<Routes>` (`:60`). `<KeyboardShortcutHelp />` is mounted at `:76`, outside `<Routes>`, so it is present on every route.

**Table 2.** *The five route declarations and which one is gated.*

| Path | Element | Protected | Source |
| ---- | ------- | --------- | ------ |
| `/` | `<Home />` | no | `frontend/src/App.js:61` |
| `/login` | `<Login />` | no | `frontend/src/App.js:62` |
| `/register` | `<Register />` | no | `frontend/src/App.js:63` |
| `/dashboard` | `<ProtectedRoute><Suspense><JobTracker /></Suspense></ProtectedRoute>` | yes | `frontend/src/App.js:64-73` |
| `*` | `<Navigate to="/" />` | no | `frontend/src/App.js:74` |

`/dashboard` is the only protected route. The gate itself is one expression:

```javascript
return isAuthenticated ? children : <Navigate to="/login" />;
```

`frontend/src/components/ProtectedRoute.js:8`. Note the absence of `replace`, so a blocked visit to `/dashboard` leaves a history entry and the browser back button returns to the blocked URL. That is recorded in [known gaps](./11-known-gaps.md).

---

## 3. Authentication state

### The three localStorage keys

The frontend writes exactly three keys. There is no `sessionStorage` use, no cookie handling, and no IndexedDB.

**Table 3.** *Every localStorage key the frontend writes, with its writer, value shape, and readers.*

| Key | Written by | Value | Read by |
| --- | ---------- | ----- | ------- |
| `token` | `AuthContext` login and register (`frontend/src/context/AuthContext.js:37,56`) | the raw token string, no JSON wrapper and no `Bearer` prefix | hydration effect (`frontend/src/context/AuthContext.js:20`); axios request interceptor (`frontend/src/services/api.js:17`) |
| `user` | `AuthContext` login and register (`frontend/src/context/AuthContext.js:38,57`) | `JSON.stringify` of the user object returned by the backend | hydration effect (`frontend/src/context/AuthContext.js:21,25`) |
| `jobtracker-dashboard-settings` | `useDashboardSettings` (`frontend/src/hooks/useDashboardSettings.js:13,113`) | `JSON.stringify` of a flat map of thirteen `componentKey: boolean` pairs | `loadSettingsFromStorage` (`frontend/src/hooks/useDashboardSettings.js:91`) |

Key names for the first two come from the `AUTH` constant, `TOKEN_KEY: 'token'` and `USER_KEY: 'user'` (`frontend/src/constants/api.js:46-50`). The dashboard settings key is exported as `STORAGE_KEY` from the hook.

`token` and `user` are removed in two places: `AuthContext.logout` (`frontend/src/context/AuthContext.js:71-72`) and the axios 401 handler (`frontend/src/services/api.js:29-30`). Dashboard settings are never removed, only overwritten by `resetSettings`.

### Provider behavior

`AuthProvider` holds `user`, `token`, and `loading` (`frontend/src/context/AuthContext.js:15-17`). On mount it reads both auth keys and, if both are present, restores state (`:19-28`). While `loading` is true the provider renders `<div className="loading">Loading...</div>` in place of its children (`:89-91`), so the whole tree is blocked for that first tick.

The context value is:

```javascript
{ user, token, login, register, logout, isAuthenticated: !!token }
```

`frontend/src/context/AuthContext.js:80-87`. `isAuthenticated` is derived purely from the presence of a token string. The frontend never decodes the token, never checks an expiry claim, and has no refresh flow. `logout` clears state and storage, then calls `authAPI.logout()` and swallows any error from it (`:68-78`).

`JSON.parse(storedUser)` at `:25` is not wrapped in a try/catch, so a corrupt `user` value throws inside the mount effect and leaves the application on the loading screen.

### How the token is attached

The axios instance is created with a hardcoded relative base URL and a single default header (`frontend/src/services/api.js:5-13`). The request interceptor attaches the token on every request:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH.TOKEN_KEY);
  if (token) {
    config.headers[API_CONFIG.REQUEST.HEADERS.AUTHORIZATION] = `${AUTH.BEARER_PREFIX}${token}`;
  }
  return config;
});
```

`frontend/src/services/api.js:16-22`. The header name is `Authorization` and the prefix is `'Bearer '` with a trailing space, both from `frontend/src/constants/api.js:33,49`. The interceptor reads localStorage rather than React state, so the token that goes out on the wire is always the persisted one.

`API_CONFIG.REQUEST.TIMEOUT` is defined as 30000 (`frontend/src/constants/api.js:30`) but is never passed to `axios.create`, so requests have no client-side timeout.

### The 401 response interceptor

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      localStorage.removeItem(AUTH.TOKEN_KEY);
      localStorage.removeItem(AUTH.USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

`frontend/src/services/api.js:25-35`. This is the entire token-expiry story. There is no refresh exchange, no retry, and no request queueing. 403 is not handled at all; only 401 triggers the clear-and-redirect. `HTTP_STATUS.UNAUTHORIZED` is the only member of that constant referenced anywhere in `src`.

> [!WARNING]
> The interceptor fires on **any** 401, including the 401 that a failed login itself returns. `POST /api/v1/auth/login` with a wrong password returns a correct error body, but the interceptor clears both storage keys and assigns `window.location.href = '/login'` before the UI can react. That assignment is a full page navigation, so the error state written at `frontend/src/components/Login.js:36` is destroyed before the message at `frontend/src/components/Login.js:112` can render. Submitting a wrong password therefore reloads the login page with no visible error. This is a defect, recorded in [known gaps](./11-known-gaps.md).

---

## 4. Custom hooks

Three hooks live in `frontend/src/hooks`. The barrel (`frontend/src/hooks/index.js:6-8`) re-exports `useKeyboardShortcuts`, `useAnalytics`, `useDashboardSettings`, `DASHBOARD_COMPONENTS`, and `STORAGE_KEY`.

**Table 4.** *The three custom hooks and their exact return shapes.*

| # | Hook | Signature | Returns |
| - | ---- | --------- | ------- |
| 1 | `useKeyboardShortcuts` (`frontend/src/hooks/useKeyboardShortcuts.js:88`) | `(shortcuts, options = {})`, where `options.enabled` defaults to `true` (`:89`) | nothing (`undefined`). It is a side-effect hook that attaches a `keydown` listener to `document` (`:133-139`). |
| 2 | `useAnalytics` (`frontend/src/hooks/useAnalytics.js:141`) | `(options = {})`, destructured as `{ year, staleDays = 14 }` (`:142`) | `{ metrics, countsByStatus, salaryDistribution, activityHeatmap, timePatterns, stageDurations, transitionMatrix, funnelAnalytics, healthIndicators, companyInsights, locationInsights, positionInsights, loading, error, refetch }` (`:269-285`). The twelve data slices are each `null` until their request resolves; `loading` starts `true`; `refetch` is `fetchAnalytics`. Also available as the module default export (`:288`). |
| 3 | `useDashboardSettings` (`frontend/src/hooks/useDashboardSettings.js:144`) | takes no arguments | `{ settings, isComponentVisible, toggleComponent, resetSettings, areAllHidden, componentDisplayNames }` (`:197-204`). `settings` is a `componentKey: boolean` map; `isComponentVisible(key)` is a strict `=== true` test (`:155`); `toggleComponent(key)` silently ignores keys not in the defaults (`:167-169`); `areAllHidden` is a memoized "every value falsy" (`:193-195`); `componentDisplayNames` is the module-private display-name map (`:43-57`). |

### Notes on each

**`useKeyboardShortcuts`** matches an event against the `shortcuts` array in array order, comparing `event.key` with an exact case-sensitive string equality (`:98`). If a shortcut declares `meta`, `ctrl`, or `cmdOrCtrl`, the modifiers must match (`:101-102`, helpers at `:65-67,75-86`). If it declares no modifier, no modifier check runs at all: the `else` branch is a comment with no code (`:103-107`). When the event target is an input, textarea, select, or contenteditable element, the shortcut is skipped unless its key is `Escape` or it requires a modifier (`:113-120`). Only the first match fires, because the loop `break`s after calling the handler (`:128-129`).

**`useAnalytics`** issues twelve requests and settles them independently, so a single failing endpoint sets only its own slice to `null`. The top-level `error` is populated only when all twelve fail. `refetch` exists but the dashboard does not destructure it (`frontend/src/Dashboard.jsx:114-128`), so analytics are not refreshed after a create, update, or delete. The dashboard also drops `error` and `stageDurations` from the same destructure.

**`useDashboardSettings`** loads from localStorage by spreading the stored map over the defaults (`:98`), so a component added in a later release picks up its default rather than being treated as hidden. A parse failure logs a warning and falls back to the defaults (`:99-103`). `areAllHidden` is returned but nothing in the application consumes it.

---

## 5. Dashboard composition and the settings gate

`frontend/src/Dashboard.jsx` exports `JobTracker` (`:55`) and holds the whole authenticated experience: fetching, keyboard shortcuts, CRUD orchestration, and layout.

Applications load once on mount through `jobApplicationsAPI.getAll(0, 100)` (`:203`). Page and size are hardcoded, the response is unwrapped as `response.data.content || response.data || []` to tolerate either a Spring `Page` or a bare array, and each record is mapped through `toUIFormat` (`:204-205`). There is no pagination anywhere in the UI, so a user with more than 100 applications sees a silently truncated table while the backend-computed analytics still reflect the full set.

While the application fetch is in flight the dashboard returns only a full-page spinner (`:275`). That is separate from `analyticsLoading`, so the shell appears as soon as applications arrive and the charts fill in afterward.

### What the settings gate controls

Every chart and the stat-card block is wrapped in `isComponentVisible('<key>')` from `useDashboardSettings`. Each grid row is additionally gated on the boolean OR of its children so an empty row is never rendered.

**Table 5.** *The thirteen toggleable components, their display names, and their shipped defaults.*

| Key | Display name | Default |
| --- | ------------ | ------- |
| `statCards` | Stat Cards | `true` |
| `stageFunnel` | Stage Funnel | `true` |
| `salaryRangeChart` | Salary Range Chart | `true` |
| `maxTimePerStageChart` | Max Time Per Stage | `true` |
| `dayOfWeekBar` | Day of Week Chart | `true` |
| `hourBar` | Hour Distribution Chart | `true` |
| `activityHeatmap` | Activity Heatmap | `true` |
| `companyInsights` | Company Insights | `true` |
| `locationInsights` | Location Insights | `true` |
| `positionInsights` | Position Insights | `true` |
| `statusTransitionHeatmap` | Status Transition Heatmap | `false` |
| `funnelAnalytics` | Funnel Analytics | `false` |
| `applicationHealthDashboard` | Application Health Dashboard | `false` |

Keys are declared at `frontend/src/hooks/useDashboardSettings.js:21-35`, display names at `:43-57`, defaults at `:68-82`.

Three views default to hidden: the status transition heatmap, funnel analytics, and the application health dashboard. The reason is written into the code as a comment at `frontend/src/hooks/useDashboardSettings.js:59-65`: the advanced views are opt-in so that a first-run dashboard stays readable, because they only become meaningful once a user has accumulated enough applications to show a trend. On a fresh account those three panels would render empty or near-empty grids, which is why they are off until the user turns them on in the settings modal.

The applications table is deliberately not toggleable. It has no key in `DASHBOARD_COMPONENTS`, it is rendered unconditionally (`frontend/src/Dashboard.jsx:682-691`), and the settings modal states this in its footer.

### Render order

**Table 6.** *Dashboard sections in DOM order, with the setting that gates each.*

| # | Section | Gate | Source |
| - | ------- | ---- | ------ |
| 1 | Header and error banner | always rendered | `frontend/src/Dashboard.jsx:388-493` |
| 2 | Stat cards | `statCards` | `frontend/src/Dashboard.jsx:496` |
| 3 | `StageFunnel`, `SalaryRangeChart`, `MaxTimePerStageChart` | OR of the three keys | `frontend/src/Dashboard.jsx:561,563,570,577` |
| 4 | `CompanyInsights`, `LocationInsights`, `PositionInsights` | OR of the three keys | `frontend/src/Dashboard.jsx:584,586,593,600` |
| 5 | `StatusTransitionHeatmap`, `FunnelAnalytics`, `ApplicationHealthDashboard` | OR of the three keys | `frontend/src/Dashboard.jsx:611,613,620,627` |
| 6 | `DayOfWeekBar`, `HourBar` | OR of the two keys | `frontend/src/Dashboard.jsx:638,640,647` |
| 7 | `ActivityHeatmap` | `activityHeatmap` | `frontend/src/Dashboard.jsx:658` |
| 8 | `AppTable` | never gated | `frontend/src/Dashboard.jsx:682-691` |
| 9 | Keyboard shortcut hint | always rendered | `frontend/src/Dashboard.jsx:693-702` |
| 10 | `ApplicationModal` | `editing` is truthy | `frontend/src/Dashboard.jsx:705-713` |
| 11 | `ApplicationViewModal` | `viewing` is truthy | `frontend/src/Dashboard.jsx:715-721` |
| 12 | `DashboardSettingsModal` | always mounted, self-gates on `isOpen` | `frontend/src/Dashboard.jsx:723-736` |

The settings modal lists chart toggles in `Object.values(DASHBOARD_COMPONENTS)` order (`frontend/src/components/settings/DashboardSettingsModal.jsx:259-261`), which places the day-of-week and hour charts before the insights row. The dashboard renders the insights row first (Table 6, rows 4 and 6). The two orders do not match.

### Danger Zone

Below the toggles, the settings modal renders a Danger Zone with the two bulk deletes (`DashboardSettingsModal.jsx:400-436`). Each row is disabled when it would delete nothing: the non-active row when `nonActiveCount` is `0`, the delete-all row when `totalApps` is `0`.

Clicking either row opens a `ConfirmDeleteModal` rather than deleting immediately. The confirm phrase differs by severity, `DELETE ALL` for everything and `DELETE` for the non-active subset, so muscle memory from one cannot fire the other.

Three details in this interaction are easy to get wrong and are worth naming:

- **The confirmations are nested inside the settings backdrop**, which closes the settings modal on click. Without intervention every click inside a confirmation would bubble up and dismiss the modal underneath it. A wrapper stops propagation (`DashboardSettingsModal.jsx:486-490`).
- **Failure keeps the confirmation open.** `confirmDeletion` closes the dialog only when the handler resolves (`DashboardSettingsModal.jsx:247-256`); a rejected handler leaves it open so the error stays on screen. This is why `Dashboard.jsx` re-throws after setting `deleteError` (`:246`, `:263`).
- **The typed phrase resets on close**, via an effect keyed on `isOpen` (`ConfirmDeleteModal.jsx:52-57`). Reopening a confirmation always starts guarded.

The dashboard owns the data side. `nonActiveCount` is refetched every time the settings modal opens (`Dashboard.jsx:214-226`) rather than being kept in sync continuously, since applications change status while the modal is closed. On success each handler updates local state optimistically instead of refetching the list: delete-all empties `apps`, and the non-active delete filters against `NON_ACTIVE_STATUSES` (`Dashboard.jsx:257`). Both then call `refetchAnalytics`.

That filter is a second, independent definition of "non-active" living in `frontend/src/constants/statuses.js:123`. The server-side `NON_ACTIVE_STATUSES` decides what is actually deleted; the frontend copy only decides which rows disappear from the table without a refetch. If the two drift, the table will disagree with the database until the next load.

---

## 6. Keyboard shortcuts

`KeyboardShortcutContext` registers no key handlers. It holds the help modal's open state and a hand-maintained `SHORTCUT_DEFINITIONS` array that exists solely to render that modal (`frontend/src/context/KeyboardShortcutContext.js:40-68`). All real key handling happens at four `useKeyboardShortcuts` call sites:

1. `frontend/src/Dashboard.jsx:276`, enabled when `!editing && !viewing && !loading` (`:289`)
2. `frontend/src/components/KeyboardShortcutHelp.js:166`, enabled when `isHelpOpen` (`:168`)
3. `frontend/src/components/modal/ApplicationModal.jsx:83`, enabled when `!!app` (`:87`)
4. `frontend/src/components/modal/ApplicationViewModal.jsx:158`, enabled when `!!app` (`:160`)

**Table 7.** *Every shortcut actually registered, taken from the four call sites rather than from the help modal's list.*

| Key or chord | Action | Active when | Source |
| ------------ | ------ | ----------- | ------ |
| `n` | Open the New Application modal | dashboard, no modal open, after applications load | `frontend/src/Dashboard.jsx:277` |
| `/` | Focus the table search input | same | `frontend/src/Dashboard.jsx:278` |
| `?` | Toggle the keyboard shortcut help modal | same | `frontend/src/Dashboard.jsx:279` |
| `Escape` | Close the edit modal, else the view modal, else clear the row selection | same | `frontend/src/Dashboard.jsx:280` |
| `j` | Select the next table row | same | `frontend/src/Dashboard.jsx:281` |
| `ArrowDown` | Select the next table row | same | `frontend/src/Dashboard.jsx:282` |
| `k` | Select the previous table row | same | `frontend/src/Dashboard.jsx:283` |
| `ArrowUp` | Select the previous table row | same | `frontend/src/Dashboard.jsx:284` |
| `Enter` | Open the read-only view modal for the selected row | same | `frontend/src/Dashboard.jsx:285` |
| `e` | Open the edit modal for the selected row | same | `frontend/src/Dashboard.jsx:286` |
| `Delete` | Delete the selected row, after a browser confirm | same | `frontend/src/Dashboard.jsx:287` |
| `Backspace` | Delete the selected row, after a browser confirm | same | `frontend/src/Dashboard.jsx:288` |
| `Cmd+Enter` or `Ctrl+Enter` | Save and close | while the create or edit modal is open | `frontend/src/components/modal/ApplicationModal.jsx:84` |
| `Cmd+S` or `Ctrl+S` | Save and close | while the create or edit modal is open | `frontend/src/components/modal/ApplicationModal.jsx:85` |
| `Escape` | Cancel and close | while the create or edit modal is open | `frontend/src/components/modal/ApplicationModal.jsx:86` |
| `Escape` | Close the read-only view modal | while the view modal is open | `frontend/src/components/modal/ApplicationViewModal.jsx:159` |
| `Escape` | Close the help modal | while the help modal is open | `frontend/src/components/KeyboardShortcutHelp.js:167` |

No shortcuts are registered on `/`, `/login`, or `/register`. Pressing `?` on those routes does nothing, even though `<KeyboardShortcutHelp />` is mounted there.

The save chord is registered with `key: 's'` in lowercase (`frontend/src/components/modal/ApplicationModal.jsx:85`) and matching is case-sensitive, so `Cmd+Shift+S`, which produces `event.key === 'S'`, does not match.

### Where the displayed help list has drifted

The help modal renders `SHORTCUT_DEFINITIONS` verbatim. That array is a hand-maintained duplicate of the registrations, and nothing derives it from them, so it can go stale without any test failing.

**Table 8.** *The help modal's displayed rows compared with what is registered.*

| Group in the modal | Displayed key | Displayed description | Registered? |
| ------------------ | ------------- | --------------------- | ----------- |
| Global | `n` | Open new application modal | yes |
| Global | `/` | Focus search input | yes |
| Global | `?` | Show keyboard shortcuts help | yes |
| Global | `Escape` | Close modal / clear selection | yes |
| Modal | `Cmd/Ctrl + Enter` | Save and close | yes |
| Modal | `Cmd/Ctrl + S` | Save and close | yes |
| Modal | `Escape` | Cancel and close | yes |
| Table Navigation | `j / ArrowDown` | Select next row | yes |
| Table Navigation | `k / ArrowUp` | Select previous row | yes |
| Table Navigation | `Enter` | View selected application | yes |
| Table Navigation | `e` | Edit selected application | yes |
| Table Navigation | `Delete` | Delete selected (with confirm) | yes |
| (absent) | `Backspace` | Delete selected (with confirm) | **registered but not displayed** |

Displayed rows are at `frontend/src/context/KeyboardShortcutContext.js:44-47,53-55,61-65`. The one drift is `Backspace`: it is a live shortcut (`frontend/src/Dashboard.jsx:288`) and it deletes the selected application, but the Table Navigation group does not list it. Users pressing `Backspace` outside an input field on the dashboard will trigger a delete confirmation that the help screen never told them about.

Two further behaviors follow from the matching algorithm and are worth knowing when reading Table 7:

- Because unmodified shortcuts skip the modifier check entirely (`frontend/src/hooks/useKeyboardShortcuts.js:103-107`), `Cmd+N` and `Ctrl+N` fire the plain `n` shortcut, and `Cmd+E` and `Ctrl+E` fire the plain `e` shortcut. Both are registered with `preventDefault: true`, so the browser's native behavior is suppressed and the application modal opens instead.
- While the help modal is open, the dashboard's shortcuts are still enabled, because they gate only on `editing`, `viewing`, and `loading`. One `Escape` press therefore both closes the help modal and clears the table row selection.

Both are recorded in [known gaps](./11-known-gaps.md).

---

## 7. Component inventory

**Table 9.** *Files at the root of `frontend/src`.*

| File | Purpose |
| ---- | ------- |
| `index.js` | Mounts the app with `createRoot` into `#root`, wrapped in `StrictMode`. |
| `App.js` | Providers, router, five routes, the single lazy split, the always-mounted help modal. |
| `Dashboard.jsx` | The authenticated experience: fetching, shortcuts, settings-gated layout, CRUD orchestration. |
| `index.css` | Light-theme global CSS used by the public screens. The dashboard injects its own dark theme inline. |
| `setupTests.js` | Imports `@testing-library/jest-dom`. |

**Table 10.** *Components directly under `frontend/src/components`.*

| File | Purpose |
| ---- | ------- |
| `Home.js` | Public landing page; redirects an authenticated visitor to `/dashboard`. |
| `Login.js` | Email and password form. |
| `Register.js` | First name, last name, email, and password form. |
| `ProtectedRoute.js` | Auth gate: renders children or navigates to `/login`. |
| `KeyboardShortcutHelp.js` | The `?` help modal, rendering `SHORTCUT_DEFINITIONS` as grouped key badges. |
| `ActivityHeatmap.jsx` | Year-long contribution grid with hover tooltip and legend. |

**Table 11.** *`frontend/src/components/common`, barrel at `common/index.js`.*

| File | Purpose |
| ---- | ------- |
| `StatCard.jsx` | Dark stat tile with an accent bar, label, large value, optional sub text, and shimmer placeholders while loading. |
| `Badge.jsx` | Status pill colored from `STATUS_COLORS` and labeled from `STATUS_LABELS`. |
| `ConfirmDeleteModal.jsx` | Type-to-confirm dialog for destructive actions. Holds the typed phrase in local state and enables its confirm button only on an exact match; resets that state whenever it closes. Used twice by `DashboardSettingsModal`. |

There is no shared `Modal.jsx` in this directory. Every modal in the app builds its own backdrop and dialog element inline, `ConfirmDeleteModal` included.

**Table 12.** *`frontend/src/components/charts`, barrel at `charts/index.js`.*

| File | Rendered title | Purpose |
| ---- | -------------- | ------- |
| `ChartContainer.jsx` | none | Shared card chrome for every chart: background, border, radius, optional title, subtitle, and header-right slot. |
| `StageFunnel.jsx` | Pipeline Funnel | Horizontal bars per funnel group, aggregated from `countsByStatus`. |
| `SalaryRangeChart.jsx` | Salary Range Distribution | Scatter plot of minimum against maximum salary with average crosshairs. |
| `MaxTimePerStageChart.jsx` | Max Days in Stage | Longest current-stage dwell time per funnel group. |
| `DayOfWeekBar.jsx` | Applications by Day of Week | Vertical bars from `timePatterns.byDayOfWeek`. |
| `HourBar.jsx` | Applications by Hour | Twenty-four vertical bars from `timePatterns.byHour`. |
| `StatusTransitionHeatmap.jsx` | Status Transitions | From-status by to-status grid with intensity-scaled cells. |
| `FunnelAnalytics.jsx` | Funnel Analytics | Overall success rate, stage conversion bars, drop-off chart, and success by position level. |
| `ApplicationHealthDashboard.jsx` | Application Health | Summary tiles plus stale, hot, and quick-win lists. |
| `CompanyInsights.jsx` | Company Insights | Top companies with response, ghost, and interview rates. |
| `LocationInsights.jsx` | Location & RTO Insights | Top locations plus a return-to-office distribution. |
| `PositionInsights.jsx` | Position Level Insights | Per-level distribution, rates, and salary bands. |
| `TimeInStageChart.jsx` | Time in Current Status (days) | Top applications by days in current status. Exported from the barrel but never rendered. |
| `StageDurationChart.jsx` | Avg. Time Per Stage (days) | Average stage time computed client-side from audit events. Exported from the barrel but never rendered. |

**Table 13.** *Table, modal, and settings components.*

| File | Purpose |
| ---- | ------- |
| `table/AppTable.jsx` | The applications table: search box, filter chips, add button, twelve columns, row selection, conditional scrolling with a sticky header. |
| `table/TableHeader.jsx` | Styled header cell that appends a downward arrow to the active sort column. |
| `modal/ApplicationModal.jsx` | Create and edit form modal. |
| `modal/ApplicationViewModal.jsx` | Read-only detail modal that fetches and renders the per-application audit trail. |
| `modal/AuditTrailTimeline.jsx` | Vertical event timeline, newest first, with per-event-type icons. |
| `modal/JourneyTimeline.jsx` | Per-stage duration bars. Not in the modal barrel and imported by nothing. |
| `settings/DashboardSettingsModal.jsx` | Toggle list for dashboard component visibility, with a reset button and a Danger Zone holding the two bulk deletes. |

**Table 14.** *Non-component modules.*

| File | Purpose |
| ---- | ------- |
| `context/AuthContext.js` | Token and user state, login, register, logout, localStorage persistence. |
| `context/KeyboardShortcutContext.js` | Help modal state plus the static `SHORTCUT_DEFINITIONS` list. |
| `context/ConfigContext.js` | `ConfigProvider` and `useConfig` for backend-driven status and option config. |
| `services/api.js` | The axios instance, both interceptors, and the four API namespaces. |
| `utils/dataAdapter.js` | Backend and UI mapping, date normalization, and a re-export hub for status and color constants. |
| `utils/dateHelpers.js` | `daysBetween`, `getToday`, `timeInStage`, `totalDaysActive`. |
| `utils/formatters.js` | Date, salary, duration, domain, and rate-color formatting. |
| `utils/stageDurationUtils.js` | Stage-duration computation from audit events, consumed only by the two unrendered charts. |
| `test-utils/factories`, `test-utils/helpers` | Fixtures and helpers for the test suite. |

> [!NOTE]
> `Status: not wired.` `ConfigProvider` in `frontend/src/context/ConfigContext.js` is never mounted and `useConfig` is never called, so `configAPI.getStatuses` and `configAPI.getOptions` (`frontend/src/services/api.js:246,255`) are never requested. Statuses, levels, and RTO types come entirely from the hardcoded constants in `frontend/src/constants/statuses.js`, even though a comment in that file directs new code to prefer the backend-driven config.

---

## 8. Charts without a charting library

There is no charting dependency in `frontend/package.json:13-22`: no Recharts, no Chart.js, no D3, no Victory, no Nivo. Every visualization is written by hand.

The split is:

- `SalaryRangeChart.jsx` is the only component that emits an `<svg>` element. It is a scatter plot, so it needs real coordinate mapping: it computes its own axis domains, tick positions, point placement, dashed average crosshairs, and a tooltip rectangle that flips near the chart edges.
- Every other chart is built from styled `div` elements. Bars are div widths or heights, heatmap cells are div backgrounds with an interpolated color, and funnel rows are div rectangles scaled against the maximum count in the series. `ActivityHeatmap.jsx` and `StatusTransitionHeatmap.jsx` are grids of divs, not SVG.

This is a deliberate decision, and it is defensible for what this application draws. None of these charts needs an axis library, a scale library, or a layout algorithm. They are bars, grids, and one scatter plot over data sets that are already aggregated by the backend. A charting library would add roughly a hundred kilobytes of JavaScript to the dashboard chunk, pull its own theming system into a UI that styles everything inline, and make the dark palette in `frontend/src/constants/colors.js` a second source of truth to keep in sync. The costs are real too, and are visible in the code: color-threshold helpers are duplicated in three places, there is no shared axis or tooltip abstraction, and the only shared piece is the card chrome in `ChartContainer.jsx`.

`ChartContainer` accepts exactly `{ title, subtitle, children, headerRight, testId, style }` (`frontend/src/components/charts/ChartContainer.jsx:38-45`). Four charts pass it a `loading` prop as well: `StageFunnel.jsx:48`, `SalaryRangeChart.jsx:85`, `DayOfWeekBar.jsx:62`, and `HourBar.jsx:48`. The container does not destructure it, so the prop is dropped and those four charts show no loading state; they render an empty or zeroed chart until data arrives. The other six charts implement their own loading state inside the container, so the behavior is inconsistent across the dashboard. See [known gaps](./11-known-gaps.md).

---

## 9. Constants

Four modules under `frontend/src/constants`, star-exported through `frontend/src/constants/index.js:1-4`.

**Table 15.** *The four constants modules.*

| Module | Principal exports | Source |
| ------ | ----------------- | ------ |
| `statuses.js` | `APPLICATION_STATUS` (18 keys where key equals value, `:17`), `APPLICATION_STATUSES` (`:43`), `STATUS_LABELS` (`:50`), `STATUS_GROUPS` (`:76`), `RESPONSE_STATUSES` (`:99`), `NON_ACTIVE_STATUSES` (`:123`), `INTERVIEW_STATUSES` (`:134`), `OFFER_STATUSES` (`:149`), `TECHNICAL_STATUSES` (`:163`), `isStatusInGroup` (`:182`), `isTerminalStatus` (`:198`), `LEVEL_TYPES` (`:211`), `LEVEL_LABELS` (`:229`), `RTO_TYPES` (`:247`), `RTO_LABELS` (`:260`) | `frontend/src/constants/statuses.js` |
| `colors.js` | `STATUS_COLORS` (`:13`), `FUNNEL_COLORS` (`:47`), `CHART_COLORS` (`:62`), `RTO_COLORS` (`:97`), `LEVEL_COLORS` (`:111`), `getUrgencyColor` (`:135`), `getDurationColor` (`:152`) | `frontend/src/constants/colors.js` |
| `dashboard.js` | `FUNNEL_GROUPS` (`:18`), `FILTER_OPTIONS` (`:34`), `HOURS` (`:40`), `DAYS` (`:47`), `DAYS_SUNDAY_START` (`:54`), `getDayIndex` (`:67`) | `frontend/src/constants/dashboard.js` |
| `api.js` | `API_CONFIG` (`:2`), `AUTH` (`:46`), `HTTP_STATUS` (`:53`) | `frontend/src/constants/api.js` |

Three facts about this layer are worth stating plainly:

- `constants/dashboard.js` imports `STATUS_GROUPS` from `utils/dataAdapter` rather than from its sibling `constants/statuses.js`, which creates a constants-to-utils-to-constants import loop. It also re-exports `FUNNEL_COLORS`, which the barrel then star-exports a second time.
- `LEVEL_COLORS` and `LEVEL_TYPES` do not agree. `LEVEL_COLORS` carries `LEAD` and `MANAGER`, which are not valid level types, and omits `INTERN` and `C_LEVEL`, which are. `RTO_COLORS` has no entry for `HYBRID_1` even though that is a valid RTO type.
- Several exports are unused outside their own tests: `getDayIndex`, `getUrgencyColor`, `getDurationColor`, `API_CONFIG.BASE_URL`, `API_CONFIG.REQUEST.TIMEOUT`, `API_CONFIG.PAGINATION.MAX_SIZE`, and every `HTTP_STATUS` member except `UNAUTHORIZED`.

---

## 10. The data adapter

`frontend/src/utils/dataAdapter.js` is the boundary between backend payloads and UI objects. Most components import status constants from here rather than from `constants/`, because the adapter re-exports them.

### Why it normalizes timestamps

The backend serializes every timestamp as an ISO-8601 string. Until 2.0.0 it emitted epoch-second decimals, because a hand-built `@Primary ObjectMapper` suppressed the `spring.jackson.*` properties. `convertDate` still accepts every encoding, which is why the change required no frontend edit:

```javascript
export function convertDate(dateValue, fallback = null) {
  if (!dateValue && dateValue !== 0) return fallback;

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  if (typeof dateValue === 'number') {
    return new Date(dateValue * 1000).toISOString();
  }

  if (Array.isArray(dateValue)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue;
    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  return fallback;
}
```

`frontend/src/utils/dataAdapter.js:31-54`. Three encodings are handled: a string passes through unchanged, a number is treated as epoch seconds and multiplied by 1000, and an array is treated as a `LocalDateTime` field list and formatted without a timezone suffix. `parseBackendDate` (`:84-90`) wraps this and returns a `Date`, or `null` when the result is invalid.

The number branch is what keeps the UI working against the current serialization. If the Jackson configuration is ever fixed so timestamps serialize as ISO-8601 strings, the string branch already covers that case and the adapter continues to work unchanged.

### Field mapping

**Table 16.** *`toUIFormat` (`frontend/src/utils/dataAdapter.js:95-121`), backend field to UI field.*

| UI field | Backend field | Fallback |
| -------- | ------------- | -------- |
| `id` | `id` | none |
| `company` | `companyName` | none |
| `role` | `positionTitle` | none |
| `status` | `status` | none |
| `appliedAt` | `appliedDate` | the current time as an ISO string |
| `lastUpdate` | `updatedAt` | `appliedAt` |
| `statusChangedAt` | `statusChangedAt` | `appliedAt` |
| `interviewDate` | `interviewDate` | `null` |
| `salaryMin`, `salaryMax` | same names | passed through unchanged |
| `location`, `jobUrl`, `notes`, `jobDescription`, `contactName`, `contactEmail`, `contactPhone` | same names | `""` |
| `rtoType`, `level` | same names | `null` |

Three more exports complete the boundary:

- `toBackendFormat(form)` (`:182`) builds the create payload, reversing the company and role renames and converting empty strings to `null`. It deliberately omits `statusChangedAt` so the backend stamps it.
- `toBackendFormatForUpdate(form, originalData, statusChanged)` (`:244`) builds the update payload. It always sends the scalar fields, then conditionally includes `appliedDate` when it differs from the original, `interviewDate` when it differs, and `statusChangedAt` only when the status did **not** change and the user edited it directly. When the status did change, `statusChangedAt` is omitted so the backend stamps it.
- `createEmptyApplication()` (`:303`) produces the blank form object used by both the `n` shortcut and the table's add button, with `status` defaulting to `APPLIED` and `appliedAt` to the current time.

---

## See also

- [Architecture](./01-architecture.md) for how the SPA sits against the Spring Boot backend.
- [API reference](./03-api-reference.md) for the endpoints behind `services/api.js`.
- [Security and authentication](./04-security-and-authentication.md) for the server side of the token the request interceptor attaches.
- [Analytics internals](./05-analytics-internals.md) for how the twelve analytics payloads are computed.
- [Testing](./07-testing.md) for the frontend suite and how to run it.
- [Known gaps](./11-known-gaps.md) for the defects referenced from this page.
- [Settings and shortcuts](../user-guide/05-settings-and-shortcuts.md) for the user-facing view of the settings modal and the shortcut list.

*Documentation current as of Job Tracker 2.1.0 (August 2026). Source of truth is the code; report drift as an issue.*
