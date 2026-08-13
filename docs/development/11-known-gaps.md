# Known gaps and defects

> **Audience:** Contributors and operators  ·  **Scope:** What remains broken, unreachable, or inconsistent after the 1.3.2 defect sweep, with the evidence for each

This page records what is broken, what exists but is unreachable, and where the code, the
configuration, and the documentation disagree. It exists so that a contributor does not
spend an afternoon debugging something already known, and so that a user is not misled by
a number the dashboard prints. Every entry names the file it was read from. Nothing here
is a plan; it is a description of the software as it is.

Most of the defects this page catalogued at 1.3.1 have since been fixed. Section 1 lists
what was closed, so that anyone who read the earlier version can see what changed.
Sections 2 onward describe what is still true.

Two labels are used throughout, and they are not interchangeable.

**Table 1.** *The evidence labels used on every entry in this page.*

| Label | Meaning |
| ----- | ------- |
| **Confirmed** | Either reproduced against a running stack, or provable by reading the source on both sides of the interaction (the producer and the consumer). |
| **Suspected** | Inferred from reading one side only. The mechanism is visible in the source, but the resulting behavior was not observed. |

Severity is judged by user-visible impact: **high** means a user loses data, loses access,
or is shown a wrong number with no signal; **medium** means a feature silently does less
than it claims; **low** means the defect is cosmetic or affects only contributors.

## Contents

