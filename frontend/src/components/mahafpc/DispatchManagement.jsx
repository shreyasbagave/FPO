import { useState } from 'react';
import { Plus, Truck, CheckCircle, Clock } from 'lucide-react';
import {
  mockDispatches,
  mockUsers,
  mockProducts,
  mockInventory,
  getFPOById,
  getRetailerById,
  getProductById,
} from '../../mockData';
import { formatQuantity } from '../../utils/unitConverter';

const DispatchManagement = ({ user, onAlert }) => {
  const [dispatches, setDispatches] = useState(mockDispatches);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fpoId: '',
    retailerId: '',
    productId: '',
    quantity: '',
    rate: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fpo = getFPOById(parseInt(formData.fpoId));
    const retailer = getRetailerById(parseInt(formData.retailerId));
    const product = getProductById(parseInt(formData.productId));

    // Quantity is stored in tons (no conversion needed)
    const newDispatch = {
      id: dispatches.length + 1,
      date: formData.date,
      fpoId: parseInt(formData.fpoId),
      fpoName: fpo.name,
      retailerId: parseInt(formData.retailerId),
      retailerName: retailer.name,
      productId: parseInt(formData.productId),
      productName: product.name,
      quantity: parseFloat(formData.quantity), // Store in tons
      rate: parseFloat(formData.rate),
      amount: parseFloat(formData.quantity) * parseFloat(formData.rate),
      status: 'pending',
      lotThreshold: 20, // In tons
    };

    setDispatches([newDispatch, ...dispatches]);
    onAlert({
      type: 'success',
      message: `Dispatch call generated for ${formData.quantity} ton of ${product.name}`,
    });
    setShowForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      fpoId: '',
      retailerId: '',
      productId: '',
      quantity: '',
      rate: '',
    });
  };

  const handleStatusChange = (dispatchId, newStatus) => {
    setDispatches(
      dispatches.map((d) => (d.id === dispatchId ? { ...d, status: newStatus } : d))
    );
    onAlert({
      type: 'success',
      message: `Dispatch status updated to ${newStatus}`,
    });
  };

  const pendingDispatches = dispatches.filter((d) => d.status === 'pending');
  const completedDispatches = dispatches.filter((d) => d.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dispatch Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Generate dispatch calls and coordinate logistics</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Generate Dispatch Call</span>
          <span className="sm:hidden">New Dispatch</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending Dispatches</p>
              <p className="text-3xl font-bold text-gray-800">{pendingDispatches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Dispatches</p>
              <p className="text-3xl font-bold text-gray-800">{completedDispatches.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Dispatches</p>
              <p className="text-3xl font-bold text-gray-800">{dispatches.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Generate Dispatch Call</h3>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FPO
                </label>
                <select
                  value={formData.fpoId}
                  onChange={(e) => setFormData({ ...formData, fpoId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select FPO</option>
                  {mockUsers.fpo.map((fpo) => (
                    <option key={fpo.id} value={fpo.id}>
                      {fpo.name} - {fpo.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Linkage Partner (MLP)
                </label>
                <select
                  value={formData.retailerId}
                  onChange={(e) => setFormData({ ...formData, retailerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select MLP</option>
                  {mockUsers.retailer.map((retailer) => (
                    <option key={retailer.id} value={retailer.id}>
                      {retailer.name} - {retailer.location}
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
                  {mockProducts.map((product) => (
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
                      ? `₹${(parseFloat(formData.quantity) * parseFloat(formData.rate)).toLocaleString()}`
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
                Generate Dispatch Call
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispatch List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Dispatch Calls</h3>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FPO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MLP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No dispatch calls generated yet
                  </td>
                </tr>
              ) : (
                dispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dispatch.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dispatch.fpoName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dispatch.retailerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dispatch.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(dispatch.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{dispatch.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          dispatch.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {dispatch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dispatch.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(dispatch.id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
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

export default DispatchManagement;

