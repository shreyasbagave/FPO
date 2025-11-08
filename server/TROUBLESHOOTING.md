# MongoDB Connection Troubleshooting

## Authentication Error: "bad auth : Authentication failed" (Code 8000)

This error typically means one of the following:

### 1. Check MongoDB Atlas Database Access

1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com
2. Navigate to **Database Access** (left sidebar)
3. Verify the user `engage_db_user` exists
4. Check the user's password
5. Ensure the user has **Read and write** permissions (or at minimum, **Read and write to any database**)

**To fix:**
- If user doesn't exist, create a new database user
- If password is wrong, reset the password
- Update the connection string with the correct credentials

### 2. Check IP Whitelist

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access** (left sidebar)
3. Check if your IP address is whitelisted
4. If not, click **Add IP Address**
5. For development, you can temporarily allow all IPs: `0.0.0.0/0` (not recommended for production)

**To fix:**
- Add your current IP address
- Or add `0.0.0.0/0` for all IPs (development only)
- Wait 1-2 minutes for changes to take effect

### 3. Verify Connection String Format

The connection string should be in this format:
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**Current connection string:**
```
mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority&appName=Cluster0
```

**To test:**
1. Try connecting without specifying a database name:
   ```
   mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

2. Or try with a default database name:
   ```
   mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/admin?retryWrites=true&w=majority&appName=Cluster0
   ```

### 4. Test Connection Using MongoDB Compass

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Use the connection string to test the connection
3. If Compass can connect, the issue is with the Node.js code
4. If Compass can't connect, the issue is with credentials or network access

### 5. Quick Fix: Use Environment Variable

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=procurement_db
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

Make sure the credentials in the `.env` file match your MongoDB Atlas settings.

### 6. Alternative: Create New Database User

If the existing user doesn't work:

1. Go to MongoDB Atlas → Database Access
2. Click **Add New Database User**
3. Create a new user with:
   - Username: `procurement_user` (or your choice)
   - Password: (create a strong password)
   - Database User Privileges: **Read and write to any database**
4. Click **Add User**
5. Update your `.env` file with the new credentials

### 7. Test Connection Script

Create a test file `test-connection.js` in the server directory:

```javascript
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✓ Connected successfully!');
    
    const db = client.db('procurement_db');
    const collections = await db.listCollections().toArray();
    console.log(`✓ Found ${collections.length} collections`);
    
    await client.close();
    console.log('✓ Connection closed');
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error code name:', error.codeName);
  }
}

testConnection();
```

Run it:
```bash
node test-connection.js
```

## Common Solutions

1. **Most common fix:** Whitelist your IP address in Network Access
2. **Second most common:** Verify database user credentials
3. **Third:** Check if the database name exists or needs to be created

## Still Not Working?

1. Check MongoDB Atlas status page for any outages
2. Verify your internet connection
3. Try connecting from a different network
4. Contact MongoDB Atlas support if the user definitely exists and IP is whitelisted

