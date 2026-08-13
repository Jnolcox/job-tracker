# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security reports.**

Report privately through GitHub's [private vulnerability reporting](https://github.com/Jnolcox/job-tracker/security/advisories/new), reachable from the **Security** tab under **Report a vulnerability**. That opens a draft advisory visible only to you and the maintainer.

Please include:

- What the issue is and roughly how severe you think it is
- Steps to reproduce, ideally a minimal case
- The version of Job Tracker, and whether you were running the Docker Compose stack or a local build
- Whether the deployment was reachable from a network beyond localhost
- Whether you replaced the default `JWT_SECRET` and database passwords

Expect an acknowledgement within a few days. This is a small project maintained in spare time, so please allow reasonable time for a fix before disclosing publicly. There is no bug bounty.

## Supported versions

Only the most recent release receives security fixes. There are no long-term support branches and no backports to older tags.

## Known by design, please do not report these

Three properties of the shipped repository look alarming and are already documented. Reporting them costs you time and costs us a close.

- **The default JWT signing secret is committed to the repository.** It appears in `src/main/resources/application.yml`, `src/main/resources/application-docker.yml`, `docker-compose.yml`, and `.env.example`. Treat it as public knowledge. Any deployment that has not replaced it signs tokens with a key anyone can read, which means anyone can mint a valid token for any registered email address. This is a starter default so that the stack runs out of the box, and it is the single most important thing a deployer must change. See "Before you deploy" below.
- **The Compose stack seeds a demo account with a published password.** `DataInitializer` is annotated `@Profile("!test")`, so it runs under both runnable profiles. On first boot it creates `test@example.com` with the password `password123`, seeds five sample applications, and logs the credentials in plaintext at `INFO`. The README documents this and tells you to remove the seed before any real deployment. Nothing in the code enforces that.
- **The shipped Compose stack is meant for local use and has no TLS.** Nginx listens on plain HTTP, no `server.ssl.*` is configured, and MySQL is published on host port 3306 with default credentials. Bearer tokens travel in cleartext in this setup. Put the stack behind a TLS-terminating reverse proxy, or do not expose it beyond your own machine.

Two related behaviors are also known and documented rather than hidden: JWTs cannot be revoked (there is no denylist and no `jti`, so a leaked token stays valid until it expires), and BCrypt truncates input at 72 bytes, so a longer password is equivalent to its first 72 bytes.

## In scope and worth reporting

- Anything that lets one user read or modify another user's applications or application events. Isolation is enforced entirely in application code, through user-scoped queries and explicit ownership assertions, with no database-level backstop. A path that bypasses either mechanism is the highest-value report you can file.
- Token forgery or signature bypass against a deployment that uses a properly generated secret: algorithm confusion, `alg` manipulation, claim smuggling, or accepting a token the signature does not cover.
- Injection of any kind: SQL or JPQL injection through query parameters, filters, or search terms.
- Cross-site scripting in rendered application data. Company names, position titles, notes, and contact fields are user-supplied and rendered in the React frontend, and no Content-Security-Policy is set anywhere in the project.
- Any path that leaks the JWT secret into logs, an HTTP response, an error page, the OpenAPI document, or client-side code.
- Privilege or ownership escalation through request bodies, for example a field that reassigns the owner of a record.

## Before you deploy

Replace the default signing secret. The application Base64-decodes `JWT_SECRET` and derives the HMAC key from the decoded bytes, and the decoded length selects the algorithm: 48 bytes gives HS384, which is what the shipped default produces. Generate a replacement with:

```bash
openssl rand -base64 48
```

Older instructions suggested `openssl rand -hex 32`. That also works and also yields an HS384 key, because its 64 hexadecimal characters are themselves valid Base64 and decode to 48 bytes, but it carries only the 256 bits of randomness that generated the hex string rather than a full 384. Either way, do not shorten the secret: fewer decoded bytes silently downgrades the signing algorithm, and below 32 bytes the library refuses to sign at all.

Then, at minimum:

- Change `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` from the values in `.env.example`, and stop publishing MySQL on the host if you do not need it there.
- Remove `DataInitializer` or otherwise prevent the demo account from being created, and delete it if it already exists.
- Terminate TLS in front of the stack.
- Review `CORS_ALLOWED_ORIGINS` and set it to your real frontend origin. Never set it to `*`.

For the full mechanism behind all of this, see [docs/development/04-security-and-authentication.md](docs/development/04-security-and-authentication.md).
