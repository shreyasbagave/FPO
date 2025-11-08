import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { testBackendConnection } from '../utils/testConnection';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [step, setStep] = useState('role'); // 'role' or 'credentials'
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Test backend connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testBackendConnection();
      setConnectionStatus(result);
      if (!result.success) {
        setError('Cannot connect to backend. Please check if backend server is running.');
      }
    };
    checkConnection();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('credentials');
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleBack = () => {
    setStep('role');
    setSelectedRole('');
    setFormData({ username: '', password: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData.username, formData.password, selectedRole);

      if (response.success && response.user) {
        // Verify role matches
        if (response.user.role !== selectedRole) {
          setError(`This account is not registered as ${selectedRole}. Please select the correct role.`);
          setLoading(false);
          return;
        }
        onLogin(response.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 w-full max-w-md">
        {/* MAHAFPC Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <img
            src="/logocheck.png"
            alt="MAHAFPC Logo"
            className="h-12 sm:h-16 md:h-20 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2">
          Procurement & Dispatch
        </h1>
        <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Management System</p>

        {/* Connection Status */}
        {connectionStatus && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            connectionStatus.success 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {connectionStatus.success ? (
              <span>✓ Backend connected</span>
            ) : (
              <div>
                <span>✗ Backend not connected</span>
                <p className="text-xs mt-1">{connectionStatus.message}</p>
                <a 
                  href="/test-connection" 
                  className="text-xs underline mt-1 block"
                >
                  Test connection →
                </a>
              </div>
            )}
          </div>
        )}

        {step === 'role' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'FPO', label: 'FPO (Farmer Producer Organization)' },
                  { key: 'MAHAFPC', label: 'MAHAFPC' },
                  { key: 'Retailer', label: 'Market Linkage Partner (MLP)' },
                ].map((role) => (
                  <button
                    key={role.key}
                    onClick={() => handleRoleSelect(role.key)}
                    className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="font-semibold text-gray-800">{role.label}</div>
                    <div className="text-xs text-gray-500 mt-1">Click to continue</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-green-600 hover:text-green-700 hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Role Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Selected Role</p>
                  <p className="font-semibold text-green-700">
                    {selectedRole === 'Retailer' ? 'Market Linkage Partner' : selectedRole}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your username or email"
                disabled={loading}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center space-y-2">
              <Link
                to="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 hover:underline block"
              >
                Forgot Password?
              </Link>
              <div className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-green-600 hover:text-green-700 hover:underline font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
