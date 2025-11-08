// Test connection to backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    console.log('API URL:', API_BASE_URL);
    
    // Test health endpoint (no auth required)
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      console.log('✓ Backend is connected!');
      console.log('Response:', data);
      return { success: true, message: 'Backend connected', data };
    } else {
      console.error('✗ Backend returned error:', data);
      return { success: false, message: data.message || 'Backend error', data };
    }
  } catch (error) {
    console.error('✗ Cannot connect to backend:', error.message);
    console.error('Make sure:');
    console.error('1. Backend server is running on port 5000');
    console.error('2. CORS is enabled in backend');
    console.error('3. API URL is correct:', API_BASE_URL);
    return { 
      success: false, 
      message: error.message,
      error: error 
    };
  }
};

// Test authentication endpoint
export const testAuthEndpoint = async () => {
  try {
    console.log('Testing auth endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/auth/users/FPO`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Auth endpoint is working!');
      console.log('FPO users:', data.users);
      return { success: true, data };
    } else {
      console.error('✗ Auth endpoint error:', data);
      return { success: false, message: data.message, data };
    }
  } catch (error) {
    console.error('✗ Auth endpoint error:', error.message);
    return { success: false, message: error.message, error };
  }
};

// Run all tests
export const runConnectionTests = async () => {
  console.log('=== Backend Connection Tests ===\n');
  
  const healthTest = await testBackendConnection();
  console.log('\n');
  
  const authTest = await testAuthEndpoint();
  console.log('\n');
  
  console.log('=== Test Results ===');
  console.log('Health Check:', healthTest.success ? '✓ PASS' : '✗ FAIL');
  console.log('Auth Endpoint:', authTest.success ? '✓ PASS' : '✗ FAIL');
  
  return {
    health: healthTest,
    auth: authTest,
    allPassed: healthTest.success && authTest.success,
  };
};

