# Known gaps and defects

> **Audience:** Contributors and operators  ·  **Scope:** Defects, dead code, and drift in Job Tracker 1.3.1, with the evidence for each

This page records what is broken, what exists but is unreachable, and where the code, the
configuration, and the documentation disagree. It exists so that a contributor does not
spend an afternoon debugging something already known, and so that a user is not misled by
a number the dashboard prints. Every entry names the file it was read from. Nothing here
is a plan; it is a description of the software as it is at version 1.3.1.

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

- [1. Confirmed defects](#1-confirmed-defects)
- [2. Unreachable and dead code](#2-unreachable-and-dead-code)
- [3. Drift between code, configuration, and documentation](#3-drift-between-code-configuration-and-documentation)
- [4. Scaling characteristics](#4-scaling-characteristics)
- [5. Inconsistencies between backend and frontend](#5-inconsistencies-between-backend-and-frontend)
- [6. Unverified leads](#6-unverified-leads)
- [See also](#see-also)

---

## 1. Confirmed defects

**Table 2.** *The defects in this section, ordered by impact.*

| Defect | Severity | Evidence |
| ------ | -------- | -------- |
| `analytics/stage-durations` returns 500 on a fresh install | High | Reproduced at runtime |
| A failed login reloads the page and shows no error | High | Reproduced at runtime |
| The demo account is seeded on every non-test profile | High | Reproduced at runtime |
| Analytics panels never refresh after a create, update, or delete | High | Source, both sides |
| The level and RTO dropdowns offer values the backend enum rejects | High | Source, both sides |
| "Interviewed" in Funnel Analytics is always zero | Medium | Source, both sides |
| Quick wins and quick losses double count two statuses | Medium | Source |
| `JWT_EXPIRATION` is inert under the `docker` profile | Medium | Source |
| The MySQL init script is missing the `level` column | Medium | Source |
| `PUT` cannot clear an optional field | Medium | Source |
| Hardcoded `container_name` blocks a second stack | Low | Reproduced at runtime |

### The stage-durations endpoint returns 500 on a fresh install

**Confirmed** (reproduced at runtime). Severity: high.

`GET /api/v1/job-applications/analytics/stage-durations` throws a `NullPointerException`
on a freshly seeded database. Of the twelve analytics requests the dashboard issues on
load, this is the only one that fails.

```text
java.lang.NullPointerException: temporal
	at java.base/java.time.Instant.from(Unknown Source)
	at java.base/java.time.temporal.ChronoUnit.between(Unknown Source)
	at com.nolcox.jobtracking.application.service.impl.AnalyticsServiceImpl.getStageDurations(AnalyticsServiceImpl.java:523)
```

The mechanism has three parts, all readable in source:

1. `statusChangedAt` is nullable. It carries a bare `@Column(name = "status_changed_at")`
   with no `nullable = false` and no lifecycle callback
   (`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:99-100`).
2. The write paths always populate it, defaulting to `Instant.now()`
   (`src/main/java/com/nolcox/jobtracking/application/service/impl/JobApplicationServiceImpl.java:116`
   on create, `:192-197` on update), so anything created through the UI is safe.
3. `DataInitializer` bypasses the service and builds entities directly. It never sets
   `statusChangedAt`, and it seeds three applications in non-`APPLIED` statuses:
   `TECH_SCREEN`, `REJECTED`, and `OFFER_RECEIVED`
   (`src/main/java/com/nolcox/jobtracking/config/DataInitializer.java:85,103,120`).

`getStageDurations` guards `appliedDate`
(`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:512`)
but not `statusChangedAt`, then dereferences it on the non-`APPLIED` branch (`:520-523`).

The failure is invisible in the browser. `useAnalytics` records an error only if all
twelve requests fail (`frontend/src/hooks/useAnalytics.js:246-259`), so a single failure
leaves `error` null, and nothing renders this endpoint's data anyway (see
[section 2](#2-unreachable-and-dead-code)). The result is a 500 in the backend log on the
exact path the install instructions describe.

> [!IMPORTANT]
> This is the first thing a new contributor is likely to hit. Follow the readme, run
> Compose, log in as the demo user, and the backend logs a stack trace before you have
> touched anything. The API is otherwise healthy.

### A failed login clears credentials and reloads, so no error is shown

**Confirmed** (reproduced at runtime). Severity: high.

`POST /api/v1/auth/login` with a wrong password correctly returns HTTP 401 with a
descriptive body:

```json
{"status":"UNAUTHORIZED","error":"Authentication Failed","message":"Invalid email or password"}
```

The Axios response interceptor fires on any 401 regardless of which request produced it.
It clears both storage keys and assigns `window.location.href = '/login'`
(`frontend/src/services/api.js:25-31`). That is a full page navigation, so the React error
state set in `frontend/src/components/Login.js:36` is destroyed before the message can
render at `frontend/src/components/Login.js:112`.

The user-visible result: typing the wrong password reloads the login page and displays
nothing. The same interceptor also ejects a user mid-action when a token expires, with no
message and no query parameter to explain the jump. No test covers the interceptor.

### The demo account is seeded on every non-test profile

**Confirmed** (reproduced at runtime). Severity: high.

`DataInitializer` is a `CommandLineRunner` guarded only by `@Profile("!test")`
(`src/main/java/com/nolcox/jobtracking/config/DataInitializer.java:25`). Both runnable
profiles, the default one and `docker`, therefore run it. It creates
`test@example.com` with the password `password123` and an enabled `USER` role
(`:40-51`), plus five sample applications, and it logs the credentials in plaintext at
INFO level (`:51`).

There is no property, environment variable, or profile that disables the seed short of
editing code.

> [!WARNING]
> A `docker compose up` on a reachable host ships a known-credential account with full
> read and write access to the API. Removing `DataInitializer` is a code change, not a
> configuration change. See [security and authentication](./04-security-and-authentication.md).

### Analytics panels never refresh after a create, update, or delete

**Confirmed** (source, both sides). Severity: high.

`useAnalytics` exposes a `refetch` function (`frontend/src/hooks/useAnalytics.js:284`) and
nothing in the application imports it. The only references outside the hook are in test
files. `Dashboard.jsx` mutates only its local `apps` array on save and delete
(`frontend/src/Dashboard.jsx:241`, `:259`).

Every server-computed number on the screen, meaning the stat cards, the funnel, the
heatmap, and the insight panels, keeps showing pre-mutation values until the user reloads
the page. Counts derived from local state and counts derived from the server visibly
disagree in the meantime.

### The level and RTO dropdowns offer values the backend enum rejects

**Confirmed** (source, both sides). Severity: high.

The frontend maintains its own option lists, and they do not match the backend enums.

**Table 3.** *Values that exist on one side only.*

| Field | In the dropdown, not in the enum | In the enum, not in the dropdown |
| ----- | -------------------------------- | -------------------------------- |
| Level | `INTERN`, `C_LEVEL` | `LEAD`, `MANAGER` |
| RTO type | `HYBRID_1` | (none) |

`LEVEL_TYPES` is at `frontend/src/constants/statuses.js:197-207` and `RTO_TYPES` at
`:229-236`. The backend enums are
`src/main/java/com/nolcox/jobtracking/domain/entity/Level.java:3-13` and
`src/main/java/com/nolcox/jobtracking/domain/entity/RtoType.java:3-9`. Both lists feed the
edit modal's `<select>` elements directly.

Selecting "Intern", "C-Level", or "Hybrid 1 day" sends a value Jackson cannot map, and the
save fails. Conversely, `LEAD` and `MANAGER` are supported by the backend and cannot be
entered through the UI at all, even though the frontend defines colors for them
(`frontend/src/constants/colors.js:117-118`).

The status code returned for the rejected value is **suspected**, not confirmed:
`GlobalExceptionHandler` does not extend `ResponseEntityExceptionHandler` and declares no
handler for `HttpMessageNotReadableException`, so the exception reaches
`@ExceptionHandler(Exception.class)` at
`src/main/java/com/nolcox/jobtracking/application/controller/GlobalExceptionHandler.java:110`,
which returns 500 with the message "An unexpected error occurred". Either way the user
sees the generic "Failed to save application. Please try again."
(`frontend/src/Dashboard.jsx:246`).

### "Interviewed" in Funnel Analytics is always zero

**Confirmed** (source, both sides). Severity: medium.

`FunnelAnalytics` derives its interviewed count from
`data.stageConversionRates.RECRUITER_SCREEN`, falling back to `.TECH_SCREEN`
(`frontend/src/components/charts/FunnelAnalytics.jsx:175-185`). The backend's
`calculateStageConversionRates` puts exactly one key into that map, `APPLIED`, and returns
(`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:666-681`).
Neither key the frontend looks for ever exists, so `interviewedCount` stays at zero.

The response breakdown therefore reports `interviewed: 0 (0.0%)` permanently. The related
"Stage Conversion" section filters a nine-stage order against the same one-key map, so it
always renders a single bar.

### Quick wins and quick losses double count two statuses

**Confirmed** (source). Severity: medium.

`OFFER_STATUSES`
(`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:98-104`)
and `NEGATIVE_TERMINAL_STATUSES` (`:192-198`) both contain `OFFER_DECLINED` and
`OFFER_RESCINDED`. `findQuickOutcomes` selects one set or the other from a boolean flag
(`:926-927`), so an application in either of those two statuses is counted as a quick win
and as a quick loss at the same time. The two lists in the health panel can name the same
application.

### JWT_EXPIRATION is inert under the docker profile

**Confirmed** (source). Severity: medium.

`src/main/resources/application-docker.yml:39` hardcodes `expiration: 86400000` with no
`${JWT_EXPIRATION:...}` placeholder. Meanwhile `docker-compose.yml:37` passes the variable
into the container and `.env.example:11` documents it. Setting `JWT_EXPIRATION` in `.env`
changes nothing under Compose; the token lifetime is one day regardless.

The default profile does honor the variable
(`src/main/resources/application.yml:34`), so the same setting behaves differently
depending on how the backend was started.

### The MySQL init script is missing the level column

**Confirmed** (source). Severity: medium.

`level` exists on the entity
(`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:72-73`) and in the
H2 test schema (`src/test/resources/schema.sql:28`), but the string `level` does not appear
anywhere in `src/main/resources/database/job_tracking_db_1.sql`, which is the file Compose
mounts as the MySQL init script.

Only `spring.jpa.hibernate.ddl-auto: update`
(`src/main/resources/application.yml:23`, `src/main/resources/application-docker.yml:28`)
closes the gap: Hibernate adds the column at startup. An operator who loads the checked-in
schema and then turns off DDL updates gets an application that cannot read or write the
seniority level.

### PUT cannot clear an optional field

**Confirmed** (source). Severity: medium.

`updateApplication` maps the request onto the entity with ModelMapper configured
`setSkipNullEnabled(true)` (`src/main/java/com/nolcox/jobtracking/config/ModelMapperConfig.java:15`),
so every null field in the request body is skipped rather than applied.

Once `notes`, `location`, `level`, `rtoType`, or `contactEmail` has a value, no request can
set it back to empty. The endpoint is a `PUT` and reads as a full replacement, but it
behaves as a sparse merge. See [the API reference](./03-api-reference.md).

### Hardcoded container_name blocks a second stack

**Confirmed** (reproduced at runtime). Severity: low.

Every service in `docker-compose.yml` sets an explicit `container_name`
(`docker-compose.yml:4`, `:29`, `:57`). Container names are global, not scoped to the
Compose project, so bringing the stack up under a different project name still collides
with any existing containers and fails with a name conflict instead of starting alongside.
Running two instances requires editing the Compose file. See
[deployment and operations](./09-deployment-and-operations.md).

### An audit value longer than 500 characters fails the update

**Suspected** (source on one side; the failure was not reproduced). Severity: medium.

`ApplicationEvent.oldValue` and `newValue` are both `@Column(length = 500)` with
`@Size(max = 500)`
(`src/main/java/com/nolcox/jobtracking/domain/entity/ApplicationEvent.java:87-97`), and both
schemas agree on `VARCHAR(500)`. But the request DTO permits 5000 characters of `notes` and
10000 characters of `jobDescription`
(`src/main/java/com/nolcox/jobtracking/application/dto/request/JobApplicationUpdateRequest.java:23,51`),
and both are written verbatim into an event when they change
(`src/main/java/com/nolcox/jobtracking/application/service/impl/ApplicationEventServiceImpl.java:171`
for notes, `:297` for the job description). No truncation logic exists anywhere in the
service.

Editing an application whose notes or job description exceed 500 characters should
therefore fail and roll back the whole edit. What is unverified is the error shape: bean
validation may raise a `ConstraintViolationException` inside the transaction, or the value
may reach MySQL and be rejected there. The defect stands either way; only the status code
and message are uncertain.

---

## 2. Unreachable and dead code

> [!NOTE]
> **Status: not wired.** Three pieces of the backend are implemented, compiled, and
> reachable by nothing.
> `AuthServiceImpl.refreshToken` (`src/main/java/com/nolcox/jobtracking/application/service/impl/AuthServiceImpl.java:104`)
> and `AuthServiceImpl.logout` (`:134`) have no HTTP route: `AuthController` maps only
> `/register` and `/login`
> (`src/main/java/com/nolcox/jobtracking/application/controller/AuthController.java:26,33`).
> `ApiConstants` defines `API_VERSION_1` and `CURRENT_API_VERSION`
> (`src/main/java/com/nolcox/jobtracking/common/constants/ApiConstants.java:10-11`) and no
> file reads either one; every controller hardcodes its `"/v1/..."` prefix instead.
> `JobApplicationRepository` extends `JpaSpecificationExecutor<JobApplication>`
> (`src/main/java/com/nolcox/jobtracking/domain/repository/JobApplicationRepository.java:17`)
> and no `Specification` is constructed anywhere in the repository.

### The refresh-token machinery has no entry point

**Confirmed** (source). Severity: low.

Beyond the two unrouted service methods above, the supporting cast is dead as well.
`JwtService.generateRefreshToken` (`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtService.java:47`),
`getRefreshExpiration` (`:104`), and `extractUserId` (`:33`) are referenced only from
tests. The property `app.jwt.refresh-expiration` (`:26`) is set in no YAML file and governs
a token type the application never issues. `refreshToken` also wraps its entire body in
`catch (Exception e)` (`.../AuthServiceImpl.java:127`), so the specific error it raises is
flattened into a generic message before any caller could see it.

`logout` clears `SecurityContextHolder` in a stateless application. Even if it were routed,
it would be a no-op: nothing server-side tracks issued tokens.

### The frontend calls a logout endpoint that does not exist

**Confirmed** (source, both sides). Severity: low.

`API_CONFIG.ENDPOINTS.AUTH.LOGOUT` is `'/auth/logout'`
(`frontend/src/constants/api.js:18`), used by `authAPI.logout()`
(`frontend/src/services/api.js:41`) and fired on every logout
(`frontend/src/context/AuthContext.js:75-77`). No such route exists on `AuthController`.
The call is wrapped in `.catch(() => {})`, so the failure is silent, but every logout
produces one failed request. Local state and storage are cleared client-side first, so
logout itself works.

### The whole /v1/config subsystem has no client

**Confirmed** (source, both sides). Severity: medium.

`ConfigController` (`src/main/java/com/nolcox/jobtracking/application/controller/ConfigController.java:25`)
serves status and option metadata, backed by a full status table in `ConfigServiceImpl`.
On the client, `configAPI` (`frontend/src/services/api.js:196`) is called only from
`ConfigContext` (`frontend/src/context/ConfigContext.js:84-85`), and `ConfigProvider` is
never mounted: `App.js` wraps the tree in `AuthProvider` and `KeyboardShortcutProvider`
only. Outside its own test file, `ConfigProvider` appears nowhere.

The consequence is two independent copies of status metadata, and they have already
diverged. See [section 5](#5-inconsistencies-between-backend-and-frontend).

### Five service methods have no route

**Confirmed** (source, both sides). Severity: low.

`JobApplicationServiceImpl` implements `getApplicationStatistics` (`:273`),
`getApplicationsByStatus` (`:278`), `searchApplications` (`:287`),
`updateApplicationStatus` (`:304`), and the two-argument `getUserApplications` (`:330`).
`JobApplicationController` calls only `getUserApplications(userId, status, companyName,
pageable)`, `getApplication`, `createApplication`, `updateApplication`, and
`deleteApplication` (`:72`, `:84`, `:95`, `:118`, `:129`).

Worth knowing before you go looking for it: `updateApplicationStatus` is the only path that
emits a standalone `STATUS_CHANGED` event, and it is unreachable. Several repository query
methods exist solely to back these five, and are likewise reachable only from tests.

### Frontend components that are exported and never rendered

**Confirmed** (source). Severity: low.

- `StageDurationChart` and `TimeInStageChart` are exported from
  `frontend/src/components/charts/index.js:12` and `:7` and imported by nothing except
  their own tests.
- `Modal` and `Spinner` are exported from `frontend/src/components/common/index.js:8-9`
  and rendered nowhere. Each modal in the application builds its own container instead.
- `frontend/src/components/modal/JourneyTimeline.jsx` is not exported from the modal
  barrel at all and is imported only by its own test.
- `frontend/src/utils/stageDurationUtils.js` is imported only by `StageDurationChart` and
  `JourneyTimeline`, that is, only by components nothing renders.

### One analytics request per dashboard load is discarded

**Confirmed** (source, both sides). Severity: low.

`useAnalytics` fetches `stage-durations` and stores it in state
(`frontend/src/hooks/useAnalytics.js:198`, `:275`), and `Dashboard.jsx` never reads
`stageDurations`. The only component that renders that shape is `StageDurationChart`,
which nothing imports. The round trip happens on every dashboard load, and it is the one
request that returns 500 on a fresh install.

`jobApplicationsAPI.getAllEvents` (`frontend/src/services/api.js:63`) and
`jobApplicationsAPI.getById` (`:48`) are also defined and never called.

### Smaller dead paths

**Confirmed** (source). Severity: low.

- `JwtAuthenticationFilter` bypasses public endpoints with
  `request.getServletPath().contains("/api/auth")`
  (`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtAuthenticationFilter.java:36`).
  The servlet path excludes the context path, which is `/api`
  (`src/main/resources/application.yml:3-4`), so the real servlet path is
  `/v1/auth/login` and the condition is always false. The filter falls through anyway, so
  the effect is nil.
- `@EnableMethodSecurity` is on
  (`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:31`) and no
  `@PreAuthorize`, `@Secured`, or `@PostAuthorize` annotation exists in `src/main/java`.
  `Role.ADMIN` (`src/main/java/com/nolcox/jobtracking/domain/entity/Role.java:5`) is
  assigned only in test fixtures; registration always hardcodes `Role.USER`.
- `frontend/src/constants/api.js:30` declares `TIMEOUT: 30000` and the Axios instance is
  created without a `timeout` option (`frontend/src/services/api.js:8-13`). Requests hang
  indefinitely against a stalled backend, and the dashboard spinner never resolves.
- `src/test/java/com/nolcox/jobtracking/integration/TestConfig.java` is imported by no test.
- `frontend/src/components/charts/DayOfWeekBar.jsx:80` contains commented-out JSX inside an
  otherwise empty `<span>`.

---

## 3. Drift between code, configuration, and documentation

### Jackson configuration in application.yml has no effect

**Confirmed** (reproduced at runtime). Severity: medium.

`src/main/resources/application.yml:10-14` sets
`spring.jackson.serialization.write-dates-as-timestamps: false` and
`spring.jackson.deserialization.fail-on-unknown-properties: false`. Neither takes effect.
`DatabaseConfig` declares a hand-built `@Bean @Primary ObjectMapper`
(`src/main/java/com/nolcox/jobtracking/config/DatabaseConfig.java:14-16`), which causes
Spring Boot's Jackson auto-configuration to back off, and with it every `spring.jackson.*`
property.

Timestamps therefore serialize as epoch-second decimals, for example
`"timestamp":1786590482.142765877`, and not as ISO-8601. The frontend has been built
around the actual behavior: `convertDate` documents the epoch-second format and multiplies
by 1000 (`frontend/src/utils/dataAdapter.js:22-43`). The YAML states the opposite of what
the API does. Consumers should read
[the API reference](./03-api-reference.md), not the YAML.

The same mechanism leaves `FAIL_ON_UNKNOWN_PROPERTIES` at the bare-mapper default, which is
on, so an unexpected field in a request body is rejected despite the configuration saying
it should be ignored.

### Tokens are signed with HS384, and the algorithm is never pinned

**Confirmed** (computation and source). Severity: low, with a sharp edge.

`JwtService.getSigningKey` Base64-decodes the configured secret and hands the bytes to
`Keys.hmacShaKeyFor`
(`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtService.java:89-91`),
which picks the HMAC variant from the key length. The committed default secret is 64
Base64 characters, which decodes to 48 bytes, which selects HS384.

Because nothing pins the algorithm, changing the secret's length silently changes the
signing algorithm. A shorter secret weakens it, and fewer than 32 decoded bytes makes the
library refuse to sign at all, which surfaces as a startup-time or first-login failure
rather than a configuration error.

The same secret is shipped as a working default in three places and in `.env.example`, so
an operator who copies the example file without editing it uses the same key as every other
clone of the repository. See [security and authentication](./04-security-and-authentication.md).

### The OpenAPI document contradicts the build

**Confirmed** (source). Severity: low.

`OpenApiConfig` hardcodes `.version("1.0")`
(`src/main/java/com/nolcox/jobtracking/config/OpenApiConfig.java:21`) while `pom.xml:15`
declares `1.3.1` and `frontend/package.json` declares `1.3.1`. Swagger UI and
`/api/api-docs` advertise a version that has never been released.

The same file declares the API license as `Apache 2.0`
(`src/main/java/com/nolcox/jobtracking/config/OpenApiConfig.java:26-28`), while the
repository ships an MIT license (`LICENSE:1`).

### Two schema sources and no migration tool

**Confirmed** (source). Severity: medium.

`spring.jpa.hibernate.ddl-auto: update` is set in both runnable profiles
(`src/main/resources/application.yml:23`,
`src/main/resources/application-docker.yml:28`), and Compose separately mounts
`src/main/resources/database/job_tracking_db_1.sql` as a MySQL init script. There is no
Flyway or Liquibase dependency in `pom.xml`. The production schema is therefore whichever
of the two got there first, plus whatever Hibernate infers on each boot.

The two checked-in schemas have already drifted apart beyond the missing `level` column
noted in section 1: `first_name` is 100 characters in the MySQL script and 255 in
`src/test/resources/schema.sql`, `contact_phone` is 50 against 255, and only the MySQL
script declares `ON DELETE CASCADE` on `job_applications.user_id`. Tests run against the
H2 schema and cannot catch this class of divergence.

### JavaDoc that contradicts the method it documents

**Confirmed** (source). Severity: low.

- `calculateStageConversionRates` is documented as "the percentage of applications that
  advanced past each status" and computes exactly one entry, for `APPLIED`
  (`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:660-681`).
- `extractPositionType` recognizes seniority words only and returns "Other" for everything
  else (`.../AnalyticsServiceImpl.java:762-780`), while the response DTO's JavaDoc gives
  "Frontend", "Backend", and "Full Stack" as examples of what it returns.
- `SalaryDistributionResponse` documents its entries as "sorted by midpoint descending,
  capped at 15"; `getSalaryDistribution` neither sorts nor caps. It also documents
  `salaryMin` and `salaryMax` as nullable, and the service coalesces so neither is ever
  null, except that an average of exactly zero is converted to null
  (`.../AnalyticsServiceImpl.java:426-427`), which conflates "no salary data" with
  "everyone offered zero".
- `frontend/src/constants/statuses.js` refers readers to `metricsEngine.js` five times
  (`:5`, `:96`, `:117`, `:132`, `:146`). No file by that name exists in the repository.

### Error message constants exist and are bypassed

**Confirmed** (source). Severity: low.

`ErrorMessages` defines `USER_NOT_FOUND` and `ACCESS_DENIED`
(`src/main/java/com/nolcox/jobtracking/shared/exception/ErrorMessages.java:31,38`),
and the same literals are typed out by hand at
`src/main/java/com/nolcox/jobtracking/application/service/impl/JobApplicationServiceImpl.java:110`
and `:350`, and at
`src/main/java/com/nolcox/jobtracking/application/service/impl/ApplicationEventServiceImpl.java:371`.
The class exists specifically so that the same error type always produces the same string,
and nothing enforces that.

---

## 4. Scaling characteristics

These are not defects. They are properties of the current design that determine how the
application behaves as an account grows, and they are worth knowing before profiling
anything. See [analytics internals](./05-analytics-internals.md) for how the computations
themselves work.

### Every analytics endpoint loads the user's whole table

**Confirmed** (source). Severity: medium at scale.

`repository.findAllByUserId(userId)` appears at ten call sites in `AnalyticsServiceImpl`
(`:230`, `:379`, `:438`, `:470`, `:498`, `:624`, `:789`, `:973`, `:1075`, `:1177`). All
filtering, grouping, averaging, and percentage work is then done in Java streams. Only
`getCountsByStatus` pushes aggregation into SQL.

A single dashboard load issues twelve analytics requests in parallel
(`frontend/src/hooks/useAnalytics.js:167-232`), so a user with N applications causes
roughly eight times N rows to be materialized per page view. With the default demo data
this is invisible. With a few thousand applications it will not be.

### The table shows the first 100 applications and nothing more

**Confirmed** (source, both sides). Severity: medium.

`Dashboard.jsx:203` calls `jobApplicationsAPI.getAll(0, 100)`. The API is paginated and
the response's `content` array is read, but no component exposes page controls and nothing
reads `totalElements`.

Past 100 applications the table silently drops rows, and the header count
`{apps.length} APPLICATIONS` (`frontend/src/Dashboard.jsx:337`) under-reports, while the
server-computed analytics on the same screen count everything. The two halves of the
dashboard disagree with no explanation offered to the user.

### One extra database query per authenticated request

**Confirmed** (source). Severity: low.

`JwtAuthenticationFilter` calls `userDetailsService.loadUserByUsername` on every
authenticated request
(`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtAuthenticationFilter.java:61`),
which becomes a `findByEmail` lookup. Twelve of those fire per dashboard load. The token
already carries a `userId` claim and `JwtService.extractUserId` exists to read it, unused.

### Analytics bucket by the server's time zone

**Confirmed** (source). Severity: low.

`getActivityHeatmap` and `getTimePatterns` both bucket by `ZoneId.systemDefault()`
(`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:450,480`).
The heatmap and the hour-of-day chart therefore shift with the server's configured zone
and do not reflect the user's locale. Two deployments of the same data in different regions
produce different charts.

---

## 5. Inconsistencies between backend and frontend

### Funnel and conversion figures read current status only

**Confirmed** (source). Severity: medium, and it changes how the numbers should be read.

`getFunnelAnalytics` loads `repository.findAllByUserId(userId)` and derives every figure
from `app.getStatus()`
(`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:621-657`).
The event repository is consulted in exactly three places in the entire service: the
transition matrix and two health queries.

An application that passed three interview rounds and was then rejected contributes nothing
to any interview or conversion rate, because only its terminal status is read. The
transition matrix, which is event-derived, shows those same three hops. The two views on
the same dashboard can disagree, and both are behaving as written. This is documented in
[analytics and insights](../user-guide/04-analytics-and-insights.md) for users and in
[analytics internals](./05-analytics-internals.md) for contributors.

### The two copies of status metadata have diverged

**Confirmed** (source, both sides). Severity: medium.

Because `/v1/config/*` has no client (see [section 2](#2-unreachable-and-dead-code)), the
backend and the frontend each carry a full status table, and they no longer agree.

**Table 4.** *Status metadata that differs between the backend table and the frontend constants.*

| Status | Backend label and color | Frontend label and color |
| ------ | ----------------------- | ------------------------ |
| `TECH_SCREEN` | "Technical Screen", `#22D3EE` | "Tech Screen", `#F59E0B` |
| `TAKE_HOME` | "Take Home Assignment", `#06B6D4` | "Take Home", `#F59E0B` |
| `TECHNICAL_I` | "Technical Interview I", `#14B8A6` | "Technical I", `#F59E0B` |
| `REFERENCE_CHECK` | "Reference Check", `#10B981` | "Reference Check", `#cb37a1` |
| `GHOSTED` | "Ghosted", `#6B7280` | "Ghosted", `#F87171` |

Backend values are in
`src/main/java/com/nolcox/jobtracking/application/service/impl/ConfigServiceImpl.java:67-80`
and `:109-110`; frontend values are in `frontend/src/constants/statuses.js:50-69` and
`frontend/src/constants/colors.js:13-40`.

The groupings differ too, and this one changes a number on screen. The backend's
`INTERVIEWING` group holds two statuses, `RECRUITER_SCREEN` and `REFERENCE_CHECK`
(`.../ConfigServiceImpl.java:116-117`); the frontend's holds seven
(`frontend/src/constants/statuses.js:82-90`). The backend's `WAITING` group includes
`APPLIED` (`.../ConfigServiceImpl.java:122-123`) and the frontend's does not
(`frontend/src/constants/statuses.js:79`). The dashboard's "In Interviews" card therefore
counts something different from what the backend's own `INTERVIEW_STATUSES` counts.

A third disagreement sits entirely inside the backend: `ConfigServiceImpl` groups
`OFFER_DECLINED` and `OFFER_RESCINDED` under `REJECTED`, while
`AnalyticsServiceImpl.OFFER_STATUSES` counts both as offers. The same application is an
offer in the metrics and a rejection in the grouping.

### The "Status Changed Date" field edits the wrong value

**Confirmed** (source, both sides). Severity: medium.

The modal's input labeled "STATUS CHANGED DATE" reads and writes `form.lastUpdate`
(`frontend/src/components/modal/ApplicationModal.jsx:370-377`), and `toUIFormat` sets
`lastUpdate` from `updatedAt` (`frontend/src/utils/dataAdapter.js:106`). On save,
`toBackendFormatForUpdate` compares `form.lastUpdate` against the original and sends the
result as `statusChangedAt` (`frontend/src/utils/dataAdapter.js:272-277`).

So the field displays the record's last-modified timestamp under a "status changed" label,
and writes to the correct backend column starting from the wrong value. The API does return
`statusChangedAt` (`JobApplicationResponse` includes it), and no part of the UI displays
it.

### The backend's error messages are discarded before the user sees them

**Confirmed** (source, both sides). Severity: medium.

The backend builds a per-field validation error map
(`src/main/java/com/nolcox/jobtracking/application/controller/GlobalExceptionHandler.java:36`).
The frontend replaces every failure with a fixed string: "Failed to save application.
Please try again." (`frontend/src/Dashboard.jsx:246`), "Failed to load applications."
(`:208`), "Failed to delete application." (`:262`). A blank company name produces a precise
server-side message that the user never sees.

Two related swallows: `ApplicationViewModal` catches an audit-trail fetch failure and sets
`events` to an empty array, which renders identically to "this application has no history";
and `JwtAuthenticationFilter` logs an expired token at ERROR level
(`.../JwtAuthenticationFilter.java:86-87`), so a routine condition writes an error line on
every request from a stale session.

### Smaller mismatches

**Confirmed** (source). Severity: low.

- Logging in with a password shorter than 8 characters returns 400 with "Password must be
  at least 8 characters", not 401, because `AuthRequest.password` carries
  `@Size(min = 8)`
  (`src/main/java/com/nolcox/jobtracking/application/dto/request/AuthRequest.java:13`).
  This states the password policy to an unauthenticated caller and locks out any account
  whose password predates the rule.
- Nothing validates that `salaryMin` is less than or equal to `salaryMax`, in either the
  request DTOs or the modal. A record with a minimum of 200000 and a maximum of 50000 is
  accepted and flows into the salary averages.
- `JobApplication` carries `@Version private Long version`
  (`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:102-103`), and
  `JobApplicationResponse` does not expose it and no request DTO accepts it. Optimistic
  locking is enabled and no client can participate in it, so concurrent edits are
  last-write-wins.
- The audit trail renders raw camelCase field names to the user, producing lines such as
  "salaryMin updated from 100000.0 to 120000.0"
  (`frontend/src/components/modal/AuditTrailTimeline.jsx:98`).
- `AppTable` sorts by a single key with no direction toggle and stringifies nulls through
  `String(a[sortKey]).localeCompare(...)`
  (`frontend/src/components/table/AppTable.jsx:97`), so applications with no level sort
  under the literal text "null". The table also defaults to the "Active" filter, hiding the
  whole `REJECTED` group on first paint (`:72`, `:78-81`), while the count in the header
  above it includes them.

---

## 6. Unverified leads

Everything above was read in the source. The following were noticed during the survey and
could not be confirmed. They are leads, not claims, and no user-facing documentation should
repeat them as fact.

1. **Whether every insight component consumes every field of its DTO.** The prop-shape
   JSDoc matches the DTOs at the top level for the health, company, location, position,
   transition, and salary components. A field-by-field audit was not done;
   `SalaryDistributionResponse.avgMid` and `TransitionMatrixResponse.statuses` in
   particular were not traced to a render site.
3. **The exact HTTP status for an invalid enum in a request body or query parameter.**
   Reasoned from `GlobalExceptionHandler` not extending `ResponseEntityExceptionHandler`,
   not observed against a running server. The same uncertainty applies to a non-integer
   `year` on the activity heatmap and to malformed JSON on any POST or PUT.
4. **What `/api/actuator/**` exposes under the default profile.** `SecurityConfig`
   permits it unauthenticated
   (`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:69`). The `docker`
   profile limits exposure to `health` and `info`; `src/main/resources/application.yml`
   has no `management` block at all, so the effective exposure is whatever Spring Boot 3.4
   defaults to. Not verified.

One further observation about the test suite, stated as fact because it was checked but
worth reading with care: `mvn verify` passes, including the 85 percent JaCoCo line-coverage
gate. That gate measures a bundle that includes the dead code enumerated in
[section 2](#2-unreachable-and-dead-code). Tests for components no user can reach and for
service methods no route calls contribute to the number. Three near-duplicate auth
integration test classes and two job-application ones also inflate the suite;
`AuthIntegrationTestSimple` and `AuthIntegrationTestWorking` read as abandoned forks of
`AuthIntegrationTest`. See [testing](./07-testing.md).

Continuous integration runs only on `develop`
(`.github/workflows/ci.yml:5,7`), so a push to a feature branch is unverified until a pull
request opens.

---

## See also

- [Testing](./07-testing.md) for what the suites do and do not cover.
- [Analytics internals](./05-analytics-internals.md) for why the funnel and the transition
  matrix can disagree.
- [Security and authentication](./04-security-and-authentication.md) for the demo account,
  the shipped secret, and the token algorithm.
- [Configuration](./08-configuration.md) for which properties are honored on which profile.
- [Troubleshooting](../user-guide/06-troubleshooting.md) for the user-facing symptoms of
  several defects on this page.
- [Contributing](./10-contributing.md) if you intend to fix one of these.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
