# Changelog

All notable changes to Job Tracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries before 1.3.1 were reconstructed from the git history and the published GitHub
releases, so they are less granular than entries written at the time.

## [Unreleased]

## [2.0.0] - 2026-08-13

Closes the defects catalogued in
[docs/development/11-known-gaps.md](docs/development/11-known-gaps.md) at 1.3.1.

The major version reflects four changes that an existing client or deployment can notice.
Read the Breaking section before upgrading; the rest of the release is fixes.

### Breaking

- **Timestamps are ISO-8601 strings**, for example `"2026-08-13T04:05:13Z"`. They were
  epoch-second decimals, for example `1786590482.142765877`. Any client that parses them
  as numbers must be updated. The bundled web interface already accepted both formats and
  needed no change.
- **`PUT /api/v1/job-applications/{id}` replaces rather than merges.** An optional field
  the body omits, or sends as null, is now cleared. Previously it was left untouched,
  which is why an optional field could never be emptied. A client that sends partial
  bodies will silently clear the fields it leaves out: send the complete record, or
  migrate it before upgrading.
- **The demo account is no longer seeded by default.** `app.demo-data.enabled` defaults to
  false. The Docker Compose stack sets `DEMO_DATA_ENABLED=true` so the quick start still
  works, and any other deployment that wants `test@example.com` must opt in.
- **Container names are no longer pinned.** Compose derives them from the project name, so
  scripts referring to `jobtracking-backend`, `jobtracking-mysql` or `jobtracking-frontend`
  need updating. In exchange, a second copy of the stack can run alongside the first.

### Fixed

- `GET /api/v1/job-applications/analytics/stage-durations` returned 500 on every fresh
  install. `statusChangedAt` is nullable and the seeded demo applications did not set it,
  and the calculation dereferenced it without a guard.
- A failed login cleared credentials and reloaded the page, destroying the error message
  before it could render. The 401 interceptor no longer redirects for login and
  registration, so the form shows the server's message.
- Analytics panels kept pre-mutation values until the page was reloaded. Creating,
  editing, or deleting an application now refreshes them.
- The level and RTO dropdowns offered `INTERN`, `C_LEVEL` and `HYBRID_1`, which the
  backend enums rejected, while `LEAD` and `MANAGER` were supported and unreachable. Both
  sides now offer the same values.
- "Interviewed" in Funnel Analytics was permanently zero, because the backend emitted a
  single `APPLIED` conversion key and the frontend looked for the interview stages.
- Quick wins and quick losses counted the same application twice when it was in
  `OFFER_DECLINED` or `OFFER_RESCINDED`.
- `JWT_EXPIRATION` was ignored under the `docker` profile, which hardcoded the value.
- The MySQL init script was missing the `level` column, and the two checked-in schemas
  disagreed on column widths and cascade behavior.
- `PUT` could not clear an optional field, because null values were skipped rather than
  applied. It now behaves as the full replacement its verb implies.
- Editing an application whose notes or job description exceeded 500 characters could
  fail the whole update, because the audit columns are 500 wide. Audit values are
  truncated.
- The `spring.jackson.*` properties had no effect, so timestamps serialized as
  epoch-second decimals rather than ISO-8601 and unknown request fields were rejected.
- A disabled account kept API access until its token expired.
- Logging in restated the password policy to an unauthenticated caller and locked out any
  account whose password predated the rule.
- The dashboard replaced every API error with a fixed string, hiding per-field validation
  messages.
- The "Status Changed Date" field displayed and edited the record's last-modified
  timestamp instead of the status-change timestamp.
- Nothing validated that `salaryMin` was at most `salaryMax`.
- The OpenAPI document advertised version 1.0 and an Apache 2.0 license. It now reports
  the built version and MIT.
- The two copies of status metadata had diverged in labels, colors, and group membership,
  which made the "In Interviews" figure depend on which copy was consulted.
- An expired token wrote an error line on every request from a stale session.
- The Axios client ignored its own configured timeout, so requests to a stalled backend
  hung indefinitely.
- An authenticated request could be answered with 401. The JWT filter mutated the context
  returned by `SecurityContextHolder.getContext()`, which Spring Security 6 resolves
  lazily, so the authentication could be discarded before authorization read it. The
  filter now publishes a fresh context. This reproduced only when the request was the
  first one against a fresh application context.

### Changed

- The demo account is gated behind `app.demo-data.enabled`, which defaults to false. The
  `docker` profile enables it so the quick start still works. It is no longer possible to
  ship a known-credential account by accident.
- Funnel stage conversion rates are derived from the status-change history, so an
  application that passed several interview rounds before being rejected now contributes
  to every stage it reached.
- `docker-compose.yml` no longer pins `container_name`, so a second copy of the stack can
  run alongside the first.
- The audit trail renders readable field names instead of entity property names.

### Removed

- The refresh-token machinery, which had no route and no way to work in a stateless
  design, along with the unrouted `logout` service method and the frontend call to the
  logout endpoint that never existed.
