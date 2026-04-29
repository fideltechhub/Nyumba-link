# Quick Deploy to Render

## TL;DR - Deploy in 3 Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push
```

### 2. Go to Render Dashboard
https://dashboard.render.com/blueprints

### 3. Click "New Blueprint"
- Select your GitHub repo
- Click "Create from Blueprint"
- Render automatically deploys everything using `render.yaml`

---

## What Gets Deployed

✅ **Frontend**: React app at `https://nyumba-link-client.onrender.com`
✅ **Backend**: Node/Express API at `https://nyumba-link-server.onrender.com`
✅ **Database**: PostgreSQL with automatic backups

## Admin Login
- **Email**: nyumbalink@gmail.com
- **Password**: admin123 (change this after login!)

## Check Status
https://dashboard.render.com - View logs, environment variables, and deployments

## Files Modified
- `server/db.js` - Updated for PostgreSQL
- `server/index.js` - Added dotenv config
- `server/package.json` - Added pg, dotenv
- `server/.env.example` - Environment template
- `client/.env.production` - API URL for production
- `render.yaml` - Deployment configuration
- `DEPLOYMENT.md` - Full deployment guide
