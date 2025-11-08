import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://engage_db_user:dA5av4hwGDCag60j@cluster0.kn2lkoq.mongodb.net/procurement_db?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  let client;
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✓ Connected successfully!');
    
    // Test different databases
    const dbNames = ['procurement_db', 'admin', 'test'];
    
    for (const dbName of dbNames) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        console.log(`✓ Database "${dbName}": Found ${collections.length} collections`);
      } catch (err) {
        console.log(`✗ Database "${dbName}": ${err.message}`);
      }
    }
    
    // Test listing all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    console.log(`\n✓ Available databases: ${result.databases.map(d => d.name).join(', ')}`);
    
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error code name:', error.codeName);
    
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('\n=== AUTHENTICATION ERROR ===');
      console.error('This usually means:');
      console.error('1. Wrong username or password');
      console.error('2. Database user does not exist');
      console.error('3. IP address not whitelisted');
      console.error('\nPlease check:');
      console.error('- MongoDB Atlas → Database Access (verify user)');
      console.error('- MongoDB Atlas → Network Access (whitelist IP)');
    }
  } finally {
    if (client) {
      await client.close();
      console.log('\n✓ Connection closed');
    }
  }
}

testConnection();

