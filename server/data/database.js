import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string - use environment variable or construct from provided credentials
// Original connection string format (without database name)
const BASE_URI = process.env.MONGODB_URI || 'mongodb+srv://engage_db_user:orelse12@cluster0.kn2lkoq.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'procurement_db';

// Construct full URI with database name
// If BASE_URI ends with /?appName=Cluster0, replace with /procurement_db?...
// Otherwise, append database name
let MONGODB_URI;
if (BASE_URI.includes('?appName=')) {
  MONGODB_URI = BASE_URI.replace('/?appName=', `/${DB_NAME}?retryWrites=true&w=majority&appName=`);
} else if (BASE_URI.includes('?')) {
  MONGODB_URI = `${BASE_URI}&database=${DB_NAME}`;
} else {
  MONGODB_URI = `${BASE_URI}/${DB_NAME}?retryWrites=true&w=majority`;
}

let client = null;
let db = null;

// Connect to MongoDB
export const connectDB = async () => {
  try {
    if (client) {
      return db;
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('Base URI:', BASE_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')); // Hide credentials in log
    console.log('Database:', DB_NAME);
    console.log('Full connection string:', MONGODB_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')); // Hide credentials in log
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    await client.connect();
    db = client.db(DB_NAME);
    
    // Test connection by listing collections
    const collections = await db.listCollections().toArray();
    console.log('Connected to MongoDB successfully!');
    console.log(`Database: ${DB_NAME}`);
    console.log(`Collections found: ${collections.length}`);
    
    // Initialize collections with sample data if empty
    await initializeCollections();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('\n=== MongoDB Authentication Error ===');
      console.error('Possible causes:');
      console.error('1. Incorrect username or password');
      console.error('2. Database user not found or deleted');
      console.error('3. IP address not whitelisted in MongoDB Atlas');
      console.error('4. Database name does not exist');
      console.error('\nPlease check:');
      console.error('- MongoDB Atlas Dashboard → Database Access (verify user exists)');
      console.error('- MongoDB Atlas Dashboard → Network Access (whitelist your IP)');
      console.error('- Verify connection string credentials');
    }
    
    throw error;
  }
};

// Get database instance
export const getDB = async () => {
  if (!db) {
    await connectDB();
  }
  return db;
};

// Initialize collections with sample data
const initializeCollections = async () => {
  try {
    const database = await getDB();
    
    // Initialize Users with hashed passwords
    const usersCollection = database.collection('users');
    const userCount = await usersCollection.countDocuments();
    if (userCount === 0) {
      // Import bcrypt for password hashing
      const bcrypt = (await import('bcryptjs')).default;
      
      const defaultUsers = [
        { 
          id: 1, 
          username: 'greenvalley', 
          name: 'Green Valley FPO', 
          location: 'Pune', 
          contact: '9876543210', 
          role: 'FPO', 
          email: 'greenvalley@fpo.in',
          password: await bcrypt.hash('fpo123', 10)
        },
        { 
          id: 2, 
          username: 'sunrise', 
          name: 'Sunrise FPO', 
          location: 'Nashik', 
          contact: '9876543211', 
          role: 'FPO', 
          email: 'sunrise@fpo.in',
          password: await bcrypt.hash('fpo123', 10)
        },
        { 
          id: 3, 
          username: 'harvest', 
          name: 'Harvest FPO', 
          location: 'Aurangabad', 
          contact: '9876543212', 
          role: 'FPO', 
          email: 'harvest@fpo.in',
          password: await bcrypt.hash('fpo123', 10)
        },
        { 
          id: 4, 
          username: 'admin', 
          name: 'MAHAFPC Admin', 
          email: 'admin@mahafpc.in', 
          role: 'MAHAFPC', 
          password: await bcrypt.hash('admin123', 10)
        },
        { 
          id: 5, 
          username: 'raigad', 
          name: 'Raigad Market', 
          location: 'Raigad', 
          contact: '9876543223', 
          role: 'Retailer', 
          email: 'raigad@retailer.in',
          password: await bcrypt.hash('retail123', 10)
        },
      ];
      
      await usersCollection.insertMany(defaultUsers);
    }

    // Initialize Farmers - No default farmers, they will be created by FPO users
    // Farmers are now user-specific and will be created through the API

    // Initialize Products
    const productsCollection = database.collection('products');
    const productCount = await productsCollection.countDocuments();
    if (productCount === 0) {
      await productsCollection.insertMany([
        { id: 1, name: 'Wheat', unit: 'kg', category: 'Grains' },
        { id: 2, name: 'Rice', unit: 'kg', category: 'Grains' },
        { id: 3, name: 'Moong Dal', unit: 'kg', category: 'Pulses' },
        { id: 4, name: 'Toor Dal', unit: 'kg', category: 'Pulses' },
        { id: 5, name: 'Gram', unit: 'kg', category: 'Pulses' },
        { id: 6, name: 'Jowar', unit: 'kg', category: 'Grains' },
      ]);
    }

    // Initialize Retailers
    const retailersCollection = database.collection('retailers');
    const retailerCount = await retailersCollection.countDocuments();
    if (retailerCount === 0) {
      await retailersCollection.insertMany([
        { id: 1, name: 'Raigad Market', location: 'Raigad', contact: '9876543223' },
      ]);
    }

    console.log('Collections initialized with sample data');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

// Generate new ID for a collection
export const generateId = async (collectionName) => {
  try {
    const database = await getDB();
    const collection = database.collection(collectionName);
    
    const lastDoc = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    
    return lastDoc.length > 0 ? lastDoc[0].id + 1 : 1;
  } catch (error) {
    console.error('Error generating ID:', error);
    return Date.now();
  }
};

// Close MongoDB connection
export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};

// Helper to get collection
export const getCollection = async (collectionName) => {
  const database = await getDB();
  return database.collection(collectionName);
};
