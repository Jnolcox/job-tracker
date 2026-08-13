# Testing

> **Audience:** Contributors adding or changing tests, and reviewers checking that a change is covered.  ·  **Scope:** Both test suites, the test profile and its database, fixtures, the JaCoCo gate, the accessibility assertions, how to run one test, and what CI enforces.

Job Tracker has two independent test suites that never talk to each other: a Maven/JUnit 5 suite for the Spring Boot backend and a Jest suite for the React frontend. Neither one needs MySQL, Docker, or a network connection. This page describes what each suite contains, how the coverage gate is configured, and the specific rough edges that will surprise you the first time you add a test.

## Contents

- [1. The two suites at a glance](#1-the-two-suites-at-a-glance)
- [2. Backend test layout](#2-backend-test-layout)
- [3. The test profile and its database](#3-the-test-profile-and-its-database)
- [4. Fixtures and builders](#4-fixtures-and-builders)
- [5. The JaCoCo coverage gate](#5-the-jacoco-coverage-gate)
- [6. The frontend suite](#6-the-frontend-suite)
- [7. Running a single test](#7-running-a-single-test)
- [8. Continuous integration](#8-continuous-integration)
- [9. Before you add a test](#9-before-you-add-a-test)
- [See also](#see-also)

---

## 1. The two suites at a glance

Both suites were executed against this commit to produce the numbers in Table 1. The backend numbers come from the surefire summary line printed by `mvn --batch-mode verify` (`Tests run: 237, Failures: 0, Errors: 0, Skipped: 0`). The frontend numbers come from the Jest summary printed by `CI=true npx react-scripts test --watchAll=false` (`Test Suites: 28 passed, 28 total` and `Tests: 2 skipped, 603 passed, 605 total`). These are collected counts from a real run, not counts of `@Test` annotations or `it(` calls.

**Table 1.** *The two suites, their runners, and the counts each one reports on a full run.*

| # | Suite | Runner | Command CI runs | Suites | Tests | Passed | Skipped |
| - | ----- | ------ | --------------- | ------ | ----- | ------ | ------- |
| 1 | Backend | JUnit 5 on maven-surefire-plugin 3.5.3, inherited from `spring-boot-starter-parent` 3.4.5 | `mvn --batch-mode verify` | 15 classes | 237 | 237 | 0 |
| 2 | Frontend | Jest 27.5.1, bundled with react-scripts 5.0.1 | `npm test -- --watchAll=false` with `CI=true` | 28 | 605 | 603 | 2 |

Two facts about the backend count are worth stating up front. First, `src/test/java` declares 261 `@Test` methods, not 237: three integration classes are never collected, for the reason given in section 2. Second, the backend has no skipped tests at all. There is no `@Disabled`, no `@Ignore`, and no `Assumptions.assumeTrue` anywhere under `src/test`, and there are no `@ParameterizedTest` or `@RepeatedTest` methods either.

The frontend's 605 is larger than the number of literal `it(` and `test(` calls in the tree, because eight `it.each` tables expand to more than one test each.

---

## 2. Backend test layout

The backend tests live under `src/test/java/com/nolcox/jobtracking/` in four folders: `application/controller/`, `application/service/impl/`, `infrastructure/security/`, `integration/`, plus a `fixtures/` folder that contains no tests.

There are exactly two kinds of test in the repository, not three. **There are no slice tests.** A grep across `src/test` finds no `@WebMvcTest`, no `@DataJpaTest`, no `@JsonTest`, and no `@WebFluxTest`. Every backend test is either a plain Mockito unit test with no Spring context at all, or a full `@SpringBootTest` that boots the entire application.

This matters more than it sounds. The classes in `application/controller/` are named like controller tests but they are not MVC slices: they construct the controller with Mockito mocks and call its methods directly, then assert on the returned `ResponseEntity`. Nothing in those tests exercises `@Valid` bean validation, JSON serialization or deserialization, `@RequestParam` binding, the `GlobalExceptionHandler` mapping of exceptions to status codes, or the security filter chain. All of that is covered only by the two MockMvc integration classes.

**Table 2.** *Every backend test class, its kind, its declared `@Test` count, and whether surefire collects it.*

| # | Class | Kind | Tests | Collected |
| - | ----- | ---- | ----- | --------- |
| 1 | `AuthControllerTest` | Mockito unit (`application/controller/AuthControllerTest.java:25`) | 4 | Yes |
| 2 | `ConfigControllerTest` | Mockito unit (`ConfigControllerTest.java:30`) | 5 | Yes |
| 3 | `JobApplicationControllerTest` | Mockito unit (`JobApplicationControllerTest.java:63`) | 27 | Yes |
| 4 | `AnalyticsServiceImplTest` | Mockito unit (`AnalyticsServiceImplTest.java:45`) | 20 | Yes |
| 5 | `AnalyticsServiceImplDataFusionTest` | Mockito unit (`AnalyticsServiceImplDataFusionTest.java:45`) | 25 | Yes |
| 6 | `AnalyticsServiceImplEventBasedTest` | Mockito unit (`AnalyticsServiceImplEventBasedTest.java:47`) | 18 | Yes |
| 7 | `ApplicationEventServiceImplTest` | Mockito unit (`ApplicationEventServiceImplTest.java:51`) | 24 | Yes |
| 8 | `AuthServiceImplTest` | Mockito unit (`AuthServiceImplTest.java:40`) | 12 | Yes |
| 9 | `ConfigServiceImplTest` | Mockito unit (`ConfigServiceImplTest.java:26`) | 12 | Yes |
| 10 | `JobApplicationServiceImplTest` | Mockito unit (`JobApplicationServiceImplTest.java:45`) | 18 | Yes |
| 11 | `CustomUserDetailsServiceTest` | Mockito unit (`CustomUserDetailsServiceTest.java:25`) | 12 | Yes |
| 12 | `JwtAuthenticationFilterTest` | Mockito unit (`JwtAuthenticationFilterTest.java:33`) | 12 | Yes |
| 13 | `JwtServiceTest` | Plain JUnit 5, no extension; wires `JwtService` by hand with `ReflectionTestUtils` | 16 | Yes |
| 14 | `AuthIntegrationTest` | `@SpringBootTest(RANDOM_PORT)` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` + `@Transactional` (`integration/AuthIntegrationTest.java:34-37`) | 12 | Yes |
| 15 | `JobApplicationIntegrationTest` | Same four annotations (`integration/JobApplicationIntegrationTest.java:47-50`) | 20 | Yes |
| 16 | `AuthIntegrationTestSimple` | `@SpringBootTest` + `@ActiveProfiles("test")` + `@Transactional`, no MockMvc (`integration/AuthIntegrationTestSimple.java:27-29`) | 7 | **No** |
| 17 | `AuthIntegrationTestWorking` | `@SpringBootTest` + `@ActiveProfiles("test")` + `@TestPropertySource` + `@Transactional` (`integration/AuthIntegrationTestWorking.java:28-40`) | 4 | **No** |
| 18 | `JobApplicationIntegrationTestSimple` | `@SpringBootTest` + `@ActiveProfiles("test")` + `@Transactional`, no MockMvc (`integration/JobApplicationIntegrationTestSimple.java:38-40`) | 13 | **No** |

Rows 1 through 15 sum to 237, which is exactly the surefire total.

### The three classes that never run

> [!WARNING]
> `AuthIntegrationTestSimple`, `AuthIntegrationTestWorking` and `JobApplicationIntegrationTestSimple` contain 24 passing tests that CI never executes. `pom.xml` declares no surefire `<includes>`, so surefire's default patterns apply: `**/Test*.java`, `**/*Test.java`, `**/*Tests.java`, `**/*TestCase.java`. These three file names start with neither `Test` nor end with `Test.java`, `Tests.java` or `TestCase.java`, so none of them matches. They are invisible, not broken: forcing them with `-Dtest=` runs all 24 and they all pass. A file named `FooIntegrationTestSimple.java` will silently do nothing.

The naming trap is the single most likely way to add a backend test that appears to work and never runs. If you add a class under `integration/`, end its file name in `Test.java`.

### AuthIntegrationTestSimple and AuthIntegrationTestWorking genuinely overlap

They do duplicate each other, and the duplication is not subtle. `AuthIntegrationTestWorking` is a strict subset of `AuthIntegrationTestSimple`. All four of its tests exist in `Simple` under the same method names and the same `@DisplayName` strings:

- `shouldRegisterNewUserSuccessfully` (`AuthIntegrationTestWorking.java:67`, `AuthIntegrationTestSimple.java:56`)
- `shouldLoginSuccessfully` (`:104`, `:118`)
- `shouldFailLoginWithInvalidCredentials` (`:136`, `:150`)
- `shouldCompleteFullAuthenticationFlow` (`:156`, `:180`)

`Simple` adds three that `Working` does not have: `shouldFailRegistrationWithDuplicateEmail` (`AuthIntegrationTestSimple.java:93`), `shouldFailLoginWithNonExistentUser` (`:170`) and `shouldGenerateValidJwtTokens` (`:207`).

The only structural difference is the `@TestPropertySource` block on `AuthIntegrationTestWorking.java:30-39`, which restates the H2 URL, driver, credentials, JWT secret and expiration that `application-test.yml` already supplies, and adds one genuinely different value: `spring.jpa.hibernate.ddl-auto=create-drop` where the profile says `none`. That single differing property gives the class its own Spring `ApplicationContext` cache key, so if the class were ever collected it would pay for a second full context startup in order to test a subset of what `Simple` already covers. The class Javadoc on each file reads as a separate attempt at the same job: "Simplified Integration tests ... without MockMvc" against "Working Integration tests ... using the service layer".

`JobApplicationIntegrationTestSimple` overlaps `JobApplicationIntegrationTest` the same way. Twelve of its thirteen display names appear verbatim in the MockMvc class; the difference is that the `Simple` variant drives `JobApplicationService` directly and asserts on thrown `ResourceNotFoundException` and `UnauthorizedException` instead of on HTTP status codes.

**What this means if you are adding an authentication test:** put it in `AuthIntegrationTest`, which uses MockMvc and actually runs. Do not extend `Simple` or `Working`. Both are candidates for deletion, and adding to them buys no coverage and no CI protection.

> [!NOTE]
> `Status: not wired.` `TestConfig` (`src/test/java/com/nolcox/jobtracking/integration/TestConfig.java`) is a `@TestConfiguration` that imports `SecurityConfig` and declares a `BCryptPasswordEncoder` bean, but a grep across the repository finds no `@Import(TestConfig.class)` and no other reference to it. It compiles into `target/test-classes` and is otherwise inert.

One more detail worth knowing: `pom.xml:107-111` declares `spring-security-test`, but no test imports anything from it. There is no `@WithMockUser` and no `SecurityMockMvcRequestPostProcessors` anywhere in `src/test`. The integration tests authenticate by generating a real JWT with `JwtService` and sending an `Authorization: Bearer` header.

---

## 3. The test profile and its database

Backend tests that need a Spring context activate the `test` profile through `@ActiveProfiles("test")` on the five integration classes. No `spring.profiles.active` default exists anywhere, and the Mockito unit tests never load a context, so the profile is irrelevant to them.

The profile is defined in `src/test/resources/application-test.yml`, which is 31 lines long.

**Table 3.** *Every setting in the test profile and what it does.*

| # | Key | Value | Effect |
| - | --- | ----- | ------ |
| 1 | `spring.datasource.url` | `jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE` | In-memory H2, kept alive for the life of the JVM (`application-test.yml:3`) |
| 2 | `spring.datasource.driver-class-name` | `org.h2.Driver` | H2 driver, test scope only (`:4`) |
| 3 | `spring.datasource.username` / `password` | `sa` / empty | H2 defaults (`:5-6`) |
| 4 | `spring.jpa.database-platform` | `org.hibernate.dialect.H2Dialect` | See the dialect note below (`:9`) |
| 5 | `spring.jpa.hibernate.ddl-auto` | `none` | Hibernate creates nothing; the schema comes from `schema.sql` (`:11`) |
| 6 | `spring.jpa.defer-datasource-initialization` | `true` | Runs the SQL init after the `EntityManagerFactory` is built (`:13`) |
| 7 | `spring.sql.init.mode` | `always` | Applies the schema on every context startup (`:16`) |
| 8 | `spring.sql.init.schema-locations` | `classpath:schema.sql` | Points at `src/test/resources/schema.sql` (`:17`) |
| 9 | `spring.h2.console.enabled` | `false` | The H2 console is off even in tests (`:21`) |
| 10 | `app.jwt.secret` | `testSecretKeyForJWTTokenGenerationWhichShouldBeAtLeast256Bits` | Test-only signing secret (`:25`) |
| 11 | `app.jwt.expiration` | `86400000` | 24 hours (`:26`) |
| 12 | `logging.level` | `com.nolcox.jobtracking: DEBUG`, `org.springframework.security: DEBUG` | Verbose test logs (`:30-31`) |

`app.jwt.refresh-expiration` is not set here, so it falls back to the `@Value` default of `604800000` (7 days) at `src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtService.java:26`.

**No test needs MySQL, Docker, or the network.** There is no Testcontainers dependency, no `services:` block in the CI workflow, and no MySQL container anywhere in the test path. A clean checkout plus a JDK and Maven is enough to run the whole backend suite offline. The CI workflow states this intent in an inline comment at `.github/workflows/ci.yml:23-24`.

### The schema is hand-written, not generated

`src/test/resources/schema.sql` is 53 lines of hand-written DDL, applied by `spring.sql.init` on every context startup, with every statement guarded by `IF NOT EXISTS`. It creates three tables and one index:

- `users` (`schema.sql:2`): `id` autoincrement primary key, `first_name`, `last_name`, unique `email`, `password`, `role`, `enabled`, `created_at`, `updated_at`.
- `job_applications` (`schema.sql:14`): foreign key `user_id` to `users(id)`, plus `company_name`, `position_title`, `job_description`, `job_url`, `applied_date` (not null), `status` (not null), `interview_date`, `salary_min`, `salary_max`, `location`, `rto_type`, `level`, contact name/email/phone, `notes`, `version`, `created_at`, `updated_at`, `status_changed_at`.
- `application_events` (`schema.sql:41`): foreign key `application_id` to `job_applications(id)` with `ON DELETE CASCADE`, plus `event_type`, `field_name`, `old_value`, `new_value`, `details`, `created_at`.
- Index `idx_application_events` on `(application_id, created_at)` (`schema.sql:53`).

Because `ddl-auto` is `none`, this file is the only source of truth for the test schema, and it is not generated from the JPA entities. If you add a column to an entity and forget to add it here, the failure appears as a runtime SQL error inside an integration test rather than as a compile error. See [Domain and persistence](./02-domain-and-persistence.md) for the entity definitions this file has to track.

### Dialect drift

`src/main/resources/application.yml:27` sets `spring.jpa.properties.hibernate.dialect: org.hibernate.dialect.MySQLDialect`. The test profile only overrides `spring.jpa.database-platform`, which is the weaker of the two keys, so `spring.jpa.properties.hibernate.dialect` still wins and the integration tests run `MySQLDialect` against an H2 connection. It works today because `ddl-auto` is `none` and the queries are simple, but the tests are not validating the SQL that the production dialect generates. This is recorded on the [known gaps](./11-known-gaps.md) page.

### Isolation

All five integration classes are `@Transactional`, so every test rolls back at the end. On top of that, two of them also clear tables in `@BeforeEach`: `AuthIntegrationTest.java:62` calls `userRepository.deleteAll()`, and `JobApplicationIntegrationTest.java:84-85` calls `jobApplicationRepository.deleteAll()` followed by `userRepository.deleteAll()`. Because the H2 URL sets `DB_CLOSE_DELAY=-1`, a single in-memory database is shared across contexts within one JVM, which is why the explicit cleanup exists.

The demo-data seeder stays out of the test context because `DataInitializer` is annotated `@Profile("!test")` at `src/main/java/com/nolcox/jobtracking/config/DataInitializer.java:24`.

---

## 4. Fixtures and builders

`src/test/java/com/nolcox/jobtracking/fixtures/` holds six hand-rolled fluent builders. There is no external fixture library: no Instancio, no EasyRandom. The convention is a static entry point named `aXxx()`, chainable `withX(...)` methods, and a terminal `build()` or `buildResponse()`.

**Table 4.** *The six backend fixtures, their entry points, and their terminal methods.*

| # | Fixture | Entry point | Terminal methods | Notable defaults |
| - | ------- | ----------- | ---------------- | ---------------- |
| 1 | `UserFixture` | `aUser()` (`UserFixture.java:20`) | `build()` (`:79`) | id 1, `test@example.com`, John Doe, `Role.USER`, enabled |
| 2 | `JobApplicationFixture` | `aJobApplication()` (`JobApplicationFixture.java:38`) | `build()` (`:173`), `buildResponse()` (`:200`) | "Test Company", "Software Engineer", `APPLIED`, salary 100k to 150k, `RtoType.HYBRID_3`, `Level.MID` |
| 3 | `JobApplicationRequestFixture` | `aJobApplicationRequest()` (`JobApplicationRequestFixture.java:35`) | `buildCreateRequest()` (`:182`), `buildUpdateRequest()` (`:204`) | "Tech Corp", "Senior Software Engineer", all three dates null |
| 4 | `ApplicationEventFixture` | `anEvent()` (`ApplicationEventFixture.java:48`) plus five named starters at `:57`, `:71`, `:85`, `:99`, `:113` | `build()` (`:167`), `buildResponse()` (`:185`) | `FIELD_UPDATED` on `companyName` |
| 5 | `AuthRequestFixture` | `anAuthRequest()` (`AuthRequestFixture.java:10`) | `build()` (`:60`) | `test@example.com` / `password123` |
| 6 | `RegisterRequestFixture` | `aRegisterRequest()` (`RegisterRequestFixture.java:12`) | `build()` (`:107`) | John Doe, `test@example.com`, `password123` |

Scenario shortcuts are the reason to reach for these rather than building entities inline. `JobApplicationFixture` offers `withInterviewScheduled()`, `rejected()`, `offerReceived()` and `accepted()`. `UserFixture` offers `asAdmin()` and `disabled()`. `AuthRequestFixture` and `RegisterRequestFixture` both carry a set of invalid-input helpers (`withInvalidEmail()`, `withShortPassword()`, and empty and null variants of each field).

Two caveats. First, many of those invalid-input helpers exercise validation that no test currently reaches, because the controller tests call controller methods directly and never pass through bean validation. They are unused API surface that the compiler cannot flag. Second, the integration tests do not use the fixtures at all: they build `User.builder()` and request records inline.

---

## 5. The JaCoCo coverage gate

The gate is `org.jacoco:jacoco-maven-plugin` 0.8.12, declared at `pom.xml:148-195` with three executions:

1. `prepare-agent` (`pom.xml:153-157`), on its default phase, attaches the coverage agent.
2. `report` (`pom.xml:158-164`), bound explicitly to the `test` phase, writes `target/site/jacoco/` including `index.html`, `jacoco.xml` and `jacoco.csv`.
3. `jacoco-check` (`pom.xml:165-193`), with no explicit `<phase>`, so it uses the goal's default binding of `verify`.

That third binding is why `mvn test` runs the tests without enforcing anything and `mvn verify` enforces the gate.

### The rule

There is exactly one rule (`pom.xml:181-190`):

```xml
<rule>
    <element>BUNDLE</element>
    <limits>
        <limit>
            <counter>LINE</counter>
            <value>COVEREDRATIO</value>
            <minimum>0.85</minimum>
        </limit>
    </limits>
</rule>
```

Read it precisely: whole-bundle **line** coverage at or above 0.85. There is no per-class rule, no per-package rule, and no branch, method or complexity rule. A single completely untested new class cannot fail the build on its own as long as the aggregate stays above 85 percent. Conversely, the gate says nothing about branches, so a well-covered line with an untested `else` counts as covered.

### Exclusions

All four exclusions are declared on the `check` execution only (`pom.xml:171-179`), never on `report`.

**Table 5.** *The four JaCoCo exclusions, what each removes, and why.*

| # | Exclusion | `pom.xml` | Lines removed | Reason |
| - | --------- | --------- | ------------- | ------ |
| 1 | `com/nolcox/jobtracking/config/DataInitializer.class` | 173 | 110 lines at 0 percent | The demo-data seeder is disabled under the `test` profile by `@Profile("!test")`, so this suite can never cover it. Largest exclusion by a wide margin. |
| 2 | `com/nolcox/jobtracking/config/OpenApiConfig.class` | 174 | 19 lines, actually 100 percent covered | Grouped under the comment "Exclude configuration classes". Because the integration tests instantiate this bean, excluding it slightly lowers the measured ratio rather than raising it. |
| 3 | `com/nolcox/jobtracking/domain/repository/*` | 176 | 7 lines at 0 percent, across three interfaces | Spring Data generates the implementations at runtime, so there is nothing meaningful for the suite to cover. |
| 4 | `com/nolcox/jobtracking/JobTrackingApplication.class` | 178 | 3 lines, 1 covered | The `main()` method is never invoked by tests. |

### What the numbers actually are

Measured from `target/site/jacoco/jacoco.xml` after a clean `mvn verify` at this commit:

- The `report` execution, which applies no exclusions and produces the HTML artifact CI uploads, covers 1183 of 1364 lines, or 86.7 percent.
- The `check` execution, after the four exclusions, covers 1164 of 1226 lines, or 94.9 percent. That is the number the gate evaluates.

Those two numbers describe the same run and they are both correct, but they are not the same measurement. The HTML report CI publishes has no exclusions applied, so anyone reading the artifact will conclude the project has about 1.7 points of headroom above the gate when it actually has about 10. The `report` execution analyzed 72 classes and the `check` execution analyzed 68, which the build log records.

Uncovered classes that are **not** excluded and therefore do count against the gate include the four exception types (each at 2 of 4 lines, because their secondary constructors are never used) and the anonymous `BigDecimal` serializer inside `src/main/java/com/nolcox/jobtracking/config/DatabaseConfig.java`, at 1 of 5 lines. The two-decimal rounding behavior in that serializer is effectively untested.

### JaCoCo and newer JDKs

JaCoCo 0.8.12 cannot read class files newer than roughly Java 21. Running the suite locally on a recent JDK produces a large number of stack traces of the form `java.io.IOException: Error while instrumenting ... with JaCoCo 0.8.12` caused by `java.lang.IllegalArgumentException: Unsupported class file major version 70`, all of them from Mockito's generated mock classes. They do not fail the build, and they do not occur on CI, which pins JDK 17. Coverage of mock-adjacent classes may be understated in a local run on a newer JDK.

---

## 6. The frontend suite

### Runner and configuration

`frontend/package.json:26` defines `"test": "react-scripts test"`. There is no Jest CLI invocation and no Vitest. react-scripts 5.0.1 bundles Jest 27.5.1 with the Create React App generated configuration: a `jsdom` environment and a `testMatch` covering `src/**/__tests__/**` plus `src/**/*.{spec,test}.{js,mjs,jsx,ts,tsx}`.

`frontend/package.json` has no `jest` key at all. There is no custom `testMatch`, no `coverageThreshold`, and no additional `setupFiles`. ESLint configuration is a two-line `eslintConfig` extending `react-app` and `react-app/jest`.

Testing libraries are split oddly between the two dependency blocks: `@testing-library/jest-dom` ^5.17.0, `@testing-library/react` ^13.4.0 and `@testing-library/user-event` ^14.5.2 sit in `dependencies`, while `jest-axe` ^10.0.0 and `source-map-explorer` ^2.5.3 sit in `devDependencies`.

### The setup file does one thing

`frontend/src/setupTests.js` is 11 lines, and the only executable line is `import '@testing-library/jest-dom';` at line 11. It does **not** register jest-axe, so every test file that uses axe has to call `expect.extend(toHaveNoViolations)` itself; sixteen files repeat that line. There is no global `afterEach(cleanup)` beyond React Testing Library's automatic cleanup, no fetch mock, no `matchMedia` polyfill, and no `IntersectionObserver` stub. If a component you are testing needs one of those, you provide it in your own file.

### Factories and helpers

Shared test data lives in `frontend/src/test-utils/`, re-exported through a single barrel so tests import from one place:

```js
import { createMockApplication, mockDate } from '../test-utils';
```

`frontend/src/test-utils/factories/application.js` exports six functions:

- `createMockApplication(overrides)` (`:38`) builds a UI-shape application with an auto-incrementing id (`app-1`, `app-2`, and so on), `company: 'Test Company'`, `status: 'APPLIED'`, and fixed ISO dates.
- `createMockBackendApplication(overrides)` (`:70`) builds the backend shape instead: `companyName`, `positionTitle`, and `appliedDate` without a trailing `Z`. Its id is a random base-36 string, not the counter.
- `createNewApplication(overrides)` (`:100`) returns just `{ status: 'APPLIED' }`, for "new application" modal tests.
- `createExistingApplication(overrides)` (`:115`) returns a small field set with id `'app-123'`, for edit-modal tests.
- `generateMockApplications(count, customizer)` (`:135`) returns an array of `count` applications.
- `resetApplicationIdCounter()` (`:25`) resets the module-level counter.

`frontend/src/test-utils/factories/event.js` exports eleven functions covering single events and whole journeys: `createMockEvent` (`:45`), the alias `createEvent` (`:65`), `createJourneyEvents` (`:82`), `createApplicationCreatedEvent` (`:108`), `createCreatedEvent` (`:124`), `createStatusChangedEvent` (`:147`), `createFieldUpdatedEvent` (`:168`), `createInterviewScheduledEvent` (`:187`), `createNoteAddedEvent` (`:205`), `createFullJourney` (`:226`) and `resetEventIdCounter` (`:28`). Note that `createApplicationCreatedEvent` and `createCreatedEvent` exist side by side because parts of the codebase spell the same event `APPLICATION_CREATED` and parts spell it `CREATED`; the inconsistency is baked into the fixtures.

`frontend/src/test-utils/helpers/date.js` exports five functions built on a captured reference to the real `Date` constructor: `mockDate(value)` (`:48`), `restoreDate()` (`:86`), `withMockedDate(value, callback)` (`:106`), `createDateMock(value)` (`:134`) and `getRealDate()` (`:152`). `mockDate` replaces `global.Date` with a subclass whose zero-argument constructor returns a fixed instant and whose static `now()` returns that instant in epoch milliseconds; it copies `UTC` and `parse` across but nothing else, so code depending on other `Date` statics or on `jest.useFakeTimers` interop is untested territory.

Both `resetApplicationIdCounter` and `resetEventIdCounter` are exported but never called from any test file, so the module-level id counters carry across tests within a file. Nothing currently depends on stable ids, but a test asserting on `app-1` would be order-dependent.

### Accessibility assertions

Sixteen test files contain jest-axe assertions, 24 assertions in total. The pattern is identical everywhere: import `axe` and `toHaveNoViolations` from `jest-axe`, call `expect.extend(toHaveNoViolations)` at module scope, then `const results = await axe(container); expect(results).toHaveNoViolations();` inside an accessibility `describe` block.

**Table 6.** *Every test file with a jest-axe assertion, and the component it covers.*

| # | Component under test | Test file | Assertions |
| - | -------------------- | ----------------------- | ---------- |
| 1 | Dashboard | `frontend/src/Dashboard.test.jsx:682` | 1 |
| 2 | ActivityHeatmap | `frontend/src/components/ActivityHeatmap.test.jsx:446,459` | 2 |
| 3 | ApplicationHealthDashboard | `frontend/src/components/charts/ApplicationHealthDashboard.test.jsx:199` | 1 |
| 4 | CompanyInsights | `frontend/src/components/charts/CompanyInsights.test.jsx:172,178` | 2 |
| 5 | FunnelAnalytics | `frontend/src/components/charts/FunnelAnalytics.test.jsx:322` | 1 |
| 6 | LocationInsights | `frontend/src/components/charts/LocationInsights.test.jsx:229,235` | 2 |
| 7 | PositionInsights | `frontend/src/components/charts/PositionInsights.test.jsx:212,218` | 2 |
| 8 | SalaryRangeChart | `frontend/src/components/charts/SalaryRangeChart.test.jsx:167,179` | 2 |
| 10 | StatusTransitionHeatmap | `frontend/src/components/charts/StatusTransitionHeatmap.test.jsx:124` | 1 |
| 11 | StatCard | `frontend/src/components/common/StatCard.test.jsx:215,224,231` | 3 |
| 12 | ApplicationModal | `frontend/src/components/modal/ApplicationModal.test.jsx:221,232` | 2 |
| 13 | ApplicationViewModal | `frontend/src/components/modal/ApplicationViewModal.test.jsx:500` | 1 |
| 15 | DashboardSettingsModal | `frontend/src/components/settings/DashboardSettingsModal.test.jsx:226` | 1 |
| 16 | AppTable | `frontend/src/components/table/AppTable.test.jsx:285` | 1 |

Two files have an accessibility `describe` block containing only manual DOM assertions and no axe call: `frontend/src/components/modal/AuditTrailTimeline.test.jsx` and `frontend/src/components/KeyboardShortcutHelp.test.js`. Counting those two as having accessibility coverage would be misleading.

One rule is suppressed. `frontend/src/Dashboard.test.jsx:679-687` disables the axe `heading-order` rule with an in-place comment: "Excluding heading-order rule due to existing issue in Dashboard component where chart sections use h3 without preceding h1/h2 headers. TODO: Fix heading hierarchy in Dashboard.jsx component." Every other axe call in the suite runs the default ruleset with no options.

### The two skipped tests

Both skips are deliberate `it.skip` calls with an explanation in place, and both point at something real.

1. `frontend/src/components/charts/LocationInsights.test.jsx:166`, `it.skip('should display success rates as percentages', ...)`. The comment above it says the success rate display is currently commented out in the component and the test should be re-enabled with the feature.
2. `frontend/src/components/modal/ApplicationModal.test.jsx:95`, `it.skip('should not render anything when app is null', ...)`. This one documents a defect rather than a disabled feature: `ApplicationModal` accesses `app.id` inside a `useCallback` dependency list before performing its null check, so passing `app={undefined}` throws instead of rendering nothing. The comment proposes two fixes, adding a null guard before the dependency list or moving the null check above every hook, and marks it for the next modal refactor.

There is no `describe.skip`, no `it.todo`, no `xit`, and no `.only` anywhere in `frontend/src`.

---

## 7. Running a single test

### Backend

`pom.xml` declares no surefire configuration, so the plugin's default include patterns and the standard `-Dtest=` selection apply.

```bash
# one class
mvn -Dtest=JwtServiceTest test

# one method
mvn -Dtest='JwtServiceTest#testGenerateToken_WithUserDetails_ShouldReturnValidToken' test

# one @Nested group, using the inner-class form
mvn -Dtest='AuthServiceImplTest$RegistrationTests' test

# several classes, including the ones surefire never collects on its own
mvn -Dtest='AuthIntegrationTestSimple,JobApplicationIntegrationTestSimple' test

# skip the coverage agent while iterating
mvn -Dtest=JwtServiceTest -Djacoco.skip=true test

# the full suite plus the 85 percent gate, which is what CI runs
mvn verify
```

Add `-DfailIfNoTests=false` when the pattern may match nothing.

### Frontend

```bash
cd frontend

# whole suite, non-interactive, which is what CI runs
CI=true npm test -- --watchAll=false

# one file: the positional argument is a regex matched against the test path
CI=true npm test -- --watchAll=false src/components/common/StatCard.test.jsx
CI=true npm test -- --watchAll=false StatCard

# one test by name
CI=true npm test -- --watchAll=false StatCard -t "should have no accessibility violations"

# coverage on demand; no threshold is configured, so this only reports
CI=true npm test -- --watchAll=false --coverage

# interactive watch mode
npm test
```

Without `CI=true`, `react-scripts test` starts Jest in watch mode and never exits, which will hang a script or an agent that expects it to terminate.

---

## 8. Continuous integration

CI is a single workflow, `.github/workflows/ci.yml`, 61 lines. It is the only file under `.github/`: there is no Dependabot configuration, no CODEOWNERS, no issue templates, and no release workflow.

### Triggers

```yaml
on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]
```

CI runs on pushes to `develop` and on pull requests targeting `develop` (`ci.yml:3-7`). There is no `main` trigger, no tag or release trigger, no `workflow_dispatch`, no schedule, and no path filters. A pull request opened against any branch other than `develop` gets no CI at all. There is also no `concurrency` group, so two pushes in quick succession run two full builds.

The two jobs, `backend` and `frontend`, both run on `ubuntu-latest` with no `needs:` relationship, so they run in parallel and either can fail the check independently.

**Table 7.** *Every step in both CI jobs.*

| # | Job | Step | `ci.yml` | What it does |
| - | --- | ---- | -------- | ------------ |
| 1 | backend | `actions/checkout@v5` | 14 | Checkout |
| 2 | backend | `actions/setup-java@v5` | 16-21 | JDK 17, Temurin, `cache: maven` |
| 3 | backend | `mvn --batch-mode verify` | 25-26 | Compiles, runs 237 tests, writes the JaCoCo report at the `test` phase, enforces the gate at the `verify` phase, packages the jar |
| 4 | backend | `actions/upload-artifact@v5` | 28-34 | Uploads `target/site/jacoco/` as `jacoco-report`, with `if: always()` and `if-no-files-found: warn` |
| 5 | frontend | `actions/checkout@v5` | 43 | Checkout |
| 6 | frontend | `actions/setup-node@v5` | 45-50 | Node 22, `cache: npm`, keyed on `frontend/package-lock.json` |
| 7 | frontend | `npm ci` | 52-53 | Clean install from the lockfile |
| 8 | frontend | `npm test -- --watchAll=false` with `env: CI: true` | 55-58 | Runs all 28 Jest suites |
| 9 | frontend | `npm run build` | 60-61 | `react-scripts build` |

Every `run:` step in the frontend job inherits `working-directory: frontend` from `ci.yml:39-41`.

### What makes the backend job fail

1. A compilation error in `src/main` or `src/test`.
2. Any surefire test failure or error. There is no `-DskipTests` and no `testFailureIgnore`.
3. A JaCoCo rule violation: bundle line coverage below 0.85 after the four exclusions.
4. Nothing else. There is no Checkstyle, no SpotBugs, no enforcer plugin, and no dependency or license audit. The backend has no lint step of any kind.

Because the JaCoCo `report` execution is bound to `test` and the `check` execution to `verify`, the HTML report exists even when the gate later fails, which is why the upload step uses `if: always()`.

### What makes the frontend job fail

1. `npm ci` failing, for instance if `package.json` and `package-lock.json` disagree. `package.json` carries an `overrides` block covering `underscore`, `serialize-javascript`, `nth-check`, `postcss`, `@tootallnate/once` and `webpack-dev-server`, and `npm ci` has to satisfy those from the lockfile.
2. Any failing Jest test. Under `CI=true` Jest also treats new or obsolete snapshots as failures, though the suite reports zero snapshots, so that is moot today.
3. `npm run build` failing.

> [!IMPORTANT]
> `npm run build` is the de facto lint gate, and nothing in `ci.yml` says so. GitHub Actions sets `CI=true` for every step by default. Under `CI=true`, Create React App's `eslint-webpack-plugin` promotes every ESLint warning to an error and aborts the build. An unused import or a missing React Hook dependency therefore fails CI even though the workflow has no lint step. This has already broken the build once. Before pushing, run `CI=true npm run build` from `frontend/` and not just `npm run build`, because a plain local build will happily succeed on code that CI rejects.

There is no coverage requirement on the frontend at all: no `coverageThreshold` in `package.json`, `--coverage` is never passed in CI, and no coverage data is uploaded. The coverage badge in the readme is a static shields.io image, not a live measurement, and the 85 percent figure it shows applies only to backend line coverage.

### What CI does not do

- It does not run the three integration classes described in section 2.
- It does not lint or format the Java source.
- It does not build or push a Docker image, despite the `Dockerfile` and `docker-compose.yml` in the repository root.
- It does not run any end-to-end test; there is no Playwright or Cypress setup.
- It does not upload the frontend build output, only the JaCoCo HTML.
- It does not publish test results as check annotations, so failures are visible only in the raw log.
- It does not run on `main`, because no trigger targets that branch.

---

## 9. Before you add a test

A short checklist drawn from everything above.

- **Backend file names must end in `Test.java`.** Otherwise surefire will not collect the class and the tests will never run. This is the trap that already caught three classes.
- **Put new authentication integration tests in `AuthIntegrationTest`,** not in `AuthIntegrationTestSimple` or `AuthIntegrationTestWorking`. Those two overlap each other, neither runs, and neither contributes to coverage.
- **If your change adds an entity column, add it to `src/test/resources/schema.sql` too.** Hibernate creates nothing under the test profile.
- **A controller test in `application/controller/` does not test HTTP.** If you need validation, JSON binding, exception-to-status mapping, or the security filter chain, write a MockMvc integration test.
- **Run `mvn verify`, not `mvn test`,** if you want to know whether the coverage gate is satisfied. `mvn test` never evaluates it.
- **Run `CI=true npm run build` before pushing frontend changes.** A lint warning that your editor shows in yellow is a red CI build.
- **Reuse the fixtures and factories.** They exist on both sides and they encode the default shapes the rest of the suite expects.

---

## See also

- [Known gaps](./11-known-gaps.md) for the consolidated list of defects, including the ones this page records.
- [Configuration](./08-configuration.md) for how the `test` profile relates to the default and `docker` profiles.
- [Domain and persistence](./02-domain-and-persistence.md) for the entities that `schema.sql` has to track by hand.
- [Contributing](../../CONTRIBUTING.md) for the workflow around opening a pull request against `develop`.

*Documentation current as of Job Tracker 2.0.0 (August 2026). Source of truth is the code; report drift as an issue.*
