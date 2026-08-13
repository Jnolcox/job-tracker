# Changelog

All notable changes to Job Tracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries before 1.3.1 were reconstructed from the git history and the published GitHub
releases, so they are less granular than entries written at the time.

## [Unreleased]

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

[Unreleased]: https://github.com/Jnolcox/job-tracker/compare/v1.3.1...HEAD
[1.3.1]: https://github.com/Jnolcox/job-tracker/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Jnolcox/job-tracker/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/Jnolcox/job-tracker/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/Jnolcox/job-tracker/compare/v1.1.0...v1.2.1
[1.1.0]: https://github.com/Jnolcox/job-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Jnolcox/job-tracker/releases/tag/v1.0.0
