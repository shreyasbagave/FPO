# Procurement System Setup Guide

## Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```
MONGODB_URI=mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

4. **Important: MongoDB Atlas Setup**
   - Go to MongoDB Atlas dashboard
   - Navigate to Network Access
   - Add your IP address (or use `0.0.0.0/0` for all IPs during development)
   - Ensure the database user has proper permissions

5. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal)

## Testing the Connection

1. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","message":"Procurement API is running"}`

2. **Test MongoDB Connection:**
   - Check the backend console for "Connected to MongoDB" message
   - If you see authentication errors, verify:
     - MongoDB Atlas IP whitelist includes your IP
     - Database user credentials are correct
     - Database name is correct

3. **Test Frontend Login:**
   - Open the frontend in browser
   - Select a role (FPO, MAHAFPC, or MLP)
   - Select a user
   - Click Login
   - Should redirect to dashboard

## Troubleshooting

### MongoDB Authentication Error

If you see "bad auth : Authentication failed" error:

1. **Check IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add your current IP address
   - Or temporarily allow all IPs (0.0.0.0/0) for development

2. **Verify Credentials:**
   - Ensure the username and password in the connection string are correct
   - Check if the database user has read/write permissions

3. **Check Connection String:**
   - Ensure the connection string format is correct
   - Database name should be `procurement_db`

### Frontend Can't Connect to Backend

1. **Check Backend is Running:**
   - Verify backend is running on port 5000
   - Check console for errors

2. **Check CORS:**
   - Backend has CORS enabled
   - If issues persist, check browser console for CORS errors

3. **Check API URL:**
   - Verify `.env` file has correct `VITE_API_URL`
   - Restart frontend after changing `.env`

## Default Users

The system initializes with these default users:

- **FPO Users:**
  - Green Valley FPO (ID: 1)
  - Sunrise FPO (ID: 2)
  - Harvest FPO (ID: 3)

- **MAHAFPC:**
  - MAHAFPC Admin (ID: 4)

- **Retailer:**
  - Raigad Market (ID: 5)

## API Endpoints

All API endpoints are prefixed with `/api`:

- Authentication: `/api/auth/*`
- Farmers: `/api/farmers/*`
- Products: `/api/products/*`
- Procurements: `/api/procurements/*`
- Sales: `/api/sales/*`
- Inventory: `/api/inventory/*`
- Dispatches: `/api/dispatches/*`
- Payments: `/api/payments/*`
- Activities: `/api/activities/*`
- Analytics: `/api/analytics/*`

See `server/README.md` for complete API documentation.

