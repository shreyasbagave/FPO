import { useState } from 'react';
import { testBackendConnection, testAuthEndpoint, runConnectionTests } from '../utils/testConnection';

const ConnectionTest = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    const testResults = await runConnectionTests();
    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Backend Connection Test</h2>
      
      <button
        onClick={handleTest}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {results && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${results.allPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-semibold mb-2">
              Overall Status: {results.allPassed ? '✓ Connected' : '✗ Not Connected'}
            </h3>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-1">
                Health Check: {results.health.success ? '✓ PASS' : '✗ FAIL'}
              </h4>
              {results.health.success ? (
                <p className="text-sm text-gray-600">{results.health.data?.message}</p>
              ) : (
                <p className="text-sm text-red-600">{results.health.message}</p>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-1">
                Auth Endpoint: {results.auth.success ? '✓ PASS' : '✗ FAIL'}
              </h4>
              {results.auth.success ? (
                <div className="text-sm text-gray-600">
                  <p>Found {results.auth.data?.users?.length || 0} FPO users</p>
                </div>
              ) : (
                <p className="text-sm text-red-600">{results.auth.message}</p>
              )}
            </div>
          </div>

          {!results.allPassed && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-2">Troubleshooting:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Make sure backend server is running: <code className="bg-gray-100 px-1 rounded">npm run dev</code> in server folder</li>
                <li>Check if backend is accessible: <code className="bg-gray-100 px-1 rounded">https://fpob.onrender.com/api/health</code></li>
                <li>Verify CORS is enabled in backend</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;

