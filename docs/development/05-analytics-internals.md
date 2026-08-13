# Analytics internals

> **Audience:** Backend and frontend developers changing, debugging, or consuming the analytics endpoints  ·  **Scope:** The twelve analytics routes on `JobApplicationController`, the `AnalyticsServiceImpl` engine behind them, the `ApplicationEvent` audit trail, and the defects and costs that come with all of it

The analytics are the product. Twelve endpoints turn a user's application rows into rates, distributions, and health signals, and most of them are single-pass Java stream aggregations over every application the user owns. This page states, for each endpoint, what it computes, the formula in words, the response shape, what happens on empty or degenerate input, and the exact bucketing and rounding values. It also states three things that a reader will otherwise get wrong: what data each endpoint actually reads, which computations are broken, and what a single dashboard load costs the database.

Everything below is against Job Tracker 1.3.1 on `develop`. The engine lives in one file, `src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java`, 1279 lines, and all line citations without another path are to that file.

## Contents

- [1. What is derived from what](#1-what-is-derived-from-what)
- [2. Known defects](#2-known-defects)
- [3. Cost model](#3-cost-model)
- [4. Shared vocabulary, thresholds, and rounding](#4-shared-vocabulary-thresholds-and-rounding)
- [5. Endpoint reference](#5-endpoint-reference)
- [6. The audit trail](#6-the-audit-trail)
- [See also](#see-also)

---

## 1. What is derived from what

There are two possible sources for any figure on this dashboard: the `status` column on the `job_applications` row as it stands right now, and the `application_events` log that records how it got there. Almost everything reads the first one.

The whole service touches the event repository in exactly three places: `eventRepository.findStatusTransitionsByUserId` at line 568, `findLastEventTimestampByApplicationForUser` at line 800, and `countRecentEventsByApplicationForUser` at line 809. Every other figure comes from `repository.findAllByUserId(userId)` and a test against `app.getStatus()`.

**Table 1.** *Data source for each analytics endpoint, with the service method that produces it.*

| # | Endpoint | Service method | Data source |
| - | -------- | -------------- | ----------- |
| 1 | `GET /metrics` | `getMetrics` (:227) | Current status only |
| 2 | `GET /counts-by-status` | `getCountsByStatus` (:370) | Current status only, `GROUP BY` in SQL |
| 3 | `GET /analytics/salary-distribution` | `getSalaryDistribution` (:376) | Current status only |
| 4 | `GET /analytics/activity-heatmap` | `getActivityHeatmap` (:435) | `appliedDate` column |
| 5 | `GET /analytics/time-patterns` | `getTimePatterns` (:467) | `appliedDate` column |
| 6 | `GET /analytics/stage-durations` | `getStageDurations` (:495) | `appliedDate` and `statusChangedAt` columns |
| 7 | `GET /analytics/transition-matrix` | `getTransitionMatrix` (:565) | Event log only |
| 8 | `GET /analytics/funnel` | `getFunnelAnalytics` (:621) | Current status only |
| 9 | `GET /analytics/health` | `getApplicationHealth` (:782) | Hybrid: stale and hot from the event log, quick wins and quick losses from the row |
| 10 | `GET /analytics/company-insights` | `getCompanyInsights` (:970) | Current status only |
| 11 | `GET /analytics/location-insights` | `getLocationInsights` (:1072) | Current status only |
| 12 | `GET /analytics/position-insights` | `getPositionInsights` (:1174) | Current status only |

Only the transition matrix is fully event derived. Health is partly so. Everything else, including the entire funnel, is computed from the current status column alone.

### The concrete consequence

Take an application that went `APPLIED` to `RECRUITER_SCREEN` to `TECHNICAL_I` to `TECHNICAL_II` and was then rejected. Its row now reads `status = REJECTED`.

- `trueInterviewRate` counts applications whose *current* status is in `INTERVIEW_STATUSES` (:245-248). `REJECTED` is not in that set, so this application contributes zero to the interview rate.
- `appliedToScreen`, `screenToTech`, and `techToOffer` all test current status the same way (:339-367). Zero again.
- Every per-company, per-location, and per-level `interviewRate` and `successRate` tests current status (:1009-1041, :1101-1128, :1210-1234). Zero.
- The transition matrix, reading `STATUS_CHANGED` events, shows all four hops: `APPLIED->RECRUITER_SCREEN`, `RECRUITER_SCREEN->TECHNICAL_I`, `TECHNICAL_I->TECHNICAL_II`, `TECHNICAL_II->REJECTED`.

So the transition matrix asserts that this user reached a technical interview and the funnel asserts that nobody did. Both are behaving exactly as written. The status-derived views are systematically biased downward the moment applications resolve, because resolution overwrites the only field they read.

Two related effects follow from the same mechanism:

- `WITHDRAWN` belongs to none of `RESPONSE_STATUSES`, `INTERVIEW_STATUSES`, or `OFFER_STATUSES` (:154-162, :132-138, :98-104). Withdrawing after receiving an offer removes that offer from `trueOfferRate`, `overallSuccessRate`, and every per-group success rate. It still appears as a drop-off point and as a quick loss.
- Deleting an application deletes its events first (`application/service/impl/JobApplicationServiceImpl.java:267`), so the transition matrix is rewritten retroactively at the same time the status-derived counts drop.

> [!IMPORTANT]
> When the transition matrix and the funnel disagree, neither is malfunctioning. They are answering different questions: "what paths were walked" versus "where does everything sit now". Do not reconcile them in a consumer; label them.

---

## 2. Known defects

Three defects in this layer are confirmed. Each is tracked on [known gaps](./11-known-gaps.md).

### `stage-durations` returns 500 on a fresh install

`getStageDurations` guards `appliedDate` for null but not `statusChangedAt`, then dereferences `statusChangedAt` on the non-`APPLIED` branch:

```java
if (app.getStatus() == ApplicationStatus.APPLIED) {
    days = ChronoUnit.DAYS.between(app.getAppliedDate(), now);
} else {
    days = ChronoUnit.DAYS.between(app.getAppliedDate(), app.getStatusChangedAt());
}
```

That second call is line 523. `status_changed_at` is nullable: the column carries a bare `@Column(name = "status_changed_at")` with no `nullable = false` and no lifecycle callback (`src/main/java/com/nolcox/jobtracking/domain/entity/JobApplication.java:99-100`). The API write paths always populate it, defaulting to `Instant.now()` on create (`JobApplicationServiceImpl.java:116`) and preserving or refreshing it on update (`JobApplicationServiceImpl.java:193-197`), so an application created through the UI is safe.

`DataInitializer` bypasses the service and builds entities directly. It never sets `statusChangedAt`, and it seeds three non-`APPLIED` statuses: `TECH_SCREEN`, `REJECTED`, and `OFFER_RECEIVED` (`src/main/java/com/nolcox/jobtracking/config/DataInitializer.java:85,103,120`). The result, confirmed at runtime against the Compose stack:

```text
java.lang.NullPointerException: temporal
	at java.base/java.time.Instant.from(Unknown Source)
	at java.base/java.time.temporal.ChronoUnit.between(Unknown Source)
	at com.nolcox.jobtracking.application.service.impl.AnalyticsServiceImpl.getStageDurations(AnalyticsServiceImpl.java:523)
```

> [!WARNING]
> Install with Compose, log in as the seeded demo user, open the dashboard: eleven of the twelve analytics routes return 200 and `analytics/stage-durations` returns 500. The dashboard fetches with `Promise.allSettled` (`frontend/src/hooks/useAnalytics.js:233`), so the page still renders; the failed slice is set to `null`.

### Quick wins and quick losses double count two statuses

`findQuickOutcomes` picks its target set from a boolean:

```java
Set<ApplicationStatus> targetStatuses = wins ? OFFER_STATUSES : NEGATIVE_TERMINAL_STATUSES;
```

That is line 927. `OFFER_STATUSES` (:98-104) contains `OFFER_DECLINED` and `OFFER_RESCINDED`, and so does `NEGATIVE_TERMINAL_STATUSES` (:192-198). An application in either of those two statuses that resolved within seven days is emitted into both `quickWins` and `quickLosses`, and counted in both `quickWinCount` and `quickLossCount` (:833-839). The two lists are not disjoint and the summary counts do not sum to a meaningful total.

A second, smaller problem sits in the same function: `OFFER_STATUSES` also contains `OFFER_RECEIVED` and `NEGOTIATING`, which are not resolutions. An application still in negotiation is reported as a quick win with a `resolvedAt` that is only its most recent status change.

### Related rough edges

These are documented in full on [known gaps](./11-known-gaps.md) rather than repeated here: `WAITING_FOR_RESPONSE` counting as a response (:154-162), `stageConversionRates` returning exactly one key (:666-681), `extractPositionType` matching substrings inside unrelated words (:762-779), salary coalescing biasing both averages (:395-401), `staleDays` and `topN` being unvalidated (`application/controller/JobApplicationController.java:375,400`), and the frontend journey timeline branching on an event type the backend never writes (`frontend/src/utils/stageDurationUtils.js:148`).

---

## 3. Cost model

There is no caching anywhere in the backend. No `@Cacheable` annotation exists under `src/main/java`. The service is `@Transactional(readOnly = true)` at the class level (:80), and that is the only cross-cutting concern applied to it.

Ten of the twelve endpoints open with an independent, unbounded `repository.findAllByUserId(userId)` and materialize every application the user owns into a `List` before aggregating in Java streams. Those ten call sites are lines 230, 379, 438, 470, 498, 624, 789, 973, 1075, and 1177. The two exceptions are `counts-by-status`, which pushes a `GROUP BY` into JPQL (`src/main/java/com/nolcox/jobtracking/domain/repository/JobApplicationRepository.java:34-45`), and `transition-matrix`, which reads only the event log.

The dashboard fires all twelve in parallel on every load (`frontend/src/hooks/useAnalytics.js:169-230`, dispatched at :233). So one page view costs roughly:

- Ten full scans of the user's `job_applications` rows, each one a separate query returning the same rows.
- One `GROUP BY` over the same table.
- Three queries against `application_events`: the status-transition fetch, the `MAX(created_at)` per application, and the recent-event count.

This scales linearly in applications per user and it multiplies by ten. It is fine at the scale a single job seeker generates and it is the first thing to change if the application ever holds many applications per user or many concurrent dashboard viewers. `GET /v1/job-applications/events/all` has the same shape and is worse: it is unpaginated across every application the user owns (`ApplicationEventServiceImpl.java:195-205`).

Debug logging compounds this in the shipped defaults: `logging.level.com.nolcox.jobtracking: DEBUG` is checked in, and every analytics method logs the user id on entry.

---

## 4. Shared vocabulary, thresholds, and rounding

### Status sets

Nearly every rate in the service is "count the applications whose current status is in set S, divide by the group total, multiply by 100". The sets are static `EnumSet`s built bottom-up, so the broader ones contain the narrower ones.

**Table 2.** *Status membership sets and their members, all declared in `AnalyticsServiceImpl`.*

| # | Set | Members | Lines |
| - | --- | ------- | ----- |
| 1 | `OFFER_STATUSES` | `OFFER_RECEIVED`, `NEGOTIATING`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `OFFER_RESCINDED` | 98-104 |
| 2 | `TECH_STATUSES` | `TECH_SCREEN`, `TAKE_HOME`, `SYSTEM_DESIGN`, `TECHNICAL_I`, `TECHNICAL_II`, `REFERENCE_CHECK`, plus all of `OFFER_STATUSES` | 110-123 |
| 3 | `INTERVIEW_STATUSES` | `RECRUITER_SCREEN` plus all of `TECH_STATUSES` (11 values) | 132-138 |
| 4 | `SCREEN_STATUSES` | The same object as `INTERVIEW_STATUSES`, assigned as an alias | 145 |
| 5 | `RESPONSE_STATUSES` | `INTERVIEW_STATUSES` plus `REJECTED`, `ON_HOLD`, `WAITING_FOR_RESPONSE` (14 values) | 154-162 |
| 6 | `TERMINAL_STATUSES` | `REJECTED`, `WITHDRAWN`, `GHOSTED` | 169-173 |
| 7 | `ALL_TERMINAL_STATUSES` | `REJECTED`, `WITHDRAWN`, `GHOSTED`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `OFFER_RESCINDED` | 179-186 |
| 8 | `NEGATIVE_TERMINAL_STATUSES` | `REJECTED`, `WITHDRAWN`, `GHOSTED`, `OFFER_DECLINED`, `OFFER_RESCINDED` | 192-198 |

Three sets describe "terminal" and they are all different. `TERMINAL_STATUSES` is used only to filter the salary distribution. `ALL_TERMINAL_STATUSES` drives drop-off points, the health active count, and the stale filter. `NEGATIVE_TERMINAL_STATUSES` drives quick losses.

`GHOSTED` is deliberately excluded from `RESPONSE_STATUSES` because it means no response arrived. `WITHDRAWN` is excluded too, without comment, and it appears in no positive set at all.

The full status enum has 18 values in declaration order (`src/main/java/com/nolcox/jobtracking/domain/entity/ApplicationStatus.java:4-21`). Declaration order matters wherever the code uses an `EnumMap`, since that fixes JSON key order.

### Thresholds

**Table 3.** *Tuning constants, their values, and their effect.*

| # | Constant | Value | Effect | Line |
| - | -------- | ----- | ------ | ---- |
| 1 | `DEFAULT_STALE_DAYS` | 14 | Service-side default for the `staleDays` health parameter | 203 |
| 2 | `HOT_ACTIVITY_WINDOW_DAYS` | 7 | Look-back window for counting recent events | 208 |
| 3 | `HOT_EVENT_THRESHOLD` | 3 | Events in the window at or above which an application is "hot" | 213 |
| 4 | `QUICK_OUTCOME_DAYS` | 7 | Maximum days from applied to resolved for a quick win or quick loss | 218 |
| 5 | `MAX_BOTTLENECK_STAGES` | 5 | Cap on the `bottleneckStages` list | 224 |
| 6 | `DEFAULT_TOP_N_COMPANIES` | 10 | Service-side default for the `topN` company-insights parameter | 967 |

Rows 1 and 6 are unreachable through HTTP. The controller supplies `defaultValue = "14"` and `defaultValue = "10"` itself (`JobApplicationController.java:375,400`), so the service never sees null on those parameters.

### Rounding

One helper does all rounding:

```java
private double roundToOneDecimal(double value) {
    return Math.round(value * 10.0) / 10.0;
}
```

It is at lines 558-560. `Math.round` on the scaled value rounds halves up, so 12.25 becomes 12.3. Every percentage, every average duration, and the salary averages in location and position insights (:1252, :1274) pass through it. The salary *distribution* endpoint does not round at all: its aggregates are raw doubles (:404-421).

### Time and day math

Every timestamp on the entities is a `java.time.Instant`, which carries no zone. Two consequences follow.

- Day counts use `ChronoUnit.DAYS.between(Instant, Instant)`, which truncates toward zero. Twenty-three hours to a response counts as 0 days, not 1.
- Only two endpoints convert to a calendar, `activity-heatmap` (:449-451) and `time-patterns` (:480), and both use `ZoneId.systemDefault()`. That is the JVM's zone, not the user's. The heatmap's default year is server local as well (`JobApplicationController.java:256`). A user in a different zone from the server will see applications land on the wrong day and in the wrong hour bucket.

Timestamps serialize as epoch-second decimals, for example `"lastEventAt": 1784862476.0`, not as ISO-8601 strings. `spring.jackson.serialization.write-dates-as-timestamps: false` is set in `src/main/resources/application.yml` but has no effect, because a hand-built `@Primary ObjectMapper` in `src/main/java/com/nolcox/jobtracking/config/DatabaseConfig.java` makes Spring Boot's Jackson auto-configuration back off. The frontend compensates in its data adapter. See [configuration](./08-configuration.md).

---

## 5. Endpoint reference

All twelve sit on `JobApplicationController`, `@RequestMapping("/v1/job-applications")` (`JobApplicationController.java:53`), under the `/api` servlet context path. All require authentication, and the user id comes from the JWT principal (`JobApplicationController.java:449-451`), so every repository call is scoped by user id. Path naming is inconsistent: `metrics` and `counts-by-status` sit directly on the collection, the other ten sit under `analytics/`.

**Table 4.** *Behavior of each endpoint when the user has no applications, or no data of the relevant kind.*

| # | Endpoint | Empty-input result | Line |
| - | -------- | ------------------ | ---- |
| 1 | `/metrics` | `MetricsResponse.empty()`: all six scalars `0.0`, `totalApplications` `0`, all three conversions `0.0` | 233 |
| 2 | `/counts-by-status` | `{}`. Statuses with zero applications are absent, not zero | 371-372 |
| 3 | `/analytics/salary-distribution` | All five numeric fields `null`, `activeAppsWithSalary` `0`, `entries` `[]` | 390 |
| 4 | `/analytics/activity-heatmap` | `data` `{}`, `maxCount` `0`, `year` echoes the request | 463 |
| 5 | `/analytics/time-patterns` | Both maps `{}` | 491 |
| 6 | `/analytics/stage-durations` | Empty `EnumMap` and empty list | 501 |
| 7 | `/analytics/transition-matrix` | `TransitionMatrixResponse.empty()`: empty list, empty set, `0` | 571 |
| 8 | `/analytics/funnel` | `FunnelAnalyticsResponse.empty()`: three empty lists, empty map, `0.0`, `0` | 627 |
| 9 | `/analytics/health` | `ApplicationHealthResponse.empty(staleDays)`: four empty lists, all-zero summary, threshold echoed | 792 |
| 10 | `/analytics/company-insights` | `CompanyInsightsResponse.empty()` | 976 |
| 11 | `/analytics/location-insights` | `LocationInsightsResponse.empty()` | 1078 |
| 12 | `/analytics/position-insights` | `PositionInsightsResponse.empty()` | 1180 |

Rows 4 and 5 have no early return at all; their loops simply never execute.

### `GET /metrics`

Headline rates for the dashboard. Controller at `JobApplicationController.java:191-199`, service `getMetrics` at :227-274.

Formulas, all against current status, `total` being every application the user owns:

- `trueResponseRate`: count of applications whose status is in `RESPONSE_STATUSES`, times 100, over `total` (:239-242).
- `trueInterviewRate`: same over `INTERVIEW_STATUSES` (:245-248).
- `trueOfferRate`: same over `OFFER_STATUSES` (:251-254).
- `avgDaysToResponse` (`calculateAvgDaysToResponse`, :283-299): keep applications in `RESPONSE_STATUSES` that have both `appliedDate` and `statusChangedAt` non-null, map each to `DAYS.between(appliedDate, statusChangedAt)`, drop negatives, take the arithmetic mean. If nothing survives the filter the method returns `0.0`, not null, so "unknown" and "same day" are indistinguishable. Note that `statusChangedAt` is the *most recent* status change, so this is not days to first response despite the name.
- `weeklyPace` (`calculateWeeklyPace`, :306-334): with fewer than two applications, return the raw count. Otherwise take the earliest and latest non-null `appliedDate`; if either is missing, return the count. Compute `days = DAYS.between(earliest, latest)`; if that is 0, return the count. Otherwise `weeks = days / 7.0` and the pace is `count / weeks`. There is no smoothing and no minimum window, so 50 applications spread over one day yields a pace of 350 per week.
- `stageConversions` (`calculateStageConversions`, :339-367): `appliedToScreen` is `SCREEN_STATUSES` count over `total`; `screenToTech` is `TECH_STATUSES` count over the screened count, or `0.0` when nothing is screened; `techToOffer` is `OFFER_STATUSES` count over the tech count, or `0.0`. Because `TECH_STATUSES` is a subset of `SCREEN_STATUSES` and `OFFER_STATUSES` is a subset of `TECH_STATUSES`, these are containment ratios of a single snapshot, not stage-to-stage transitions.

All six top-level scalars are rounded to one decimal (:266-270), and the three conversions are rounded inside their helper (:364-366).

A live response from the seeded demo account:

```json
{
    "trueResponseRate": 60.0,
    "trueInterviewRate": 40.0,
    "trueOfferRate": 20.0,
    "avgDaysToResponse": 0.0,
    "weeklyPace": 1.9,
    "totalApplications": 5,
    "stageConversions": {
        "appliedToScreen": 40.0,
        "screenToTech": 100.0,
        "techToOffer": 50.0
    }
}
```

The `0.0` for `avgDaysToResponse` here is the "no qualifying data" case, not a real measurement: the seeded rows have a null `statusChangedAt`.

### `GET /counts-by-status`

Raw counts per status. Controller at `JobApplicationController.java:210-218`; the service method is one line delegating to the repository (:370-373).

This is the only aggregation pushed into the database. `countByStatusForUserRaw` runs `SELECT ja.status, COUNT(ja) ... WHERE ja.user.id = :userId GROUP BY ja.status`, and a default method collects the rows into a map (`JobApplicationRepository.java:34-45`).

```json
{
    "TECH_SCREEN": 1,
    "OFFER_RECEIVED": 1,
    "APPLIED": 2,
    "REJECTED": 1
}
```

Statuses with no applications are absent from the map rather than present with a zero. Any consumer must default missing keys itself.

### `GET /analytics/salary-distribution`

Scatter data and reference lines for expected compensation. Controller at `JobApplicationController.java:229-237`, service at :376-432.

Filter (:384-387): drop applications whose status is in `TERMINAL_STATUSES` (`REJECTED`, `WITHDRAWN`, `GHOSTED`), then keep those with at least one of `salaryMin` and `salaryMax`. `OFFER_ACCEPTED`, `OFFER_DECLINED`, and `OFFER_RESCINDED` are *not* excluded here, even though they are terminal everywhere else in the service.

Coalescing (:395-401): for each surviving application, a missing `salaryMin` is filled with `salaryMax` and vice versa, so every scatter point has both coordinates. An application with only one value lands on the diagonal. Both averages are then computed over the *filled* values, which biases them: a posting with only an upper bound pulls `avgMin` up, and one with only a lower bound pulls `avgMax` down.

Aggregates:

- `globalMin`, `globalMax`: min and max over the coalesced entries (:403-410).
- `avgMin`, `avgMax`: means over the coalesced entries (:412-419).
- `avgMid`: `(avgMin + avgMax) / 2.0` (:421).
- `activeAppsWithSalary`: the size of the filtered list (:429).

Null-ing rule (:426-427): `avgMin` and `avgMax` are emitted as `null` when the computed value is not greater than zero, while `avgMid`, `globalMin`, and `globalMax` are emitted raw. A legitimate all-zero salary set therefore returns `null` averages next to an `avgMid` of `0.0`. Nothing here is rounded.

```text
{
  globalMin: Double, globalMax: Double,
  avgMin: Double|null, avgMax: Double|null,
  avgMid: Double,
  activeAppsWithSalary: Long,
  entries: [ { company: String, salaryMin: Double, salaryMax: Double } ]
}
```

`entries` is emitted in `findAllByUserId` order and is not truncated, contrary to the record's own javadoc.

### `GET /analytics/activity-heatmap?year=`

Applications per calendar day, for a contribution-graph style chart. Controller at `JobApplicationController.java:249-259`, service at :435-464.

`year` is optional; the controller substitutes `Year.now().getValue()` when it is absent (:256), so the service always receives a non-null year.

Algorithm: for each application with a non-null `appliedDate`, convert to a `LocalDate` in the JVM's default zone, skip it if its year differs from the requested year, and increment a `TreeMap` keyed by the ISO date string. `maxCount` is tracked as the running maximum (:457-460).

Bucketing is one bucket per calendar day. Days with no applications are absent from the map, not zero filled, so the consumer draws the empty cells. The `TreeMap` gives chronological key order because ISO date strings sort lexicographically.

```text
{ data: { "YYYY-MM-DD": Integer }, maxCount: Integer, year: Integer }
```

### `GET /analytics/time-patterns`

When during the week and the day the user applies. Controller at `JobApplicationController.java:270-278`, service at :467-492.

For each application with a non-null `appliedDate`, take the zoned date-time in the JVM's default zone and increment two counters: one keyed by `DayOfWeek`, one keyed by hour of day 0 through 23 (:480-488).

Bucketing is one bucket per weekday and one per clock hour. Neither map is zero filled: only observed days and hours appear. `byDayOfWeek` is an `EnumMap` so its keys come out in `DayOfWeek` declaration order, Monday first; `byHour` is a `TreeMap` so hours are ascending.

```json
{
    "byDayOfWeek": {
        "TUESDAY": 1,
        "WEDNESDAY": 2,
        "FRIDAY": 1,
        "SATURDAY": 1
    },
    "byHour": {
        "3": 5
    }
}
```

Hour keys serialize as strings because they are JSON object keys. In this sample every application landed in hour 3, which is a direct artifact of the server's zone applied to seeded timestamps.

### `GET /analytics/stage-durations`

Average days per stage, plus the slowest stages. Controller at `JobApplicationController.java:289-297`, service at :495-553.

Algorithm, per application, skipping any with a null `appliedDate` (:511-533):

1. If the current status is `APPLIED`, `days = DAYS.between(appliedDate, now)`, where `now` is captured once for the whole request at line 510.
2. Otherwise `days = DAYS.between(appliedDate, statusChangedAt)`.
3. Clamp negatives to 0.
4. Append `days` to the bucket for the application's *current* status.

Then each bucket's mean is rounded to one decimal into `averageTimeByStage` (:535-543), and `bottleneckStages` is those same entries as `(stage, avgDays)` pairs sorted by `avgDays` descending and limited to `MAX_BOTTLENECK_STAGES`, that is 5 (:545-550).

This is not time spent in a stage. It is elapsed time from application to the most recent transition, filed under whichever status the application happens to sit in now. An application at `TECHNICAL_I` 40 days after applying reports 40 days under `TECHNICAL_I` regardless of how those 40 days were split. The source comment at :504-507 says as much, while the DTO and the OpenAPI summary both describe it as average time spent in each stage.

```text
{
  averageTimeByStage: { "APPLIED": Double, "TECH_SCREEN": Double, ... },
  bottleneckStages: [ { stage: ApplicationStatus, avgDays: Double } ]
}
```

`averageTimeByStage` is an `EnumMap`, so key order follows the status enum declaration order, and only statuses actually present appear. Step 2 above is the null dereference described in [section 2](#2-known-defects).

### `GET /analytics/transition-matrix`

Counts of every observed status hop. Controller at `JobApplicationController.java:315-324`, service at :565-618. This is the only endpoint computed purely from the event log.

Source query (`src/main/java/com/nolcox/jobtracking/domain/repository/ApplicationEventRepository.java:136-141`):

```sql
SELECT e FROM ApplicationEvent e
WHERE e.application.user.id = :userId
  AND e.eventType = 'STATUS_CHANGED'
  AND e.fieldName = 'status'
ORDER BY e.createdAt DESC
```

Algorithm (:579-615): skip any event with a null `oldValue` or `newValue`; parse both with `ApplicationStatus.valueOf`, catching `IllegalArgumentException`, logging at WARN, and skipping the event (the comment attributes this to legacy data); count into a map keyed by the string `"FROM->TO"`; then split that key back apart to rebuild the pair. Transitions are sorted by count descending, and `totalTransitions` is the sum of the surviving counts, so skipped events are excluded from it.

```text
{
  transitions: [ { fromStatus: ApplicationStatus, toStatus: ApplicationStatus, count: Long } ],
  statuses: Set<ApplicationStatus>,
  totalTransitions: Long
}
```

`statuses` is backed by a `HashSet` (:577), so its JSON array order is unspecified. The frontend ignores that field and rebuilds its heatmap axes from `transitions`, which means the axes are ordered by transition count rather than by pipeline order.

### `GET /analytics/funnel`

Conversion, drop-off, and success rates by company and by position type. Controller at `JobApplicationController.java:341-350`, service at :621-658. Despite the name, all four sub-computations read current status only.

- `stageConversionRates` (`calculateStageConversionRates`, :666-681): the map is populated with exactly one key, `APPLIED`, whose value is the percentage of applications whose status is anything other than `APPLIED`. No other status is ever added, so the promised "percentage advancing from each status" is a single number.
- `dropOffPoints` (`calculateDropOffPoints`, :686-704): group applications whose status is in `ALL_TERMINAL_STATUSES` by status, count each, compute `count * 100 / total`, sort by count descending. The set used here includes `OFFER_ACCEPTED`, so an accepted offer is reported as a drop-off point.
- `successRateByCompany` (`calculateSuccessRateByCompany`, :709-727): group by the exact `companyName` string with no trimming and no case folding, count `OFFER_STATUSES` members as offers, `successRate = offers * 100 / companyTotal`, sort by application count descending. The list is not truncated, so a user with 400 distinct companies gets 400 rows.
- `successRateByPositionType` (`calculateSuccessRateByPositionType`, :735-754): group by `extractPositionType(positionTitle)`, then drop the `"Other"` bucket entirely (:740). Same offer math. Because `"Other"` is dropped, the row counts do not sum to `totalApplicationsAnalyzed`.
- `overallSuccessRate`: `OFFER_STATUSES` count over `total`, rounded (:645-648).

`extractPositionType` (:762-779) is a first-match-wins substring scan over the lower-cased title. Order matters and it matches inside words.

**Table 5.** *`extractPositionType` match order, substrings, and returned label.*

| # | Substrings tested | Label returned |
| - | ----------------- | -------------- |
| 1 | `principal` | `Principal` |
| 2 | `staff` | `Staff` |
| 3 | `senior`, `sr.`, `sr ` | `Senior` |
| 4 | `lead` | `Lead` |
| 5 | `junior`, `jr.`, `jr ` | `Junior` |
| 6 | `mid-level`, `mid level` | `Mid-Level` |
| 7 | `intern` | `Intern` |
| 8 | `entry` | `Entry Level` |
| 9 | No match, or a null title | `Other` |

Row 4 precedes row 5, so "Junior Team Lead" is classified `Lead`. Row 7 matches inside "Internal", so "Internal Tools Engineer" is classified `Intern`.

A live response, truncated after the first three companies:

```json
{
    "stageConversionRates": {
        "APPLIED": 60.0
    },
    "dropOffPoints": [
        {
            "status": "REJECTED",
            "count": 1,
            "percentage": 20.0
        }
    ],
    "successRateByCompany": [
        {
            "companyName": "BigTech Corp",
            "totalApplications": 1,
            "offersReceived": 0,
            "successRate": 0.0
        }
    ],
    "successRateByPositionType": [],
    "overallSuccessRate": 20.0,
    "totalApplicationsAnalyzed": 5
}
```

### `GET /analytics/health?staleDays=`

Which applications need attention. Controller at `JobApplicationController.java:370-380`, service at :782-849. This is the one endpoint that mixes row data and the event log.

`staleDays` carries `@RequestParam(required = false, defaultValue = "14")` and no validation annotation. Negative and absurdly large values are accepted: `staleDays=-5` puts the threshold in the future and marks every non-terminal application stale.

Data gathering, with `now` captured once at line 787:

- `lastEventByAppId` from `findLastEventTimestampByApplicationForUser`, JPQL `SELECT e.application.id, MAX(e.createdAt) ... GROUP BY e.application.id` (`ApplicationEventRepository.java:189-192`), read at :800-805.
- `recentEventCountByAppId` from `countRecentEventsByApplicationForUser` with `since = now - 7 days`, JPQL `SELECT e.application.id, COUNT(e) ... WHERE e.createdAt >= :since GROUP BY e.application.id` (`ApplicationEventRepository.java:172-178`), read at :808-814.

The four categories:

- **Stale** (`findStaleApplications`, :854-889): threshold is `now - staleDays`. Skip anything in `ALL_TERMINAL_STATUSES`. Use the application's last event timestamp, falling back to `appliedDate` when it has no events. If that timestamp is before the threshold, emit it with `daysSinceLastEvent = DAYS.between(lastEvent, now)`. Sort by `daysSinceLastEvent` descending. An application with no events and a null `appliedDate` is silently skipped. Because the timestamp is `MAX(created_at)` over *all* event types, editing a phone number resets staleness on a dormant application.
- **Hot** (`findHotApplications`, :894-917): any application whose recent-event count is at least `HOT_EVENT_THRESHOLD`, that is 3, within the 7-day window. `lastEventAt` falls back to `statusChangedAt` rather than `appliedDate`. Sort by recent event count descending. Two things follow from counting all event types: a single `PUT` that changes three fields writes three `FIELD_UPDATED` rows and flips the application to hot, and unlike stale, this list is not filtered to non-terminal statuses, so a recently edited rejected application appears as hot.
- **Quick wins** (`findQuickOutcomes(apps, true)`, :926-960): applications whose status is in `OFFER_STATUSES` with both `appliedDate` and `statusChangedAt` non-null and `0 <= DAYS.between(applied, changed) <= QUICK_OUTCOME_DAYS`, that is 7. Sort by `daysToResolution` ascending.
- **Quick losses**: the same function against `NEGATIVE_TERMINAL_STATUSES`. See [section 2](#2-known-defects) for the overlap between the two sets.

`activeCount` is the number of applications *not* in `ALL_TERMINAL_STATUSES` (:828-831), so `OFFER_RECEIVED`, `NEGOTIATING`, `ON_HOLD`, and `WAITING_FOR_RESPONSE` all count as active. The summary is simply the four list sizes plus that count (:833-839). None of the four lists is truncated.

```json
{
    "staleApplications": [
        {
            "applicationId": 4,
            "companyName": "FinanceFlow",
            "positionTitle": "Backend Engineer",
            "currentStatus": "OFFER_RECEIVED",
            "lastEventAt": 1784862476.0,
            "daysSinceLastEvent": 20
        }
    ],
    "hotApplications": [],
    "quickWins": [],
    "quickLosses": [],
    "staleDaysThreshold": 14,
    "summary": {
        "staleCount": 1,
        "hotCount": 0,
        "quickWinCount": 0,
        "quickLossCount": 0,
        "activeCount": 4
    }
}
```

Each `quickWins` and `quickLosses` element has the shape `{ applicationId, companyName, positionTitle, finalStatus, appliedAt, resolvedAt, daysToResolution }`.

### `GET /analytics/company-insights?topN=`

Per-company response, ghost, and interview rates. Controller at `JobApplicationController.java:395-405`, service at :970-996.

`topN` carries `@RequestParam(required = false, defaultValue = "10")` and no validation. `topN=0` returns an empty list; `topN=-1` makes `Stream.limit` throw `IllegalArgumentException` and the request fails.

Group by the exact `companyName` string (:983-984). `totalCompaniesAnalyzed` is the number of distinct groups *before* truncation (:986); `companies` is sorted by application count descending and then truncated to `topN` (:989-993). `totalApplicationsAnalyzed` is the user's full application count, not the number inside the returned companies, so percentages computed against it by a consumer will not sum to 100.

Per company (`calculateCompanyMetrics`, :1009-1041), all from current status:

- `responseRate`: `RESPONSE_STATUSES` count over the company total.
- `ghostRate`: count of `GHOSTED` over the company total.
- `interviewRate`: `INTERVIEW_STATUSES` count over the company total.
- `avgDaysToResponse` (`calculateAvgDaysToResponseForApps`, :1052-1069): the same filter as the global version, but it returns `null` rather than `0.0` when nothing qualifies (:1059-1061).

```text
{
  companies: [ { companyName: String, applicationCount: long, responseRate: double,
                 ghostRate: double, interviewRate: double, avgDaysToResponse: Double|null } ],
  totalCompaniesAnalyzed: int,
  totalApplicationsAnalyzed: long
}
```

The primitive and boxed split is deliberate in the record: the three rates are primitive `double` and never null, `avgDaysToResponse` is a boxed `Double` and is nullable. This is the opposite convention from `/metrics`, where the same quantity is never null and uses `0.0` for unknown.

### `GET /analytics/location-insights`

Salary and success broken down by place and by return-to-office arrangement. Controller at `JobApplicationController.java:417-426`, service at :1072-1090. No parameters, no truncation.

`byLocation` (`calculateLocationMetrics`, :1101-1128): group by the exact `location` string with a null mapped to the literal `"Not Specified"` (:1104). No normalization, so `"Austin, TX"` and `"austin, tx"` are separate rows. Per group, `successRate` is `OFFER_STATUSES` count over the group count, and the two salary averages come from `calculateAverageSalaryMin` and `calculateAverageSalaryMax` (:1242-1278), each of which filters independently and returns `null` when no application in the group carries that field. Because the two averages are computed over potentially different subsets, a row can report an average min above its average max. Sorted by application count descending.

`byRtoType` (`calculateRtoMetrics`, :1140-1171): the same math grouped by `rtoType.name()`, again with null mapped to `"Not Specified"` (:1146), plus `percentage = count * 100 / totalApplications`. The field is typed as a plain `String`, so the sentinel and the five real enum values share one field.

```text
{
  byLocation: [ { location: String, applicationCount: long,
                  avgSalaryMin: Double|null, avgSalaryMax: Double|null, successRate: double } ],
  byRtoType:  [ { rtoType: String, applicationCount: long, percentage: double,
                  avgSalaryMin: Double|null, avgSalaryMax: Double|null, successRate: double } ],
  totalApplicationsAnalyzed: long
}
```

### `GET /analytics/position-insights`

Success and interview rates by seniority level. Controller at `JobApplicationController.java:438-447`, service at :1174-1197. No parameters, no truncation.

Group by the `Level` enum column, with null mapped to `"Not Specified"` (:1185-1189). This is a different notion of position type from the funnel endpoint, which derives its buckets from title keywords instead of from the column. The two will disagree whenever a title says "Senior" and the `level` column says something else, or is unset.

Per level (`calculateLevelMetrics`, :1210-1234): `percentage` is the group count over the user total; `successRate` is `OFFER_STATUSES` count over the group count; `interviewRate` is `INTERVIEW_STATUSES` count over the group count; the two salary averages behave as in location insights. Sorted by application count descending.

```text
{
  byLevel: [ { level: String, applicationCount: long, percentage: double,
               successRate: double, interviewRate: double,
               avgSalaryMin: Double|null, avgSalaryMax: Double|null } ],
  totalApplicationsAnalyzed: long
}
```

---

## 6. The audit trail

### The entity

`ApplicationEvent` (`src/main/java/com/nolcox/jobtracking/domain/entity/ApplicationEvent.java`) maps to `application_events`, with an index on `(application_id, created_at)` (:38-40).

**Table 6.** *Columns on `ApplicationEvent`.*

| # | Field | Column | Type and constraints | Lines |
| - | ----- | ------ | -------------------- | ----- |
| 1 | `id` | `id` | `Long`, identity | 49-51 |
| 2 | `application` | `application_id` | `@ManyToOne(LAZY)`, not null | 57-61 |
| 3 | `eventType` | `event_type` | `EventType` as a string, not null, length 50 | 68-71 |
| 4 | `fieldName` | `field_name` | `String`, max 100, nullable | 78-80 |
| 5 | `oldValue` | `old_value` | `String`, max 500, nullable | 87-89 |
| 6 | `newValue` | `new_value` | `String`, max 500, nullable | 95-97 |
| 7 | `details` | `details` | `TEXT`, nullable | 102-103 |
| 8 | `createdAt` | `created_at` | `Instant`, `@CreatedDate`, not null, not updatable | 110-112 |

`@EnableJpaAuditing` is on the application class, so `createdAt` is stamped by `AuditingEntityListener` on persist. Every writer method in `ApplicationEventServiceImpl` also sets `.createdAt(Instant.now())` in its builder; the auditing handler overwrites it, so the builder values are not authoritative.

There is deliberately no `@OneToMany` from `JobApplication` back to its events. The note at `JobApplication.java:105-109` explains that events are reached only through `ApplicationEventRepository` and cascade-deleted at the database level.

### What triggers an event

`EventType` has six values (`src/main/java/com/nolcox/jobtracking/domain/entity/EventType.java:27-56`): `APPLICATION_CREATED`, `STATUS_CHANGED`, `INTERVIEW_SCHEDULED`, `INTERVIEW_UPDATED`, `FIELD_UPDATED`, `NOTE_ADDED`.

The writer is `ApplicationEventServiceImpl`, injected into `JobApplicationServiceImpl` by optional setter injection, `@Autowired(required = false)` (`JobApplicationServiceImpl.java:70`). Every call site is null-guarded, so if the bean is absent the audit trail stops silently and every event-derived metric reports zero without erroring.

**Table 7.** *What writes an event, and what it writes.*

| # | Trigger | Event written | Call site |
| - | ------- | ------------- | --------- |
| 1 | `POST /v1/job-applications` | One `APPLICATION_CREATED` with `fieldName`, `oldValue`, and `newValue` all null and a human-readable `details` string | `JobApplicationServiceImpl.java:123` |
| 2 | `PUT /v1/job-applications/{id}` | Zero or more events, one per changed field, via `compareAndLogChanges` | `JobApplicationServiceImpl.java:205` |
| 3 | `updateApplicationStatus` service method | One `STATUS_CHANGED` | `JobApplicationServiceImpl.java:323` |

Row 3 is unreachable over HTTP. No controller maps `updateApplicationStatus`; a grep across `src/main` finds only its interface declaration (`application/service/JobApplicationService.java:109`) and the implementation (`JobApplicationServiceImpl.java:304`). In practice every `STATUS_CHANGED` event comes from row 2.

`compareAndLogChanges` (`ApplicationEventServiceImpl.java:249-311`) diffs an old-state snapshot against the saved entity and emits:

- `STATUS_CHANGED` with `fieldName = "status"` and both values as enum names (:256-258). The transition-matrix query keys off exactly this pair, `eventType = 'STATUS_CHANGED' AND fieldName = 'status'`, so anything that does not set both is invisible to the matrix.
- `INTERVIEW_SCHEDULED` when `interviewDate` goes from null to non-null, and `INTERVIEW_UPDATED` when it changes between two non-null values (:261-271). Clearing an interview date to null emits nothing; the code says so in a comment.
- `NOTE_ADDED` whenever `notes` changes at all, including edits and clearing (:274-276).
- `FIELD_UPDATED` for `companyName`, `positionTitle`, `location`, `jobUrl`, `contactName`, `contactEmail`, `contactPhone`, `jobDescription`, `salaryMin`, `salaryMax`, `rtoType`, and `level`, through the generic `compareField` helper (:283-310, helper at :339-351).

Never audited: `appliedDate`, `statusChangedAt`, `user`, and `version`. The old-state snapshot is a hand-written builder copy, `captureApplicationState` (`JobApplicationServiceImpl.java:226`), which must be maintained by hand when fields are added.

One consequence deserves emphasis. On update, a caller-supplied `statusChangedAt` wins outright (`JobApplicationServiceImpl.java:193`); only when the caller omits it and the status changed does the service stamp `Instant.now()`. The corresponding event's `createdAt` is always the real write time. Backdating an application therefore moves `avgDaysToResponse`, `stage-durations`, and quick wins and losses while leaving stale, hot, and the transition matrix untouched.

Deletion destroys history: `deleteApplication` calls `eventRepository.deleteByApplicationId(id)` before removing the row (`JobApplicationServiceImpl.java:267`).

### Reading events

- `GET /v1/job-applications/{id}/events` returns one application's trail, newest first, after an ownership check (`ApplicationEventServiceImpl.java:215-229`).
- `GET /v1/job-applications/events/all` returns every event across every application the user owns, newest first, unpaginated (`ApplicationEventServiceImpl.java:195-205`).

Both return `{ id, applicationId, eventType, fieldName, oldValue, newValue, details, createdAt }`.

### Journey timeline and stage durations, compared

Two different computations claim to describe time in a stage, and they do not agree.

The **backend** `/analytics/stage-durations` reads only the two timestamp columns and files the whole applied-to-latest-transition span under the current status, as described under [`GET /analytics/stage-durations`](#get-analyticsstage-durations).

The **frontend journey timeline** walks the event log instead. `JourneyTimeline.jsx` calls `getStageDurations(applicationId, events)` from `frontend/src/utils/stageDurationUtils.js:121-183` and never calls the analytics endpoint. That function filters events to the application, sorts them ascending by `createdAt`, seeds `currentStatus` to `'APPLIED'`, and walks forward: on a `STATUS_CHANGED` event with `fieldName === 'status'` it closes the open stage with `durationDays = floor((eventTime - stageStartTime) / 86400000)` and opens a new one at `event.newValue`. After the loop it appends the open stage with `endDate: null` and `isCurrent: true`, measured to now. Day math uses `Math.floor` (`frontend/src/utils/dateHelpers.js:25`), matching the backend's truncation.

For an application sitting at `TECHNICAL_I` 40 days after applying, the backend reports 40 days under `TECHNICAL_I` while the timeline reports the real per-stage split. These will essentially never match, and the timeline is the one describing what actually happened.

> [!NOTE]
> The timeline's loop also branches on `event.eventType === 'CREATED'` to set the initial start time (`frontend/src/utils/stageDurationUtils.js:148`), but the backend only ever writes `APPLICATION_CREATED`. Against real data `stageStartTime` stays null through the creation event, so the initial `APPLIED` stage is dropped and the chart begins at the first status change. The unit tests fabricate `'CREATED'` events, which hides this. See [known gaps](./11-known-gaps.md).

Note also that the dashboard fetches `/analytics/stage-durations` on every load but never reads the result: `Dashboard.jsx` does not destructure `stageDurations` from `useAnalytics` (`frontend/src/Dashboard.jsx:88-101`). The request is paid for and discarded, and its 500 on a fresh install is therefore invisible in the UI.

---

## See also

- [Domain and persistence](./02-domain-and-persistence.md) for the `JobApplication` and `ApplicationEvent` mappings and the nullability of `status_changed_at`.
- [API reference](./03-api-reference.md) for request and response contracts of the twelve routes, and for the endpoints outside analytics.
- [Known gaps](./11-known-gaps.md) for the full defect list, including the items summarized here.
- [Frontend](./06-frontend.md) for how `useAnalytics` fans out and how the hand-written SVG charts consume these payloads.
- [Analytics and insights](../user-guide/04-analytics-and-insights.md) for the same metrics described from the user's side.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
