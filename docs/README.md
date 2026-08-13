# Documentation index

> **Audience:** Job Tracker users, operators, and contributors  ·  **Scope:** What every page in this set covers, which order to read them in, and the conventions a new page has to follow

This is the map of Job Tracker's documentation: a six-page user guide covering everything
you can do in the web interface, and an eleven-page developer and operator guide covering
how the Spring Boot backend and the React frontend are built, configured, tested, and run.
Every page is written against the code in this repository at version 2.0.0. Where an older
statement and the source disagree, the source wins and the discrepancy is recorded rather
than smoothed over, which is why one of the eleven developer pages is a catalog of defects.
Start with a reading path in section 1, or go straight to the page indexes in sections 2
and 3.

## Contents

- [1. Reading paths](#1-reading-paths)
- [2. The user guide](#2-the-user-guide)
- [3. The developer and operator guide](#3-the-developer-and-operator-guide)
- [4. Reference material outside this set](#4-reference-material-outside-this-set)
- [5. Documentation conventions](#5-documentation-conventions)

---

## 1. Reading paths

Three ways in, depending on what you are here to do. Nothing in the user guide assumes you
have read a developer page, and no page assumes you have read a later one.

**Table 1.** *Reading path: using Job Tracker.*

| Order | Page | Why |
| ----- | ---- | --- |
| 1 | [Getting started](./user-guide/01-getting-started.md) | Get an instance running, sign in, and add a first application |
| 2 | [Dashboard and navigation](./user-guide/02-dashboard-and-navigation.md) | Learn the header, the stat cards, the charts, and the applications table |
| 3 | [Tracking applications](./user-guide/03-tracking-applications.md) | The form, the eighteen statuses, the journey history, search and filters |
| 4 | [Analytics and insights](./user-guide/04-analytics-and-insights.md) | What each number means, and what it deliberately does not tell you |
| 5 | [Settings and shortcuts](./user-guide/05-settings-and-shortcuts.md) | Turn views on and off, and learn the keyboard reference |
| 6 | [Troubleshooting](./user-guide/06-troubleshooting.md) | Read it when something breaks, not before |

**Table 2.** *Reading path: running Job Tracker.*

| Order | Page | Why |
| ----- | ---- | --- |
| 1 | [Getting started](./user-guide/01-getting-started.md) | The shortest route from a clone to a running Compose stack, and the security steps to take before anyone else can reach it |
| 2 | [Configuration](./development/08-configuration.md) | Every property in the three Spring configuration files, and which environment variables are actually read |
| 3 | [Deployment and operations](./development/09-deployment-and-operations.md) | The Compose stack service by service, both images, nginx, actuator exposure, and on-disk state |
| 4 | [Security and authentication](./development/04-security-and-authentication.md) | The filter chain, the JWT implementation, and the weaknesses you are accepting |
| 5 | [Known gaps and defects](./development/11-known-gaps.md) | What is broken, unreachable, or drifted, before you put data in it |
| 6 | [Troubleshooting](./user-guide/06-troubleshooting.md) | The same failure modes, described as a user sees them |

**Table 3.** *Reading path: changing Job Tracker.*

| Order | Page | Why |
| ----- | ---- | --- |
| 1 | [Architecture](./development/01-architecture.md) | Deployable pieces, package layout, one write request end to end, and the design decisions behind them |
| 2 | The page for the subsystem you are touching | Domain and persistence, API reference, security, analytics internals, or frontend; see Table 5 |
| 3 | [Testing](./development/07-testing.md) | Both suites, the test profile, fixtures, and the 85 percent JaCoCo gate that CI enforces |
| 4 | [Contributing](./development/10-contributing.md) | Local setup, the full command reference, code conventions, and pull request expectations |
| 5 | [Known gaps and defects](./development/11-known-gaps.md) | Check whether the thing you are about to fix is already recorded, with evidence |

> [!TIP]
> Before you change anything, skim [Known gaps and defects](./development/11-known-gaps.md).
> It lists the confirmed defects, the code no route reaches, and the places where the
> configuration and the code disagree, so you do not spend an afternoon debugging a feature
> that was never wired up.

---

## 2. The user guide

Six pages, ordered so that reading them front to back is a tour of the product. These pages
describe the interface as a user sees it and cite no file paths.

**Table 4.** *The user guide.*

| Page | What it answers |
| ---- | --------------- |
| [01. Getting started](./user-guide/01-getting-started.md) | What do I need, how do I install with Docker Compose or run it locally, how do I sign in, and what must I change before anyone else can reach the stack? |
| [02. Dashboard and navigation](./user-guide/02-dashboard-and-navigation.md) | What is on the dashboard, what do the stat cards and charts show, which views are switched off by default, and how do I move around without the mouse? |
| [03. Tracking applications](./user-guide/03-tracking-applications.md) | How do I add an application, what do the eighteen statuses mean, how do I move one through the pipeline, and how do I find it again? |
| [04. Analytics and insights](./user-guide/04-analytics-and-insights.md) | What question does each number answer, why do two views sometimes disagree, and how much history does each one need before it means anything? |
| [05. Settings and shortcuts](./user-guide/05-settings-and-shortcuts.md) | What can I switch on and off, where are my preferences stored, and which keyboard shortcuts really exist? |
| [06. Troubleshooting](./user-guide/06-troubleshooting.md) | Why can I not sign in, why is a dashboard panel empty or wrong, and why will the Compose stack not start? |

---

## 3. The developer and operator guide

Eleven pages. The first six describe the system and its subsystems, the next three cover how
it is tested, configured, and run, and the last two cover contributing and the defect
catalog. These pages cite source locations as file and line.

**Table 5.** *The developer and operator guide.*

| Page | What it answers |
| ---- | --------------- |
| [01. Architecture](./development/01-architecture.md) | What are the deployable pieces, how do the packages depend on each other, what happens during one authenticated write request, and where do cross-cutting concerns live? |
| [02. Domain and persistence](./development/02-domain-and-persistence.md) | What are the entities and their relationships, how do auditing and optimistic locking work, what do the enums mean, and how is the schema managed? |
| [03. API reference](./development/03-api-reference.md) | What is every HTTP route, its parameters, body, response shape, and status codes, and how are errors and pagination represented? |
| [04. Security and authentication](./development/04-security-and-authentication.md) | How does the filter chain work, how are tokens issued and validated, how is per-user isolation enforced, and what is weak about it today? |
| [05. Analytics internals](./development/05-analytics-internals.md) | What is derived from what, which defects the engine has, what each of the twelve routes computes, and what it costs to run? |
| [06. Frontend](./development/06-frontend.md) | How are the build, routing, authentication state, hooks, dashboard composition, hand-written SVG charts, and the data adapter organized? |
| [07. Testing](./development/07-testing.md) | How is each suite laid out, what database do backend tests run against, how does the coverage gate work, and how do I run a single test? |
| [08. Configuration](./development/08-configuration.md) | What does every property and environment variable do, and which ones are present but have no effect? |
| [09. Deployment and operations](./development/09-deployment-and-operations.md) | What does the Compose stack contain, how are the images built, what state lives on disk, and what does a first run actually look like? |
| [10. Contributing](./development/10-contributing.md) | How do I set up a clone, what are the full backend and frontend commands, what style applies, and what is expected of a pull request? |
| [11. Known gaps and defects](./development/11-known-gaps.md) | What is confirmed broken, what is unreachable or dead, where has the code drifted from configuration and documentation, and where do backend and frontend disagree? |

---

## 4. Reference material outside this set

These files live in the repository root rather than under `docs/`, because tooling and
GitHub's own interface expect them there.

**Table 6.** *Reference material kept outside this set.*

| Document | What it is | When to read it |
| -------- | ---------- | --------------- |
| [README.md](../README.md) | Project readme: overview, feature list, technology stack, architecture summary, quick start, and a plainly stated project status | First, if you have not seen the project before |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | The short contributor guide: prerequisites, cloning, the checks to run before opening a pull request, and how to report a bug | Before your first pull request; the long form is [development/10](./development/10-contributing.md) |
| [SECURITY.md](../SECURITY.md) | The security policy: how to report a vulnerability privately, which versions are supported, what is known by design, and what is worth reporting | Before reporting anything security related, and before deploying |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | The Contributor Covenant, with enforcement responsibilities and guidelines | Before participating in issues, pull requests, or discussions |
| [CHANGELOG.md](../CHANGELOG.md) | Release history in Keep a Changelog format, from 1.0.0 through 1.3.1 plus an `[Unreleased]` section | When you need to know what changed between two versions |

> [!NOTE]
> Changelog entries before 1.3.1 were reconstructed from the git history and the published
> GitHub releases, so they are less granular than entries written at the time. The file says
> so itself.

---

## 5. Documentation conventions

If you add or edit a page in this set, match the following so the whole thing reads as one
document. These are the rules the existing pages follow.

### Mechanics

- **No em dashes anywhere.** Not one, in any file, in any position. Use a comma, a colon, a
  semicolon, parentheses, or two sentences. A spaced hyphen standing in for an em dash
  counts as an em dash and is equally out. Ordinary hyphens inside compound words are fine.
- No emoji. No marketing adjectives.
- American spelling, present tense, active voice.
- Every fenced code block declares a language.
- Never invent a path, class, method, endpoint, configuration key, or line number, and never
  link to a file, heading, or anchor you have not confirmed exists.

### Page shape

- `# Title` in sentence case, then an audience-and-scope line immediately under it, in
  exactly this form: `> **Audience:** ...  ·  **Scope:** ...` with two spaces, a middle dot,
  and two spaces between the halves.
- One short opening paragraph saying what the page covers and why.
- A `## Contents` bullet list linking to the numbered sections, on any page longer than
  roughly 80 lines.
- Numbered level-2 sections in sentence case: `## 1. Architecture`, `## 2. ...`. Level-3
  headings are not numbered.
- A horizontal rule `---` between top-level sections and nowhere else.
- An optional `## See also` at the end: a bullet list of related pages, each with a short
  reason to follow it.
- Long pages end with an italic currency line naming the version and the month.

### Tables and figures

Tables are numbered per page starting at 1, with the caption **above** the table: a bold
label and an italic sentence ending in a period.

```markdown
**Table 1.** *The pipeline statuses and the stage each one belongs to.*

| Status | Stage |
| ------ | ----- |
```

Every diagram and screenshot is a numbered figure with the caption **below** it, in the same
bold-label plus italic-sentence form. Mermaid is allowed and encouraged for architecture and
request flow; keep the diagrams readable and avoid color styling that fails in dark mode.
Reference tables and figures by number in prose ("see Table 2"), never as "the table below".

### Citations

Developer pages cite source locations inline as file and, where it helps, line, for example
`src/main/java/com/nolcox/jobtracking/config/SecurityConfig.java:68` or
`frontend/src/hooks/useDashboardSettings.js:64`. Line numbers must be correct at the commit
you are writing against, so open the file and check before you cite it. User-guide pages
cite no file paths at all; they describe the interface as a user sees it.

### Honesty

- When code exists but nothing reaches it, use the exact phrase **`Status: not wired.`**
  inside a `> [!NOTE]` callout, naming the class and its file. That phrasing is greppable on
  purpose.
- Record defects, drift, and rough edges rather than smoothing them over. State the problem
  and move on; do not editorialize about it. [Known gaps and
  defects](./development/11-known-gaps.md) exists so that these have somewhere to live.
- Where the documentation and the code disagree, the code is right and the discrepancy gets
  written down.

### Callouts

GitHub alert syntax only: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`,
`> [!CAUTION]`. At most three per page. A page that needs a fourth is usually a page that
should state the point in prose instead.

---

## See also

- [Project readme](../README.md) for the overview, the quick start, and the project status
- [Getting started](./user-guide/01-getting-started.md) if you have nothing running yet
- [Architecture](./development/01-architecture.md) if you are about to read the source

*Documentation current as of Job Tracker 2.0.0 (August 2026). Source of truth is the code; report drift as an issue.*
