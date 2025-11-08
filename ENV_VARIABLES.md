# Environment Variables Quick Reference

This file lists all environment variables used in the Procurement System.

## Backend (Server) Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0` |
| `DB_NAME` | Database name | `procurement_db` |
| `JWT_SECRET` | Secret key for JWT token signing | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | Node environment | `production` or `development` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port | `5000` | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `*` (all origins) | `https://your-frontend.onrender.com` |

## Frontend Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-backend.onrender.com/api` |

## Setting Environment Variables

### Local Development

1. **Backend**: Create `server/.env` file
2. **Frontend**: Create `frontend/.env` file

Copy from `.env.example` files and fill in your values.

### Render Deployment

1. Go to your Render service dashboard
2. Navigate to **Environment** section
3. Add each variable with its value
4. Save and redeploy

## Generating JWT_SECRET

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Notes

- Never commit `.env` files to Git
- Use strong, unique secrets in production
- Rotate secrets periodically
- Use different secrets for development and production

