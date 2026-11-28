# Release process
1. Edit on a branch or main in GitHub.
2. Push to main. Vercel builds and deploys automatically (2-4 minutes).
3. The "smoke-and-uptime" GitHub Action waits 4 minutes, then checks key pages. A failed run emails the repo owner (free uptime alert). It also runs every 6 hours.
4. Rollback: Vercel dashboard, Deployments, Promote a previous deployment.
5. New page checklist: add to scripts/prerender.ts and scripts/generate-sitemap.ts.
# Backups
Orders and customers: use the dashboard CSV export weekly. Supabase free plan has no automatic backups; real backups need the service key or a paid plan.
