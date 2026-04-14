# ATS Pipeline Deployment Guide

## Architecture

```
┌─────────────────┐
│   Vercel        │  Frontend (React + Vite)
│   https://...   │
└────────┬────────┘
         │
    API calls
         │
┌────────▼────────┐
│   Railway       │  Backend (Express + Node.js)
│   https://...   │
└────────┬────────┘
         │
   Database queries
         │
┌────────▼────────┐
│   PostgreSQL    │  Database (Railway/Neon/Supabase)
│   Cloud DB      │
└─────────────────┘
```

---

## Frontend Deployment (Vercel)

### Step 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel
```

Or connect GitHub directly at https://vercel.com

### Step 2: Configure Environment

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend-url.railway.app` (without `/api`)
3. Redeploy

### Step 3: Verify

- Frontend: https://ats-pipeline.vercel.app
- Test API connection: `https://your-backend-url.railway.app/health`

---

## Backend Deployment (Railway)

### Step 1: Set Up Railway Project

1. Go to https://railway.app
2. Create new project → GitHub (connect your repo)
3. Select ATS Pipeline repo
4. Create PostgreSQL database

### Step 2: Configure Backend Service

1. In Railway dashboard, click on repo
2. Create service:
   - Service: `backend`
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`

### Step 3: Set Environment Variables

In Railway dashboard, add variables:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=generate-a-random-string-here
NODE_ENV=production
CORS_ORIGIN=https://ats-pipeline.vercel.app
ACK_WINDOW_MINUTES=120
DECAY_CHECK_INTERVAL_MS=60000
```

To generate secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

- Push to GitHub: `git push origin master`
- Railway auto-deploys on push
- Get backend URL from Railway dashboard

---

## Database Setup

### Option A: Railway PostgreSQL (Recommended)

- Already included if you use Railway
- `DATABASE_URL` provided automatically
- No additional setup needed

### Option B: Neon (Free tier)

1. Go to https://neon.tech
2. Create project: ATS Pipeline
3. Copy connection string
4. Add to backend environment: `DATABASE_URL=postgresql://user:...`

### Option C: Supabase

1. Go to https://supabase.com
2. Create project
3. In SQL editor, run `backend/src/db/init.sql`
4. Copy connection string to `DATABASE_URL`

---

## Environment Variables Summary

### Frontend (Vercel)
```env
VITE_API_URL=https://ats-backend.railway.app
```

### Backend (Railway)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-secret
NODE_ENV=production
CORS_ORIGIN=https://ats-pipeline.vercel.app
PORT=3000
ACK_WINDOW_MINUTES=120
DECAY_CHECK_INTERVAL_MS=60000
```

---

## Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway
- [ ] PostgreSQL database created
- [ ] Environment variables configured
- [ ] Test login: https://ats-pipeline.vercel.app/login
- [ ] Test API health: `curl https://backend-url/health`
- [ ] Test create job: Company dashboard → Create Position
- [ ] Test apply: Home page → Apply For Job
- [ ] Test pipeline: Dashboard → See candidates in pipeline

---

## Troubleshooting

### "Cannot connect to API"
- Check `VITE_API_URL` is set correctly (no trailing slash)
- Verify backend is running: `GET /health`
- Check CORS_ORIGIN matches frontend URL

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Run migrations: `npm run migrate` in backend service
- Check database is online in Railway/Neon dashboard

### "Login not working"
- Verify `JWT_SECRET` is set (cannot be empty)
- Check database has `companies` table: `SELECT * FROM companies;`
- Monitor backend logs in Railway dashboard

---

## Scaling & Future Improvements

1. **SendGrid Integration** - Real email notifications
2. **Structured Logging** - Winston/Pino for production
3. **APM Monitoring** - Sentry for error tracking
4. **Rate Limiting** - Prevent abuse
5. **Analytics Dashboard** - Usage metrics & insights
6. **Auto-scaling** - Railway Pro plan for traffic spikes

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Last Updated:** April 2026
**Status:** Production Ready ✅
