# Procurement Backend API

Backend API for the Procurement and Dispatch Management System.

## Features

- RESTful API with Express.js
- MongoDB database integration
- JWT authentication
- Role-based access control (FPO, MAHAFPC, Retailer)
- Complete CRUD operations for all entities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```
MONGODB_URI=mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with role and user ID
- `GET /api/auth/users/:role` - Get users by role

### Farmers
- `GET /api/farmers` - Get all farmers
- `GET /api/farmers/:id` - Get farmer by ID
- `POST /api/farmers` - Create farmer (FPO only)
- `PUT /api/farmers/:id` - Update farmer (FPO only)
- `DELETE /api/farmers/:id` - Delete farmer (FPO only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (MAHAFPC only)
- `PUT /api/products/:id` - Update product (MAHAFPC only)
- `DELETE /api/products/:id` - Delete product (MAHAFPC only)

### Procurements
- `GET /api/procurements` - Get all procurements (filtered by FPO)
- `GET /api/procurements/:id` - Get procurement by ID
- `POST /api/procurements` - Create procurement (FPO only)
- `PUT /api/procurements/:id` - Update procurement (FPO only)
- `DELETE /api/procurements/:id` - Delete procurement (FPO only)

### Sales
- `GET /api/sales` - Get all sales (filtered by FPO)
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create sale (FPO only)
- `PUT /api/sales/:id` - Update sale (FPO only)
- `PUT /api/sales/:id/status` - Update sale status (MAHAFPC only)

### Inventory
- `GET /api/inventory` - Get all inventory (filtered by FPO)
- `GET /api/inventory/product/:productId` - Get inventory by product
- `POST /api/inventory` - Create/update inventory
- `PUT /api/inventory/:id` - Update inventory

### Dispatches
- `GET /api/dispatches` - Get all dispatches
- `GET /api/dispatches/:id` - Get dispatch by ID
- `POST /api/dispatches` - Create dispatch (MAHAFPC only)
- `PUT /api/dispatches/:id` - Update dispatch (MAHAFPC only)
- `PUT /api/dispatches/:id/status` - Update dispatch status

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `PUT /api/payments/:id/status` - Update payment status

### Activities
- `GET /api/activities` - Get all activities (filtered by FPO)
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create activity

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/sales-by-product` - Get sales grouped by product
- `GET /api/analytics/procurement-by-product` - Get procurements grouped by product

### FPO
- `GET /api/fpo` - Get all FPOs
- `GET /api/fpo/:id` - Get FPO by ID
- `GET /api/fpo/:id/daily-records` - Get FPO daily records (MAHAFPC only)

### Retailers
- `GET /api/retailers` - Get all retailers
- `GET /api/retailers/:id` - Get retailer by ID
- `POST /api/retailers` - Create retailer (MAHAFPC only)
- `PUT /api/retailers/:id` - Update retailer (MAHAFPC only)
- `DELETE /api/retailers/:id` - Delete retailer (MAHAFPC only)

## Authentication

All endpoints except `/api/auth/login` and `/api/health` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Roles

- **FPO**: Farmer Producer Organization - can manage farmers, procurements, sales, inventory
- **MAHAFPC**: Federation - can manage products, dispatches, payments, retailers, approve sales
- **Retailer**: Market Linkage Partner - can view dispatches and products

## Database

The application uses MongoDB. Collections are automatically initialized with sample data on first run.

## Health Check

- `GET /api/health` - Check if API is running