- `ApiConstants`, an unused `JpaSpecificationExecutor`, an unreferenced test
  configuration, four frontend components that nothing rendered, and the per-load
  analytics request whose result was discarded.

### Added

- A full documentation set under `docs/`, covering a user guide and a developer and
  operator guide, indexed by [docs/README.md](docs/README.md).
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` and this changelog.

---

## [1.3.1] - 2026-08-13

Maintenance release. No runtime feature changes. This release makes the project build
and install cleanly from a fresh clone and adds the project scaffolding a public
repository is expected to carry.

### Fixed

- `npm ci` failed on a fresh clone under Node 22 LTS. The lockfile had been generated
  by npm 11, which omits an optional peer dependency that npm 10 treats as out of sync.
  Verified working under both npm 10 and npm 11.
- `npm run build` failed in any environment that sets `CI`. `react-scripts` escalates
  lint warnings to errors there, and two pieces of dead code tripped it: an uncalled
  `formatDaysAgo` helper and an `activeCount` binding superseded by `calculatedActive`.
- A failing `useDashboardSettings` test that still asserted every dashboard component
  starts visible, after the three advanced analytics views became opt-in in 1.3.0.

### Added

- Continuous integration in `.github/workflows/ci.yml`: a backend job running
  `mvn verify` including the 85% JaCoCo coverage gate, and a frontend job running the
  test suite and the production build.
- An MIT `LICENSE` file, which the readme had been linking to without it existing.
- Status and technology badges in the readme header.

### Changed

- The readme was rewritten with working setup instructions. It previously listed
  prerequisites and then jumped to service URLs with no clone, build or run steps, and
  the Docker Compose stack was undocumented.
- Corrected the database documentation. H2 is test scope only, MySQL is required for
  every runnable profile, and the advertised H2 console is not enabled anywhere.
- `pom.xml` and `frontend/package.json` now carry the release version, having drifted
  to 1.0.0 and 0.1.0 respectively. The backend `Dockerfile` matches the built jar by
  glob so it no longer needs editing on each version bump.
- `.env` is now ignored by git, since the documented setup creates one holding the JWT
  secret and the database passwords.

### Removed

- An orphan root `package-lock.json` that had no matching `package.json`.

---

## [1.3.0] - 2026-04-18

### Added

- Company, location and position insight views.
- A dashboard settings menu for showing and hiding individual metrics and stat cards,
  persisted per browser.
- Detail modals for the newer metrics.

### Changed

- Reordered the metrics and the stat cards on the dashboard.
- The status transition heatmap, funnel analytics and application health views now
  default to hidden, so a first-run dashboard stays readable before there is enough
  history for them to mean anything.
- Extracted repeated color and formatting values into shared constants.

### Fixed

- Assorted fixes across the analytics surface, alongside expanded test coverage.

---

## [1.2.2] - 2026-04-08

### Fixed

- Docker Compose configuration corrections.

---

## [1.2.1] - 2026-04-08

There is no 1.2.0 release. The series moved from 1.1.0 to 1.2.1.

### Added

- Hover detail on the scatter plot.

### Changed

- Swagger UI configuration updates.
- The frontend bundle was reduced through code splitting.

### Fixed

- An npm dependency vulnerability.
- A keyboard shortcut bug in the shortcut help modal.
- Exception handling and JWT signing corrections in the backend.

---

## [1.1.0] - 2026-04-07

### Changed

- Derived metric logic moved out of the frontend and into the backend, so the API
  returns computed figures rather than the browser assembling them.
- Consolidated redundant code into shared constants.
- Rearranged the stat cards.

### Added

- Shared test factories and mock utilities for the frontend suite.

### Fixed

- The activity heatmap aligned days incorrectly.
- The edit keyboard shortcut appended a character to the company name field.
- The application table now scrolls after 25 records.

---

## [1.0.0] - 2026-04-01

First stable release: a full-stack job application tracker with a React frontend and a
Spring Boot API.

### Added

- Job application management with create, view, edit and delete.
- Eighteen pipeline statuses, from applied through the interview stages to offer,
  rejection, withdrawal and ghosted.
- Role level, RTO type, salary range and other per-application detail.
- A dashboard with stat cards, pipeline metrics, an activity heatmap and stage
  duration tracking.
- A per-application event timeline recording every status change.
- JWT authentication with per-user data isolation.
- Docker Compose configuration for the database, backend and frontend.
- Swagger UI for API exploration.

[Unreleased]: https://github.com/Jnolcox/job-tracker/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Jnolcox/job-tracker/compare/v1.3.1...v2.0.0
[1.3.1]: https://github.com/Jnolcox/job-tracker/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Jnolcox/job-tracker/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Jnolcox/job-tracker/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Jnolcox/job-tracker/compare/v1.1.0...v1.2.1
[1.1.0]: https://github.com/Jnolcox/job-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Jnolcox/job-tracker/releases/tag/v1.0.0
