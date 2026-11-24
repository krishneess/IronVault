# IronVault – Gym Fitness Repository Management System

A premium, gold-and-dark web application for gyms with three roles – **Members**, **Trainers** and
**Administrators** – built around a **repository (data-centric) architecture** on a **three-tier layered** stack:
every module reads and writes through one central MongoDB repository, accessed only by the backend.

| Tier | Technology | Folder |
| --- | --- | --- |
| Presentation | React 19 + Vite, Bootstrap 5, Lucide icons | `client/` |
| Application | Node.js, Express 5, JWT, bcryptjs | `server/` |
| Data | MongoDB Atlas via Mongoose | `server/src/models`, `server/src/repositories` |

## Features

**Member** – personal profile · membership selection, status and validity · assigned workout plan (exercises, sets,
reps, rest) · assigned diet plan (meals, calories vs target) · fitness progress logging (weight, body fat %, chest,
waist, arms, legs) · progress history charts · assigned trainer profile.

**Trainer** – profile · assigned members with search · member profiles and progress monitoring · create, update,
delete workout and diet plans · assign / unassign plans to coached members.

**Admin** – member and trainer accounts (create, edit, reset password, activate / deactivate) · trainer allocation
with load balancing · membership tiers · subscription management through the full lifecycle · operational reports
with CSV export · audit-log activity monitor.

**Membership lifecycle** (state-chart diagram): Created → Payment Pending → Active → Suspended / Expired / Cancelled,
with guarded transitions, automatic expiry, and server-side access restriction for members without an active
membership. Payment is recorded by an administrator (no payment gateway).

## Architecture

```
React SPA ──HTTPS/JSON──▶ Express API ──Mongoose──▶ MongoDB (central repository)
                          routes → controllers → services → repositories → models
                          protect (JWT) · authorize (roles) · requireActiveMembership
```

```
server/src
  config/        environment validation, database connection
  models/        User (+ Admin/Trainer/Member discriminators), WorkoutPlan(+Exercise), DietPlan(+Meal),
                 FitnessRecord, TrainerAssignment, MembershipTier, Membership, AuditLog
  repositories/  data access – the only code that queries MongoDB
  services/      business rules, membership state machine (membershipLifecycle.js), reports
  controllers/   HTTP handlers          routes/  Express routers under /api
  middleware/    auth, membership access, security headers + rate limiting, errors
  utils/         validation, response envelope, tokens        scripts/  seedAdmin.js
server/tests/e2e  end-to-end API suite (115 checks) + cleanup
client/src
  services/      API client and per-module services
  context/       Auth, Toast, Confirm-dialog providers
  components/    common UI, layouts, charts (SVG), fitness, membership, admin
  pages/         landing, auth, member/, trainer/, admin/, account/
postman/         Postman collection (59 requests, 156 assertions) + Newman runner
api/index.js     Vercel serverless entry – wraps the Express app       vercel.json  build + routing
```

## Getting started

Prerequisites: Node.js 20+, and MongoDB (Atlas, or a local server for development).

```bash
npm run install:all                 # installs server and client dependencies

# create server/.env (see below), then:
npm run seed:admin                  # creates the first administrator
npm run dev:server                  # API  → http://localhost:5000/api
npm run dev:client                  # app  → http://localhost:5173
```

Environment files are not committed. Create `server/.env` with at least:

```ini
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ironvault?retryWrites=true&w=majority
JWT_SECRET=<64 random hex characters>
CLIENT_URL=http://localhost:5173
ADMIN_NAME=System Administrator
ADMIN_EMAIL=<admin email>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
```

