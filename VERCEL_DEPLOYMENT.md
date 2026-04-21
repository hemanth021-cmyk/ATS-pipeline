# Vercel Deployment Guide 🚀

Deploy ATS Pipeline on Vercel with serverless backend and static frontend.

## Architecture

```
Vercel (All-in-One):
├── Frontend: Static site hosted at vercel.com
├── API: Serverless functions at /api/*
└── Database: PostgreSQL (external - Neon, Railway, AWS RDS, etc.)
```

## Prerequisites

- Vercel account (free tier available)
- PostgreSQL database (see "Database Setup" below)
- GitHub repository with this code

## Step 1: Database Setup

Choose one:

### Option A: Neon (Recommended - Free tier available)
1. Go to https://neon.tech
2. Click "Sign Up"
3. Create a new project
4. Copy the connection string: `postgresql://user:password@host/dbname`
5. Save for later (Step 3)

### Option B: Railway
1. Go to https://railway.app
2. Click "New Project" → PostgreSQL
3. Copy "Database URL" from Variables
4. Save for later (Step 3)

### Option C: Supabase
1. Go to https://supabase.com
2. Create a new project
3. Get connection string from Settings → Database → Connection String
4. Save for later (Step 3)

## Step 2: Prepare for Vercel

1. **Ensure code is pushed to GitHub:**
   ```bash
   git push -u origin master
   ```

2. **Verify project structure:**
   ```
   ats-pipeline/
   ├── vercel.json            ← Deployment config
   ├── api/index.js           ← Serverless handler
   ├── backend/               ← Express API code
   ├── frontend/              ← React + Vite
   └── package.json           ← Root package.json
   ```

3. **Check that build script works locally:**
   ```bash
   npm run build:all
   ```

## Step 3: Connect to Vercel

### Via Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → Project
3. Select "Import Git Repository"
4. Find and select `ats-pipeline` repo
5. Click "Import"

### Via Vercel CLI

```bash
npm i -g vercel
cd ats-pipeline
vercel deploy
```

## Step 4: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Production |
| `JWT_SECRET` | Random 32+ char string | Production |
| `JWT_EXPIRES_IN` | `7d` | Production |
| `ACK_WINDOW_MINUTES` | `120` | Production |
| `DECAY_CHECK_INTERVAL_MS` | `60000` | Production |
| `CORS_ORIGIN` | `https://your-project.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `VITE_API_URL` | `https://your-project.vercel.app` | Production |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Deploy Database Schema

After deployment, initialize the database:

1. **Option A: Via SSH (if available):**
   ```bash
   cd ats-pipeline/backend
   DATABASE_URL="your_connection_string" npm run migrate
   ```

2. **Option B: Via Vercel CLI:**
   ```bash
   vercel env pull  # Downloads .env.local
   npm --prefix backend run migrate
   ```

3. **Option C: Manual SQL:**
   - Connect to your DB with a SQL client
   - Run queries from `backend/src/db/init.sql`

## Step 6: Verify Deployment

1. Go to your Vercel deployment URL: `https://your-project.vercel.app`
2. Test API health: `https://your-project.vercel.app/health`
3. Expected response: `{"ok": true, "db": "up"}`

## Troubleshooting

### "Cannot find module" errors
- Check that all imports in `api/index.js` use correct relative paths
- Ensure backend and frontend `.gitignore` files don't exclude needed files

### Database connection fails
- Verify `DATABASE_URL` format
- Check database is accessible from Vercel (may need to whitelist IPs or use a public database)
- Test locally: `DATABASE_URL=your_url npm --prefix backend run migrate`

### CORS errors
- Ensure `CORS_ORIGIN` matches your Vercel URL exactly
- Example: `https://ats-pipeline-123.vercel.app`

### 504 Gateway Timeout
- Decay scheduler may be running on serverless function (has 60s timeout)
- Set `DISABLE_DECAY_SCHEDULER=true` or use a separate cron service

### Build fails
- Run `npm run build:all` locally to test
- Check Node version: Vercel defaults to v18, but v20+ recommended
- Add to `vercel.json` to specify Node version:
  ```json
  "buildCommand": "npm run build:all",
  "env": {
    "NODE_ENV": "production"
  }
  ```

## Advanced: Enable Decay Scheduler

The decay scheduler runs on intervals but serverless functions sleep between requests.

**Option 1: Use a Cron Service (Recommended)**
- Vercel Cron: https://vercel.com/docs/crons
- EasyCron: https://www.easycron.com
- Cron-job.org: https://cron-job.org

**Option 2: Keep in App (Not Recommended)**
- Set `DISABLE_DECAY_SCHEDULER=false`
- Scheduler will run while function is active
- May miss decays if no requests for hours

## Monitoring & Logs

1. **View Deployment Logs:**
   ```
   Vercel Dashboard → Deployments → Select Deployment → Logs
   ```

2. **Tail Live Logs:**
   ```bash
   vercel logs --follow
   ```

3. **View Error Logs:**
   ```
   Vercel Dashboard → Functions → Select Function → Logs
   ```

## Performance Optimization

### Frontend Caching
Vercel automatically caches:
- Static assets (JS, CSS, images)
- HTML with 60s cache

### API Response Caching
Add to response headers in `backend/src/app.js`:
```javascript
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('/api/applications')) {
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=240');
  }
  next();
});
```

### Database Connection Pooling
Already configured in `backend/src/db/pool.js`:
- Max 5 connections
- 30s idle timeout
- Reconnect on failure

## Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records (instructions provided)
4. Update `CORS_ORIGIN` environment variable

## Rollback to Previous Version

```bash
vercel rollback
```

Or via Dashboard:
```
Deployments → Select Previous Version → Switch
```

## Zero-Downtime Deployments

Vercel handles this automatically:
1. New version deployed to unique URL
2. DNS switches when ready
3. Old version still serves until fully replaced
4. Takes ~30-60 seconds

## Next Steps

1. Set up monitoring: Sentry, DataDog, or New Relic
2. Configure email notifications: SendGrid or Mailgun (see backend setup)
3. Enable structured logging: See `STABILITY_IMPROVEMENTS.md`
4. Set up git-based deployments: Automatic deploys on push to `master`

## Support

- Vercel Docs: https://vercel.com/docs
- PostgreSQL Connection Issues: Check provider's docs
- Build Issues: Run locally with `npm run build:all`
