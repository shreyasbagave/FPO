// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (username, password, role) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
    
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  signup: async (userData) => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },
  
  forgotPassword: async (username, email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ username, email }),
    });
  },
  
  resetPassword: async (resetToken, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  getUsersByRole: async (role) => {
    return apiRequest(`/auth/users/${role}`);
  },
};

// Farmers API
export const farmersAPI = {
  getAll: () => apiRequest('/farmers'),
  getById: (id) => apiRequest(`/farmers/${id}`),
  create: (data) => apiRequest('/farmers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/farmers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/farmers/${id}`, {
    method: 'DELETE',
  }),
};

// Products API
export const productsAPI = {
  getAll: () => apiRequest('/products'),
  getById: (id) => apiRequest(`/products/${id}`),
  create: (data) => apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Procurements API
export const procurementsAPI = {
  getAll: () => apiRequest('/procurements'),
  getById: (id) => apiRequest(`/procurements/${id}`),
  create: (data) => apiRequest('/procurements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/procurements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/procurements/${id}`, {
    method: 'DELETE',
  }),
};

// Sales API
export const salesAPI = {
  getAll: () => apiRequest('/sales'),
  getById: (id) => apiRequest(`/sales/${id}`),
  create: (data) => apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/sales/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => apiRequest('/inventory'),
  getByProductId: (productId) => apiRequest(`/inventory/product/${productId}`),
  create: (data) => apiRequest('/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Dispatches API
export const dispatchesAPI = {
  getAll: () => apiRequest('/dispatches'),
  getById: (id) => apiRequest(`/dispatches/${id}`),
  create: (data) => apiRequest('/dispatches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/dispatches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/dispatches/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// Payments API
export const paymentsAPI = {
  getAll: () => apiRequest('/payments'),
  getById: (id) => apiRequest(`/payments/${id}`),
  create: (data) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/payments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// Activities API
export const activitiesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/activities${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/activities/${id}`),
  create: (data) => apiRequest('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => apiRequest('/analytics/dashboard'),
  getSalesByProduct: () => apiRequest('/analytics/sales-by-product'),
  getProcurementByProduct: () => apiRequest('/analytics/procurement-by-product'),
};

// FPO API
export const fpoAPI = {
  getAll: () => apiRequest('/fpo'),
  getById: (id) => apiRequest(`/fpo/${id}`),
  getDailyRecords: (id, date) => {
    const queryString = date ? `?date=${date}` : '';
    return apiRequest(`/fpo/${id}/daily-records${queryString}`);
  },
};

// Retailers API
export const retailersAPI = {
  getAll: () => apiRequest('/retailers'),
  getById: (id) => apiRequest(`/retailers/${id}`),
  create: (data) => apiRequest('/retailers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/retailers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/retailers/${id}`, {
    method: 'DELETE',
  }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  create: (data) => apiRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllAsRead: () => apiRequest('/notifications/mark-all-read', {
    method: 'PUT',
  }),
  delete: (id) => apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  }),
  deleteAll: () => apiRequest('/notifications', {
    method: 'DELETE',
  }),
};

export default {
  auth: authAPI,
  farmers: farmersAPI,
  products: productsAPI,
  procurements: procurementsAPI,
  sales: salesAPI,
  inventory: inventoryAPI,
  dispatches: dispatchesAPI,
  payments: paymentsAPI,
  activities: activitiesAPI,
  analytics: analyticsAPI,
  fpo: fpoAPI,
  retailers: retailersAPI,
  notifications: notificationsAPI,
};