The client needs no `.env` – it calls `/api`, which the Vite dev server proxies to `http://localhost:5000`.
The full variable list is in [DEPLOYMENT.md](DEPLOYMENT.md#environment-variables-reference).
`npm run seed:demo` (in `server/`) adds 6 demo members and 6 demo trainers; `npm run seed:demo -- --remove` deletes them.

Public registration creates **Member** accounts only; trainers and admins are created by an administrator.
After registering, a member chooses a membership plan; an administrator verifies the payment to activate it.

## Testing

| Command | What it does |
| --- | --- |
| `npm run test:e2e` | Runs the end-to-end API suite (auth & RBAC, fitness management, membership & administration) against the running API, then removes its data |
| `npm run test:postman` | Runs the Postman collection with Newman, then removes its data |
| `npm run test:cleanup` | Removes any leftover test data (`@e2e.ironvault.test` users, `E2E …` tiers) |
| `npm run lint` · `npm run build` | Lint and production-build the client |

Import `postman/IronVault.postman_collection.json` and `postman/IronVault-Local.postman_environment.json` into the
Postman app and set `adminPassword` to run it interactively. Test runners refuse to run with `NODE_ENV=production`
unless explicitly allowed.

## API

All responses use one envelope:

```json
{ "success": true,  "message": "…", "data": { }, "meta": { } }
{ "success": false, "message": "…", "code": "MEMBERSHIP_INACTIVE", "errors": { "field": "reason" } }
```

Send the token as `Authorization: Bearer <token>`.

### Authentication & dashboards

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | API and database status |
| POST | `/api/auth/register` | Public | Register a member account |
| POST | `/api/auth/login` | Public | Log in with email or username |
| GET | `/api/auth/me` | Authenticated | Current user |
| PATCH | `/api/auth/change-password` | Authenticated | Change password |
| GET | `/api/dashboard/admin` · `/trainer` · `/member` | Matching role | Role dashboard data |

### Core fitness management

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET / PATCH | `/api/members/me` | Member | View / update own profile |
| GET | `/api/members/me/trainer` · `/me/plans` | Member (active membership) | Assigned trainer · assigned plans |
| GET / PATCH | `/api/trainers/me` | Trainer | View / update own profile |
| GET | `/api/trainers/me/members[/:memberId[/progress]]` | Trainer (assigned only) | Members, member detail, progress |
| GET / POST | `/api/workout-plans` | Trainer (own) / Admin (all) · Trainer | List / create |
| GET / PUT / DELETE | `/api/workout-plans/:id` | Owner trainer, Admin, assigned Member (view) | View / update / delete |
| POST / DELETE | `/api/workout-plans/:id/assignments[/:memberId]` | Owner trainer | Assign / unassign |
| … | `/api/diet-plans/…` | as workout plans | Diet plans with meals |
| GET / POST | `/api/fitness-records` | Member (active membership) | History (`from`, `to`) / log progress |
| GET | `/api/fitness-records/summary` | Member | Latest values and change |
| PUT / DELETE | `/api/fitness-records/:id` | Member (own) | Update / delete |

### Administration & membership

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/membership-tiers` | Public | Active tiers |
| GET · POST · PUT · PATCH `…/status` · DELETE | `/api/membership-tiers[/all\|/:id]` | Admin | Manage tiers |
| GET / POST | `/api/memberships/me` | Member | Membership overview / select a plan |
| POST | `/api/memberships/:id/transitions` | Member (own) / Admin | Lifecycle action |
| GET / POST · GET `/summary` · GET `/:id` | `/api/memberships` | Admin | Subscriptions |
| GET / POST | `/api/assignments` · DELETE `/member/:memberId` | Admin | Trainer allocation |
| GET / POST · GET / PATCH `/:id` · PATCH `/:id/status` | `/api/admin/members` · `/api/admin/trainers` | Admin | Account management |
| GET | `/api/admin/trainers/options` | Admin | Active trainers with load |
| GET | `/api/admin/reports/operational?from=&to=` | Admin | Operational report |
| GET | `/api/admin/audit-logs` | Admin | Audit records |

**Lifecycle actions:** `submit`, `cancel_application`, `verify_payment` (admin), `abandon_payment`, `suspend` (admin,
tier must allow holds), `resume` (admin – extends the end date by the hold length), `terminate` (admin), `revoke`
(admin), `decline_renewal`. Expiry is applied automatically (every 15 minutes and on read).

## Security

bcrypt password hashing · JWT with expiry · role checks on every protected route · ownership checks on plans and
records · membership-based access control · input validation on client and server · mass-assignment protection ·
rate limiting on sign-in / registration · security headers and `no-store` caching for API responses · CORS restricted
to configured origins · secrets only in environment variables (`.env` is git-ignored).

## Deployment

The whole application deploys as **one Vercel project**: the React build is served as static files and the Express
API runs as a serverless function (`api/index.js`) under `/api`, configured by `vercel.json`. MongoDB stays on
Atlas. See **[DEPLOYMENT.md](DEPLOYMENT.md)**.
