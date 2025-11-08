import { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar, Filter, X, FileDown, Edit, Trash2 } from 'lucide-react';
import { farmersAPI, productsAPI, procurementsAPI } from '../../services/api';
import { exportProcurementToPDF } from '../../utils/pdfExport';
import { formatQuantityAllUnits, formatQuantity } from '../../utils/unitConverter';

const ProcurementManagement = ({ user, onAlert }) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const todayDate = getTodayDate();
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    farmerId: '',
    productId: '',
  });
  const [formData, setFormData] = useState({
    date: todayDate,
    farmerId: '',
    productId: '',
    quantity: '',
    rate: '',
  });

  // Fetch farmers, products, and procurements from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [farmersRes, productsRes, procurementsRes] = await Promise.all([
          farmersAPI.getAll(),
          productsAPI.getAll(),
          procurementsAPI.getAll(),
        ]);

        if (farmersRes.success) {
          setFarmers(farmersRes.farmers || []);
        }
        if (productsRes.success) {
          setProducts(productsRes.products || []);
        }
        if (procurementsRes.success) {
          // Store all procurements, but filter by today's date for display
          setProcurements(procurementsRes.procurements || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        onAlert && onAlert({
          type: 'error',
          message: 'Failed to load data. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [todayDate, onAlert]);

  const allProcurements = procurements;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const farmer = farmers.find(f => f.id === parseInt(formData.farmerId));
    const product = products.find(p => p.id === parseInt(formData.productId));

    if (!farmer || !product) {
      onAlert && onAlert({
        type: 'error',
        message: 'Please select valid farmer and product',
      });
      return;
    }

    // Quantity is stored in tons (no conversion needed)
    try {
      let response;
      if (editingProcurement) {
        // Update existing procurement
        response = await procurementsAPI.update(editingProcurement.id, {
          farmerId: parseInt(formData.farmerId),
          productId: parseInt(formData.productId),
          quantity: parseFloat(formData.quantity),
          rate: parseFloat(formData.rate),
          date: formData.date,
        });
      } else {
        // Create new procurement
        response = await procurementsAPI.create({
          farmerId: parseInt(formData.farmerId),
          productId: parseInt(formData.productId),
          quantity: parseFloat(formData.quantity), // Store in tons
          rate: parseFloat(formData.rate),
          date: formData.date,
        });
      }

      if (response.success) {
        // Refresh procurements list
        const procurementsRes = await procurementsAPI.getAll();
        if (procurementsRes.success) {
          setProcurements(procurementsRes.procurements || []);
        }
        
        onAlert && onAlert({
          type: 'success',
          message: editingProcurement 
            ? `Procurement updated: ${formData.quantity} ton of ${product.name}`
            : `Procurement recorded: ${formData.quantity} ton of ${product.name}`,
        });
        
        setShowForm(false);
        setEditingProcurement(null);
        setFormData({
          date: todayDate,
          farmerId: '',
          productId: '',
          quantity: '',
          rate: '',
        });
      } else {
        onAlert && onAlert({
          type: 'error',
          message: response.message || `Failed to ${editingProcurement ? 'update' : 'create'} procurement`,
        });
      }
    } catch (error) {
      console.error(`Error ${editingProcurement ? 'updating' : 'creating'} procurement:`, error);
      onAlert && onAlert({
        type: 'error',
        message: error.message || `Failed to ${editingProcurement ? 'update' : 'create'} procurement`,
      });
    }
  };

  const handleEditProcurement = (procurement) => {
    setEditingProcurement(procurement);
    setFormData({
      date: procurement.date,
      farmerId: procurement.farmerId.toString(),
      productId: procurement.productId.toString(),
      quantity: procurement.quantity.toString(),
      rate: procurement.rate.toString(),
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProcurement(null);
    setFormData({
      date: todayDate,
      farmerId: '',
      productId: '',
      quantity: '',
      rate: '',
    });
  };

  const handleDeleteProcurement = async (procurementId, procurementDetails) => {
    if (!window.confirm(`Are you sure you want to delete this procurement?\n\nFarmer: ${procurementDetails.farmerName}\nProduct: ${procurementDetails.productName}\nQuantity: ${procurementDetails.quantity} ton`)) {
      return;
    }

    try {
      const response = await procurementsAPI.delete(procurementId);
      
      if (response.success) {
        // Refresh procurements list
        const procurementsRes = await procurementsAPI.getAll();
        if (procurementsRes.success) {
          setProcurements(procurementsRes.procurements || []);
        }
        
        onAlert && onAlert({
          type: 'success',
          message: 'Procurement deleted successfully',
        });
      } else {
        onAlert && onAlert({
          type: 'error',
          message: response.message || 'Failed to delete procurement',
        });
      }
    } catch (error) {
      console.error('Error deleting procurement:', error);
      onAlert && onAlert({
        type: 'error',
        message: error.message || 'Failed to delete procurement',
      });
    }
  };

  // Filter procurements based on filters (only today's procurements are shown)
  const filteredProcurements = useMemo(() => {
    return allProcurements.filter((procurement) => {
      // Only show today's procurements
      if (procurement.date !== todayDate) return false;

      // Date range filter (only applies within today)
      if (filters.dateFrom && procurement.date < filters.dateFrom) return false;
      if (filters.dateTo && procurement.date > filters.dateTo) return false;

      // Farmer filter
      if (filters.farmerId && procurement.farmerId !== parseInt(filters.farmerId)) return false;

      // Product filter
      if (filters.productId && procurement.productId !== parseInt(filters.productId)) return false;

      return true;
    });
  }, [allProcurements, filters, todayDate]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      farmerId: '',
      productId: '',
    });
  };

  const totalQuantity = filteredProcurements.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = filteredProcurements.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Procurement Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Record daily purchases from farmers</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={async () => await exportProcurementToPDF(filteredProcurements, user, filters)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Export to PDF</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Purchase Entry</span>
            <span className="sm:hidden">New Entry</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Today's Procurements</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{filteredProcurements.length}</p>
          <p className="text-xs text-gray-500 mt-1">{todayDate}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Today's Quantity</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {formatQuantityAllUnits(totalQuantity)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{todayDate}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Today's Amount</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{todayDate}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            {editingProcurement ? 'Edit Purchase Entry' : 'New Purchase Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={todayDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingProcurement ? 'You can change the date' : "Only today's procurements are displayed by default"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farmer
                </label>
                <select
                  value={formData.farmerId}
                  onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Farmer</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name} - {farmer.villageName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (ton)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (₹ per ton)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  value={
                    formData.quantity && formData.rate
                      ? `₹${(parseFloat(formData.quantity) * parseFloat(formData.rate)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                      : ''
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingProcurement ? 'Update Purchase' : 'Save Purchase'}
                </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Procurement History</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} />
              Filters
              {(filters.dateFrom || filters.dateTo || filters.farmerId || filters.productId) && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>
          {(filters.dateFrom || filters.dateTo || filters.farmerId || filters.productId) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Farmer
                </label>
                <select
                  value={filters.farmerId}
                  onChange={(e) => handleFilterChange('farmerId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Farmers</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name} - {farmer.villageName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={filters.productId}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Procurement List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Today's Procurement List</h3>
            <span className="text-sm text-gray-600">
              Showing {filteredProcurements.length} of {allProcurements.length} procurements ({todayDate})
            </span>
          </div>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcurements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {allProcurements.length === 0 ? `No procurements recorded for today (${todayDate})` : 'No procurements match the filters'}
                  </td>
                </tr>
              ) : (
                filteredProcurements.map((procurement) => (
                  <tr key={procurement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {procurement.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {procurement.farmerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {procurement.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(procurement.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{procurement.rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{procurement.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProcurement(procurement)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Edit procurement"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProcurement(procurement.id, {
                            farmerName: procurement.farmerName,
                            productName: procurement.productName,
                            quantity: procurement.quantity
                          })}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete procurement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProcurementManagement;

