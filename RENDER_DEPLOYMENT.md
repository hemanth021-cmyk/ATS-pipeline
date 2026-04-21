# Render Deployment Guide (Unified Hosting)

This guide covers deploying the **ATS Pipeline** as a single, unified "Web Service" on **Render**. This is the recommended approach to avoid CORS issues and ensure the background scheduler runs reliably.

## Prerequisites

1.  A **Render** account (free or paid).
2.  A **PostgreSQL** database (you can create this on Render as well).

## Step 1: Create a PostgreSQL Instance

1.  In the Render Dashboard, click **New > PostgreSQL**.
2.  **Name**: `ats-db`
3.  **Database Name**: `ats_pipeline`
4.  **User**: `ats_user`
5.  Click **Create Database**.
6.  Once created, find the **Internal/External Database URL**. You will need this for the next step.

## Step 2: Create the Web Service

1.  Click **New > Web Service**.
2.  Connect your GitHub repository.
3.  **Name**: `ats-pipeline`
4.  **Environment**: `Node`
5.  **Build Command**: `npm run build:all`
6.  **Start Command**: `npm run start:prod`
7.  **Auto Deploy**: `Yes` (recommended).

## Step 3: Environment Variables

Click the **Environment** tab in your Web Service settings and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your PostgreSQL Internal/External URL |
| `JWT_SECRET` | A long, complex random string |
| `NODE_ENV` | `production` |
| `SERVE_STATIC` | `true` |
| `ACK_WINDOW_MINUTES` | `120` (optional) |
| `DECAY_CHECK_INTERVAL_MS` | `60000` (optional) |

## Step 4: Verify Deployment

1.  Wait for the Build to complete.
2.  Check the **Logs** tab. You should see:
    -   `Applied init.sql successfully.` (from the migration script)
    -   `[decay_scheduler] Running every 60000ms`
    -   `ATS Pipeline API listening on port ...`
3.  Visit your service URL (e.g., `https://ats-pipeline.onrender.com`). The frontend should load automatically.

## CORS & Redirect Notes

-   Because this is a **Unified** deployment, your Frontend and Backend share the same URL.
-   The API is reached at `/api/...`.
-   The Frontend SPA fallback is handled by the Express server automatically.
-   In the Dashboard settings, the "Root Directory" should be left **empty** (default).
