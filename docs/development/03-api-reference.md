# API reference

> **Audience:** Developers writing a client against the Job Tracker backend, or extending it.  ·  **Scope:** Every HTTP route the Spring Boot application exposes at version 2.0.0, with parameters, bodies, response shapes, and status codes.

The backend serves 26 application routes plus the springdoc documentation endpoints. This page lists all of them, grouped by area, and documents the cross-cutting rules a client author needs first: how the bearer token is obtained, how timestamps serialize, what an error body looks like, and how pagination is parameterized.

Response examples on this page were captured from a running stack under the `docker` profile against the seeded demo account created by `DataInitializer`. The numbers are therefore small and real rather than illustrative, and some samples are abridged where noted.

## Contents

- [1. Base URL and path composition](#1-base-url-and-path-composition)
- [2. Authentication](#2-authentication)
- [3. Serialization rules](#3-serialization-rules)
- [4. Errors](#4-errors)
- [5. Pagination](#5-pagination)
- [6. Authentication endpoints](#6-authentication-endpoints)
- [7. Job application endpoints](#7-job-application-endpoints)
- [8. Audit trail endpoints](#8-audit-trail-endpoints)
- [9. Analytics endpoints](#9-analytics-endpoints)
- [10. Configuration endpoints](#10-configuration-endpoints)
- [11. OpenAPI and Swagger UI](#11-openapi-and-swagger-ui)
- [See also](#see-also)

---

## 1. Base URL and path composition

Every externally visible URL is the origin, plus the servlet context path `/api`, plus the controller mapping, plus the method mapping.

**Table 1.** *The layers that compose a full request path.*

| Layer | Value | Source |
| ----- | ----- | ------ |
| Server port | `8080` | `src/main/resources/application.yml:2` |
| Servlet context path | `/api` | `src/main/resources/application.yml:4` |
| Auth controller | `/v1/auth` | `src/main/java/com/nolcox/jobtracking/application/controller/AuthController.java:19` |
| Job application controller | `/v1/job-applications` | `src/main/java/com/nolcox/jobtracking/application/controller/JobApplicationController.java:54` |
| Config controller | `/v1/config` | `src/main/java/com/nolcox/jobtracking/application/controller/ConfigController.java:25` |

So a login is `POST http://localhost:8080/api/v1/auth/login`.

The `/v1` segment is a literal in each `@RequestMapping`. There is no content negotiation to speak of: request and response bodies are `application/json` throughout, and no endpoint accepts or returns any other media type.

Spring Security matches on the path *relative to* the context path, so the matchers in `SecurityConfig` are written without the `/api` prefix (`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:63-72`). Keep that in mind when adding rules.

CORS allows the origins in `app.cors.allowed-origins` (default `http://localhost:3000,http://localhost:4200`), the methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`, any header, and credentials, applied to `/**` (`SecurityConfig.java:84-97`, `application.yml:37`). CSRF is disabled and sessions are `STATELESS` (`SecurityConfig.java:61`, `:73-75`).

---

## 2. Authentication

Every route on `JobApplicationController` requires a bearer token. The two auth routes and the two config routes are public, permitted explicitly at `SecurityConfig.java:64` and `:66`. Everything else falls through to `anyRequest().authenticated()` (`SecurityConfig.java:71`).

### Obtaining a token

`POST /api/v1/auth/register` and `POST /api/v1/auth/login` both return an `AuthResponse` whose `token` field is a signed JWT. Send it on every subsequent request:

```http
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

`JwtAuthenticationFilter` requires the exact prefix `Bearer ` (`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtAuthenticationFilter.java:42-49`). If the header is absent, malformed, or the token fails validation, the filter swallows the exception and lets the request continue unauthenticated; `JwtAuthenticationEntryPoint` then writes the 401 (`JwtAuthenticationEntryPoint.java:26-43`).

The token's subject is the user's email. It also carries `userId` and `role` claims (`AuthServiceImpl.java:159-164`), but nothing on the server reads them: the filter loads the `User` entity by email and the controller takes the id from that entity (`JobApplicationController.java:516-519`).

### Token lifetime

The TTL comes from `app.jwt.expiration`, in milliseconds. It differs by profile.

**Table 2.** *Access token lifetime by Spring profile.*

| Profile | Configured value | Effective lifetime | Honors `JWT_EXPIRATION` | Source |
| ------- | ---------------- | ------------------ | ----------------------- | ------ |
| default | `${JWT_EXPIRATION:2592000000}` | 30 days | yes | `src/main/resources/application.yml:34` |
| `docker` | `86400000` | 24 hours | no | `src/main/resources/application-docker.yml:39` |

The `docker` profile hardcodes the value with no placeholder, so setting `JWT_EXPIRATION` in the Compose environment changes nothing. See [known gaps](./11-known-gaps.md).

The `expiresIn` field in the login and register responses reports whatever the running profile configured, in milliseconds (`AuthServiceImpl.java:185`).

There is no refresh endpoint and no logout endpoint. `AuthServiceImpl.refreshToken` and `AuthServiceImpl.logout` exist but no controller maps a route to them, and there is no token blacklist, so an issued token stays valid until it expires.

### Signing

Tokens are signed with an HMAC key derived by Base64-decoding `app.jwt.secret` and passing the bytes to `Keys.hmacShaKeyFor` (`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtService.java:89-91`). The algorithm is never pinned, so jjwt picks it from the key length. The committed default secret decodes to 48 bytes, which selects **HS384**. Changing the secret's length changes the algorithm. Details are in [security and authentication](./04-security-and-authentication.md).

---

## 3. Serialization rules

> [!IMPORTANT]
> Timestamps serialize as ISO 8601 strings, for example `"2026-08-13T04:05:13Z"`. Until 2.0.0 they rendered as epoch-second decimals, because a hand-built `@Primary ObjectMapper` made Spring Boot's Jackson auto-configuration back off and left every `spring.jackson.*` property inert. That mapper is now a builder customizer, so `write-dates-as-timestamps: false` applies as written. A client built against the old format should parse strings, not numbers.

This applies uniformly: `appliedDate`, `createdAt`, `updatedAt`, `statusChangedAt`, `interviewDate`, event `createdAt`, and the `timestamp` on error bodies.

Two further rules worth knowing before reading the endpoint sections:

- **Enums serialize as their constant name.** `status` is `"OFFER_RECEIVED"`, `rtoType` is `"HYBRID_2"`, `eventType` is `"STATUS_CHANGED"`. Map keys typed as enums follow the same rule, so `counts-by-status` is keyed by `"APPLIED"`, `"REJECTED"`, and so on.
- **Request deserialization ignores unknown properties.** `fail-on-unknown-properties: false` is configured (`application.yml:14`), and the custom `ObjectMapper` does not re-enable it, so extra fields in a request body are silently dropped rather than rejected.

---

## 4. Errors

There are two error body shapes.

`ApiErrorResponse` (`src/main/java/com/nolcox/jobtracking/application/dto/response/ApiErrorResponse.java:7-12`) has four fields: `status` (the `HttpStatus` constant name as a string, for example `"NOT_FOUND"`, not the numeric code), `error` (a short label), `message` (a human-readable sentence), and `timestamp` (an `Instant`, serialized per section 3).

`ValidationErrorResponse` (`ValidationErrorResponse.java:8-13`) replaces `message` with `errors`, a map of field name to violation message. It has no `message` field at all, which is the single most common client-side surprise in this API.

A live 401 from a wrong password:

```json
{"status":"UNAUTHORIZED","error":"Authentication Failed","message":"Invalid email or password"}
```

A validation failure on register looks like:

```json
{
  "status": "BAD_REQUEST",
  "error": "Validation Failed",
  "errors": {
    "password": "Password must be at least 8 characters"
  }
}
```

The mapping from exception to status lives in a single `@RestControllerAdvice`.

**Table 3.** *Exception to HTTP status mapping in `GlobalExceptionHandler`.*

| Exception | Status | Body type | `error` value | `message` value | Line |
| --------- | ------ | --------- | ------------- | --------------- | ---- |
| `ResourceNotFoundException` | 404 | `ApiErrorResponse` | `Resource Not Found` | the exception message | `:24-34` |
| `MethodArgumentNotValidException` | 400 | `ValidationErrorResponse` | `Validation Failed` | none; see `errors` | `:36-52` |
| `UnauthorizedException` | 403 | `ApiErrorResponse` | `Access Denied` | the exception message | `:54-64` |
| `AuthenticationFailureException` | 401 | `ApiErrorResponse` | `Authentication Failed` | the exception message | `:76-86` |
| `BusinessException` | 400 | `ApiErrorResponse` | `Business Logic Error` | the exception message | `:98-108` |
| `Exception` (catch-all) | 500 | `ApiErrorResponse` | `Internal Server Error` | the fixed string `An unexpected error occurred` | `:110-120` |

All line numbers are in `src/main/java/com/nolcox/jobtracking/application/controller/GlobalExceptionHandler.java`.

Note the naming inversion: `UnauthorizedException` produces **403**, and authentication failure produces 401.

Missing or invalid tokens do not pass through this advice. `JwtAuthenticationEntryPoint` writes them directly, with the same `ApiErrorResponse` shape, `error` of `Authentication Failed` and the message `You need to be authenticated to access this resource` (`JwtAuthenticationEntryPoint.java:35-40`).

The advice does not extend `ResponseEntityExceptionHandler` and registers no handler for `MethodArgumentTypeMismatchException`, `NoResourceFoundException`, or `HttpRequestMethodNotSupportedException`. Because `ExceptionHandlerExceptionResolver` runs before `DefaultHandlerExceptionResolver`, the catch-all is expected to claim those cases and return 500 rather than 400 or 404. That means an unparseable enum in `?status=`, a non-numeric `{id}`, an unknown path, and a wrong method are all likely to surface as 500 `An unexpected error occurred`. This behavior is reasoned from resolver ordering and is not covered by any test; treat it as probable rather than confirmed.

Canonical messages are in `src/main/java/com/nolcox/jobtracking/shared/exception/ErrorMessages.java`: `Application not found`, `User not found`, `Invalid email or password`, `Email is already registered`.

---

## 5. Pagination

Exactly one endpoint is paginated: `GET /api/v1/job-applications`. It binds a Spring Data `Pageable` (`JobApplicationController.java:71`). No `spring.data.web.*` properties are set in either `application.yml` or `application-docker.yml`, so Spring Boot's defaults apply.

**Table 4.** *Pagination query parameters and their defaults.*

| Parameter | Type | Default | Notes |
| --------- | ---- | ------- | ----- |
| `page` | integer | `0` | Zero-based. |
| `size` | integer | `20` | Spring Boot caps page size at 2000. |
| `sort` | string, repeatable | none | `property,asc` or `property,desc`. |

There is no default sort. `findByUserIdWithFilters` carries no `ORDER BY` (`src/main/java/com/nolcox/jobtracking/domain/repository/JobApplicationRepository.java:24-30`) and the controller supplies no fallback `Sort`, so page ordering is whatever the database returns. Pass an explicit `sort` if order matters to your client.

The response is a `Page<JobApplicationResponse>` returned directly, so the JSON envelope is Jackson's bean rendering of `PageImpl`. Spring Boot 3.3 and later warn against relying on this envelope, and no `spring.data.web.pageable.serialization-mode` is configured. Only `content` is asserted by the test suite. Treat `content`, `totalElements`, `totalPages`, `size`, and `number` as the practical contract and the rest as incidental.

The audit endpoint `GET /api/v1/job-applications/events/all` is **not** paginated and has no cap; it returns every event the user has ever generated.

---

## 6. Authentication endpoints

Both routes are public (`SecurityConfig.java:64`) and both return `AuthResponse` on success.

### `POST /api/v1/auth/register`

Creates a user and immediately issues a token. Handler at `AuthController.java:26-31`.

Request body is `RegisterRequest` (`src/main/java/com/nolcox/jobtracking/application/dto/request/RegisterRequest.java:7-24`).

**Table 5.** *`RegisterRequest` fields.*

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `firstName` | string | required, at most 100 characters |
| `lastName` | string | required, at most 100 characters |
| `email` | string | required, email format, at most 255 characters |
| `password` | string | required, at least 8 characters |

New users always get the role `USER` and are created enabled (`AuthServiceImpl.java:56`). Passwords are hashed with BCrypt at strength 12 (`SecurityConfig.java:39`, `:48-49`).

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "password": "correct-horse"
}
```

Status codes:

- **200 OK** on success. Not 201, and no `Location` header is set, despite creating a resource (`AuthController.java:30`).
- **400 Bad Request** with a `ValidationErrorResponse` if any constraint fails.
- **400 Bad Request** with an `ApiErrorResponse` and message `Email is already registered` if the address is taken (`AuthServiceImpl.java:47`).

### `POST /api/v1/auth/login`

Exchanges credentials for a token. Handler at `AuthController.java:33-38`.

Request body is `AuthRequest` (`src/main/java/com/nolcox/jobtracking/application/dto/request/AuthRequest.java:7-15`): `email` (required, email format) and `password` (required, at least 8 characters).

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Status codes:

- **200 OK** on success.
- **400 Bad Request** if `password` is shorter than 8 characters. The `@Size(min = 8)` constraint sits on the *login* DTO (`AuthRequest.java:13`), so a legacy short password produces a validation error rather than an authentication failure.
- **401 Unauthorized** with message `Invalid email or password` for wrong credentials (`AuthServiceImpl.java:99`).

### Response shape

**Table 6.** *`AuthResponse` fields, shared by both endpoints.*

| Field | Type | Notes |
| ----- | ---- | ----- |
| `token` | string | The signed JWT. |
| `type` | string | Always the literal `Bearer` (`AuthServiceImpl.java:184`). |
| `expiresIn` | integer | Token lifetime in **milliseconds**, not seconds. |
| `user` | object | A `UserInfo`. |

`UserInfo` (`src/main/java/com/nolcox/jobtracking/application/dto/response/UserInfo.java:3-9`) carries `id` (integer), `email` (string), `firstName` (string), `lastName` (string), and `role` (string, the `Role` enum name).

```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "USER"
  }
}
```

---

## 7. Job application endpoints

All five routes require a bearer token. The owning user is always taken from the authenticated principal, never from the request body or a query parameter.

Ownership is enforced two different ways, and the difference is observable. The list endpoint scopes at the query level. The single-resource endpoints fetch first and then check, so requesting another user's application returns **403**, not 404 (`src/main/java/com/nolcox/jobtracking/application/service/impl/JobApplicationServiceImpl.java:104-106`, `:348-351`). A client can therefore distinguish "this id does not exist" from "this id belongs to someone else".

### `GET /api/v1/job-applications`

Lists the caller's applications, paginated. Handler at `JobApplicationController.java:66-79`.

**Table 7.** *Query parameters for the list endpoint.*

| Parameter | Type | Required | Default | Behavior |
| --------- | ---- | -------- | ------- | -------- |
| `status` | `ApplicationStatus` enum name | no | none | Exact match. An unrecognized value is not handled and is expected to surface as 500 (see section 4). |
| `companyName` | string | no | none | Case-insensitive substring match (`JobApplicationRepository.java:26`). |
| `page`, `size`, `sort` | see Table 4 | no | `0`, `20`, unsorted | Standard Spring Data binding. |

Returns **200** with a page envelope. Captured from the seeded account with `size=1`, abridged after the envelope keys shown:

```json
{
  "content": [
    {
      "id": 1,
      "companyName": "TechCorp Inc",
      "positionTitle": "Senior Software Engineer",
      "jobDescription": "Exciting opportunity to work with cutting-edge technologies including React, Spring Boot, and AWS",
      "status": "APPLIED",
      "appliedDate": 1786158476.0,
      "interviewDate": null,
      "salaryMin": 110000.0,
      "salaryMax": 130000.0,
      "location": "San Francisco, CA",
      "rtoType": "HYBRID_2",
      "level": null,
      "notes": "Great company culture, remote-friendly",
      "jobUrl": "https://techcorp.com/jobs/senior-engineer",
      "contactName": "Jane Smith",
      "contactEmail": "jane.smith@techcorp.com",
      "contactPhone": "+1-555-0123",
      "createdAt": 1786590476.0,
      "updatedAt": 1786590476.0,
      "statusChangedAt": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 1,
    "sort": { "empty": true, "sorted": false, "unsorted": true },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": false,
  "totalPages": 5,
  "totalElements": 5,
  "size": 1,
  "number": 0
}
```

Note `statusChangedAt: null` on that seeded row. That null is the direct cause of the stage-durations failure described in section 9.

### `GET /api/v1/job-applications/{id}`

Fetches one application. Handler at `JobApplicationController.java:81-90`. Path parameter `id` is a `Long` with no validation annotation.

- **200 OK** with a `JobApplicationResponse`.
- **403 Forbidden** (`Access denied`) if the application belongs to another user.
- **404 Not Found** (`Application not found`) if no row has that id.

### `POST /api/v1/job-applications`

Creates an application. Handler at `JobApplicationController.java:92-112`. Body is a `JobApplicationCreateRequest`.

**Table 8.** *`JobApplicationCreateRequest` fields, in declaration order.*

| Field | Type | Validation |
| ----- | ---- | ---------- |
| `companyName` | string | required, at most 255 characters |
| `positionTitle` | string | required, at most 255 characters |
| `jobDescription` | string | at most 10000 characters |
| `status` | `ApplicationStatus` | required |
| `jobUrl` | string | at most 500 characters |
| `salaryMin` | number | zero or positive |
| `salaryMax` | number | zero or positive |
| `location` | string | at most 255 characters |
| `rtoType` | `RtoType` | none |
| `level` | `Level` | none |
| `notes` | string | at most 5000 characters |
| `contactName` | string | at most 255 characters |
| `contactEmail` | string | email format |
| `contactPhone` | string | at most 50 characters |
| `appliedDate` | timestamp | none; defaults to now |
| `statusChangedAt` | timestamp | none; defaults to now |
| `interviewDate` | timestamp | none |

Field definitions are at `src/main/java/com/nolcox/jobtracking/application/dto/request/JobApplicationCreateRequest.java:14-62`. There is no cross-field rule that `salaryMax >= salaryMin`, so an inverted pair is accepted.

```json
{
  "companyName": "TechCorp Inc",
  "positionTitle": "Senior Software Engineer",
  "status": "APPLIED",
  "salaryMin": 110000,
  "salaryMax": 130000,
  "location": "San Francisco, CA",
  "rtoType": "HYBRID_2"
}
```

`appliedDate` and `statusChangedAt` both default to the current instant when omitted (`JobApplicationServiceImpl.java:127`, `:116`), and an `APPLICATION_CREATED` audit event is written.

- **201 Created**, body is the created `JobApplicationResponse`, with a `Location` header pointing at the new resource (`JobApplicationController.java:101-107`). If no servlet context is available the controller falls back to 201 with no `Location` (`:104-107`).
- **400 Bad Request** with a `ValidationErrorResponse` on constraint failure.

### `PUT /api/v1/job-applications/{id}`

Updates an application. Handler at `JobApplicationController.java:114-124`. Body is a `JobApplicationUpdateRequest` (`.../request/JobApplicationUpdateRequest.java:14-62`), which has the same 17 fields and the same constraints as the create request but declares them in a different order.

Despite the `PUT` verb, the semantics are a merge, not a replace: the mapper is configured with `setSkipNullEnabled(true)` (`src/main/java/com/nolcox/jobtracking/config/ModelMapperConfig.java:12-16`), so a null field in the body leaves the stored column untouched rather than clearing it. `companyName`, `positionTitle`, and `status` are still required by validation.

`statusChangedAt` is resolved in priority order: the request value if present, otherwise the current instant if the status changed, otherwise the original value (`JobApplicationServiceImpl.java:201-211`). A field-level diff is written to the audit trail.

- **200 OK** with the updated `JobApplicationResponse`.
- **400**, **403**, **404** as for the single-resource read.

### `DELETE /api/v1/job-applications/{id}`

Deletes an application and its audit events. Handler at `JobApplicationController.java:126-135`.

- **204 No Content**, empty body.
- **403 Forbidden** or **404 Not Found** as above.

### Bulk delete

Three endpoints operate on a set of applications rather than one. All three take no request body and no parameters; the set is derived entirely from the authenticated user.

Both deletes remove the associated audit events first, then the applications (`JobApplicationServiceImpl.java:368-383`, `:387-402`). The order is not incidental: `ApplicationEvent` holds the foreign key, so deleting applications first leaves the persistence context inconsistent. The service owns that ordering so no caller can get it wrong.

Deletion is permanent. There is no soft-delete flag, no undo, and the audit trail that would have recorded the deletion is itself removed. Neither endpoint writes an audit event.

#### `DELETE /api/v1/job-applications/bulk/all`

Deletes every application belonging to the caller. Handler at `JobApplicationController.java:147-159`.

- **200 OK** with a `BulkDeleteResponse`.
- **200 OK** with `deletedCount: 0` when the caller has no applications. Deleting nothing is not an error.

#### `DELETE /api/v1/job-applications/bulk/non-active`

Deletes only the caller's closed-out applications. Handler at `JobApplicationController.java:169-181`.

"Non-active" means `REJECTED`, `WITHDRAWN`, or `GHOSTED`, defined once as `NON_ACTIVE_STATUSES` (`JobApplicationServiceImpl.java:60-63`). It is a fixed set, not a client parameter: a caller cannot choose which statuses to purge. Note that this is a narrower set than the terminal statuses used elsewhere in the app; `OFFER_DECLINED` and `OFFER_ACCEPTED` are terminal but are **not** deleted.

The service resolves matching IDs before deleting (`JobApplicationServiceImpl.java:388`) and returns early when the list is empty (`:391-394`). That early return is load-bearing, not just an optimization: both delete queries use an `IN (:ids)` clause, which is invalid SQL when the list is empty.

- **200 OK** with a `BulkDeleteResponse`.
- **200 OK** with `deletedCount: 0` when nothing matches.

#### `GET /api/v1/job-applications/counts/non-active`

Counts what the non-active delete would remove, without removing it. Handler at `JobApplicationController.java:190-198`. The UI calls this to show the user a number before they confirm.

Returns a single-key JSON object rather than a bare integer:

```json
{ "count": 7 }
```

The key is the constant `NON_ACTIVE_COUNT_KEY` (`JobApplicationController.java:60`). The count is pushed into the database as a `COUNT` query (`JobApplicationRepository.java:36-39`), not derived by materializing rows.

#### `BulkDeleteResponse`

**Table 9.** *`BulkDeleteResponse` fields (`.../response/BulkDeleteResponse.java:12-15`).*

| Field | Type | Notes |
| ----- | ---- | ----- |
| `deletedCount` | integer | Applications removed. Does not count the audit events removed alongside them. |
| `message` | string | Human-readable summary, for example `Deleted 7 application(s)`. Intended for display; do not parse it. |

For `bulk/all` the count is read before deletion (`JobApplicationServiceImpl.java:369`), because the bulk queries report rows affected at the JDBC level rather than through the repository API. A concurrent insert between the count and the delete would therefore be deleted but not counted.

### Response shape

**Table 10.** *`JobApplicationResponse` fields, in serialization order.*

| Field | Type | Field | Type |
| ----- | ---- | ----- | ---- |
| `id` | integer | `notes` | string |
| `companyName` | string | `jobUrl` | string |
| `positionTitle` | string | `contactName` | string |
| `jobDescription` | string | `contactEmail` | string |
| `status` | `ApplicationStatus` | `contactPhone` | string |
| `appliedDate` | timestamp | `createdAt` | timestamp |
| `interviewDate` | timestamp | `updatedAt` | timestamp |
| `salaryMin` | number | `statusChangedAt` | timestamp |
| `salaryMax` | number | | |
| `location` | string | | |
| `rtoType` | `RtoType` | | |
| `level` | `Level` | | |

Defined at `src/main/java/com/nolcox/jobtracking/application/dto/response/JobApplicationResponse.java:9-30`. There is no `userId` field; the response never discloses the owner.

The 18 valid `ApplicationStatus` values are listed in Table 13. `RtoType` and `Level` values are in Tables 15 and 16.

---

## 8. Audit trail endpoints

Both return a bare JSON array (not a page envelope) of `ApplicationEventResponse`, newest first.

### `GET /api/v1/job-applications/events/all`

Every event across all of the caller's applications. Handler at `JobApplicationController.java:213-222`; scoping is entirely at the query level (`ApplicationEventRepository.java:123-124`).

This endpoint is unbounded. It takes no parameters, applies no cap, and returns the user's complete event history in one response. For a long-lived account that grows without limit.

- **200 OK** with a JSON array. An account with no events returns `[]`.

### `GET /api/v1/job-applications/{id}/events`

The audit trail for one application. Handler at `JobApplicationController.java:235-245`. It loads the application first, checks ownership, and only then reads events (`ApplicationEventServiceImpl.java:215-222`).

- **200 OK** with a JSON array.
- **403 Forbidden** if the application belongs to another user.
- **404 Not Found** if the id does not exist.

Route precedence between the literal `/events/all` and the templated `/{id}/events` relies on Spring's pattern comparator preferring the literal segment. No test pins this.

**Table 11.** *`ApplicationEventResponse` fields.*

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | integer | |
| `applicationId` | integer | |
| `eventType` | `EventType` | One of `APPLICATION_CREATED`, `STATUS_CHANGED`, `INTERVIEW_SCHEDULED`, `INTERVIEW_UPDATED`, `FIELD_UPDATED`, `NOTE_ADDED`. |
| `fieldName` | string | Set on `FIELD_UPDATED` events. |
| `oldValue` | string | |
| `newValue` | string | |
| `details` | string | Free-text context. |
| `createdAt` | timestamp | |

Defined at `src/main/java/com/nolcox/jobtracking/application/dto/response/ApplicationEventResponse.java:37-46`; the enum is at `src/main/java/com/nolcox/jobtracking/domain/entity/EventType.java`.

---

## 9. Analytics endpoints

Twelve `GET` routes, all requiring a bearer token, all scoped by passing the authenticated user's id into a repository query. Ten take no parameters at all.

**Table 12.** *The twelve analytics routes. All paths are prefixed with `/api/v1/job-applications`.*

| Path | Parameters | Response type | Handler |
| ---- | ---------- | ------------- | ------- |
| `/metrics` | none | `MetricsResponse` | `:191-199` |
| `/counts-by-status` | none | map of status to count | `:210-218` |
| `/analytics/salary-distribution` | none | `SalaryDistributionResponse` | `:229-237` |
| `/analytics/activity-heatmap` | `year` | `ActivityHeatmapResponse` | `:249-259` |
| `/analytics/time-patterns` | none | `TimePatternsResponse` | `:270-278` |
| `/analytics/stage-durations` | none | `StageDurationsResponse` | `:289-297` |
| `/analytics/transition-matrix` | none | `TransitionMatrixResponse` | `:315-324` |
| `/analytics/funnel` | none | `FunnelAnalyticsResponse` | `:341-350` |
| `/analytics/health` | `staleDays` | `ApplicationHealthResponse` | `:370-380` |
| `/analytics/company-insights` | `topN` | `CompanyInsightsResponse` | `:395-405` |
| `/analytics/location-insights` | none | `LocationInsightsResponse` | `:417-426` |
| `/analytics/position-insights` | none | `PositionInsightsResponse` | `:438-447` |

Handler lines are in `src/main/java/com/nolcox/jobtracking/application/controller/JobApplicationController.java`.

The three optional parameters:

- `year` (integer, optional). Defaults to the current year, resolved in the controller (`:256`). No range guard, so a nonsensical year returns an empty heatmap rather than an error.
- `staleDays` (integer, optional, default `14`, declared at `:375` and again as `DEFAULT_STALE_DAYS` at `AnalyticsServiceImpl.java:203`). No `@Min` guard.
- `topN` (integer, optional, default `10`, declared at `:400` and again as `DEFAULT_TOP_N_COMPANIES` at `AnalyticsServiceImpl.java:967`). No `@Min` guard, and the value reaches `Stream.limit` at `AnalyticsServiceImpl.java:992`, which throws on a negative argument. A negative `topN` therefore produces a 500.

Eleven of the twelve return **200** against a freshly seeded account. One does not.

> [!WARNING]
> `GET /api/v1/job-applications/analytics/stage-durations` returns **500** on a fresh install. `DataInitializer` writes entities directly rather than through the service layer and never sets `statusChangedAt`, while seeding three non-`APPLIED` statuses. `getStageDurations` guards `appliedDate` but not `statusChangedAt`, then dereferences it on the non-`APPLIED` branch (`src/main/java/com/nolcox/jobtracking/application/service/impl/AnalyticsServiceImpl.java:523`), throwing `NullPointerException: temporal`. Applications created through the API are unaffected, because both write paths default `statusChangedAt` to the current instant. See [known gaps](./11-known-gaps.md).

### `/metrics`

Headline rates and counts. `MetricsResponse` (`.../response/MetricsResponse.java:18-25`) has `trueResponseRate`, `trueInterviewRate`, `trueOfferRate`, `avgDaysToResponse`, `weeklyPace` (all numbers), `totalApplications` (integer), and `stageConversions`, a nested object with `appliedToScreen`, `screenToTech`, and `techToOffer` (`:52-56`). Rates are percentages from 0 to 100, rounded to one decimal. A user with no applications gets all zeros from `MetricsResponse.empty()`.

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

### `/counts-by-status`

A raw JSON object keyed by status name, with integer counts. The query groups by status (`JobApplicationRepository.java:44-46`), so **statuses with no applications are absent from the map**, not present with a zero. Clients must supply their own zero default.

```json
{
  "TECH_SCREEN": 1,
  "OFFER_RECEIVED": 1,
  "APPLIED": 2,
  "REJECTED": 1
}
```

### `/analytics/salary-distribution`

`SalaryDistributionResponse` (`.../response/SalaryDistributionResponse.java:21-28`) has `globalMin`, `globalMax`, `avgMin`, `avgMax`, `avgMid` (numbers; `avgMin` and `avgMax` are null when the average is not positive), `activeAppsWithSalary` (integer), and `entries`, a list of `{ company, salaryMin, salaryMax }` (`:37-41`). Only applications outside the terminal statuses `REJECTED`, `WITHDRAWN`, and `GHOSTED` are considered, and an application with only one salary bound has the missing bound coalesced to the present one.

The DTO's Javadoc claims `entries` is "sorted by midpoint descending, capped at 15" (`SalaryDistributionResponse.java:18-19`). The implementation does neither: it maps and collects with no sort and no limit (`AnalyticsServiceImpl.java:395-401`). The code is the contract; the Javadoc is stale.

### `/analytics/activity-heatmap`

`ActivityHeatmapResponse` (`.../response/ActivityHeatmapResponse.java:16-19`) has `data` (an object keyed by `YYYY-MM-DD` date strings with integer values), `maxCount` (integer), and `year` (integer). Note that the heatmap keys are ISO date strings even though every `Instant` elsewhere is numeric; they are formatted, not serialized.

### `/analytics/time-patterns`

`TimePatternsResponse` (`.../response/TimePatternsResponse.java:16-18`) has `byDayOfWeek` (keyed by `MONDAY` through `SUNDAY`) and `byHour` (keyed by stringified hours `0` through `23`). Both maps omit empty buckets.

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

### `/analytics/stage-durations`

`StageDurationsResponse` (`.../response/StageDurationsResponse.java:18-20`) has `averageTimeByStage` (an object keyed by status name with numeric day counts) and `bottleneckStages`, a list of `{ stage, avgDays }` capped at 5 entries (`MAX_BOTTLENECK_STAGES`, `AnalyticsServiceImpl.java:224`, applied at `:549`). Subject to the 500 described above.

### `/analytics/transition-matrix`

`TransitionMatrixResponse` (`.../response/TransitionMatrixResponse.java:22-25`) has `transitions`, a list of `{ fromStatus, toStatus, count }` (`:37-41`), `statuses` (an array of status names), and `totalTransitions` (integer). This is the only analytics view derived from the event history rather than from current status, which is why it can disagree with the funnel numbers. See [analytics internals](./05-analytics-internals.md).

### `/analytics/funnel`

`FunnelAnalyticsResponse` (`.../response/FunnelAnalyticsResponse.java:23-29`) has `stageConversionRates` (an object keyed by status name with percentage values), `dropOffPoints` (list of `{ status, count, percentage }`), `successRateByCompany` (list of `{ companyName, totalApplications, offersReceived, successRate }`), `successRateByPositionType` (list of `{ positionType, totalApplications, offersReceived, successRate }`), `overallSuccessRate` (number), and `totalApplicationsAnalyzed` (integer).

Every figure here is computed from each application's *current* status only. An application that reached three interview rounds and was then rejected contributes nothing to any interview or conversion figure.

Captured, abridged after the first three companies:

```json
{
  "stageConversionRates": { "APPLIED": 60.0 },
  "dropOffPoints": [
    { "status": "REJECTED", "count": 1, "percentage": 20.0 }
  ],
  "successRateByCompany": [
    { "companyName": "BigTech Corp", "totalApplications": 1, "offersReceived": 0, "successRate": 0.0 },
    { "companyName": "TechCorp Inc", "totalApplications": 1, "offersReceived": 0, "successRate": 0.0 },
    { "companyName": "FinanceFlow", "totalApplications": 1, "offersReceived": 1, "successRate": 100.0 }
  ]
}
```

### `/analytics/health`

`ApplicationHealthResponse` (`.../response/ApplicationHealthResponse.java:27-33`) has `staleApplications`, `hotApplications`, `quickWins`, `quickLosses`, `staleDaysThreshold` (integer, echoing the effective `staleDays`), and `summary`.

- `StaleApplication`: `applicationId`, `companyName`, `positionTitle`, `currentStatus`, `lastEventAt` (timestamp), `daysSinceLastEvent` (integer) (`:45-52`).
- `HotApplication`: `applicationId`, `companyName`, `positionTitle`, `currentStatus`, `recentEventCount` (integer), `lastEventAt` (`:64-71`). Hot means at least 3 events in the last 7 days (`AnalyticsServiceImpl.java:208`, `:213`).
- `QuickOutcome` (used for both `quickWins` and `quickLosses`): `applicationId`, `companyName`, `positionTitle`, `finalStatus`, `appliedAt`, `resolvedAt`, `daysToResolution` (integer) (`:84-92`). The window is 7 days (`:218`).
- `HealthSummary`: `staleCount`, `hotCount`, `quickWinCount`, `quickLossCount`, `activeCount`, all integers (`:103-109`).

The status sets behind `quickWins` and `quickLosses` overlap: `OFFER_DECLINED` and `OFFER_RESCINDED` appear in both, so an application in either status is counted twice. See [known gaps](./11-known-gaps.md).

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

### `/analytics/company-insights`

`CompanyInsightsResponse` (`.../response/CompanyInsightsResponse.java:19-22`) has `companies`, `totalCompaniesAnalyzed` (integer), and `totalApplicationsAnalyzed` (integer). Each `CompanyMetrics` (`:41-48`) has `companyName`, `applicationCount` (integer), `responseRate`, `ghostRate`, `interviewRate` (numbers), and `avgDaysToResponse` (number or null).

`companies` is truncated to `topN`, but `totalCompaniesAnalyzed` counts every distinct company, so the two will not agree once a user has more than `topN` companies.

### `/analytics/location-insights`

`LocationInsightsResponse` (`.../response/LocationInsightsResponse.java:17-20`) has `byLocation`, `byRtoType`, and `totalApplicationsAnalyzed` (integer).

- `LocationMetrics` (`:36-42`): `location`, `applicationCount`, `avgSalaryMin` (number or null), `avgSalaryMax` (number or null), `successRate`.
- `RtoMetrics` (`:57-64`): `rtoType`, `applicationCount`, `percentage`, `avgSalaryMin`, `avgSalaryMax`, `successRate`.

Applications with a null location or a null RTO type are bucketed under the literal string `Not Specified`.

### `/analytics/position-insights`

`PositionInsightsResponse` (`.../response/PositionInsightsResponse.java:16-18`) has `byLevel` and `totalApplicationsAnalyzed` (integer). Each `LevelMetrics` (`:34-42`) has `level` (string), `applicationCount` (integer), `percentage`, `successRate`, `interviewRate` (numbers), `avgSalaryMin`, and `avgSalaryMax` (numbers or null).

---

## 10. Configuration endpoints

Both routes are public (`SecurityConfig.java:66`) and neither takes an `Authentication` parameter, so there is no user scoping. The payloads are static per deployment: they are built from the enum definitions at class-initialization time and never touch the database.

### `GET /api/v1/config/statuses`

Handler at `ConfigController.java:55-61`. Returns a `StatusConfigResponse` (`.../response/StatusConfigResponse.java:16-18`) with `statuses` (a list of `{ key, label, color, group }`) and `groups` (an object mapping a group name to an array of status keys). Always **200**.

The `statuses` array follows enum declaration order. The `groups` object is backed by a `HashMap` (`ConfigServiceImpl.java:52`), so its key order is unspecified.

**Table 13.** *The 18 statuses returned by `/config/statuses`, with their display metadata (`ConfigServiceImpl.java:57-110`).*

| key | label | color | group |
| --- | ----- | ----- | ----- |
| `APPLIED` | Applied | `#4E9AF1` | WAITING |
| `RECRUITER_SCREEN` | Recruiter Screen | `#A78BFA` | INTERVIEWING |
| `TECH_SCREEN` | Technical Screen | `#22D3EE` | TECHNICAL |
| `TAKE_HOME` | Take Home Assignment | `#06B6D4` | TECHNICAL |
| `SYSTEM_DESIGN` | System Design | `#0891B2` | TECHNICAL |
| `TECHNICAL_I` | Technical Interview I | `#14B8A6` | TECHNICAL |
| `TECHNICAL_II` | Technical Interview II | `#0D9488` | TECHNICAL |
| `REFERENCE_CHECK` | Reference Check | `#10B981` | INTERVIEWING |
| `OFFER_RECEIVED` | Offer Received | `#22C55E` | OFFER |
| `NEGOTIATING` | Negotiating | `#84CC16` | OFFER |
| `OFFER_ACCEPTED` | Offer Accepted | `#16A34A` | OFFER |
| `OFFER_DECLINED` | Offer Declined | `#F59E0B` | REJECTED |
| `OFFER_RESCINDED` | Offer Rescinded | `#EF4444` | REJECTED |
| `REJECTED` | Rejected | `#EF4444` | REJECTED |
| `WITHDRAWN` | Withdrawn | `#F97316` | WITHDRAWN |
| `ON_HOLD` | On Hold | `#EAB308` | WAITING |
| `WAITING_FOR_RESPONSE` | Waiting for Response | `#60A5FA` | WAITING |
| `GHOSTED` | Ghosted | `#6B7280` | REJECTED |

The rows are listed in enum declaration order (`src/main/java/com/nolcox/jobtracking/domain/entity/ApplicationStatus.java:3-22`). A status with no metadata entry falls back to a formatted label, the color `#9CA3AF`, and the group `OTHER` (`ConfigServiceImpl.java:158-159`).

**Table 14.** *The `groups` map (`ConfigServiceImpl.java:113-123`).*

| Group | Statuses |
| ----- | -------- |
| `WAITING` | `APPLIED`, `WAITING_FOR_RESPONSE`, `ON_HOLD` |
| `INTERVIEWING` | `RECRUITER_SCREEN`, `REFERENCE_CHECK` |
| `TECHNICAL` | `TECH_SCREEN`, `TAKE_HOME`, `SYSTEM_DESIGN`, `TECHNICAL_I`, `TECHNICAL_II` |
| `OFFER` | `OFFER_RECEIVED`, `NEGOTIATING`, `OFFER_ACCEPTED` |
| `REJECTED` | `REJECTED`, `OFFER_DECLINED`, `OFFER_RESCINDED`, `GHOSTED` |
| `WITHDRAWN` | `WITHDRAWN` |

Note that a status's own `group` field and the `groups` map are not fully consistent for `TECHNICAL`: the per-status `group` for the technical stages is `TECHNICAL`, and the `INTERVIEWING` group deliberately holds only `RECRUITER_SCREEN` and `REFERENCE_CHECK`.

Captured, abridged to the first two entries:

```json
{
  "statuses": [
    { "key": "APPLIED", "label": "Applied", "color": "#4E9AF1", "group": "WAITING" },
    { "key": "RECRUITER_SCREEN", "label": "Recruiter Screen", "color": "#A78BFA", "group": "INTERVIEWING" }
  ]
}
```

### `GET /api/v1/config/options`

Handler at `ConfigController.java:87-93`. Returns an `OptionsConfigResponse` (`.../response/OptionsConfigResponse.java:15-17`) with `rtoTypes` and `levels`, each a list of `{ key, label }` in enum declaration order. Always **200**.

**Table 15.** *`rtoTypes` (`ConfigServiceImpl.java:129-135`).*

| key | label |
| --- | ----- |
| `REMOTE` | Remote |
| `HYBRID_2` | Hybrid (2 days/week) |
| `HYBRID_3` | Hybrid (3 days/week) |
| `HYBRID_4` | Hybrid (4 days/week) |
| `ONSITE` | On-site |

**Table 16.** *`levels` (`ConfigServiceImpl.java:140-150`).*

| key | label |
| --- | ----- |
| `JUNIOR` | Junior |
| `MID` | Mid-Level |
| `SENIOR` | Senior |
| `STAFF` | Staff |
| `PRINCIPAL` | Principal |
| `LEAD` | Lead |
| `MANAGER` | Manager |
| `DIRECTOR` | Director |
| `VP` | VP |

`EventType` is not exposed by any config endpoint; its values are listed in Table 11.

---

## 11. OpenAPI and Swagger UI

springdoc serves a generated spec at `/api/api-docs` and an interactive UI at `/api/swagger-ui.html` (`src/main/resources/application.yml:39-43`). Both are public (`SecurityConfig.java:67`).

The document metadata is assembled in `src/main/java/com/nolcox/jobtracking/config/OpenApiConfig.java:16-37`: title `Job Tracking API`, description `REST API for Job Application Tracking System`, contact `John Nolcox`, license Apache 2.0. Operations are tagged `Authentication`, `Job Application`, and `Configuration`.

Two things about the generated spec will mislead a client generator.

> [!NOTE]
> `info.version` is read from the build information Maven generates, so the published specification reports the version that was built. Until 2.0.0 it was the hardcoded string `"1.0"`.
>
> The `bearerAuth` security requirement is added at the document root (`OpenApiConfig.java:29`), not per operation, and no operation overrides it. The published spec therefore marks `POST /v1/auth/register`, `POST /v1/auth/login`, `GET /v1/config/statuses`, and `GET /v1/config/options` as requiring a bearer token even though `SecurityConfig` permits them anonymously. Generated clients will send an `Authorization` header on the very calls that mint the token.

The controllers use only `@Tag`, `@Operation`, and one `@ParameterObject`. There are no `@ApiResponse` or `@Schema` annotations, so response codes and field descriptions in the spec are inferred from Java types alone, and the error responses documented in section 4 do not appear in the spec at all. No `servers` block is declared, so springdoc infers the server URL, including the `/api` context path, from the incoming request.

---

## See also

- [Architecture](./01-architecture.md) for how a request travels from the filter chain to the repository.
- [Security and authentication](./04-security-and-authentication.md) for the JWT signing details, the CORS policy, and the ownership model.
- [Analytics internals](./05-analytics-internals.md) for the status sets and formulas behind the twelve analytics routes.
- [Known gaps](./11-known-gaps.md) for the stage-durations failure, the double-counted quick outcomes, and the `JWT_EXPIRATION` drift.
- [Getting started](../user-guide/01-getting-started.md) if you want a running stack to call these routes against.

*Documentation current as of Job Tracker 2.0.0 (August 2026). Source of truth is the code; report drift as an issue.*
