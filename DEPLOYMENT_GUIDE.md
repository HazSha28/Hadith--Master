# Hadith Master — Deployment Guide
### Render (backend + database) + Vercel (frontend)

---

## Overview

| Service | What it hosts | Free tier |
|---|---|---|
| **Render PostgreSQL** | 61,406 hadiths database | ✅ 1 GB |
| **Render Web Service** | Node/Express API (port 10000) | ✅ 750 hrs/mo |
| **Vercel** | React frontend | ✅ Unlimited |

**Deploy order:** Database → Backend → Frontend (each step depends on the previous one's URL)

---

## Step 1 — Push code to GitHub

Before deploying, make sure your latest code is on GitHub. Run these commands from the project root:

```bash
git add backend/api/server.js backend/render.yaml backend/.env.example
git add frontend/.env.production frontend/vercel.json
git commit -m "chore: production config for Render + Vercel deployment"
git push origin main
```

> ⚠️ Confirm `.env` files are in `.gitignore` — never push real secrets to GitHub.

---

## Step 2 — Create the PostgreSQL database on Render

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Fill in:
   - **Name:** `hadith-master-db`
   - **Database:** `hadith_master`
   - **User:** leave as default (Render generates one)
   - **Region:** pick closest to your users
   - **Plan:** Free
3. Click **Create Database**
4. Wait ~1 minute for it to provision
5. On the database page, copy these values — you'll need them shortly:
   - **Hostname** (e.g. `dpg-xxxx.oregon-postgres.render.com`)
   - **Port** (`5432`)
   - **Database** name
   - **Username**
   - **Password**
   - **External Database URL** (the full `postgresql://...` connection string)

### Import the hadith data

The database dump is at: `hadith_render_import_clean.sql` (290 MB, 61,406 hadiths).

**Option A — Render dashboard (easiest)**
1. On your Render database page, click **Connect** → **External Connection**
2. Copy the **PSQL Command** shown (it includes the full connection string)
3. Run it locally, then pipe the SQL file:

```bash
# Windows PowerShell — paste your actual connection string from Render
$env:PGPASSWORD = "your_render_db_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -h your_render_pg_host.render.com `
  -U your_render_pg_user `
  -d hadith_master `
  -f "d:\Hadith Master\hadith_render_import_clean.sql"
```

> ⚠️ This upload will take **10–20 minutes** over a typical home connection (290 MB). Keep the terminal open.

**Option B — pgAdmin**
1. Open pgAdmin → Servers → Create Server → paste Render connection details
2. Right-click the database → **Restore** → select `hadith_render_import_clean.sql`

**Verify the import:**
```bash
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -h your_render_pg_host.render.com `
  -U your_render_pg_user `
  -d hadith_master `
  -c "SELECT COUNT(*) FROM hadiths;"
# Expected: 61406
```

---

## Step 3 — Deploy the backend to Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `hadith-master-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node api/server.js`
   - **Plan:** Free
4. Under **Environment Variables**, add each of the following:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `API_PORT` | `10000` |
| `PGHOST` | your Render DB hostname |
| `PGUSER` | your Render DB username |
| `PGPASSWORD` | your Render DB password |
| `PGDATABASE` | `hadith_master` |
| `PGPORT` | `5432` |
| `GOOGLE_API_KEY` | your Gemini API key |
| `OPENAI_API_KEY` | your Groq API key |
| `ALLOWED_ORIGINS` | leave blank for now (fill in after Vercel deploy) |

5. Click **Create Web Service**
6. Wait for the build to finish (2–3 minutes)
7. Copy your backend URL — it will be: `https://hadith-master-api.onrender.com`

**Verify the backend:**
Open in browser: `https://hadith-master-api.onrender.com/health`

Expected response:
```json
{ "success": true, "status": "healthy" }
```

> 💡 **Free tier note:** Render free web services spin down after 15 min of inactivity. The first request after sleep takes ~30 seconds. Upgrade to the $7/mo Starter plan to keep it always-on.

---

## Step 4 — Update backend CORS with your Vercel URL

Once you know your Vercel URL (next step), come back and:

1. On Render → your web service → **Environment** tab
2. Add/update: `ALLOWED_ORIGINS` = `https://your-app.vercel.app`
3. Render will auto-redeploy

---

## Step 5 — Deploy the frontend to Vercel

### Update the backend URL first

Open `frontend/.env.production` and replace the placeholder with your real Render URL:

```env
VITE_API_BASE_URL=https://hadith-master-api.onrender.com
```

Commit and push:
```bash
git add frontend/.env.production
git commit -m "chore: set production backend URL"
git push origin main
```

### Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
4. Under **Environment Variables**, add all values from `frontend/.env.production`:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://hadith-master-api.onrender.com` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyC53sa8nPeQA68X5FmgSTvLJmrc_AI_LSo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hadith-master-40045.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `hadith-master-40045` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hadith-master-40045.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `956247344001` |
| `VITE_FIREBASE_APP_ID` | `1:956247344001:web:3f877101e43196426e5e80` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-N10ZYSJ709` |

5. Click **Deploy**
6. Vercel will build and give you a URL like `https://hadith-master-xxxx.vercel.app`

### Add a custom domain (optional)
Vercel dashboard → your project → **Settings** → **Domains** → add your domain.

---

## Step 6 — Final wiring: update CORS on Render

Now that you have your Vercel URL:

1. Render → `hadith-master-api` → **Environment**
2. Set `ALLOWED_ORIGINS` = `https://hadith-master-xxxx.vercel.app`
   (add more comma-separated if you add a custom domain later)
3. Save — Render redeploys automatically

---

## Step 7 — Update Firebase authorized domains

Firebase Auth will block sign-ins from your Vercel domain unless you add it:

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select project `hadith-master-40045`
3. **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and enter your Vercel domain:
   - `hadith-master-xxxx.vercel.app`
   - (plus your custom domain if you have one)

---

## Step 8 — Smoke test checklist

Once everything is live, verify each feature:

- [ ] Homepage loads and daily hadith appears
- [ ] `/login` — sign in with email/password works
- [ ] `/login` — sign in with Google works
- [ ] Browse a hadith collection (`/collections/sahih_bukhari`)
- [ ] Text search returns results
- [ ] AI search (`/advanced`) returns an answer
- [ ] User profile page loads with stats
- [ ] Community chat sends and receives messages
- [ ] Admin panel accessible at `/admin/panel` with admin account

---

## Troubleshooting

**CORS errors in browser console**
→ Check `ALLOWED_ORIGINS` on Render matches your Vercel URL exactly (no trailing slash)

**"Failed to fetch" on API calls**
→ Open `https://hadith-master-api.onrender.com/health` — if it times out, the free tier is sleeping. Wait 30s and retry.

**Firebase auth errors after deployment**
→ Make sure your Vercel domain is added to Firebase authorized domains (Step 7)

**Search returns no results**
→ Verify the DB import succeeded: connect to Render DB and run `SELECT COUNT(*) FROM hadiths;` — should be 61406

**Build fails on Vercel**
→ Check that all `VITE_*` env vars are set in Vercel dashboard under Environment Variables

**`pg_dump` file too large to upload**
→ Use Render's direct PSQL connection (Option A in Step 2) — it streams rather than loading into memory

---

## File reference

| File | Purpose |
|---|---|
| `hadith_render_import_clean.sql` | Clean DB dump ready to import (290 MB) |
| `backend/render.yaml` | Render web service config |
| `backend/.env.example` | Template for Render env vars |
| `frontend/.env.production` | Vite production env vars |
| `frontend/vercel.json` | SPA rewrite rule for React Router |
