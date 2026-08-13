# Getting started

> **Audience:** Anyone installing Job Tracker for the first time.  ·  **Scope:** Prerequisites, the Docker Compose install, the local development install, signing in, the security steps to take before anyone else can reach the stack, and what to do first.

Job Tracker is a self-hosted application for recording job applications and watching what happens to them. You run it yourself: there is no hosted version and no account to sign up for. This page takes you from an empty directory to a working dashboard, and tells you what to change before the installation is safe to leave running.

## Contents

- [1. What you need](#1-what-you-need)
- [2. Install with Docker Compose](#2-install-with-docker-compose)
- [3. Install for local development](#3-install-for-local-development)
- [4. Sign in](#4-sign-in)
- [5. Secure the installation](#5-secure-the-installation)
- [6. What to do first](#6-what-to-do-first)
- [See also](#see-also)

---

## 1. What you need

For the Docker Compose install:

- Docker with Compose v2 (the `docker compose` subcommand, not the older `docker-compose` script). The Compose file has no `version:` key, which Compose v1 cannot read.
- Three free ports on your machine: 3000, 8080 and 3306.
- Enough patience for the first build. It compiles the backend with Maven and builds the frontend with Node, both from scratch.

For the local development install:

- Java 17 or later.
- Maven 3.6 or later.
- Node.js. The project readme asks for 18 or later; the Docker image and the CI pipeline both use Node 22, so 22 is the version actually exercised.
- A running MySQL 8 server.

---

## 2. Install with Docker Compose

This brings up the database, the backend and the web interface together.

```bash
git clone https://github.com/Jnolcox/job-tracker.git
cd job-tracker
cp .env.example .env
docker compose up --build
```

The `.env` file is optional in the sense that the stack starts without it, falling back to built-in default passwords and a default signing key. That is exactly why you should copy it and change the values. See [section 5](#5-secure-the-installation) before you leave the stack running.

Startup order is handled for you: the backend waits until the database reports healthy before it starts, and the web interface starts immediately. For roughly the first minute of a cold start the interface loads but every action fails, because the backend is still coming up. Wait for the backend container to report healthy and reload the page.

Once everything is up, these addresses work:

**Table 1.** *Addresses served by the Docker Compose stack.*

| What | Address |
| --- | --- |
| Web interface | `http://localhost:3000` |
| Backend API | `http://localhost:8080/api` |
| Interactive API browser (Swagger UI) | `http://localhost:8080/api/swagger-ui.html` |
| API specification | `http://localhost:8080/api/api-docs` |
| Backend health check | `http://localhost:8080/api/actuator/health` |
| Database | `localhost:3306` |

To stop the stack, press Ctrl+C and run `docker compose down`. To stop it and also delete the database, run `docker compose down -v`. That second command permanently erases every account and every application you have recorded. Nothing in the project takes a backup for you.

One limitation to know about: the container names are fixed, so you cannot run two copies of the stack on the same machine at once. A second `docker compose up` fails with a name conflict rather than starting alongside the first.

---

## 3. Install for local development

Use this path if you want to change the code. Create the database and the user the backend expects:

```sql
CREATE DATABASE job_tracking_db;
CREATE USER 'jobtracker'@'localhost' IDENTIFIED BY 'jobtracker123';
GRANT ALL PRIVILEGES ON job_tracking_db.* TO 'jobtracker'@'localhost';
```

The backend creates its own tables on startup, so you do not need to load a schema by hand.

Start the backend:

```bash
mvn spring-boot:run
```

Start the web interface in a second terminal:

```bash
cd frontend
npm install
npm start
```

The development server runs on `http://localhost:3000` and forwards API calls to the backend on port 8080, so you open the same address as in the Docker install. In this mode the login page also shows a "Test Credentials" box with a button that fills in the demo account for you. That box appears only in development mode; a production build does not include it.

---

## 4. Sign in

Open `http://localhost:3000`. The landing page offers **Get Started**, which opens the registration form, and **Login**.

The installation seeds a demo account on startup:

- Email: `test@example.com`
- Password: `password123`

That account comes with five sample applications spread across different statuses, which is useful for seeing what the dashboard looks like with data in it.

To create your own account, choose **Get Started** and fill in first name, last name, email and password. The password must be at least eight characters. That minimum is also enforced when you sign in, so typing a password shorter than eight characters is rejected as invalid input rather than as a wrong password.

> [!NOTE]
> If you sign in with a wrong password, the login page reloads and shows no error message. The server does reject the attempt correctly, but the page is replaced before the message can appear. There is nothing wrong with your installation; check the address and try again.

---

## 5. Secure the installation

Job Tracker ships in a state designed to start with zero configuration. That convenience is also its main risk. Four things are true of a freshly installed stack:

1. **The signing key is a value published in this repository.** Every session is authenticated by a token signed with the key in `JWT_SECRET`. Anyone who knows that key can create a token for any account on your installation, without knowing any password.
2. **The database passwords are published too**, and the database port is open on your machine at `localhost:3306`. Nothing in the application needs that port to be reachable from outside; the backend talks to the database over Docker's internal network.
3. **There is no HTTPS anywhere.** All traffic, including your password when you sign in, travels as plain text.
4. **A demo account with a published password is created on every startup**, on both the Docker and local-development installs.

> [!WARNING]
> Run Job Tracker on your own machine, reachable only from that machine. Do not put it on a shared server, a company network, or the public internet without putting your own HTTPS proxy and firewall in front of it. As shipped, anyone who can reach port 8080 or port 3306 can read and change all of your data.

Before you use the installation for real applications, edit `.env` and change these values:

- `JWT_SECRET`. Generate a replacement with `openssl rand -base64 48`. Changing this value signs out everyone who is currently signed in, because their existing tokens no longer verify.
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER` and `MYSQL_PASSWORD`. Change these before the first startup. The database keeps the credentials it was created with, so changing them later means deleting the database volume and starting over.

After editing `.env`, run `docker compose up --build` again so the containers pick up the new values.

> [!IMPORTANT]
> The demo account is recreated at every startup if it is missing, and its password is printed in the backend's startup log. Deleting the account is not enough; it comes back on the next restart. Treat any installation that other people can reach as compromised until you have removed the seeding step from the code. See [Security and authentication](../development/04-security-and-authentication.md) for how.

---

## 6. What to do first

1. **Sign in** and let the dashboard load. With the demo account you will see charts populated from the five sample applications.
2. **Add your first application.** Press `n`, or use the **+ Add** button above the applications table. The form is described in [Tracking applications](./03-tracking-applications.md).
3. **Open Settings**, at the top right of the dashboard. Three of the analytics views are switched off by default: Status Transition Heatmap, Funnel Analytics, and Application Health Dashboard. Turn them on if you want them. Your choices are stored in your browser, not on the server, so they do not follow you to another machine.
4. **Press `?`** to see the list of keyboard shortcuts. The dashboard is built around them.
5. **Decide what to do with the demo data.** Either delete the five sample applications one at a time from the table, or register a fresh account of your own and work there instead. Each account sees only its own applications.

---

## See also

- [Dashboard and navigation](./02-dashboard-and-navigation.md), for what every number and chart on the main screen means.
- [Tracking applications](./03-tracking-applications.md), for the application form, the status list, and how to find things again.
- [Troubleshooting](./06-troubleshooting.md), for what to do when something does not work.
- [Configuration](../development/08-configuration.md), for the full list of settings and which of them actually take effect.

*Documentation current as of Job Tracker 1.3.1 (August 2026). Source of truth is the code; report drift as an issue.*
