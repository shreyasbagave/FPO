import { useState, useEffect } from 'react';
import { User, Plus, X, Edit } from 'lucide-react';
import { farmersAPI } from '../../services/api';

const FarmerManagement = ({ user, onAlert }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    villageName: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch farmers from API
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setLoading(true);
        const response = await farmersAPI.getAll();
        if (response.success) {
          setFarmers(response.farmers || []);
        } else {
          onAlert && onAlert({
            type: 'error',
            message: 'Failed to load farmers',
          });
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
        onAlert && onAlert({
          type: 'error',
          message: 'Failed to load farmers. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, [onAlert]);

  // Handle add farmer form
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormError('');
  };

  const handleAddFarmer = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mobileNumber || !formData.villageName) {
      setFormError('Please fill in all fields');
      return;
    }

    // Validate mobile number
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobileNumber)) {
      setFormError('Mobile number must be exactly 10 digits');
      return;
    }

    try {
      if (editingFarmer) {
        // Update existing farmer
        const response = await farmersAPI.update(editingFarmer.id, formData);
        
        if (response.success) {
          // Update farmer in the list
          setFarmers(farmers.map(f => f.id === editingFarmer.id ? response.farmer : f));
          setShowAddForm(false);
          setEditingFarmer(null);
          setFormData({ name: '', mobileNumber: '', villageName: '' });
          setFormError('');
          
          onAlert && onAlert({
            type: 'success',
            message: `Farmer ${response.farmer.name} updated successfully`,
          });
        } else {
          setFormError(response.message || 'Failed to update farmer');
        }
      } else {
        // Create new farmer
        const response = await farmersAPI.create(formData);
        
        if (response.success) {
          // Add new farmer to the list
          setFarmers([...farmers, response.farmer]);
          setShowAddForm(false);
          setFormData({ name: '', mobileNumber: '', villageName: '' });
          setFormError('');
          
          onAlert && onAlert({
            type: 'success',
            message: `Farmer ${response.farmer.name} added successfully`,
          });
        } else {
          setFormError(response.message || 'Failed to add farmer');
        }
      }
    } catch (error) {
      console.error('Error saving farmer:', error);
      setFormError(error.message || `Failed to ${editingFarmer ? 'update' : 'add'} farmer`);
    }
  };

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      mobileNumber: farmer.mobileNumber,
      villageName: farmer.villageName,
    });
    setFormError('');
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingFarmer(null);
    setFormData({ name: '', mobileNumber: '', villageName: '' });
    setFormError('');
  };

  const handleDeleteFarmer = async (farmerId, farmerName) => {
    if (!window.confirm(`Are you sure you want to delete ${farmerName}?`)) {
      return;
    }

    try {
      const response = await farmersAPI.delete(farmerId);
      
      if (response.success) {
        setFarmers(farmers.filter(f => f.id !== farmerId));
        onAlert && onAlert({
          type: 'success',
          message: `Farmer ${farmerName} deleted successfully`,
        });
      } else {
        onAlert && onAlert({
          type: 'error',
          message: response.message || 'Failed to delete farmer',
        });
      }
    } catch (error) {
      console.error('Error deleting farmer:', error);
      onAlert && onAlert({
        type: 'error',
        message: error.message || 'Failed to delete farmer',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Farmer Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your farmers - add, view, and delete farmers</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add New Farmer
        </button>
      </div>

      {/* Add/Edit Farmer Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16 sm:pt-20 md:pt-24">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mt-4 sm:mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
              </h3>
              <button
                onClick={handleCancelForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddFarmer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farmer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter farmer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter 10 digits only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="villageName"
                  value={formData.villageName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter village name"
                  required
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingFarmer ? 'Update Farmer' : 'Add Farmer'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farmers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Farmers</h3>
            <span className="text-sm text-gray-600">
              Total: {farmers.length} farmer{farmers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading farmers...</p>
          </div>
        ) : farmers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No farmers found</p>
            <p className="text-sm mt-2">Click "Add New Farmer" to add your first farmer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Farmer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mobile Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Village Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-green-600" />
                        <span className="font-medium text-gray-900">{farmer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {farmer.mobileNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {farmer.villageName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditFarmer(farmer)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerManagement;

