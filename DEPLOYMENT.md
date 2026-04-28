# NyumbaLink Render Deployment Guide

## Overview
This guide walks you through deploying NyumbaLink to Render using PostgreSQL as the database.

## What Changed
- **Database**: Migrated from SQLite to PostgreSQL (production-ready, persistent)
- **Packages**: Added `pg` and `dotenv` to backend dependencies
- **Configuration**: Created `.env` files and `render.yaml` for automated deployment
- **Schema**: Updated to PostgreSQL syntax with proper foreign keys

## Deployment Steps

### 1. Create a GitHub Repository
If you haven't already, push your code to GitHub:

```bash
cd c:\Users\fidel\OneDrive\Desktop\FOLDERS\nairobi-houses
git init
git add .
git commit -m "Initial commit: ready for Render deployment"
git remote add origin https://github.com/YOUR_USERNAME/nyumba-link.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the branch (main)
5. Render will automatically read `render.yaml` and create:
   - PostgreSQL database
   - Backend service
   - Frontend service

#### Option B: Manual Setup
If you prefer manual setup, create services individually:

**Create PostgreSQL Database:**
1. Dashboard → "New +" → "PostgreSQL"
2. Name: `nyumba-link-postgres`
3. Leave other settings as default
4. Copy the Internal Database URL

**Create Backend Service:**
1. Dashboard → "New +" → "Web Service"
2. Connect GitHub repo
3. Name: `nyumba-link-server`
4. Runtime: Node
5. Build Command: `cd server && npm install`
6. Start Command: `cd server && npm start`
7. Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<paste from PostgreSQL>
   JWT_SECRET=<generate a random string>
   FRONTEND_URL=<your-frontend-url>
   PORT=3000
   ```

**Create Frontend Service:**
1. Dashboard → "New +" → "Static Site"
2. Connect GitHub repo
3. Name: `nyumba-link-client`
4. Build Command: `cd client && npm install && npm run build`
5. Publish Directory: `client/dist`
6. Environment Variables:
   ```
   VITE_API_URL=https://nyumba-link-server.onrender.com
   ```

### 3. First Deployment
When the backend service starts for the first time:
- It will automatically create all database tables
- It will seed an admin user with credentials:
  - **Email**: nyumbalink@gmail.com
  - **Password**: admin123

### 4. Verify Deployment
- Frontend URL: `https://nyumba-link-client.onrender.com`
- Backend URL: `https://nyumba-link-server.onrender.com`
- Admin API: `https://nyumba-link-server.onrender.com/api/admin`

## Environment Variables Reference

### Server (.env)
```
DATABASE_URL=postgresql://user:pass@host/dbname
NODE_ENV=production
PORT=3000
JWT_SECRET=your_secret_key
FRONTEND_URL=https://your-frontend-domain
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Client (.env.production)
```
VITE_API_URL=https://nyumba-link-server.onrender.com
```

## Important Notes

1. **Admin Credentials**: Change the default admin password after first login:
   - Email: nyumbalink@gmail.com
   - Default Password: admin123

2. **File Uploads**: The current setup uses the `uploads/` folder. For production, consider:
   - Using a cloud storage service (AWS S3, Cloudinary, etc.)
   - Or mount a persistent disk on Render

3. **Database Backups**: Render's PostgreSQL service includes automatic backups. Check your dashboard for backup settings.

4. **Custom Domain**: After deployment, you can add a custom domain in the Render dashboard.

5. **Environment Variables**: Keep sensitive data (JWT_SECRET, SMTP credentials) in Render's dashboard, not in git.

## Troubleshooting

### Database Connection Error
- Check DATABASE_URL is correctly set in environment variables
- Ensure PostgreSQL service is running
- Check service logs on Render dashboard

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are listed in package.json
- Verify Node version compatibility

### API Connection Issues
- Ensure FRONTEND_URL on backend matches actual frontend domain
- Check VITE_API_URL on client matches actual backend domain
- Check browser console for CORS errors

## Local Development

To run locally with PostgreSQL:

1. Install PostgreSQL on your machine
2. Create a local database: `createdb nyumba_link`
3. Create `.env` in server folder:
   ```
   DATABASE_URL=postgresql://localhost/nyumba_link
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=dev_secret
   FRONTEND_URL=http://localhost:3000
   ```
4. Run: `npm run dev` in both server and client folders

## Next Steps

- Configure email notifications (SMTP settings)
- Set up file uploads to cloud storage
- Add payment integration if needed
- Configure SSL certificates (handled by Render)
- Set up monitoring and error tracking
