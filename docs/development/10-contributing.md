# Contributing to Job Tracker

> **Audience:** developers submitting changes to Job Tracker  ·  **Scope:** prerequisites, local setup, the full build and test command reference, code conventions, the coverage gate, and pull request expectations

This page is the long-form contributor guide. It covers everything from getting a fresh
clone running to opening a pull request that passes CI on the first attempt. For a short
version that fits on one screen, see [CONTRIBUTING.md](../../CONTRIBUTING.md) at the
repository root.

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Getting a clone running](#2-getting-a-clone-running)
- [3. Backend command reference](#3-backend-command-reference)
- [4. Frontend command reference](#4-frontend-command-reference)
- [5. Code style and conventions](#5-code-style-and-conventions)
- [6. The coverage gate](#6-the-coverage-gate)
- [7. Commits and branches](#7-commits-and-branches)
- [8. Opening a pull request](#8-opening-a-pull-request)
- [See also](#see-also)

---

## 1. Prerequisites

The repository holds two independently built projects: a Maven backend at the repository
root and a Create React App frontend under `frontend/`. Each has its own toolchain.

**Table 1.** *Tooling required to build and test each side of the project, with the version CI uses.*

| Tool | Version used by CI | Where the version comes from | Needed for |
| ---- | ------------------ | ---------------------------- | ---------- |
| JDK | 17 (Temurin) | `.github/workflows/ci.yml:16-21`, `pom.xml:23` | Backend build and tests |
| Maven | Not pinned by CI; the Docker builder image uses 3.9 (`Dockerfile:2`) | No Maven wrapper is committed | Backend build and tests |
| Node.js | 22 | `.github/workflows/ci.yml:45-50`, `frontend/Dockerfile:2` | Frontend build and tests |
| npm | Ships with Node 22 | `.github/workflows/ci.yml:52-53` | Frontend dependency install |
| MySQL | 8 (Compose pins `mysql:8.3.0`) | `docker-compose.yml:3` | Running the backend locally without Compose |
| Docker and Compose v2 | Any recent release | `docker-compose.yml` has no `version:` key, which requires Compose v2 | The Compose setup path |

Two things about that table are worth stating plainly.

There is **no Maven wrapper** in this repository. `mvnw` and `.mvn/` do not exist, so
`mvn` must be on your `PATH`. The `.dockerignore` file carries `!.mvn` and `!mvnw`
negations with a comment claiming the wrapper is copied explicitly, but nothing in
`Dockerfile` copies it; the image build uses the `maven:3.9-eclipse-temurin-17` base
image's own Maven.

The backend targets Java 17 (`pom.xml:23`) and CI builds on Java 17. Newer JDKs compile
and run the suite, but JaCoCo 0.8.12 (`pom.xml:150-151`) cannot instrument classes
compiled at class-file versions newer than roughly Java 21. On a recent JDK the test run
emits many `Unsupported class file major version` errors for Mockito-generated classes.
The build still succeeds and CI on Java 17 is unaffected, but the local output is noisy
and coverage of mock-adjacent classes may be understated. Build on Java 17 if you want
your local coverage number to match the gate's.

MySQL is required for every runnable profile. H2 is test scope only. See
[08-configuration.md](./08-configuration.md) for the profile-by-profile detail.

---

## 2. Getting a clone running

There are two supported paths. Compose is the faster one and is what the readme
recommends; the local path is what you want for day-to-day development, because it gives
you hot reload on the frontend and a normal debugger attach on the backend.

### Path A: Docker Compose

```bash
git clone https://github.com/Jnolcox/job-tracker.git
cd job-tracker
cp .env.example .env
docker compose up --build
```

`.env` is used only for `${VAR:-default}` substitution inside `docker-compose.yml`;
Compose declares no `env_file:`, so a variable reaches a container only if a service's
`environment:` block forwards it. Every variable in `.env.example` has a Compose default,
so `docker compose up` works with no `.env` at all.

Once the containers report healthy:

**Table 2.** *Where each service is reachable from the host under Docker Compose.*

| Service | URL |
| ------- | --- |
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/api/swagger-ui.html` |
| Health check | `http://localhost:8080/api/actuator/health` |
| MySQL | `localhost:3306` |

Tear down with `docker compose down`. Add `-v` to drop the `mysql_data` volume, which
destroys all application data with no recovery path.

Two Compose behaviors will bite you eventually. Every service declares an explicit
`container_name`, so a second instance of the stack under a different Compose project name
still collides on container names and fails to start. And the MySQL init script mounted at
`/docker-entrypoint-initdb.d/init.sql` runs only when `/var/lib/mysql` is empty, so edits
to `src/main/resources/database/job_tracking_db_1.sql` do nothing until you
`docker compose down -v`.

### Path B: Local with MySQL

Create the database and user the default profile expects
(`src/main/resources/application.yml:17-19`):

```sql
CREATE DATABASE job_tracking_db;
CREATE USER 'jobtracker'@'localhost' IDENTIFIED BY 'jobtracker123';
GRANT ALL PRIVILEGES ON job_tracking_db.* TO 'jobtracker'@'localhost';
```

Hibernate creates and extends the schema on startup, because
`spring.jpa.hibernate.ddl-auto` is `update` in the default profile
(`src/main/resources/application.yml:23`). The checked-in script
`src/main/resources/database/job_tracking_db_1.sql` is behind the entity model: it does not
create the `level` column that `JobApplication` declares
(`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:72-73`). Loading
that script works only because `ddl-auto: update` adds the missing column afterward. There
is no migration tool in the project, so treat the JPA entities as the source of truth for
the schema.

Start the backend from the repository root:

```bash
mvn spring-boot:run
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm start
```

The dev server listens on port 3000 and proxies API calls to port 8080 via the `proxy`
key in `frontend/package.json:47`. From the browser's point of view everything is
same-origin, so CORS is never exercised in either supported topology.

On first startup `DataInitializer` seeds a demo account, `test@example.com` with password
`password123`, plus five sample applications. It is annotated `@Profile("!test")`
(`src/main/java/com/nolcox/jobtracking/config/DataInitializer.java:25`), so it runs under
both the default and the `docker` profiles and logs the credentials in plaintext at
startup. Log in with that account to have data on the dashboard immediately.

A fresh install has one known first-run defect, so do not spend time debugging it as a
setup mistake. `GET /api/v1/job-applications/analytics/stage-durations` returns 500 against
the seeded demo account, because `DataInitializer` bypasses the service layer and never
sets `statusChangedAt`, which `AnalyticsServiceImpl.getStageDurations` then dereferences
unguarded (`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:523`).
Applications you create through the UI are unaffected. See
[11-known-gaps.md](./11-known-gaps.md).

---

## 3. Backend command reference

All backend commands run from the repository root.

**Table 3.** *Backend Maven commands and what each one does.*

| Command | What it does |
| ------- | ------------ |
| `mvn compile` | Compiles `src/main/java` only |
| `mvn test` | Runs the surefire suite and writes the JaCoCo report to `target/site/jacoco/`. Does **not** enforce the coverage gate |
| `mvn verify` | Everything `mvn test` does, plus the JaCoCo `check` gate and packaging. This is what CI runs |
| `mvn spring-boot:run` | Starts the backend on port 8080 under the default profile |
| `mvn clean package -DskipTests` | Builds the jar without running tests, the way the Docker image build does |

The coverage gate lives on the `jacoco-check` execution (`pom.xml:165-193`), which has no
explicit `<phase>` and therefore binds to the `check` goal's default phase, `verify`. The
`report` execution is bound explicitly to `test` (`pom.xml:158-164`). That split is why
`mvn test` produces a coverage report but cannot fail on coverage, and why `mvn verify` can.

### Running a subset of tests

Surefire declares no `<includes>` or `<excludes>` anywhere in `pom.xml`, so the default
include patterns apply: `**/Test*.java`, `**/*Test.java`, `**/*Tests.java`,
`**/*TestCase.java`.

```bash
# one class
mvn -Dtest=JwtServiceTest test

# one method
mvn -Dtest='JwtServiceTest#testGenerateToken_WithUserDetails_ShouldReturnValidToken' test

# one @Nested group, using the inner-class form
mvn -Dtest='AuthServiceImplTest$RegistrationTests' test

# several classes
mvn -Dtest='AuthServiceImplTest,JwtServiceTest' test

# skip the coverage agent while iterating
mvn -Dtest=JwtServiceTest -Djacoco.skip=true test
```

Add `-DfailIfNoTests=false` when a pattern may match nothing.

> [!NOTE]
> Name new test classes so surefire collects them. `**/Test*.java` matches files whose name
> *starts with* `Test`, not files that merely contain it. Three integration classes in this
> repository are named in a way that matches no default pattern and therefore never run:
> `AuthIntegrationTestSimple`, `AuthIntegrationTestWorking` and
> `JobApplicationIntegrationTestSimple`, all under
> `src/test/java/com/nolcox/jobtracking/integration/`. They pass when forced with `-Dtest=`,
> but nothing protects them from bit rot. End your class name in `Test`.

### Test layout

```text
src/test/java/com/nolcox/jobtracking/
├── application/controller/     Mockito unit tests, not MVC slices
├── application/service/impl/   Mockito unit tests
├── infrastructure/security/    Mockito and plain JUnit unit tests
├── integration/                @SpringBootTest classes
└── fixtures/                   Fluent builders, no tests
```

There are no slice tests: no `@WebMvcTest`, no `@DataJpaTest`, no `@JsonTest`. Every test
is either a plain Mockito unit test or a full `@SpringBootTest`. The controller tests call
controller methods directly, so bean validation, JSON serialization, the exception handler
mapping and the security filter chain are exercised only by the two MockMvc integration
classes, `AuthIntegrationTest` and `JobApplicationIntegrationTest`.

Fixtures live in `src/test/java/com/nolcox/jobtracking/fixtures/`. Six hand-rolled fluent
builders (`UserFixture`, `JobApplicationFixture`, `JobApplicationRequestFixture`,
`ApplicationEventFixture`, `AuthRequestFixture`, `RegisterRequestFixture`) follow a
consistent shape: a static entry point named `aXxx()`, chainable `withX(...)` mutators, and
a terminal `build()` or `buildResponse()`. Use them in new unit tests rather than
constructing entities by hand. The integration tests do not use them, building entities
inline instead.

Integration tests activate the `test` profile via `@ActiveProfiles("test")`, which points
at in-memory H2 (`src/test/resources/application-test.yml:3-6`) with the schema supplied by
`src/test/resources/schema.sql` rather than by Hibernate. That schema file is hand written
and is not generated from the entities, so adding a persisted field to an entity means
adding the column to `schema.sql` as well. Drift shows up only as a runtime SQL error.

---

## 4. Frontend command reference

All frontend commands run from `frontend/`.

**Table 4.** *Frontend npm commands and what each one does.*

| Command | What it does |
| ------- | ------------ |
| `npm ci` | Clean install strictly from `package-lock.json`. This is what CI runs |
| `npm install` | Install, updating the lockfile if it disagrees with `package.json` |
| `npm start` | Dev server on port 3000 with hot reload, proxying `/api` to port 8080 |
| `npm test` | Jest in interactive watch mode. Does not exit on its own |
| `CI=true npm test -- --watchAll=false` | Single non-interactive run. This is what CI runs |
| `CI=true npm test -- --watchAll=false --coverage` | Same, plus a coverage report. No threshold is configured, so it only reports |
| `npm run build` | Production build via `react-scripts build` into `frontend/build/` |

Running a subset:

```bash
cd frontend

# one file: the positional argument is a regex matched against the test path
CI=true npm test -- --watchAll=false src/components/common/StatCard.test.jsx
CI=true npm test -- --watchAll=false StatCard

# one test by name
CI=true npm test -- --watchAll=false StatCard -t "should have no accessibility violations"
```

The runner is the Jest that `react-scripts` 5 bundles. `frontend/package.json` has no
`jest` key, so there is no custom `testMatch`, no `coverageThreshold` and no extra setup
files. `frontend/src/setupTests.js` does exactly one thing: it imports
`@testing-library/jest-dom`. It does not register `jest-axe`, so every test file that uses
axe calls `expect.extend(toHaveNoViolations)` itself.

Shared frontend test helpers live in `frontend/src/test-utils/`, re-exported from
`frontend/src/test-utils/index.js`. Import them as a group:

```js
import { createMockApplication, mockDate } from '../test-utils';
```

`factories/application.js` and `factories/event.js` build UI-shaped and backend-shaped
objects; `helpers/date.js` provides `mockDate`, `restoreDate`, `withMockedDate` and
`createDateMock` for freezing the clock.

> [!IMPORTANT]
> Two frontend CI failures have already broken this build once each, and both are recorded
> in [CHANGELOG.md](../../CHANGELOG.md) under 1.3.1.
>
> **`npm ci` requires the lockfile to be in sync with `package.json`.** It does not repair
> a mismatch the way `npm install` does; it fails. If you add, remove or bump a dependency,
> commit the regenerated `package-lock.json` in the same change, and verify with a clean
> `npm ci` rather than an incremental `npm install`.
>
> **`npm run build` fails on any lint warning when `CI` is set.** GitHub Actions sets `CI`
> for every step, and under `CI` the `eslint-webpack-plugin` that Create React App wires in
> promotes ESLint warnings to errors and aborts the build. An unused import, an unused
> binding or a missing React hook dependency will fail CI even though `ci.yml` has no lint
> step. There is no explicit lint command in `frontend/package.json`; run
> `CI=true npm run build` locally to reproduce the gate.

---

## 5. Code style and conventions

There is no formatter or linter enforced on the backend: no Checkstyle, no Spotless, no
SpotBugs, no enforcer plugin. The conventions below are the ones the existing code actually
follows, so match them.

### Backend

**Layered packages.** The root package is `com.nolcox.jobtracking`, split into six
subpackages:

```text
src/main/java/com/nolcox/jobtracking/
├── application/     controllers, DTOs, service interfaces and implementations
├── domain/          JPA entities and Spring Data repositories
├── infrastructure/  security, JWT
├── config/          Spring configuration and the demo data seeder
├── common/          shared API constants
└── shared/          exception types and error message constants
```

The dependency direction is `domain` inward. Verified at the current commit: nothing under
`domain/` imports `application` or `infrastructure`, and no controller imports a repository
directly. Controllers depend on service interfaces from
`application/service/`; the implementations live in `application/service/impl/` and are the
only classes that touch repositories. Keep it that way.

**Constructor injection with Lombok.** Twelve classes across the controllers, service
implementations, security components and config use `@RequiredArgsConstructor` over `final`
fields, for example `JobApplicationController` (`src/main/java/com/nolcox/jobtracking/application/controller/JobApplicationController.java:54,58-60`).
Do not introduce field injection. There is exactly one deliberate exception, a setter
injected optional dependency at
`src/main/java/com/nolcox/jobtracking/application/service/impl/JobApplicationServiceImpl.java:70`,
where `@Autowired(required = false)` makes the audit event service optional so the service
can run without event logging. Its Javadoc explains why. Treat that as a documented
one-off, not a pattern to copy.

**Lombok usage is narrow and consistent.** Only these annotations appear in `src/main/java`:

**Table 5.** *Every Lombok annotation used in backend production code, by import count.*

| Annotation | Imports | Where |
| ---------- | ------- | ----- |
| `@RequiredArgsConstructor` | 12 | Controllers, service implementations, security components, config |
| `@Slf4j` | 9 | Anything that logs |
| `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` | 3 each | The three JPA entities |
| `@NonNull` | 1 | Parameters of `JwtAuthenticationFilter.doFilterInternal` only |

Entities carry the full `@Data` plus `@Builder` set, for example
`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:17-24`. Nothing
else does. Do not put `@Data` on a service or a config class.

**DTOs are Java records with bean validation annotations**, not Lombok classes. See
`src/main/java/com/nolcox/jobtracking/application/dto/request/AuthRequest.java:7`. Request
records live in `application/dto/request/`, responses in `application/dto/response/`.

**Javadoc on the public surface.** Service implementations and their interfaces carry class
level Javadoc explaining the responsibility, and non-obvious methods carry method Javadoc
with `@param` and `@return`. Follow the existing density rather than documenting every
getter.

**Constants, not literals.** Shared API strings live in
`src/main/java/com/nolcox/jobtracking/common/constants/ApiConstants.java` and error message
strings in `src/main/java/com/nolcox/jobtracking/shared/exception/ErrorMessages.java`. Add
to those rather than repeating a literal.

### Frontend

**JSDoc file headers.** 50 of the 63 non-test source files under `frontend/src/` open with
a `@file` and `@description` block, for example
`frontend/src/hooks/useDashboardSettings.js:1-5`. Exported constants and hooks carry their
own JSDoc with `@constant`, `@param` and `@returns`. New modules should follow this.

**Components are function components with hooks.** There are no class components. Shared
state lives in context providers under `frontend/src/context/`; reusable logic lives in
hooks under `frontend/src/hooks/`.

**Constants are centralized.** Statuses, colors, dashboard component keys and API config
live under `frontend/src/constants/`, with tests that pin their shape
(`frontend/src/constants/statuses.test.js`, `frontend/src/constants/colors.test.js`). A new
status or color goes there, not inline in a component.

**No charting library.** Every chart is hand-written SVG and CSS. Adding a charting
dependency is a significant change to the project's shape; raise it in an issue first.

**Accessibility assertions.** Sixteen test files run `jest-axe` against rendered output.
When you add a new component with visible UI, add an `Accessibility` describe block with an
`await axe(container)` assertion, matching the existing pattern. Note that
`frontend/src/Dashboard.test.jsx` disables the axe `heading-order` rule with a TODO,
because the dashboard's chart sections use `h3` with no preceding `h1` or `h2`. Do not copy
that suppression into new files.

---

## 6. The coverage gate

One rule, declared at `pom.xml:181-190`:

```xml
<rule>
  <element>BUNDLE</element>
  <limits><limit>
    <counter>LINE</counter>
    <value>COVEREDRATIO</value>
    <minimum>0.85</minimum>
  </limit></limits>
</rule>
```

Whole-bundle line coverage at or above 85 percent. There is no per-class, per-package,
branch, method or complexity rule, so one completely untested new class cannot fail the
build on its own as long as the aggregate stays above the threshold. That is not license to
ship untested code; it is a fact about what the gate can and cannot catch.

Four exclusions apply to the `check` execution only (`pom.xml:171-179`):

- `config/DataInitializer.class`, the demo seeder, which the `test` profile disables and
  which therefore can never be covered by this suite
- `config/OpenApiConfig.class`
- `domain/repository/*`, the Spring Data interfaces
- `JobTrackingApplication.class`, the `main` class

The `report` execution declares **no** exclusions (`pom.xml:158-164`). The HTML report CI
uploads as the `jacoco-report` artifact therefore shows a lower, unfiltered number than the
one the gate evaluates. If you are reading the artifact to judge headroom, you are reading
the wrong number.

### Keeping a change above the gate

1. Run `mvn verify`, not `mvn test`. Only `verify` runs the gate.
2. Open `target/site/jacoco/index.html` and drill into the package you changed. Uncovered
   lines are highlighted red.
3. Cover new service and controller logic with a Mockito unit test in the matching
   `application/service/impl/` or `application/controller/` package, using the fixtures.
   Follow the existing `@Nested` plus `@DisplayName` structure so failures name the
   behavior rather than the method.
4. Cover a new persisted field or a new HTTP contract in `AuthIntegrationTest` or
   `JobApplicationIntegrationTest`, which are the only tests that exercise validation,
   serialization and the security filter chain.
5. If the gate fails, the message reads `Rule violated for bundle jobtracking: lines
   covered ratio is 0.8x, but expected minimum is 0.85`.

The frontend has no coverage requirement of any kind: no `coverageThreshold`, no
`--coverage` in CI, nothing uploaded. The `coverage >=85%` badge in the readme is a
hardcoded shields.io badge and refers to the backend gate only. New frontend code is still
expected to come with tests; the suite currently runs 28 files.

---

## 7. Commits and branches

### Branching

The default branch is `develop`. Branch from `develop` and target `develop`.

```bash
git checkout develop
git pull
git checkout -b short-descriptive-name
```

> [!WARNING]
> CI runs only on pushes to `develop` and on pull requests **targeting** `develop`
> (`.github/workflows/ci.yml:3-7`). There is no `main` trigger, no tag trigger, no
> `workflow_dispatch` and no schedule. A pull request opened against any other branch gets
> no CI at all and will merge unchecked.

The history has no branch naming convention to follow: all 15 merged pull requests came
from a single long-lived branch named `Jnolcox/test-account`. Going forward, use a short
branch name that describes the change, one branch per logical change.

### Commit messages

The existing history is mixed and does not follow a formal convention. Zero of the 119
commits use a Conventional Commits prefix; subjects are short lowercase fragments such as
`refactor to constants`, `unused const` and `readme update`, some of which describe several
unrelated changes at once.

The standard going forward:

- One logical change per commit. A commit should not break the build or the tests on its
  own.
- A subject line in the imperative mood, roughly 72 characters or fewer, with no trailing
  period. `Add stage duration null guard`, not `added stage duration null guard.`
- A body, separated by a blank line and wrapped at 72 characters, when the change needs a
  reason. Explain why, not how; the diff already says how.
- Reference an issue in the body as `Refs #12` or `Fixes #12` when one exists.

Conventional Commits prefixes are not required, because nothing in the repository consumes
them: there is no release automation, no changelog generator and no commit linting.
[CHANGELOG.md](../../CHANGELOG.md) is maintained by hand in the Keep a Changelog format.

---

## 8. Opening a pull request

Run both suites before you open the pull request. These are the two commands CI runs:

```bash
mvn verify
```

```bash
cd frontend && CI=true npm test -- --watchAll=false && npm run build
```

The build step matters as much as the test step, because it is where lint is enforced. See
section 4.

**Table 6.** *What causes each CI job to fail.*

| Job | Fails when |
| --- | ---------- |
| Backend (Java 17) | A compilation error in `src/main` or `src/test`; any surefire test failure or error; the JaCoCo bundle line ratio falling below 0.85 after exclusions. Nothing else. There is no lint, static analysis or dependency audit on the backend |
| Frontend (Node 22) | `npm ci` failing, including a lockfile out of sync with `package.json`; any failing Jest test; `npm run build` failing, which under `CI` includes any ESLint warning |

The two jobs have no `needs:` relationship, so they run in parallel and either can fail
independently. There is no `concurrency` group, so pushing twice in quick succession runs
both.

A pull request that is ready to review has:

- **A scope a reviewer can hold in their head.** One logical change. Split refactors away
  from behavior changes.
- **A title that names the change**, not the branch or the ticket number alone.
- **A description that says what changed and why**, plus how you verified it. If the change
  is user-visible, say what a user will now see; if it changes an API response shape, say
  so, because [03-api-reference.md](./03-api-reference.md) documents those shapes.
- **Tests for new behavior.** New backend logic needs a unit test at minimum; new HTTP
  contracts or persisted fields need an integration test. New frontend components need a
  test file including an accessibility assertion.
- **Documentation updated in the same change** when the change contradicts something in
  `docs/`. Where documentation and code disagree, the code wins, and stale documentation is
  a defect.
- **A changelog entry under `## [Unreleased]`** in [CHANGELOG.md](../../CHANGELOG.md) for
  anything a user or operator would notice.
- **Both CI jobs green.**

What CI does not check, and therefore what a reviewer has to: Java formatting and style,
the three uncollected integration test classes, any end-to-end behavior (there is no
Playwright or Cypress setup), the Docker image build (CI never builds it), and anything on
a branch other than `develop`.

For anything with a security dimension, do not open a public pull request or issue first.
Follow [SECURITY.md](../../SECURITY.md).

By contributing, you agree that your contributions are licensed under the MIT License, the
same terms that cover the project. See [LICENSE](../../LICENSE).

---

## See also

- [CONTRIBUTING.md](../../CONTRIBUTING.md), the short version of this page.
- [07-testing.md](./07-testing.md), the full picture of what the two suites cover and how
  CI is wired.
- [08-configuration.md](./08-configuration.md), every profile, property and environment
  variable, including which ones have no effect.
- [09-deployment-and-operations.md](./09-deployment-and-operations.md), for the Compose
  stack, image builds and data durability.
- [01-architecture.md](./01-architecture.md), for the layering the package rules in section
  5 enforce.
- [11-known-gaps.md](./11-known-gaps.md), for the defects and rough edges referenced above.
- [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md), which applies to all project spaces.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