- [1. Closed since 1.3.1](#1-closed-since-131)
- [2. Unreachable and dead code](#2-unreachable-and-dead-code)
- [3. Remaining drift](#3-remaining-drift)
- [4. Scaling characteristics](#4-scaling-characteristics)
- [5. Remaining inconsistencies](#5-remaining-inconsistencies)
- [6. Unverified leads](#6-unverified-leads)
- [See also](#see-also)

---

## 1. Closed since 1.3.1

Every entry below was recorded as a defect against 1.3.1 and no longer reproduces. They
are kept as a record, not as a list of things to investigate.

**Table 2.** *Defects closed, with the change that closed each one.*

| Defect at 1.3.1 | How it was closed |
| --------------- | ----------------- |
| `analytics/stage-durations` returned 500 on a fresh install | `getStageDurations` now skips an application whose `statusChangedAt` is unset instead of dereferencing it, and the seeded demo applications carry the field |
| A failed login reloaded the page and showed no error | The 401 interceptor no longer redirects for login and registration, so the form renders the server's message |
| The demo account was seeded on every non-test profile | Seeding is gated behind `app.demo-data.enabled`, which defaults to false and is enabled only by the `docker` profile |
| Analytics panels never refreshed after a create, update, or delete | The dashboard calls the hook's `refetch` after each mutation |
| The level and RTO dropdowns offered values the backend rejected | `Level` gained `INTERN` and `C_LEVEL`, `RtoType` gained `HYBRID_1`, and the dropdown gained `LEAD` and `MANAGER` |
| "Interviewed" in Funnel Analytics was always zero | Stage conversion rates are computed per stage from the event history rather than emitting a single `APPLIED` key |
| Quick wins and quick losses double counted two statuses | Quick losses exclude the statuses that also mean an offer was reached, so the two sets are disjoint |
| `JWT_EXPIRATION` was inert under the `docker` profile | `application-docker.yml` reads the placeholder instead of hardcoding the value |
| The MySQL init script was missing the `level` column | The column was added and the two schemas were reconciled |
| `PUT` could not clear an optional field | Updates map through a mapper that applies nulls, so a field sent as null is cleared |
| Hardcoded `container_name` blocked a second stack | The names were removed, so Compose derives them from the project name |
| An audit value longer than 500 characters failed the update | Audit values are truncated to the column width before the event is written |
| Jackson configuration in `application.yml` had no effect | The `@Primary ObjectMapper` was replaced with a builder customizer, so timestamps now serialize as ISO-8601 and the documented properties apply |
| The OpenAPI document contradicted the build | The version is read from build information and the license reads MIT |
| The two copies of status metadata had diverged | `ConfigServiceImpl` was aligned to the constants the interface actually renders |
| The "Status Changed Date" field edited the wrong value | The modal reads and writes `statusChangedAt` rather than the record's last-modified timestamp |
| The backend's error messages were discarded | The dashboard surfaces the server's `message` or per-field `errors` |
| Login restated the password policy to an unauthenticated caller | The `@Size` constraint was removed from the login request |
| A disabled account kept API access until its token expired | The JWT filter rechecks `isEnabled()` on every request |
| An expired token wrote an error line per request | Routine authentication failures log at debug |
| The Axios timeout constant was declared and unused | The client is created with it |
| The frontend called a logout endpoint that did not exist | The call was removed; logout is entirely client side |
| `ErrorMessages` constants existed and were bypassed | The literals were replaced with the constants |
| Nothing validated that `salaryMin` was at most `salaryMax` | Both request DTOs carry a cross-field assertion |

> [!NOTE]
> The funnel now reads the event history, so an application that passed three interview
> rounds before being rejected contributes to every stage it reached. Figures computed
> before the change are not recalculated retroactively, but they were never stored: every
> analytic is computed per request, so the numbers correct themselves on the next load.
> Applications that predate the audit trail carry no transitions and still contribute only
> their current status.

---

## 2. Unreachable and dead code

> [!NOTE]
> **Status: not wired.** `ConfigController`
> (`src/main/java/com/nolcox/jobtracking/application/controller/ConfigController.java:25`)
> serves status and option metadata over `/v1/config`, and nothing in the interface calls
> it. `configAPI` (`frontend/src/services/api.js:180`) is used only by `ConfigContext`
> (`frontend/src/context/ConfigContext.js:84-85`), and `ConfigProvider` is never mounted:
> `App.js` wraps the tree in `AuthProvider` and `KeyboardShortcutProvider` only. The
> endpoints remain part of the documented API surface, so they are kept rather than
> deleted, but the frontend continues to carry its own copy of the same metadata.

### Five service methods have no route

**Confirmed** (source, both sides). Severity: low.

`JobApplicationServiceImpl` implements `getApplicationStatistics`,
`getApplicationsByStatus`, `searchApplications`, `updateApplicationStatus`, and the
two-argument `getUserApplications`. `JobApplicationController` calls only the four-argument
`getUserApplications`, `getApplication`, `createApplication`, `updateApplication`, and
`deleteApplication`.

Worth knowing before you go looking for it: `updateApplicationStatus` is the only path that
emits a standalone `STATUS_CHANGED` event, and it is unreachable. Several repository query
methods exist solely to back these five, and are likewise reachable only from tests.

### Client methods with no caller

**Confirmed** (source). Severity: low.

`jobApplicationsAPI.getAllEvents`, `jobApplicationsAPI.getById` and
`analyticsAPI.getStageDurations` (`frontend/src/services/api.js`) are defined and never
called. They are kept deliberately: that module is a client for the documented HTTP API,
and trimming it to only the calls the current screens make would leave it incomplete
against [the API reference](./03-api-reference.md).

### Method security is enabled with nothing to enforce

**Confirmed** (source). Severity: low.

`@EnableMethodSecurity` is on
(`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:31`) and no
`@PreAuthorize`, `@Secured`, or `@PostAuthorize` annotation exists in `src/main/java`.
`Role.ADMIN` (`src/main/java/com/nolcox/jobtracking/domain/entity/Role.java:5`) is assigned
only in test fixtures; registration always hardcodes `Role.USER`.

---

## 3. Remaining drift

### Tokens are signed with HS384, and the algorithm is never pinned

**Confirmed** (computation and source). Severity: low, with a sharp edge.

`JwtService.getSigningKey` Base64-decodes the configured secret and hands the bytes to
`Keys.hmacShaKeyFor`, which picks the HMAC variant from the key length. The committed
default secret is 64 Base64 characters, which decodes to 48 bytes, which selects HS384.

Because nothing pins the algorithm, changing the secret's length silently changes the
signing algorithm. A shorter secret weakens it, and fewer than 32 decoded bytes makes the
library refuse to sign at all, which surfaces as a first-login failure rather than a
configuration error. See
[security and authentication](./04-security-and-authentication.md).

### Two schema sources and no migration tool

**Confirmed** (source). Severity: medium.

`spring.jpa.hibernate.ddl-auto: update` is set in both runnable profiles, and Compose
separately mounts `src/main/resources/database/job_tracking_db_1.sql` as a MySQL init
script. There is no Flyway or Liquibase dependency in `pom.xml`. The production schema is
therefore whichever of the two got there first, plus whatever Hibernate infers on each
boot.

The two checked-in schemas were reconciled during the defect sweep, so they now agree on
columns, widths, and cascade behavior. Nothing enforces that they stay that way: a change
to an entity still has to be reflected in two files by hand, and the test suite runs
against the H2 schema so it cannot catch the divergence.

### JavaDoc that contradicts the method it documents

**Confirmed** (source). Severity: low.

- `extractPositionType` recognizes seniority words only and returns "Other" for everything
  else (`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:762-780`),
  while the response DTO's JavaDoc gives "Frontend", "Backend", and "Full Stack" as
  examples of what it returns.
- `SalaryDistributionResponse` documents its entries as "sorted by midpoint descending,
  capped at 15"; `getSalaryDistribution` neither sorts nor caps. It also documents
  `salaryMin` and `salaryMax` as nullable, and the service coalesces so neither is ever
  null, except that an average of exactly zero is converted to null, which conflates "no
  salary data" with "everyone offered zero".
- `frontend/src/constants/statuses.js` refers readers to `metricsEngine.js` five times.
  No file by that name exists in the repository.

---

## 4. Scaling characteristics

These are not defects. They are properties of the current design that determine how the
application behaves as an account grows, and they are worth knowing before profiling
anything. See [analytics internals](./05-analytics-internals.md) for how the computations
themselves work.

### Every analytics endpoint loads the user's whole table

**Confirmed** (source). Severity: medium at scale.

`repository.findAllByUserId(userId)` appears at ten call sites in `AnalyticsServiceImpl`.
All filtering, grouping, averaging, and percentage work is then done in Java streams. Only
`getCountsByStatus` pushes aggregation into SQL.

A single dashboard load issues eleven analytics requests in parallel
(`frontend/src/hooks/useAnalytics.js`), so a user with N applications causes several times
N rows to be materialized per page view. With the default demo data this is invisible.
With a few thousand applications it will not be.

### The table shows the first 100 applications and nothing more

**Confirmed** (source, both sides). Severity: medium.

`Dashboard.jsx` calls `jobApplicationsAPI.getAll(0, 100)`. The API is paginated and the
response's `content` array is read, but no component exposes page controls and nothing
reads `totalElements`.

Past 100 applications the table silently drops rows, and the header count under-reports,
while the server-computed analytics on the same screen count everything. The two halves of
the dashboard disagree with no explanation offered to the user.

### One extra database query per authenticated request

**Confirmed** (source). Severity: low.

`JwtAuthenticationFilter` calls `userDetailsService.loadUserByUsername` on every
authenticated request
(`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtAuthenticationFilter.java:56`),
which becomes a `findByEmail` lookup. Eleven of those fire per dashboard load. The lookup
is now load-bearing rather than incidental: it is what lets the filter reject a token
belonging to a disabled account, so removing it would reintroduce a security defect.

### Analytics bucket by the server's time zone

**Confirmed** (source). Severity: low.

`getActivityHeatmap` and `getTimePatterns` both bucket by `ZoneId.systemDefault()`. The
heatmap and the hour-of-day chart therefore shift with the server's configured zone and do
not reflect the user's locale. Two deployments of the same data in different regions
produce different charts.

---

## 5. Remaining inconsistencies

### Ownership failures return 403 rather than 404

**Confirmed** (source). Severity: low.

Requesting an application belonging to another user returns 403, while an id that does not
exist returns 404. A caller can therefore tell whether an arbitrary id exists anywhere in
the system, even though no data about it is disclosed. See
[security and authentication](./04-security-and-authentication.md).

### The table sorts by a stringified key and hides rejections by default

**Confirmed** (source). Severity: low.

`AppTable` sorts by a single key with no direction toggle and stringifies nulls through
`String(a[sortKey]).localeCompare(...)`
(`frontend/src/components/table/AppTable.jsx:97`), so applications with no level sort under
the literal text "null". The table also defaults to the "Active" filter, hiding the whole
`REJECTED` group on first paint, while the count in the header above it includes them.

### Optimistic locking is enabled and no client can participate

**Confirmed** (source). Severity: low.

`JobApplication` carries `@Version private Long version`, and `JobApplicationResponse` does
not expose it and no request DTO accepts it. Concurrent edits are therefore last write
wins, despite the column existing.

---

## 6. Unverified leads

The following were noticed during the survey and could not be confirmed. They are leads,
not claims, and no user-facing documentation should repeat them as fact.

1. **Whether every insight component consumes every field of its DTO.** The prop-shape
   JSDoc matches the DTOs at the top level for the health, company, location, position,
   transition, and salary components. A field-by-field audit was not done;
   `SalaryDistributionResponse.avgMid` and `TransitionMatrixResponse.statuses` in
   particular were not traced to a render site.
2. **The exact HTTP status for an invalid enum in a request body or query parameter.**
   `GlobalExceptionHandler` does not extend `ResponseEntityExceptionHandler`, so the
   exception reaches the catch-all. The status was reasoned about rather than observed.
   The same uncertainty applies to a non-integer `year` on the activity heatmap and to
   malformed JSON on any POST or PUT.
3. **What `/api/actuator/**` exposes under the default profile.** `SecurityConfig` permits
   it unauthenticated. The `docker` profile limits exposure to `health` and `info`;
   `src/main/resources/application.yml` has no `management` block, so the effective
   exposure is whatever Spring Boot 3.4 defaults to. Not verified.

One further observation about the test suite, stated as fact because it was checked but
worth reading with care: `mvn verify` passes, including the 85 percent JaCoCo line-coverage
gate. That gate measures a bundle that still includes the unrouted service methods in
[section 2](#2-unreachable-and-dead-code). Three near-duplicate auth integration test
classes and two job-application ones also inflate the suite;
`AuthIntegrationTestSimple` and `AuthIntegrationTestWorking` read as abandoned forks of
`AuthIntegrationTest`. See [testing](./07-testing.md).

Continuous integration runs only on `develop`
(`.github/workflows/ci.yml:5,7`), so a push to a feature branch is unverified until a pull
request opens.

---

## See also

- [Testing](./07-testing.md) for what the suites do and do not cover.
- [Analytics internals](./05-analytics-internals.md) for how the funnel derives stages from
  the event history.
- [Security and authentication](./04-security-and-authentication.md) for the demo account,
  the shipped secret, and the token algorithm.
- [Configuration](./08-configuration.md) for which properties are honored on which profile.
- [Troubleshooting](../user-guide/06-troubleshooting.md) for the user-facing symptoms of
  several entries on this page.
- [Contributing](./10-contributing.md) if you intend to fix one of these.

*Documentation current as of Job Tracker 1.3.2 (August 2026). Source of truth is the code; report drift as an issue.*
