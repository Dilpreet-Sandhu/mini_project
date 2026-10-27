# Roomline

A mobile app for the little things that make campus living better. Students report room problems, the right specialists pick them up, and administrators see how repairs are progressing.

The interface combines conversation lists and message bubbles, social-style profiles and category circles, and lightweight navigation with a distinct teal, cream and mint identity. Built with **Expo + React Native + TypeScript + Zustand**, backed by **Rust + Axum + SQLx + PostgreSQL**. All screens use the real API; there is no mock-data switch.

## What you can demonstrate

- **Student:** register, sign in, create a complaint, choose a specialty and priority, follow its status, discuss it in a thread, view previous complaints, call/email workers, update profile/room, cancel pending complaints, reopen an unresolved repair, sign out.
- **Worker:** sign in, see unassigned complaints matching their specialty and their own assigned jobs, accept a job, start work, add messages, mark it fixed with a resolution note, view fixed jobs, view contacts and edit their profile.
- **Administrator:** sign in, inspect campus totals and overdue work, compare workers' on-time rates and average repair times, view every complaint/thread, assign or reassign pending jobs to a matching specialist, and create worker accounts.
- Specialties: electrical, plumbing, carpentry, housekeeping and general maintenance.

## Requirements

- Node.js **22.13+** (22.x) or **24.3+** (24.x), npm, Python 3 for the optional setup helper.
- Rust **1.97.1 or later** with Cargo. The backend uses edition 2024.
- Docker Desktop / Docker Engine with Compose v2, running.
- A phone/emulator with an **SDK 58-compatible Expo Go** or an Expo development build. The included project pins SDK 58. Install a matching Expo Go version from [expo.dev/go](https://expo.dev/go), or use `npx expo run:android` / `npx expo run:ios` with your Android Studio/Xcode environment. These commands build the native app locally.

No paid service, cloud database or API key is needed for local development.

## 1. Configure

Extract the ZIP and open a terminal in `roomline/`.

For a browser or iOS simulator:

```sh
python3 scripts/configure.py
```

For a physical phone, use your computer's Wi-Fi IPv4 address:

```sh
python3 scripts/configure.py --api-url http://192.168.1.10:3000
```

For the Android emulator use `http://10.0.2.2:3000` instead.

The helper creates `backend/.env` with a random JWT secret and `frontend/.env` with your API URL. It never overwrites existing settings. To change the API URL later, edit `frontend/.env` and restart Expo with `npx expo start --clear`.

If you prefer manual setup, copy each folder's `.env.example` to `.env`, then replace `ACCESS_TOKEN_SECRET` with a random value of at least 32 characters. Never put the database password or JWT secret into `frontend/.env`.

## 2. Start PostgreSQL

From `roomline/`:

```sh
docker compose up -d --wait
```

This starts PostgreSQL 17 on your computer's port 5432 and persists data in a Docker volume. Credentials for this local project: user `roomline`, password `roomline_local`, database `roomline`.

If 5432 is occupied, change the host port in `docker-compose.yml` (for example `127.0.0.1:5433:5432`) and update `DATABASE_URL` in `backend/.env` to match.

## 3. Start the Rust server

In a second terminal:

```sh
cd roomline/backend
cargo run --locked -- --seed
cargo run --locked
```

The first command applies migrations and adds demo users and sample complaints. Seeding is optional and repeatable; it does not reset existing records or passwords. The server automatically applies migrations on every startup. SQLx uses bound runtime queries, so you do not need `sqlx-cli` or a database during compilation.

The API listens on `http://localhost:3000`. Check `http://localhost:3000/health`; it should show `{"status":"ok"}`. Start these commands from `backend/` so `.env` is found.

## 4. Start the Expo app

In a third terminal:

```sh
cd roomline/frontend
npm ci
npm start
```

Scan the QR code with a matching Expo Go app, press `a` for an Android emulator, `i` for an iOS simulator, or `w` for the browser preview. For a standalone web command use `npm run web`.

Your phone and computer must be on the same network, and the phone must reach `http://YOUR_COMPUTER_IP:3000/health`. Allow local traffic to port 3000 if your firewall blocks it. `localhost` on a phone means the phone itself. An Expo tunnel carries the JavaScript bundle; it does not automatically tunnel the backend.

The server's CORS defaults allow the browser on port 8081. If Expo chooses another port, add its exact origin to `CORS_ORIGINS` in `backend/.env` and restart the server. Native mobile requests do not use browser CORS.

## Demo logins

Run the seed command first. All demo users use **`Roomline123!`**.

| Role | Email |
| --- | --- |
| Student | `student@roomline.local` |
| Second student | `student2@roomline.local` |
| Electrician | `electrician@roomline.local` |
| Plumber | `plumber@roomline.local` |
| Carpenter | `carpenter@roomline.local` |
| Housekeeping | `housekeeping@roomline.local` |
| General maintenance | `general@roomline.local` |
| Administrator | `admin@roomline.local` |

All names, phone numbers and rooms in the seed are fictional demonstration data. Public registration always creates a student. Workers are created from the administrator's **People → Add a worker** form. Administrator provisioning in this project is through the seed command; there is no public admin-signup route.

## How complaints move

1. A student creates a pending complaint. Its category selects the specialist queue; no worker is assigned yet.
2. A matching worker accepts it, or an administrator assigns it. Acceptance is one conditional SQL update, so only one worker can claim a job.
3. The assigned worker starts work: `pending → in_progress`.
4. The worker adds a repair note and marks it `resolved`. The student sees it in History.
5. If the issue remains, the student supplies a reason and reopens it: `resolved → pending`. Assignment is cleared and a new service cycle/deadline begins. The original thread is preserved.

Students may cancel only pending complaints. Administrators may assign/reassign only pending complaints, and only to a matching specialty. Only the assigned worker can start or resolve a complaint. Worker History shows currently resolved/cancelled jobs assigned to them; reopened work returns to the specialist queue.

## Performance metrics

- High priority: **24 hours**; normal: **72 hours**; low: **120 hours**.
- On time: resolved at or before the current service cycle's `due_at`.
- On-time percentage: on-time resolved complaints / resolved complaints × 100.
- Average repair hours: resolution time minus the latest service cycle's start time.
- Overdue open requests are counted separately. Workers with no resolved jobs show `—`, not 0%.
- These are all-time metrics for the latest cycle and current assignment, not a lifetime count of every historical repair attempt. Audit events preserve earlier actions.

## Project map

```text
roomline/
  frontend/
    App.tsx                     Role-based tabs, navigation and modal screens
    src/screens/                Sign in, complaints, thread, people, profile, stats
    src/components/             Shared UI and complaint rows
    src/stores/auth.ts          Zustand session and profile actions
    src/stores/portal.ts        Zustand complaints, workers and administrator data
    src/lib/                    API client, types, theme and storage
    tests/                      Deadline/status presentation tests
  backend/
    src/main.rs                 Environment, DB pool, migrations and HTTP server
    src/lib.rs                  AppState and router construction
    src/auth/                   DTOs, user model, JWT helpers, handlers and service
    src/complaint/              Workflow, threads, assignment and authorization
    src/admin/                  Performance statistics and worker provisioning
    src/user/                   Profile and worker contacts
    src/middlewares/            Bearer-token authentication
    migrations/                 SQL schema and indexes
    tests/                      Authentication and full API workflow tests
  scripts/configure.py          Local configuration helper
  docker-compose.yml           PostgreSQL 17 and persistent volume
  docs/                        API reference, demo script and verification notes
```

Backend structure follows [your reference repository](https://github.com/Dilpreet-Sandhu/chat_backend_rust) at commit `4fed064`: feature folders, `routes → handlers → service`, `Arc<AppState>`, SQLx/Postgres, bcrypt, JWT helpers, auth middleware, `AppError`, and `{ data, message }` responses. Code is written for this project. WebSocket chat and encryption from the reference are outside this maintenance app's scope; complaint discussions are persisted REST threads refreshed every 20 seconds while the app is active, with pull-to-refresh as well.

## Checks

```sh
cd frontend
npm run typecheck
npm test
npx expo export --platform web
npx expo export --platform android --platform ios
```

```sh
cd backend
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
```

For the full API test, create a dedicated database first. From the project root:

```sh
docker compose exec postgres createdb -U roomline roomline_test
cd backend
TEST_DATABASE_URL=postgres://roomline:roomline_local@localhost:5432/roomline_test \
  cargo test --locked --test api -- --ignored --nocapture
```

The integration test inserts sample/test records. Use `roomline_test`, not your own application data. On PowerShell, set `$env:TEST_DATABASE_URL` before the Cargo command. See `docs/VERIFICATION.md` for the checks run while preparing this package.

For a teacher walkthrough, follow `docs/DEMO.md`. For endpoints, see `docs/API.md`.

This is a local academic project. It includes password hashing, token expiry, secure native token storage, bound SQL, role checks and complaint access checks. It does not include password-reset emails, push notifications, file attachments, hostel-specific multi-tenancy, background delivery or public deployment configuration. Sign-out removes the local token; access tokens expire after 24 hours. The app is source code, not a prebuilt APK/IPA.

To stop PostgreSQL and preserve records: `docker compose down`.
