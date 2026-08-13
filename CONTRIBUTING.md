# Contributing to Job Tracker

> **Audience:** anyone opening an issue or a pull request  ·  **Scope:** the minimum needed to get a clone running and a change merged

Issues and pull requests are welcome. This page is the short version. The long-form guide,
covering the full command reference, code conventions and how the coverage gate works, is
[docs/development/10-contributing.md](docs/development/10-contributing.md).

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Set up a clone](#2-set-up-a-clone)
- [3. Before you open a pull request](#3-before-you-open-a-pull-request)
- [4. Coverage](#4-coverage)
- [5. Commits and branches](#5-commits-and-branches)
- [6. Reporting bugs](#6-reporting-bugs)
- [7. Security](#7-security)
- [8. License and conduct](#8-license-and-conduct)

---

## 1. Prerequisites

Java 17 (Temurin is what CI uses), Maven, Node.js 22, and either Docker with Compose v2 or
a running MySQL 8. There is no Maven wrapper in this repository, so `mvn` must be on your
`PATH`. Newer JDKs build and test fine, but JaCoCo 0.8.12 cannot instrument classes from
JDKs much newer than 21, so a local run on a recent JDK prints harmless instrumentation
errors and may understate coverage. Build on Java 17 to match CI.

---

## 2. Set up a clone

**With Docker Compose**, which brings up MySQL, the backend and the frontend together:

```bash
git clone https://github.com/Jnolcox/job-tracker.git
cd job-tracker
cp .env.example .env
docker compose up --build
```

**Locally**, with MySQL already running and a `job_tracking_db` database created (see the
readme for the exact SQL). Hibernate creates the schema on startup:

```bash
mvn spring-boot:run          # backend on :8080
cd frontend && npm install && npm start   # frontend on :3000
```

Either way, log in with the seeded demo account, `test@example.com` / `password123`.

---

## 3. Before you open a pull request

Run both suites. These are exactly what CI runs:

```bash
mvn verify
```

```bash
cd frontend && CI=true npm test -- --watchAll=false && npm run build
```

The build step is not optional. Two failure modes have already broken this build once each:

- **`npm ci` fails when `package-lock.json` is out of sync with `package.json`.** It does
  not repair the mismatch the way `npm install` does. Commit the regenerated lockfile with
  any dependency change, and verify with a clean `npm ci`.
- **`npm run build` fails on any ESLint warning when `CI` is set.** GitHub Actions sets
  `CI` for every step, and `react-scripts` promotes warnings to errors there. An unused
  import or a missing hook dependency fails CI even though there is no lint step in the
  workflow.

---

## 4. Coverage

`mvn verify` enforces an 85 percent line-coverage gate on the whole backend bundle via
JaCoCo. `mvn test` runs the suite but not the gate, so use `verify` before pushing. The
report lands in `target/site/jacoco/index.html`. New backend logic needs a unit test; new
HTTP contracts and persisted fields need an integration test. The frontend has no coverage
threshold, but new components are still expected to come with tests, including an
accessibility assertion using `jest-axe` to match the existing suite.

---

## 5. Commits and branches

Branch from `develop` and target `develop`. CI runs only on pushes to `develop` and pull
requests targeting it, so a pull request opened against any other branch gets no CI at all.

The existing history has no formal convention: none of its commits use a Conventional
Commits prefix. Going forward, keep each commit to one logical change that does not break
the build on its own, and write a subject line in the imperative mood, roughly 72
characters or fewer, with no trailing period. Add a body explaining why when the change
needs one. Add an entry under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for
anything a user or operator would notice.

A good pull request has a scope a reviewer can hold in their head, a description of what
changed and how you verified it, tests for the new behavior, and both CI jobs green.

---

## 6. Reporting bugs

Open a GitHub issue at <https://github.com/Jnolcox/job-tracker/issues>. Include the version
or commit, how you are running it (Compose or local), the steps to reproduce, what you
expected, what happened, and any relevant backend log output or browser console errors. If
the problem is in the API, the request and the full response body help. Check
[docs/development/11-known-gaps.md](docs/development/11-known-gaps.md) first; some rough
edges are already recorded there.

---

## 7. Security

Do not report a security issue in a public issue or pull request. Follow the process in
[SECURITY.md](SECURITY.md).

---

## 8. License and conduct

By contributing, you agree that your contributions are licensed under the MIT License, the
same terms that cover the project. See [LICENSE](LICENSE). All project spaces are governed
by the [Code of Conduct](CODE_OF_CONDUCT.md).
