import { useState } from 'react';
import { Package, ShoppingCart, X, ShoppingBag } from 'lucide-react';
import { mockProducts, mockInventory } from '../../mockData';
import { formatQuantity, formatQuantityAllUnits } from '../../utils/unitConverter';

const ProductView = ({ user, onAlert }) => {
  const [products] = useState(mockProducts);
  const [inventory] = useState(mockInventory);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Mock rates (in real app, these would come from MAHAFPC)
  // Rates are per ton, between 30000-50000
  const mockRates = {
    1: 35000, // Wheat
    2: 38000, // Rice
    3: 42000, // Moong Dal
    4: 45000, // Toor Dal
    5: 40000, // Gram
    6: 32000, // Jowar
  };

  const getProductRate = (productId) => {
    return mockRates[productId] || 0;
  };

  const getProductStock = (productId) => {
    // Aggregate stock across all FPOs for this product
    const items = inventory.filter((i) => i.productId === productId);
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleOrderNow = () => {
    if (!selectedProduct) return;
    setShowOrderModal(true);
    setOrderForm({
      quantity: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || !orderForm.quantity) return;

    const rate = getProductRate(selectedProduct.id);
    const amount = parseFloat(orderForm.quantity) * rate;

    // Get existing orders from localStorage or initialize empty array
    const existingOrders = JSON.parse(localStorage.getItem('retailerOrders') || '[]');
    
    const newOrder = {
      id: Date.now(),
      date: orderForm.date,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: parseFloat(orderForm.quantity), // Store in tons
      rate: rate,
      amount: amount,
      status: 'pending',
      supplier: 'MAHA FPC',
    };

    // Save to localStorage
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem('retailerOrders', JSON.stringify(updatedOrders));

    onAlert({
      type: 'success',
      message: `Order placed successfully for ${orderForm.quantity} ton of ${selectedProduct.name} from MAHA FPC!`,
    });

    setShowOrderModal(false);
    setOrderForm({
      quantity: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Products & Rates</h2>
        <p className="text-sm sm:text-base text-gray-600">View available products and current rates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Available Products</p>
              <p className="text-3xl font-bold text-gray-800">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Stock</p>
              <p className="text-3xl font-bold text-gray-800">
                {formatQuantityAllUnits(inventory.reduce((sum, i) => sum + i.quantity, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Product Categories</p>
              <p className="text-3xl font-bold text-gray-800">
                {[...new Set(products.map((p) => p.category))].length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {products.map((product) => {
          const rate = getProductRate(product.id);
          const stock = getProductStock(product.id);
          const isAvailable = stock > 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow p-6 ${
                selectedProduct?.id === product.id ? 'ring-2 ring-green-500' : ''
              } ${!isAvailable ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="text-blue-600" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="text-lg font-bold text-gray-800">₹{rate} / ton</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Stock:</span>
                  <span
                    className={`text-sm font-semibold ${
                      isAvailable ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatQuantity(stock)}
                  </span>
                </div>
                {!isAvailable && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">Out of Stock</p>
                  </div>
                )}
                {isAvailable && (
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      onAlert({
                        type: 'info',
                        message: `${product.name} selected. You can place a purchase request.`,
                      });
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Product Details */}
      {selectedProduct && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Product Details</h3>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Product Name</p>
              <p className="text-lg font-semibold text-gray-800">{selectedProduct.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-800">{selectedProduct.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rate</p>
              <p className="text-lg font-semibold text-gray-800">
                ₹{getProductRate(selectedProduct.id)} / ton
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Stock</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatQuantity(getProductStock(selectedProduct.id))}
              </p>
            </div>
          </div>
          {getProductStock(selectedProduct.id) > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={handleOrderNow}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <ShoppingBag size={20} />
                Order Now from MAHA FPC
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Product Catalog</h3>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate (₹/ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Stock (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const rate = getProductRate(product.id);
                const stock = getProductStock(product.id);
                const isAvailable = stock > 0;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{rate} / ton
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(stock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Place Order from MAHA FPC</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Product:</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedProduct.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rate:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{getProductRate(selectedProduct.id)} / ton
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available Stock:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatQuantity(getProductStock(selectedProduct.id))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Supplier:</span>
                  <span className="text-sm font-semibold text-blue-600">MAHA FPC</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderForm.date}
                  onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (ton)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={getProductStock(selectedProduct.id)}
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter quantity in tons"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum available: {formatQuantity(getProductStock(selectedProduct.id))}
                </p>
              </div>

              {orderForm.quantity && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Rate:</span>
                    <span className="text-sm font-semibold text-gray-800">
                      ₹{getProductRate(selectedProduct.id)} / ton
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {orderForm.quantity} ton
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-base font-semibold text-gray-800">Total Amount:</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{(parseFloat(orderForm.quantity) * getProductRate(selectedProduct.id)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <ShoppingBag size={20} />
                  Place Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;

