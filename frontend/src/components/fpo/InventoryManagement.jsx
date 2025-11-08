import { useState, useEffect } from 'react';
import { Package, FileDown } from 'lucide-react';
import { inventoryAPI, procurementsAPI } from '../../services/api';
import { exportInventoryToPDF } from '../../utils/pdfExport';
import { formatQuantityAllUnits, formatQuantity } from '../../utils/unitConverter';

const InventoryManagement = ({ user, onAlert }) => {
  const [inventory, setInventory] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch inventory and procurements from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [inventoryRes, procurementsRes] = await Promise.all([
          inventoryAPI.getAll(),
          procurementsAPI.getAll(),
        ]);
        
        if (inventoryRes.success) {
          setInventory(inventoryRes.inventory || []);
        } else {
          onAlert && onAlert({
            type: 'error',
            message: 'Failed to load inventory',
          });
        }

        if (procurementsRes.success) {
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
  }, [onAlert]);

  // Calculate average rate per ton for each product from procurements
  const calculateAverageRate = (productId) => {
    const productProcurements = procurements.filter(p => p.productId === productId);
    if (productProcurements.length === 0) return 0;
    
    // Calculate weighted average rate
    // Quantity is stored in tons, rate is per ton
    let totalWeightedRate = 0;
    let totalQuantityInTons = 0;
    
    productProcurements.forEach(p => {
      const quantityInTons = p.quantity || 0; // Already in tons
      const rate = p.rate || 0;
      totalWeightedRate += quantityInTons * rate;
      totalQuantityInTons += quantityInTons;
    });
    
    if (totalQuantityInTons === 0) return 0;
    
    // Return weighted average rate per ton
    return totalWeightedRate / totalQuantityInTons;
  };

  // Calculate inventory with rates and values
  const inventoryWithRates = inventory.map(item => {
    const avgRate = calculateAverageRate(item.productId);
    const quantityInTons = item.quantity || 0; // Already in tons
    const totalValue = quantityInTons * avgRate;
    
    return {
      ...item,
      avgRate,
      quantityInTons,
      totalValue,
    };
  });

  // Calculate total value based on actual procurement rates
  const totalValue = inventoryWithRates.reduce((sum, item) => {
    return sum + (item.totalValue || 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-600">Real-time stock levels and alerts</p>
        </div>
        <button
          onClick={async () => await exportInventoryToPDF(inventory, user, inventoryWithRates, totalValue)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileDown size={20} />
          Export to PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Products</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{inventory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Stock</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {formatQuantityAllUnits(inventory.reduce((sum, item) => sum + item.quantity, 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Estimated Value</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600">No inventory found</p>
          <p className="text-sm text-gray-500 mt-2">Inventory will appear here once procurements are recorded</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {inventory.map((item) => {
            return (
              <div key={item.id || item.productId} className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.productName}</h3>
                    <p className="text-sm text-gray-600">{item.unit || 'kg'}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="text-green-600" size={24} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Stock</span>
                    <span className="font-semibold text-lg">{formatQuantity(item.quantity)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Product-wise Stock Details</h3>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate per Ton (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value (₹)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryWithRates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No inventory found
                  </td>
                </tr>
              ) : (
                inventoryWithRates.map((item) => {
                  return (
                    <tr key={item.id || item.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.avgRate > 0 ? `₹${item.avgRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.totalValue > 0 ? `₹${item.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {inventoryWithRates.length > 0 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan="3">
                    Total Value
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900">
                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;

