import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, Building2, Users, TrendingUp, DollarSign, CheckCircle, XCircle, Eye, Package } from 'lucide-react';
import { mockUsers, mockProcurements, mockSales, mockPayments } from '../../mockData';
import { formatQuantity } from '../../utils/unitConverter';

const FPOManagement = ({ user, onAlert }) => {
  // Initialize FPOs with status field (active by default)
  const initialFPOs = mockUsers.fpo.map(fpo => ({
    ...fpo,
    status: 'active', // active, inactive
    email: fpo.email || `${fpo.name.toLowerCase().replace(/\s+/g, '')}@fpo.in`,
    registrationDate: fpo.registrationDate || '2025-09-01',
    totalFarmers: fpo.totalFarmers || Math.floor(Math.random() * 100) + 20,
  }));

  const [fpos, setFPOs] = useState(initialFPOs);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFPO, setSelectedFPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact: '',
    email: '',
    registrationDate: new Date().toISOString().split('T')[0],
    totalFarmers: '',
  });

  // Get statistics for an FPO
  const getFPOStatistics = (fpoId) => {
    const procurements = mockProcurements.filter(p => p.fpoId === fpoId);
    const sales = mockSales.filter(s => s.fpoId === fpoId);
    const payments = mockPayments.filter(p => p.fpoId === fpoId);

    const totalProcurement = procurements.reduce((sum, p) => sum + p.quantity, 0);
    const totalProcurementAmount = procurements.reduce((sum, p) => sum + p.amount, 0);
    const totalSales = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

    // Procurement by product
    const procurementByProduct = {};
    procurements.forEach(p => {
      if (!procurementByProduct[p.productName]) {
        procurementByProduct[p.productName] = { quantity: 0, amount: 0, count: 0 };
      }
      procurementByProduct[p.productName].quantity += p.quantity;
      procurementByProduct[p.productName].amount += p.amount;
      procurementByProduct[p.productName].count += 1;
    });

    // Procurement by date
    const procurementByDate = {};
    procurements.forEach(p => {
      if (!procurementByDate[p.date]) {
        procurementByDate[p.date] = { quantity: 0, amount: 0, count: 0 };
      }
      procurementByDate[p.date].quantity += p.quantity;
      procurementByDate[p.date].amount += p.amount;
      procurementByDate[p.date].count += 1;
    });

    // Top farmers by procurement
    const farmerProcurements = {};
    procurements.forEach(p => {
      if (!farmerProcurements[p.farmerName]) {
        farmerProcurements[p.farmerName] = { quantity: 0, amount: 0, count: 0 };
      }
      farmerProcurements[p.farmerName].quantity += p.quantity;
      farmerProcurements[p.farmerName].amount += p.amount;
      farmerProcurements[p.farmerName].count += 1;
    });

    // Sales by product
    const salesByProduct = {};
    sales.forEach(s => {
      if (!salesByProduct[s.productName]) {
        salesByProduct[s.productName] = { quantity: 0, amount: 0, count: 0 };
      }
      salesByProduct[s.productName].quantity += s.quantity;
      salesByProduct[s.productName].amount += s.amount;
      salesByProduct[s.productName].count += 1;
    });

    // Sales by date
    const salesByDate = {};
    sales.forEach(s => {
      if (!salesByDate[s.date]) {
        salesByDate[s.date] = { quantity: 0, amount: 0, count: 0 };
      }
      salesByDate[s.date].quantity += s.quantity;
      salesByDate[s.date].amount += s.amount;
      salesByDate[s.date].count += 1;
    });

    // Sales by status
    const salesByStatus = {};
    sales.forEach(s => {
      if (!salesByStatus[s.status]) {
        salesByStatus[s.status] = { quantity: 0, amount: 0, count: 0 };
      }
      salesByStatus[s.status].quantity += s.quantity;
      salesByStatus[s.status].amount += s.amount;
      salesByStatus[s.status].count += 1;
    });

    // Payment analytics
    const paymentsByStatus = {};
    payments.forEach(p => {
      if (!paymentsByStatus[p.status]) {
        paymentsByStatus[p.status] = { amount: 0, count: 0 };
      }
      paymentsByStatus[p.status].amount += p.amount;
      paymentsByStatus[p.status].count += 1;
    });

    // Performance metrics
    const profitMargin = totalSalesAmount - totalProcurementAmount;
    const profitMarginPercentage = totalProcurementAmount > 0 
      ? ((profitMargin / totalProcurementAmount) * 100).toFixed(2)
      : 0;
    const averageProcurementSize = procurements.length > 0 
      ? totalProcurementAmount / procurements.length 
      : 0;
    const averageSalesSize = sales.length > 0 
      ? totalSalesAmount / sales.length 
      : 0;

    return {
      totalProcurement,
      totalProcurementAmount,
      totalSales,
      totalSalesAmount,
      totalPayments,
      pendingPayments,
      procurementCount: procurements.length,
      salesCount: sales.length,
      paymentCount: payments.length,
      procurementByProduct,
      procurementByDate,
      farmerProcurements,
      salesByProduct,
      salesByDate,
      salesByStatus,
      paymentsByStatus,
      profitMargin,
      profitMarginPercentage,
      averageProcurementSize,
      averageSalesSize,
      procurements,
      sales,
      payments,
    };
  };

  // Filter FPOs based on search
  const filteredFPOs = useMemo(() => {
    return fpos.filter(fpo => {
      const searchLower = searchTerm.toLowerCase();
      return (
        fpo.name.toLowerCase().includes(searchLower) ||
        fpo.location.toLowerCase().includes(searchLower) ||
        fpo.contact.includes(searchTerm) ||
        (fpo.email && fpo.email.toLowerCase().includes(searchLower))
      );
    });
  }, [fpos, searchTerm]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newFPO = {
      id: Math.max(...fpos.map(f => f.id), 0) + 1,
      name: formData.name,
      location: formData.location,
      contact: formData.contact,
      email: formData.email,
      registrationDate: formData.registrationDate,
      totalFarmers: parseInt(formData.totalFarmers) || 0,
      status: 'active',
    };

    setFPOs([...fpos, newFPO]);
    onAlert({
      type: 'success',
      message: `FPO "${newFPO.name}" created successfully`,
    });
    setShowForm(false);
    resetForm();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedFPOs = fpos.map(fpo =>
      fpo.id === selectedFPO.id
        ? {
            ...fpo,
            name: formData.name,
            location: formData.location,
            contact: formData.contact,
            email: formData.email,
            registrationDate: formData.registrationDate,
            totalFarmers: parseInt(formData.totalFarmers) || fpo.totalFarmers,
          }
        : fpo
    );

    setFPOs(updatedFPOs);
    onAlert({
      type: 'success',
      message: `FPO "${formData.name}" updated successfully`,
    });
    setShowEditForm(false);
    setSelectedFPO(null);
    resetForm();
  };

  const handleDelete = (fpoId) => {
    if (window.confirm('Are you sure you want to delete this FPO?')) {
      const fpo = fpos.find(f => f.id === fpoId);
      setFPOs(fpos.filter(f => f.id !== fpoId));
      onAlert({
        type: 'success',
        message: `FPO "${fpo.name}" deleted successfully`,
      });
    }
  };

  const handleStatusToggle = (fpoId) => {
    const updatedFPOs = fpos.map(fpo =>
      fpo.id === fpoId
        ? { ...fpo, status: fpo.status === 'active' ? 'inactive' : 'active' }
        : fpo
    );
    const fpo = fpos.find(f => f.id === fpoId);
    setFPOs(updatedFPOs);
    onAlert({
      type: 'success',
      message: `FPO "${fpo.name}" ${fpo.status === 'active' ? 'deactivated' : 'activated'}`,
    });
  };

  const openEditForm = (fpo) => {
    setSelectedFPO(fpo);
    setFormData({
      name: fpo.name,
      location: fpo.location,
      contact: fpo.contact,
      email: fpo.email || '',
      registrationDate: fpo.registrationDate || new Date().toISOString().split('T')[0],
      totalFarmers: fpo.totalFarmers?.toString() || '',
    });
    setShowEditForm(true);
  };

  const openDetails = (fpo) => {
    setSelectedFPO(fpo);
    setShowDetails(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      contact: '',
      email: '',
      registrationDate: new Date().toISOString().split('T')[0],
      totalFarmers: '',
    });
  };

  const totalFPOs = fpos.length;
  const activeFPOs = fpos.filter(f => f.status === 'active').length;
  const inactiveFPOs = fpos.filter(f => f.status === 'inactive').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">FPO Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Create and manage Farmer Producer Organizations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Create New FPO</span>
          <span className="sm:hidden">New FPO</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total FPOs</p>
              <p className="text-3xl font-bold text-gray-800">{totalFPOs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active FPOs</p>
              <p className="text-3xl font-bold text-gray-800">{activeFPOs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Inactive FPOs</p>
              <p className="text-3xl font-bold text-gray-800">{inactiveFPOs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Farmers</p>
              <p className="text-3xl font-bold text-gray-800">
                {fpos.reduce((sum, f) => sum + (f.totalFarmers || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search FPOs by name, location, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create New FPO</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FPO Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label>
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Farmers</label>
                  <input
                    type="number"
                    value={formData.totalFarmers}
                    onChange={(e) => setFormData({ ...formData, totalFarmers: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create FPO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && selectedFPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Edit FPO</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedFPO(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FPO Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label>
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Farmers</label>
                  <input
                    type="number"
                    value={formData.totalFarmers}
                    onChange={(e) => setFormData({ ...formData, totalFarmers: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update FPO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedFPO(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedFPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">FPO Analytics & Details</h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedFPO(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {(() => {
              const stats = getFPOStatistics(selectedFPO.id);
              return (
                <div className="space-y-6">
                  {/* FPO Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Building2 size={18} />
                      FPO Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{selectedFPO.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{selectedFPO.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900">{selectedFPO.contact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedFPO.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registration Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedFPO.registrationDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedFPO.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedFPO.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Total Procurement</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {formatQuantity(stats.totalProcurement)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{stats.totalProcurementAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {stats.procurementCount} transactions
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {formatQuantity(stats.totalSales)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{stats.totalSalesAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {stats.salesCount} transactions
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Total Payments</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        ₹{stats.totalPayments.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Pending: ₹{stats.pendingPayments.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{stats.profitMargin.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.profitMarginPercentage}% margin
                      </p>
                    </div>
                  </div>

                  {/* Procurement Analytics */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package size={18} />
                      Procurement Analytics
                    </h4>
                    
                    {/* Procurement by Product */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">By Product</h5>
                      <div className="overflow-x-auto table-container">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Transactions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {Object.keys(stats.procurementByProduct).length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-3 py-4 text-center text-gray-500 text-sm">
                                  No procurement data
                                </td>
                              </tr>
                            ) : (
                              Object.entries(stats.procurementByProduct)
                                .sort((a, b) => b[1].amount - a[1].amount)
                                .map(([product, data]) => (
                                  <tr key={product}>
                                    <td className="px-3 py-2 font-medium text-gray-900">{product}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatQuantity(data.quantity)}</td>
                                    <td className="px-3 py-2 text-gray-700">₹{data.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-gray-500">{data.count}</td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top Farmers */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Top Farmers by Procurement</h5>
                      <div className="overflow-x-auto table-container">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Farmer</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Transactions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {Object.keys(stats.farmerProcurements).length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-3 py-4 text-center text-gray-500 text-sm">
                                  No farmer data
                                </td>
                              </tr>
                            ) : (
                              Object.entries(stats.farmerProcurements)
                                .sort((a, b) => b[1].amount - a[1].amount)
                                .slice(0, 5)
                                .map(([farmer, data]) => (
                                  <tr key={farmer}>
                                    <td className="px-3 py-2 font-medium text-gray-900">{farmer}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatQuantity(data.quantity)}</td>
                                    <td className="px-3 py-2 text-gray-700">₹{data.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-gray-500">{data.count}</td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Sales Analytics */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={18} />
                      Sales Analytics
                    </h4>
                    
                    {/* Sales by Product */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">By Product</h5>
                      <div className="overflow-x-auto table-container">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Product</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Transactions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {Object.keys(stats.salesByProduct).length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-3 py-4 text-center text-gray-500 text-sm">
                                  No sales data
                                </td>
                              </tr>
                            ) : (
                              Object.entries(stats.salesByProduct)
                                .sort((a, b) => b[1].amount - a[1].amount)
                                .map(([product, data]) => (
                                  <tr key={product}>
                                    <td className="px-3 py-2 font-medium text-gray-900">{product}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatQuantity(data.quantity)}</td>
                                    <td className="px-3 py-2 text-gray-700">₹{data.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-gray-500">{data.count}</td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sales by Status */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">By Status</h5>
                      <div className="overflow-x-auto table-container">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Transactions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {Object.keys(stats.salesByStatus).length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-3 py-4 text-center text-gray-500 text-sm">
                                  No status data
                                </td>
                              </tr>
                            ) : (
                              Object.entries(stats.salesByStatus).map(([status, data]) => (
                                <tr key={status}>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">{formatQuantity(data.quantity)}</td>
                                  <td className="px-3 py-2 text-gray-700">₹{data.amount.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-gray-500">{data.count}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Payment Analytics */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <DollarSign size={18} />
                      Payment Analytics
                    </h4>
                    <div className="overflow-x-auto table-container">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Transactions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.keys(stats.paymentsByStatus).length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-3 py-4 text-center text-gray-500 text-sm">
                                No payment data
                              </td>
                            </tr>
                          ) : (
                            Object.entries(stats.paymentsByStatus).map(([status, data]) => (
                              <tr key={status}>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-700">₹{data.amount.toLocaleString()}</td>
                                <td className="px-3 py-2 text-gray-500">{data.count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp size={18} />
                      Performance Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Average Procurement Size</p>
                        <p className="text-lg font-bold text-gray-800 mt-1">
                          ₹{stats.averageProcurementSize.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Average Sales Size</p>
                        <p className="text-lg font-bold text-gray-800 mt-1">
                          ₹{stats.averageSalesSize.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Total Farmers</p>
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {selectedFPO.totalFarmers || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Profit Margin %</p>
                        <p className={`text-lg font-bold mt-1 ${
                          parseFloat(stats.profitMarginPercentage) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stats.profitMarginPercentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FPOs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  FPO Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Farmers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFPOs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No FPOs found
                  </td>
                </tr>
              ) : (
                filteredFPOs.map((fpo) => {
                  const stats = getFPOStatistics(fpo.id);
                  return (
                    <tr key={fpo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="text-green-600" />
                          <span className="font-medium text-gray-900">{fpo.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {fpo.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {fpo.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {fpo.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {fpo.totalFarmers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            fpo.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {fpo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetails(fpo)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditForm(fpo)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(fpo.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              fpo.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={fpo.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {fpo.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(fpo.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FPOManagement;

