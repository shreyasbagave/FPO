import { useState, useEffect } from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { mockInventory, mockProducts } from '../../mockData';
import { formatQuantityAllUnits, formatQuantity } from '../../utils/unitConverter';

const InventoryControl = ({ user, onAlert }) => {
  // Aggregate inventory across all FPOs
  const aggregateInventory = mockInventory.reduce((acc, item) => {
    const existing = acc.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item, fpoId: undefined }); // Remove fpoId for aggregated view
    }
    return acc;
  }, []);
  
  const [inventory, setInventory] = useState(aggregateInventory);
  const [minLotQuantity] = useState(20); // 20 tons
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check for lot threshold alerts
    inventory.forEach((item) => {
      const totalValue = item.quantity * 30; // Mock rate
      if (totalValue >= minLotQuantity) {
        onAlert({
          type: 'success',
          message: `Dispatch Ready: ${item.productName} has reached minimum lot quantity (${minLotQuantity} ton)`,
        });
      }
    });
  }, [inventory, minLotQuantity, onAlert]);

  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity * 30, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Control</h2>
          <p className="text-gray-600">Monitor real-time stock levels and movements</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Settings size={20} />
          Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Inventory Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Lot Quantity (for dispatch)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${minLotQuantity} ton`}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
                <span className="text-sm text-gray-600">
                  System will alert when this threshold is reached
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Products</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{inventory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Stock</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{formatQuantityAllUnits(totalQuantity)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Estimated Value</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Min Lot Threshold</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{minLotQuantity} tons</p>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const lotValue = item.quantity * 30; // Mock rate
          const isDispatchReady = lotValue >= minLotQuantity;

          return (
            <div
              key={item.productId}
              className={`bg-white rounded-lg shadow p-6 ${
                isDispatchReady ? 'border-2 border-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.productName}</h3>
                  <p className="text-sm text-gray-600">{item.unit}</p>
                </div>
                {isDispatchReady && (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <AlertTriangle className="text-green-600" size={20} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-semibold text-lg">{formatQuantity(item.quantity)}</span>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Lot Value:</span>
                    <span className="font-semibold">₹{lotValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Threshold:</span>
                    <span className="font-semibold">₹{minLotQuantity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {isDispatchReady && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-semibold">
                    ✓ Dispatch Ready - Minimum lot quantity reached!
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                  Lot Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispatch Ready
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => {
                const lotValue = item.quantity * 30;
                const isDispatchReady = lotValue >= minLotQuantity;
                return (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{lotValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isDispatchReady ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryControl;

