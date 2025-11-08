# Backend-Frontend Connection Test Guide

## Quick Test

### 1. Test Backend Health Endpoint

Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Procurement API is running"
}
```

### 2. Test Frontend Connection

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open the frontend in browser (usually `http://localhost:5173`)

3. Go to the test page:
   ```
   http://localhost:5173/test-connection
   ```

4. Click "Test Connection" button

### 3. Test from Login Page

The Login page automatically tests the connection when it loads. You'll see:
- ✓ Green badge if connected
- ✗ Red badge with error message if not connected

## Manual API Test

### Using Browser Console

1. Open browser console (F12)
2. Run:
   ```javascript
   fetch('http://localhost:5000/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

### Using curl (Terminal)

```bash
curl http://localhost:5000/api/health
```

## Expected Results

### ✓ Connected (Success)
- Backend health check returns: `{"status":"OK"}`
- Auth endpoint returns user list
- No CORS errors in browser console
- Login page shows green connection status

### ✗ Not Connected (Failure)
- Network error (backend not running)
- CORS error (CORS not configured)
- 404 error (wrong URL)
- Connection refused (backend not on port 5000)

## Troubleshooting

### Backend Not Running
```bash
cd server
npm run dev
```
Check if you see: `Server is running on port 5000`

### CORS Error
Make sure backend has:
```javascript
app.use(cors());
```

### Wrong Port
- Backend default: `5000`
- Frontend default: `5173`
- Check `.env` files if changed

### Check API URL
Frontend uses: `http://localhost:5000/api`
Verify in `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Test Checklist

- [ ] Backend server is running (`npm run dev` in server folder)
- [ ] Backend health endpoint works (`http://localhost:5000/api/health`)
- [ ] Frontend can reach backend (no CORS errors)
- [ ] Login page shows connection status
- [ ] Can fetch users from API
- [ ] Can login successfully

## Connection Test Component

A dedicated test component is available at:
- Route: `/test-connection`
- Component: `frontend/src/components/ConnectionTest.jsx`

This component tests:
1. Health endpoint
2. Auth endpoint
3. Shows detailed error messages

