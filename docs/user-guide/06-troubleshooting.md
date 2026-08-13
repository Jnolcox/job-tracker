# Troubleshooting

> **Audience:** Anyone running Job Tracker who has hit a problem.  ·  **Scope:** The failure modes that actually happen, in the form symptom, cause, fix. Covers signing in, the dashboard, and starting the Docker Compose stack.

Every entry on this page is a real, reproducible behavior of Job Tracker 1.3.1, not a general list of things that might go wrong. Several of them are known defects rather than mistakes on your part, and those are labeled as such.

## Contents

- [1. Signing in and staying signed in](#1-signing-in-and-staying-signed-in)
- [2. The dashboard](#2-the-dashboard)
- [3. Starting the Docker Compose stack](#3-starting-the-docker-compose-stack)
- [4. Things that look wrong but are not](#4-things-that-look-wrong-but-are-not)
- [5. Where to look for detail](#5-where-to-look-for-detail)
- [See also](#see-also)

---

## 1. Signing in and staying signed in

### The login page flickers and reloads, with no error message

**Symptom.** You type your email and password, click Login, and the page reloads back to the empty login form. No error appears. Nothing tells you the password was wrong, and nothing tells you the server is even reachable.

**Cause.** The server rejects the attempt correctly and sends back a proper "Invalid email or password" message. The web interface handles a rejected sign-in the same way it handles an expired session anywhere else in the application: it clears the stored session and navigates the browser to the login page. That navigation throws away the error message before it can be drawn. This is a known defect.

**Fix.** There is no fix from the interface. Treat the reload as the error message: it means the email or the password did not match. Check for a stray space in the email, check caps lock, and try again. If you are certain the credentials are right and it still reloads, the account may not exist on this installation; each installation has its own accounts.

### "Login failed" appears, but you are sure the password is right

**Symptom.** The page does not reload. Instead a red "Login failed" message appears below the form.

**Cause.** This is a different rejection. The server refuses passwords shorter than eight characters as invalid input before it ever checks them, and that kind of rejection does reach the screen. Any password of fewer than eight characters produces this, whether or not it is your real password.

**Fix.** If your account predates the eight-character rule, or you are typing a truncated password, use the full password. If your real password is shorter than eight characters you cannot sign in through this form; register a new account.

> [!NOTE]
> The two behaviors are a useful diagnostic. A silent reload means the credentials were checked and rejected. A visible "Login failed" means they were never checked, because the password was too short.

### You are signed out in the middle of something

**Symptom.** You are working normally and the page suddenly jumps to the login form. Anything you had typed into an open application form is gone.

**Cause.** Your session token expired. The interface has no idea when that will happen: it does not check the expiry, and there is no refresh. It finds out only when the server rejects a request, at which point it clears the session and navigates to the login page immediately. Because it is a full page navigation, unsaved form content is not recoverable.

How long a session lasts depends on how you run Job Tracker:

- **Docker Compose:** 24 hours, fixed. The `JWT_EXPIRATION` setting is documented in `.env.example` and passed through by Compose, but the Docker profile hardcodes the value and ignores it. Setting it changes nothing.
- **Local development:** 30 days by default, and `JWT_EXPIRATION` does take effect.

**Fix.** Sign in again. To reduce how often it happens on a local development install, raise `JWT_EXPIRATION`. On Docker Compose there is no supported way to change it short of editing the profile configuration in the source.

Two other things sign you out the same way: restarting the stack after changing `JWT_SECRET`, which invalidates every existing session, and clearing your browser's data for the site.

### The page is stuck on "Loading..." and never gets further

**Symptom.** A plain "Loading..." line, with no dashboard and no login form, on every reload.

**Cause.** The browser has a corrupted copy of your stored account details. The interface reads it on startup and stops before it renders anything. There is no recovery path built in.

**Fix.** Clear the site's stored data in your browser (in most browsers this is under the padlock or site information icon in the address bar), then reload. You will be signed out and will need to sign in again. Your dashboard arrangement resets to the defaults at the same time; see [Settings and shortcuts](./05-settings-and-shortcuts.md).

---

## 2. The dashboard

### A request to `stage-durations` fails with a server error

**Symptom.** The dashboard looks normal, but your browser's developer tools show one failed request, to `analytics/stage-durations`, returning a server error. The backend log shows a `NullPointerException`. If you call that endpoint yourself, from Swagger UI for example, it returns a 500.

**Cause.** This is a known defect and it fires on a brand new installation, using the demo account, following the readme exactly. The calculation needs a status-change date on every application whose status is not Applied. The five demo applications are written straight into the database without one, and three of them carry a later status, so the calculation fails on the first of them.

Nothing on the dashboard displays this data, so no chart breaks and no error banner appears. The visible effect is limited to the failed request and the log entry.

**Fix.** Applications you create through the interface always carry a status-change date, so the problem is confined to seeded or externally inserted rows. To clear it, either delete the demo applications, or open each of the three that are not at Applied, change the status (which stamps today's date) or fill in the **STATUS CHANGED DATE** field at the bottom of the edit form, and save. See [Known gaps](../development/11-known-gaps.md) for the tracking entry.

### Charts and stat cards do not change after you add or edit an application

**Symptom.** You add an application and the table updates instantly, but Total Applied, every rate and every chart stay exactly as they were.

**Cause.** The analytics are requested once, when the dashboard opens, and never again. Creating, editing and deleting update the table in place without refetching them. This is by design in the sense that it is what the code does, and it is a known rough edge.

**Fix.** Reload the page. Doing a batch of edits and reloading once at the end is less irritating than reloading after each one.

### A chart is empty or shows only zeros

**Symptom.** A chart renders its frame and heading but no data, sometimes with a message like "No company data available".

**Cause.** Usually the underlying field is not filled in. The salary chart needs salary figures, the location chart needs the Location field, the level chart needs the Level field, and Status Transitions needs status changes you made inside Job Tracker. Applications created already at a later status leave no transition record.

Four charts (Pipeline Funnel, Salary Range Distribution, Applications by Day of Week and Applications by Hour) also show no loading indicator at all. During the second or two before the data arrives they render as empty, then fill in. That is not a stuck chart.

**Fix.** Fill in the fields you want analyzed, and reload. [Analytics and insights](./04-analytics-and-insights.md) lists what each view needs before it means anything.

### The table shows fewer applications than you expect

**Symptom.** Applications you know you recorded are not in the table.

**Cause.** Two separate limits, and neither warns you.

- The table's filter defaults to **Active**, which hides rejected, declined, rescinded and ghosted applications.
- Only the first 100 applications are loaded, and there is no paging. Past 100, the table and the header count are truncated while the server-computed rate cards still cover everything.

**Fix.** For the first, click the **All** chip above the table. For the second there is no fix in the interface. The footer under the table reads `{shown} of {loaded} applications`, so a loaded count stuck at exactly 100 is the tell.

---

## 3. Starting the Docker Compose stack

### Compose fails because a port is already in use

**Symptom.** `docker compose up` stops with an error saying a port is already allocated or the address is already in use, and one of the three containers never starts.

**Cause.** The stack claims three fixed ports on your machine: 3000 for the web interface, 8080 for the backend, 3306 for the database. Any of them can already be taken. Port 3306 is the usual culprit, because a MySQL server installed directly on the machine holds it. Port 3000 is the second most common, from another development server.

**Fix.** Either stop whatever holds the port, or change the mapping. In `docker-compose.yml`, each service has a `ports` entry of the form `"host:container"`. Change only the number on the left. For example, `"3307:3306"` moves the database to port 3307 on your machine while leaving everything inside the stack unchanged. The three services talk to each other over an internal network and are not affected.

If you move the web interface off port 3000, update `CORS_ALLOWED_ORIGINS` in your `.env` to the new address as well.

> [!TIP]
> Nothing outside the stack needs port 3306. If you have no reason to connect to the database with a client, you can delete the `ports` block from the `mysql` service entirely. That removes the conflict and closes the database to the rest of your network at the same time.

### A second copy of the stack refuses to start

**Symptom.** You already have Job Tracker running and try to start a second copy, perhaps from another checkout or under a different Compose project name. It fails immediately with a name conflict rather than starting alongside the first.

**Cause.** All three services declare fixed container names: `jobtracking-mysql`, `jobtracking-backend` and `jobtracking-frontend`. Container names are unique across the whole Docker daemon, so a project name does not separate them. This is a known limitation.

**Fix.** Run one copy at a time. Stop the first with `docker compose down` before starting the second. If you genuinely need two side by side, edit `container_name` in the second copy's `docker-compose.yml` to something distinct, and change its host ports as described above.

### The interface loads but every action fails on a cold start

**Symptom.** `http://localhost:3000` loads and looks right, but signing in fails, or the dashboard opens and everything is empty. A minute or two later the same actions work.

**Cause.** The three containers do not become ready together. The database initializes first and can take half a minute on a fresh volume, because it has to create the schema. The backend waits for the database to report healthy, then starts Spring Boot and prepares its own tables. The web interface waits for neither: it starts serving pages as soon as its container is created, which is well before the backend is answering.

On the very first `docker compose up --build` this is compounded by the build itself, which compiles the backend and builds the web interface from scratch.

**Fix.** Wait and reload. Watch the containers become healthy with:

```bash
docker compose ps
```

The backend is ready when its health check passes. You can confirm it directly:

```bash
curl http://localhost:8080/api/actuator/health
```

A response of `{"status":"UP"}` means the backend is up and the database behind it is reachable.

### The backend cannot connect to the database after you changed a password

**Symptom.** The stack was working. You edited `.env`, restarted, and now the backend restarts in a loop with database authentication errors in its log.

**Cause.** MySQL creates its user accounts once, when its data directory is first initialized. After that it keeps the credentials it was created with, and changing `MYSQL_USER` or `MYSQL_PASSWORD` in `.env` only changes what the backend tries to use. The two no longer match.

**Fix.** Either put the original values back in `.env`, or delete the database and start over:

```bash
docker compose down -v
docker compose up --build
```

> [!WARNING]
> `docker compose down -v` deletes the database volume, which permanently erases every account and every application you have recorded. Nothing in the project takes a backup for you. Set your database passwords before you start using the installation for real, not after.

---

## 4. Things that look wrong but are not

Table 1 collects the behaviors that get reported most often as bugs and are actually the application working as written. Each has a fuller explanation elsewhere in this guide.

**Table 1.** *Behavior that is expected, and where it is explained.*

| What you see | Why | Explained in |
| --- | --- | --- |
| Your interview rate is far lower than the number of interviews you have done | Almost every rate reads each application's current status only, so an application you interviewed for and were then rejected from counts only as a rejection | [Analytics and insights](./04-analytics-and-insights.md) |
| The Status Transitions grid shows interview stages that your interview rate ignores | That one view reads recorded history, unlike the rest | [Analytics and insights](./04-analytics-and-insights.md) |
| Cmd+N or Ctrl+N opens a new application instead of a browser window | The modifier is not checked, so the combination triggers the plain `n` shortcut and the browser's own action is blocked | [Settings and shortcuts](./05-settings-and-shortcuts.md) |
| Backspace deleted a row | Backspace is a live delete shortcut, though the in-app help does not list it | [Settings and shortcuts](./05-settings-and-shortcuts.md) |
| Your dashboard arrangement is gone on another machine | Preferences live in the browser, not on the server or against your account | [Settings and shortcuts](./05-settings-and-shortcuts.md) |
| The same company appears twice in Company Insights | Company names are matched as exact text, so a trailing space or different capitalization creates a second company | [Analytics and insights](./04-analytics-and-insights.md) |
| Saving a form with an empty company or role succeeds or fails oddly | The form does no validation of its own; the server is the only thing checking | [Tracking applications](./03-tracking-applications.md) |
| The salary column shows `$0k` for one end of a range | A missing figure renders as zero rather than being left blank | [Tracking applications](./03-tracking-applications.md) |
| The Activity Heatmap only ever shows this year | There is no year picker in the interface | [Analytics and insights](./04-analytics-and-insights.md) |

---

## 5. Where to look for detail

When something is not on this page, three places carry the evidence.

**The container logs.** For a stack started with Compose:

```bash
docker compose logs backend
docker compose logs mysql
docker compose logs frontend
```

Add `-f` to follow them live. The backend logs at debug level by default, so it is verbose but complete.

**Your browser's developer tools.** The Network tab shows which requests failed and what the server sent back; the Console tab shows errors from the page itself. A failing chart with an empty panel almost always has a visible failed request behind it.

**The interactive API browser.** With the stack running, `http://localhost:8080/api/swagger-ui.html` lets you call any endpoint directly and see the exact response. It is the fastest way to separate "the server is wrong" from "the page is not showing what the server sent".

If none of that explains it, check [Known gaps](../development/11-known-gaps.md) before opening an issue. The defects described on this page are already recorded there.

---

## See also

- [Getting started](./01-getting-started.md), for installation and the security steps to take before leaving the stack running.
- [Analytics and insights](./04-analytics-and-insights.md), for why the numbers read the way they do.
- [Settings and shortcuts](./05-settings-and-shortcuts.md), for preferences, resetting, and the real keyboard reference.
- [Known gaps](../development/11-known-gaps.md), for the tracked list of defects.
- [Deployment and operations](../development/09-deployment-and-operations.md), for running the stack beyond a single machine.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
