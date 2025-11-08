# Procurement Frontend

Frontend application for the Procurement and Dispatch Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm run dev
```

## Backend Connection

The frontend is configured to connect to the backend API at `http://localhost:5000/api` by default.

Make sure the backend server is running before starting the frontend.

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:5000/api`)

## Features

- Role-based authentication (FPO, MAHAFPC, Retailer)
- Real-time data synchronization with backend
- JWT token-based authentication
- Responsive design
