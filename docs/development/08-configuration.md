# Configuration

> **Audience:** Developers and operators changing how Job Tracker runs.  ·  **Scope:** Every property in the three Spring configuration files, every environment variable the code actually reads, and the settings that are present but have no effect.

Job Tracker has three configuration files and seven documented environment variables. Not all of them do something. This page lists every property side by side per profile, then every variable with its default, its type and its failure mode, then names the knobs that are inert so you do not spend an afternoon turning one.

## Contents

- [1. Where configuration lives](#1-where-configuration-lives)
- [2. Every property, profile by profile](#2-every-property-profile-by-profile)
- [3. Environment variables the backend reads](#3-environment-variables-the-backend-reads)
- [4. Environment variables Compose reads](#4-environment-variables-compose-reads)
- [5. Settings that have no effect](#5-settings-that-have-no-effect)
- [6. JWT_SECRET in detail](#6-jwt_secret-in-detail)
- [7. CORS, and why it is never exercised](#7-cors-and-why-it-is-never-exercised)
- [See also](#see-also)

---

## 1. Where configuration lives

There are exactly three files. There is no `application-prod.yml`, no `application-dev.yml` and no `application.properties`.

**Table 1.** *The three configuration files and when each one loads.*

| # | File | Profile | Loaded when |
| - | ---- | ------- | ----------- |
| 1 | `src/main/resources/application.yml` | default, always active | Every run, including tests and the `docker` profile |
| 2 | `src/main/resources/application-docker.yml` | `docker` | The backend image's entrypoint passes `--spring.profiles.active=docker` (`Dockerfile:44`) |
| 3 | `src/test/resources/application-test.yml` | `test` | Test classes annotated `@ActiveProfiles("test")` |

Two consequences are easy to miss.

First, `application.yml` is on the test classpath. Maven puts both `target/classes` and `target/test-classes` on it, so the `test` profile inherits every key that `application-test.yml` does not explicitly override. That inheritance is not always benign: `application-test.yml:9` sets `spring.jpa.database-platform: org.hibernate.dialect.H2Dialect`, but the inherited `spring.jpa.properties.hibernate.dialect: org.hibernate.dialect.MySQLDialect` (`src/main/resources/application.yml:27`) takes precedence, so the test suite runs Hibernate's MySQL dialect against H2. See [11. Known gaps](./11-known-gaps.md) and [7. Testing](./07-testing.md).

Second, the backend image bakes the profile into its entrypoint. Setting `SPRING_PROFILES_ACTIVE` on the container does nothing, because command-line arguments outrank environment variables in Spring Boot's property order.

Every URL is prefixed with the servlet context path `/api` (`src/main/resources/application.yml:4`), including actuator and springdoc. Health is `/api/actuator/health`, not `/actuator/health`. Both healthchecks use the prefixed form (`Dockerfile:41`, `docker-compose.yml:45`).

---

## 2. Every property, profile by profile

`-` means the key is absent from that file. "inherited" means the key is absent from `application-test.yml` but present in `application.yml`, which is on the test classpath, so the value applies.

**Table 2.** *Every property set in any of the three configuration files, with the value each profile sees.*

| # | Property | `application.yml` | `application-docker.yml` | `test` profile |
| - | -------- | ----------------- | ------------------------ | -------------- |
| 1 | `server.port` | `8080` (`:2`) | `8080` (`:2`) | inherited `8080`; integration tests override with `RANDOM_PORT` |
| 2 | `server.servlet.context-path` | `/api` (`:4`) | `/api` (`:4`) | inherited `/api` |
| 3 | `spring.application.name` | `job-tracking-system` (`:8`) | `job-tracking-system` (`:8`) | inherited |
| 4 | `spring.jackson.serialization.write-dates-as-timestamps` | `false` (`:12`) | `false` (`:12`) | inherited. Applied since 1.3.2 |
| 5 | `spring.jackson.deserialization.fail-on-unknown-properties` | `false` (`:14`) | `false` (`:14`) | inherited. Applied since 1.3.2 |
| 6 | `spring.datasource.url` | `jdbc:mysql://localhost:3306/job_tracking_db`, no placeholder (`:17`) | `${SPRING_DATASOURCE_URL:jdbc:mysql://mysql:3306/job_tracking_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}` (`:17`) | `jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE` (`:3`) |
| 7 | `spring.datasource.username` | `jobtracker` (`:18`) | `${SPRING_DATASOURCE_USERNAME:jobtracker}` (`:18`) | `sa` (`:5`) |
| 8 | `spring.datasource.password` | `jobtracker123` (`:19`) | `${SPRING_DATASOURCE_PASSWORD:jobtracker123}` (`:19`) | empty (`:6`) |
| 9 | `spring.datasource.driver-class-name` | `com.mysql.cj.jdbc.Driver` (`:20`) | `com.mysql.cj.jdbc.Driver` (`:20`) | `org.h2.Driver` (`:4`) |
| 10 | `spring.datasource.hikari.connection-timeout` | - | `30000` (`:22`) | - |
| 11 | `spring.datasource.hikari.maximum-pool-size` | - | `10` (`:23`) | - |
| 12 | `spring.datasource.hikari.minimum-idle` | - | `5` (`:24`) | - |
| 13 | `spring.jpa.hibernate.ddl-auto` | `update` (`:23`) | `update` (`:28`) | `none` (`:11`) |
| 14 | `spring.jpa.show-sql` | `false` (`:24`) | `false` (`:29`) | `false` (`:12`) |
| 15 | `spring.jpa.properties.hibernate.dialect` | `org.hibernate.dialect.MySQLDialect` (`:27`) | `org.hibernate.dialect.MySQLDialect` (`:32`) | inherited, and it wins over row 18 |
| 16 | `spring.jpa.properties.hibernate.format_sql` | `true` (`:28`) | `true` (`:33`) | inherited. **No effect while `show-sql` is `false`** |
| 17 | `spring.jpa.open-in-view` | `false` (`:29`) | `false` (`:34`) | inherited `false` |
| 18 | `spring.jpa.database-platform` | - | - | `org.hibernate.dialect.H2Dialect` (`:9`). **Loses to row 15** |
| 19 | `spring.jpa.defer-datasource-initialization` | - | - | `true` (`:13`) |
| 20 | `spring.sql.init.mode` | - | - | `always` (`:16`) |
| 21 | `spring.sql.init.schema-locations` | - | - | `classpath:schema.sql` (`:17`) |
| 22 | `spring.h2.console.enabled` | - | - | `false` (`:21`) |
| 23 | `app.jwt.secret` | `${JWT_SECRET:404E63...5970}` (`:33`) | `${JWT_SECRET:404E63...5970}`, same literal fallback (`:38`) | `testSecretKeyForJWTTokenGenerationWhichShouldBeAtLeast256Bits` (`:25`) |
| 24 | `app.jwt.expiration` | `${JWT_EXPIRATION:2592000000}`, 30 days | `${JWT_EXPIRATION:86400000}`, 24 hour default | `86400000` (`:26`) |
| 25 | `app.demo-data.enabled` | `${DEMO_DATA_ENABLED:false}` | `${DEMO_DATA_ENABLED:true}` | not read; `DataInitializer` is excluded from the `test` profile |
| 26 | `app.cors.allowed-origins` | `${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:4200}` (`:37`) | `${CORS_ALLOWED_ORIGINS:http://localhost}` (`:42`) | inherited from `application.yml` |
| 27 | `springdoc.api-docs.path` | `/api-docs` (`:41`) | `/api-docs` (`:46`) | inherited |
| 28 | `springdoc.swagger-ui.path` | `/swagger-ui.html` (`:43`) | `/swagger-ui.html` (`:48`) | inherited |
| 29 | `management.endpoints.web.exposure.include` | not set, so `health` only | `health,info` (`:54`) | not set, so `health` only |
| 30 | `management.endpoint.health.show-details` | not set, so `never` | `when-authorized` (`:57`) | not set, so `never` |
| 31 | `logging.level.root` | not set, Boot default `INFO` | `INFO` (`:61`) | not set |
| 32 | `logging.level.com.nolcox.jobtracking` | `DEBUG` (`:47`) | `INFO` (`:62`) | `DEBUG` (`:30`) |
| 33 | `logging.level.org.springframework.security` | `DEBUG` (`:48`) | `WARN` (`:63`) | `DEBUG` (`:31`) |

Line references in the profile columns are relative to that column's file.

Three things worth calling out from Table 2.

The default profile's datasource has no `${...}` placeholder (row 6). It is still overridable, because Spring Boot's relaxed binding maps the operating system variable `SPRING_DATASOURCE_URL` onto the property `spring.datasource.url`, and environment variables outrank config files. The override works in spite of the file, not because of it.

The docker profile's Hikari block (rows 10 to 12) sets `connection-timeout` and `maximum-pool-size` to the values HikariCP already uses by default. Only `minimum-idle: 5` changes behavior. HikariCP is the connection pool in every profile, because it ships with `spring-boot-starter-data-jpa`; the docker profile tunes it rather than adding it.

There is no file appender and no logback configuration. All logs go to stdout. Restart a container and its logs are whatever the Docker log driver retained.

---

## 3. Environment variables the backend reads

**Table 3.** *Environment variables consumed by the backend JVM, with defaults and failure modes.*

| # | Variable | Type | Default | Read by which profile | What breaks if it is wrong |
| - | -------- | ---- | ------- | --------------------- | -------------------------- |
| 1 | `JWT_SECRET` | String, decoded as Base64 | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | default and `docker` (`application.yml:33`, `application-docker.yml:38`) | Failure is lazy, not at startup. The container reports healthy and then every authenticated request fails. See section 6. |
| 2 | `JWT_EXPIRATION` | long, milliseconds | `2592000000`, 30 days | **default profile only** (`application.yml:34`) | A non-numeric value fails context startup during `@Value` binding. Zero or a negative value issues already-expired tokens, so login succeeds and every subsequent request returns 401. **Ignored entirely under the `docker` profile.** |
| 3 | `CORS_ALLOWED_ORIGINS` | comma-separated String | `http://localhost:3000,http://localhost:4200` (default profile), `http://localhost` (`docker` profile) | both (`application.yml:37`, `application-docker.yml:42`) | Only matters for genuinely cross-origin browsers, which the shipped topology does not produce. See section 7. |
| 4 | `SPRING_DATASOURCE_URL` | JDBC URL | `jdbc:mysql://mysql:3306/job_tracking_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | `docker` via placeholder (`application-docker.yml:17`); other profiles via relaxed binding | A wrong host or database name fails connection acquisition at startup, `EntityManagerFactory` creation fails, and the application exits. Under Compose, `restart: unless-stopped` then restarts it in a loop. |
| 5 | `SPRING_DATASOURCE_USERNAME` | String | `jobtracker` | `docker` (`application-docker.yml:18`) | Access denied at startup, same failure mode as row 4. |
| 6 | `SPRING_DATASOURCE_PASSWORD` | String | `jobtracker123` | `docker` (`application-docker.yml:19`) | Same as row 5. |
| 7 | `SPRING_PROFILES_ACTIVE` | comma-separated profile list | none | Spring Boot built-in; set at `docker-compose.yml:32` | **Inert in the backend image.** `Dockerfile:44` passes `--spring.profiles.active=docker` on the command line, which outranks the environment variable. Changing this variable does not change the active profile. |

Any other `SPRING_*`, `SERVER_*` or `MANAGEMENT_*` variable also binds through Spring Boot's relaxed binding, even though no file in this repository mentions it. Only the seven above are referenced anywhere in the project.

> [!WARNING]
> `JWT_EXPIRATION` does nothing under Docker. `docker-compose.yml:37` forwards it to the container and `.env.example:11` documents it, but `application-docker.yml:39` hardcodes `expiration: 86400000` with no `${JWT_EXPIRATION:...}` placeholder. Token lifetime under Compose is fixed at 24 hours no matter what you put in `.env`. The default profile does honor the variable.

---

## 4. Environment variables Compose reads

`docker-compose.yml` has no `env_file:` directive, so `.env` is used purely for `${VAR:-default}` substitution inside the Compose file itself. A value in `.env` reaches a container only if a service's `environment:` block forwards it.

**Table 4.** *Variables `.env.example` declares, where Compose uses them, and whether they reach a container.*

| # | Variable | Compose default | Used at | Reaches a container |
| - | -------- | --------------- | ------- | ------------------- |
| 1 | `MYSQL_ROOT_PASSWORD` | `rootpassword` | `docker-compose.yml:7`, and interpolated into the healthcheck argv at `:17` | mysql only |
| 2 | `MYSQL_DATABASE` | `job_tracking_db` | `docker-compose.yml:8`, and into the backend JDBC URL at `:33` | mysql, and shapes the backend URL |
| 3 | `MYSQL_USER` | `jobtracker` | `docker-compose.yml:9`, `:34` | mysql and backend |
| 4 | `MYSQL_PASSWORD` | `jobtracker123` | `docker-compose.yml:10`, `:35` | mysql and backend |
| 5 | `JWT_SECRET` | the 64-character literal | `docker-compose.yml:36` | backend |
| 6 | `JWT_EXPIRATION` | `2592000000` | `docker-compose.yml:37` | backend, where the `docker` profile ignores it |
| 7 | `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `docker-compose.yml:38` | backend |

`.env.example` lists exactly these seven (`.env.example:1-14`), and every one of them is referenced by Compose. `.env` itself is gitignored (`.gitignore:7-9`), with `.env.example` explicitly kept. Because every Compose reference carries a `:-` fallback, `docker compose up` works with no `.env` at all, using the committed default JWT secret and the default database passwords.

The root password is interpolated into the MySQL healthcheck command (`docker-compose.yml:17`), so it appears in `docker inspect` output and in the process list inside that container.

---

## 5. Settings that have no effect

These are set, look meaningful, and change nothing. They are collected here so you do not debug through them.

**Table 5.** *Configuration that is present but inert, with the reason.*

| # | Setting | Where | Why it does nothing |
| - | ------- | ----- | ------------------- |
| 1 | `SPRING_PROFILES_ACTIVE: docker` | `docker-compose.yml:32` | Overridden by the entrypoint argument at `Dockerfile:44`. Harmless because both say `docker`, but changing it has no effect |
| 2 | `spring.jpa.properties.hibernate.format_sql: true` | `application.yml:28`, `application-docker.yml:33` | `show-sql` is `false` in every profile and no SQL logger is at DEBUG, so no SQL is printed to format |
| 3 | `management.endpoint.health.show-details: when-authorized` | `application-docker.yml:57` | `/actuator/**` is `permitAll` (`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:69`), so callers are anonymous and details are never shown. Equivalent to `never` as deployed |
| 4 | `spring.h2.console.enabled: false` plus `permitAll` on `/h2-console/**` | `application-test.yml:21`, `SecurityConfig.java:68` | The console is disabled in the only profile that uses H2, and H2 is not the datasource anywhere else. The security rule is dead |
| 5 | `.dockerignore` negations `!.mvn` and `!mvnw` | `.dockerignore:50-51` | The comment says "we copy it explicitly", but nothing in `Dockerfile` copies the Maven wrapper. The build uses the builder image's own `mvn` (`Dockerfile:8`, `:12`) |

The Jackson properties were the sharpest of these until 1.3.2, because they were visible in every API response. `DatabaseConfig` declared a `@Primary ObjectMapper`, which made Spring Boot's `JacksonAutoConfiguration` back off and silently inverted both settings: timestamps serialized as epoch-second decimals and unknown request properties were rejected. It now registers a `Jackson2ObjectMapperBuilderCustomizer` instead, which customizes the auto-configured mapper rather than replacing it:

```java
@Bean
public Jackson2ObjectMapperBuilderCustomizer monetaryScaleCustomizer() {
    return builder -> builder.serializerByType(BigDecimal.class, /* setScale(2, HALF_UP) */);
}
```

Both properties now apply as written: timestamps render as ISO-8601 and an unrecognized field in a request body is ignored.

The class is named `DatabaseConfig` but contains only Jackson configuration.

---

## 6. JWT_SECRET in detail

This is the sharpest configuration edge in the project, so it gets its own section.

`JwtService.getSigningKey` decodes the configured secret as Base64 and hands the bytes to jjwt (`src/main/java/com/nolcox/jobtracking/infrastructure/security/JwtService.java`):

```java
byte[] keyBytes = Decoders.BASE64.decode(secretKey);
return Keys.hmacShaKeyFor(keyBytes);
```

What follows from those two lines:

- The secret is interpreted as **Base64**, not as raw bytes and not as hex.
- `Keys.hmacShaKeyFor` selects the HMAC variant by key length. The algorithm is never pinned. The committed default secret is 64 Base64 characters, which decode to exactly 48 bytes, so the shipped configuration signs with **HS384**, not HS256.
- Changing the secret's length silently changes the signing algorithm. A shorter secret weakens it. Fewer than 32 decoded bytes makes jjwt refuse to sign at all, throwing `WeakKeyException`.
- A secret containing characters outside the Base64 alphabet throws `DecodingException` on first use.
- Both of those failures happen on the first token operation, **not at startup**. `/api/actuator/health` still reports `UP`, so an orchestrator considers a broken deployment healthy while every login returns 500.
- Changing `JWT_SECRET` invalidates every outstanding token. There is no key rotation support, no `kid` header and no multi-key verification.

If you generate a secret with `openssl rand -hex 32`, you get 64 hexadecimal characters, which happen to be valid Base64 characters too, so it works. It is decoded as Base64 into 48 bytes, meaning 256 bits of real randomness inflated into a 384-bit key. `openssl rand -base64 48` expresses the intent honestly and gives the full 48 bytes of entropy.

The test profile's secret (`src/test/resources/application-test.yml:25`) is 61 characters, which is not valid strict Base64. jjwt's lenient decoder accepts it, which is why the suite passes.

See [4. Security and authentication](./04-security-and-authentication.md) for how the token is used once it is signed.

---

## 7. CORS, and why it is never exercised

Four separate places declare a default for the allowed origins, and they do not agree:

1. `src/main/resources/application.yml:37`: `http://localhost:3000,http://localhost:4200`. The `:4200` entry is an Angular dev-server port; this project's frontend is Create React App on 3000.
2. `src/main/resources/application-docker.yml:42`: `http://localhost`, which is port 80 and does not match the port the UI is published on.
3. `src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:44`: an inline `@Value` fallback of `http://localhost:3000,http://localhost:4200`.
4. `docker-compose.yml:38`: `http://localhost:3000`, which does match the published UI port.

None of this breaks the shipped stack, because nothing in either supported topology is cross-origin. In production the browser loads the UI from `http://localhost:3000` and calls `/api/v1/...` on that same origin, where nginx proxies it to `backend:8080` (`frontend/nginx.conf:45-46`). The Axios client uses a relative base URL, `const API_BASE_URL = '/api/v1';` (`frontend/src/services/api.js:5`), and there is no build-time or runtime API host setting anywhere in the frontend. In development, Create React App's dev server proxies instead (`frontend/package.json:47`). Both are same-origin from the browser's point of view.

CORS therefore only matters if someone points a browser application at the backend's published port 8080 directly. In that case the docker-profile fallback `http://localhost` is wrong for a UI served on port 3000.

> [!CAUTION]
> `SecurityConfig.java:87` calls `setAllowedOriginPatterns` (not `setAllowedOrigins`) and `:92` sets `setAllowCredentials(true)`. Origin *patterns* accept wildcards, so `CORS_ALLOWED_ORIGINS=*` is accepted here where `setAllowedOrigins("*")` with credentials would be rejected by Spring. Setting it to `*` silently enables credentialed CORS from any origin. Separately, the value is split on `,` with no trimming (`:87`), so `http://a, http://b` yields a pattern with a leading space that never matches anything.

---

## See also

- [9. Deployment and operations](./09-deployment-and-operations.md) for how these values are wired into the Compose stack.
- [4. Security and authentication](./04-security-and-authentication.md) for the filter chain, the public path list and token handling.
- [7. Testing](./07-testing.md) for the `test` profile and the H2 schema.
- [11. Known gaps](./11-known-gaps.md) for the running list of inert settings and drift.
- [1. Getting started](../user-guide/01-getting-started.md) if you just want the application running.

---

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
