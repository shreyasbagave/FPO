import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Test different connection string variations
const credentials = {
  username: 'engage_db_user',
  password: 'dA5av4hwGDCag60j',
  cluster: 'cluster0.kn2lkoq.mongodb.net',
};

const testConnectionStrings = [
  // Original format provided
  `mongodb+srv://${credentials.username}:${credentials.password}@${credentials.cluster}/?appName=Cluster0`,
  // With database name
  `mongodb+srv://${credentials.username}:${credentials.password}@${credentials.cluster}/procurement_db?retryWrites=true&w=majority&appName=Cluster0`,
  // With admin database
  `mongodb+srv://${credentials.username}:${credentials.password}@${credentials.cluster}/admin?retryWrites=true&w=majority&appName=Cluster0`,
];

async function testConnection(uri, label) {
  let client;
  try {
    console.log(`\n=== Testing: ${label} ===`);
    console.log('URI:', uri.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✓ Connected successfully!');
    
    // Try to list databases
    try {
      const adminDb = client.db('admin');
      const result = await adminDb.admin().listDatabases();
      console.log(`✓ Can list databases: ${result.databases.length} found`);
      result.databases.forEach(db => {
        console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      });
    } catch (err) {
      console.log(`⚠ Cannot list databases: ${err.message}`);
    }
    
    // Try to access procurement_db
    try {
      const db = client.db('procurement_db');
      const collections = await db.listCollections().toArray();
      console.log(`✓ Can access procurement_db: ${collections.length} collections found`);
      if (collections.length > 0) {
        collections.forEach(col => console.log(`  - ${col.name}`));
      }
    } catch (err) {
      console.log(`⚠ Cannot access procurement_db: ${err.message}`);
    }
    
    await client.close();
    console.log('✓ Connection closed');
    return true;
  } catch (error) {
    console.log(`✗ Connection failed: ${error.message}`);
    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.log(`  Error code: ${error.code} (${error.codeName})`);
      console.log('  This is an authentication error.');
      console.log('  Possible causes:');
      console.log('    1. Wrong username or password');
      console.log('    2. Database user does not exist');
      console.log('    3. User does not have proper permissions');
    }
    return false;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        // Ignore
      }
    }
  }
}

async function runTests() {
  console.log('MongoDB Credentials Verification');
  console.log('================================\n');
  console.log(`Username: ${credentials.username}`);
  console.log(`Password: ${credentials.password.substring(0, 4)}***`);
  console.log(`Cluster: ${credentials.cluster}`);
  
  for (let i = 0; i < testConnectionStrings.length; i++) {
    const success = await testConnection(
      testConnectionStrings[i],
      `Connection String ${i + 1}`
    );
    
    if (success) {
      console.log(`\n✓ SUCCESS! Use connection string ${i + 1}`);
      break;
    }
    
    // Wait a bit between tests
    if (i < testConnectionStrings.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n================================');
  console.log('Verification complete!');
}

runTests().catch(console.error);

