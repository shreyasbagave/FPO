# Render Deployment Guide

This guide will help you deploy the Procurement System to Render.

## Prerequisites

- A Render account (sign up at https://render.com)
- A MongoDB Atlas account (or your MongoDB connection string)
- GitHub repository with your code (already set up)

## Environment Variables

### Backend Service (Server)

When creating a Web Service on Render for the backend, add these environment variables in the Render dashboard:

#### Required Variables:

1. **MONGODB_URI**
   - Your MongoDB connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0`
   - Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?appName=Cluster0`

2. **DB_NAME**
   - Database name (default: `procurement_db`)
   - Example: `procurement_db`

3. **JWT_SECRET**
   - A strong random string for JWT token signing
   - Generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

4. **NODE_ENV**
   - Set to `production` for production deployments
   - Example: `production`

#### Optional Variables:

5. **PORT**
   - Render sets this automatically, but you can override if needed
   - Default: `5000`

6. **FRONTEND_URL**
   - Your frontend URL for CORS configuration
   - Format: `https://your-frontend-service.onrender.com`
   - Example: `https://procurement-frontend.onrender.com`
   - If not set, CORS will allow all origins (less secure)

### Frontend Service (Static Site)

When creating a Static Site on Render for the frontend, add this environment variable:

#### Required Variable:

1. **VITE_API_URL**
   - Your backend API URL
   - Format: `https://your-backend-service.onrender.com/api`
   - Example: `https://procurement-api.onrender.com/api`

## Deployment Steps

### Step 1: Deploy Backend (Web Service)

1. Go to your Render dashboard: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `shreyasbagave/FPO`
4. Configure the service:
   - **Name**: `procurement-api` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add all the environment variables listed above (Backend section)
6. Click **"Create Web Service"**
7. Wait for deployment to complete
8. Note your backend URL (e.g., `https://procurement-api.onrender.com`)

### Step 2: Deploy Frontend (Static Site)

1. In your Render dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository: `shreyasbagave/FPO`
3. Configure the site:
   - **Name**: `procurement-frontend` (or your preferred name)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add the environment variable:
   - **VITE_API_URL**: `https://your-backend-service.onrender.com/api`
   - (Replace with your actual backend URL from Step 1)
5. Click **"Create Static Site"**
6. Wait for deployment to complete

### Step 3: Update Frontend Environment Variable

After the backend is deployed:

1. Go to your frontend service settings
2. Update the **VITE_API_URL** environment variable with your actual backend URL
3. Trigger a new deployment (Render will rebuild automatically)

## MongoDB Atlas Configuration

If using MongoDB Atlas:

1. **Whitelist IP Addresses**:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (or Render's specific IPs)
   - This is required for Render to connect to your database

2. **Database User**:
   - Ensure your database user has read/write permissions
   - Verify the username and password in your connection string

## Post-Deployment Checklist

- [ ] Backend service is running and healthy
- [ ] Frontend is accessible
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection is working
- [ ] Test login functionality
- [ ] Verify all API endpoints are accessible

## Troubleshooting

### Backend Issues

1. **Connection Timeout**:
   - Check MongoDB Atlas Network Access settings
   - Verify MONGODB_URI is correct
   - Check Render service logs

2. **Port Issues**:
   - Render automatically sets PORT, don't override unless necessary
   - Ensure your server.js uses `process.env.PORT`

3. **Build Failures**:
   - Check that Root Directory is set to `server`
   - Verify package.json exists in server directory

### Frontend Issues

1. **API Connection Errors**:
   - Verify VITE_API_URL is set correctly
   - Check CORS settings in backend
   - Ensure backend URL includes `/api` at the end

2. **Build Failures**:
   - Check that Root Directory is set to `frontend`
   - Verify all dependencies are in package.json

## Environment Variable Examples

### Backend (.env file for local development)
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?appName=Cluster0
DB_NAME=procurement_db
JWT_SECRET=your-strong-secret-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Backend (Render Environment Variables)
Set these in Render Dashboard → Your Service → Environment:
- `MONGODB_URI` = `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?appName=Cluster0`
- `DB_NAME` = `procurement_db`
- `JWT_SECRET` = `[generate a strong random string]`
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://your-frontend-service.onrender.com` (optional but recommended)

### Frontend (.env file for local development)
```env
VITE_API_URL=http://localhost:5000/api
```

## Notes

- Render provides free tier with some limitations (service may spin down after inactivity)
- For production, consider upgrading to a paid plan
- Always use strong, unique JWT_SECRET in production
- Never commit `.env` files to Git (they're in .gitignore)
- Update CORS settings in backend if needed for your frontend domain

