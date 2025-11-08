# Quick Fix Guide

## Your IP is Already Whitelisted ✓

I can see you've already whitelisted your IP (0.0.0.0/0 allows all IPs). So the authentication error is likely due to:

## Most Likely Issue: Database User Credentials

The error "bad auth : Authentication failed" (code 8000) means MongoDB Atlas is rejecting the username/password combination.

### Steps to Fix:

1. **Verify Database User Exists:**
   - Go to MongoDB Atlas Dashboard
   - Click **Database Access** (left sidebar)
   - Look for `engage_db_user`
   - If it doesn't exist, you need to create it

2. **Check User Permissions:**
   - Click on `engage_db_user` (if it exists)
   - Verify it has **"Read and write to any database"** or at minimum:
     - Database: `procurement_db`
     - Permissions: **Read and write**

3. **Reset Password (if needed):**
   - In Database Access, click on `engage_db_user`
   - Click **Edit** or **Reset Password**
   - Update the password
   - Update your `.env` file with the new password

4. **Or Create New User:**
   - Click **Add New Database User**
   - Username: `procurement_user` (or your choice)
   - Password: Create a strong password
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**
   - Update your connection string with the new credentials

### Test Connection:

Run this to verify credentials work:

```bash
cd server
node verify-credentials.js
```

This will test different connection string formats and show you which one works.

### Update Your .env File:

After verifying/fixing the user, update `server/.env`:

```env
MONGODB_URI=mongodb+srv://engage_db_user:YOUR_PASSWORD@cluster0.kn2lkoq.mongodb.net/?appName=Cluster0
DB_NAME=procurement_db
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

Replace `YOUR_PASSWORD` with the actual password for the database user.

### After Fixing:

1. Restart the server: `npm run dev`
2. You should see: "Connected to MongoDB successfully!"

