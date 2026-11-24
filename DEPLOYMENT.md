# Deploying IronVault on Vercel

IronVault deploys as **one Vercel project** that contains both tiers of the application:

| Tier | What Vercel runs | Source |
| --- | --- | --- |
| Presentation | React SPA, built to static files and served from Vercel's CDN | `client/` |
| Application | Express API as a serverless function at `/api/*` | `api/index.js` → `server/src/app.js` |
| Data | MongoDB Atlas (external) | `MONGODB_URI` |

`vercel.json` installs both packages, builds the client into `client/dist`, sends every `/api/*` request to the
function, and serves `index.html` for all other routes (client-side routing). The frontend and API share one origin,
so no CORS setup or `VITE_API_URL` is needed.

## 1. MongoDB Atlas

1. Create a cluster and a database user (*Database Access*) with **Read and write to any database**.
2. *Network Access* → allow `0.0.0.0/0`. Vercel functions don't have fixed IP addresses; access is still protected
   by the database user's credentials.
3. Copy the connection string and add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ironvault?retryWrites=true&w=majority`

## 2. First administrator

Admins cannot self-register. Create one from your machine with `server/.env` pointing at Atlas:

```bash
cd server
npm run seed:admin        # uses ADMIN_NAME, ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
```

## 3. Create the Vercel project

1. Vercel → **Add New… → Project** → import the GitHub repository.
2. **Root Directory:** leave as the repository root (`./`). **Framework Preset:** *Other*.
   Build, install and output settings come from `vercel.json` – don't override them.
3. **Environment Variables** (Production, and Preview if you use preview deployments):

| Name | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string from step 1 |
| `JWT_SECRET` | 32+ random characters – `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_URL` | The project's production URL, e.g. `https://ironvault.vercel.app` (required in production) |
| `JWT_EXPIRES_IN` | Optional, default `7d` |
| `AUTH_RATE_LIMIT` / `API_RATE_LIMIT` | Optional, default 20 / 900 requests per IP per 15 minutes |

Vercel sets `NODE_ENV=production` automatically. Do **not** set `DNS_SERVERS` on Vercel – it is only a workaround
for local networks that block Atlas DNS lookups.

4. Click **Deploy**. If you didn't know the final URL in step 3, set `CLIENT_URL` afterwards and **redeploy**.

## 4. Verify

- `https://<your-project>.vercel.app/api/health` → `"database": "connected"`
- Open the site, sign in as the admin, and check a deep link such as `/admin/reports` loads after a refresh.

Optional – run the Postman collection against the deployment (it creates, then closes, its own e2e-marked records):

```bash
BASE_URL=https://<your-project>.vercel.app/api ADMIN_IDENTIFIER=admin ADMIN_PASSWORD=<admin password> node postman/run.mjs
```

## Notes for serverless

- The MongoDB connection is opened once per warm function instance and reused.
- Membership expiry needs no scheduler: memberships are expired whenever they are read, and admin lists run a
  throttled sweep.
- Rate limits are kept per function instance, so they are approximate across instances.
- Function regions: set **Settings → Functions → Region** close to your Atlas cluster for the lowest latency.

## Environment variables reference

**Server** (`server/.env` locally, Vercel project settings in production)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signing secret for login tokens (32+ chars in production) |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d` |
| `CLIENT_URL` | production | Allowed frontend origin(s), comma-separated |
| `PORT` | no | Local API port, default `5000` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | for `seed:admin` | First administrator |
| `AUTH_RATE_LIMIT`, `API_RATE_LIMIT` | no | Rate limits per IP per 15 min |
| `DNS_SERVERS` | no | e.g. `1.1.1.1,8.8.8.8` if your network refuses Atlas SRV lookups |

**Client** (`client/.env`, local development only)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL. Defaults to `/api`, which works both with the Vite dev proxy and on Vercel |
