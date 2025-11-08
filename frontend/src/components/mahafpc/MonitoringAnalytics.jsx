import { useState, useMemo } from 'react';
import { TrendingUp, Package, Users, Filter, X, Calendar } from 'lucide-react';
import {
  mockUsers,
  mockProcurements,
  mockSales,
  mockInventory,
  mockProducts,
  getFPOById,
} from '../../mockData';
import { formatQuantityAllUnits, formatQuantity } from '../../utils/unitConverter';

const MonitoringAnalytics = ({ user, onAlert }) => {
  // Get current month and year
  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1, // 1-12
      year: now.getFullYear(),
    };
  };

  const currentMonthYear = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear.month);
  const [selectedYear, setSelectedYear] = useState(currentMonthYear.year);

  // Helper function to get first and last day of selected month
  const getMonthDateRange = (month, year) => {
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const monthDateRange = getMonthDateRange(selectedMonth, selectedYear);

  // Filter procurements and sales by selected month/year
  const filteredProcurements = useMemo(() => {
    return mockProcurements.filter((procurement) => {
      return procurement.date >= monthDateRange.firstDay && procurement.date <= monthDateRange.lastDay;
    });
  }, [monthDateRange]);

  const filteredSales = useMemo(() => {
    return mockSales.filter((sale) => {
      return sale.date >= monthDateRange.firstDay && sale.date <= monthDateRange.lastDay;
    });
  }, [monthDateRange]);

  const allProcurements = filteredProcurements;
  const allSales = filteredSales;
  const allInventory = mockInventory;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    fpoId: '',
    productId: '',
    status: '',
    timeFrom: '',
    timeTo: '',
  });

  // Filter sales based on additional filters (within selected month)
  const filteredSalesWithFilters = useMemo(() => {
    return allSales.filter((sale) => {
      // Date range filter (applies within selected month)
      if (filters.dateFrom && sale.date < filters.dateFrom) return false;
      if (filters.dateTo && sale.date > filters.dateTo) return false;

      // FPO filter
      if (filters.fpoId && sale.fpoId !== parseInt(filters.fpoId)) return false;

      // Product filter
      if (filters.productId && sale.productId !== parseInt(filters.productId)) return false;

      // Status filter
      if (filters.status && sale.status !== filters.status) return false;

      // Time range filter
      if (filters.timeFrom && sale.time && sale.time < filters.timeFrom) return false;
      if (filters.timeTo && sale.time && sale.time > filters.timeTo) return false;

      return true;
    });
  }, [allSales, filters]);

  // Get month name from number
  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Generate year options (current year, past 5 years, and future 1 year)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Add future year (current + 1)
    years.push(currentYear + 1);
    // Add current year and past 5 years
    for (let i = 0; i <= 5; i++) {
      years.push(currentYear - i);
    }
    // Sort descending
    return years.sort((a, b) => b - a);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      fpoId: '',
      productId: '',
      status: '',
      timeFrom: '',
      timeTo: '',
    });
  };

  // Calculate totals
  const totalProcurement = allProcurements.reduce((sum, p) => sum + p.quantity, 0);
  const totalSales = allSales.reduce((sum, s) => sum + s.quantity, 0);
  const totalRevenue = allSales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenditure = allProcurements.reduce((sum, p) => sum + p.amount, 0);

  // Group by FPO
  const fpoProcurements = {};
  allProcurements.forEach((p) => {
    if (!fpoProcurements[p.fpoId]) {
      fpoProcurements[p.fpoId] = { quantity: 0, amount: 0 };
    }
    fpoProcurements[p.fpoId].quantity += p.quantity;
    fpoProcurements[p.fpoId].amount += p.amount;
  });

  // Group by product
  const productProcurements = {};
  allProcurements.forEach((p) => {
    if (!productProcurements[p.productName]) {
      productProcurements[p.productName] = { quantity: 0, count: 0 };
    }
    productProcurements[p.productName].quantity += p.quantity;
    productProcurements[p.productName].count += 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Monitoring & Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600">View all FPO procurement and sales summaries</p>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-600" size={20} />
            <span className="text-sm font-medium text-gray-700">Select Month:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium"
            >
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const current = getCurrentMonthYear();
                setSelectedMonth(current.month);
                setSelectedYear(current.year);
              }}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Current Month
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Showing data for <span className="font-semibold">{getMonthName(selectedMonth)} {selectedYear}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Procurement</p>
              <p className="text-3xl font-bold text-gray-800">{formatQuantityAllUnits(totalProcurement)}</p>
              <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Sales</p>
              <p className="text-3xl font-bold text-gray-800">{formatQuantityAllUnits(totalSales)}</p>
              <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-lg">
              <Users className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active FPOs</p>
              <p className="text-2xl font-bold text-gray-800">{mockUsers.fpo.length}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
          </div>
        </div>
      </div>

      {/* FPO-wise Procurement Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly FPO-wise Procurement Summary</h3>
            <span className="text-sm text-gray-600">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FPO Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(fpoProcurements).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No procurement data available for {getMonthName(selectedMonth)} {selectedYear}
                  </td>
                </tr>
              ) : (
                Object.keys(fpoProcurements).map((fpoId) => {
                  const fpo = getFPOById(parseInt(fpoId));
                  const data = fpoProcurements[fpoId];
                  return (
                    <tr key={fpoId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fpo?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fpo?.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatQuantity(data.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{data.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product-wise Flow Analysis */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Product-wise Flow Analysis</h3>
            <span className="text-sm text-gray-600">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity (ton)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procurement Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(productProcurements).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No procurement data available for {getMonthName(selectedMonth)} {selectedYear}
                  </td>
                </tr>
              ) : (
                Object.keys(productProcurements).map((productName) => {
                  const data = productProcurements[productName];
                  const inventoryItem = allInventory.find((i) => i.productName === productName);
                  return (
                    <tr key={productName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatQuantity(data.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inventoryItem ? formatQuantityAllUnits(inventoryItem.quantity) : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Sales Summary (FPO to MAHAFPC)</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} />
              Filters
              {(filters.dateFrom || filters.dateTo || filters.fpoId || filters.productId || filters.status || filters.timeFrom || filters.timeTo) && (
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>
          {(filters.dateFrom || filters.dateTo || filters.fpoId || filters.productId || filters.status || filters.timeFrom || filters.timeTo) && (
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
                  FPO
                </label>
                <select
                  value={filters.fpoId}
                  onChange={(e) => handleFilterChange('fpoId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All FPOs</option>
                  {mockUsers.fpo.map((fpo) => (
                    <option key={fpo.id} value={fpo.id}>
                      {fpo.name}
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
                  {mockProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Time
                </label>
                <input
                  type="time"
                  value={filters.timeFrom}
                  onChange={(e) => handleFilterChange('timeFrom', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Time
                </label>
                <input
                  type="time"
                  value={filters.timeTo}
                  onChange={(e) => handleFilterChange('timeTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
        <div className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Sales List</h3>
            <span className="text-sm text-gray-600">
              Showing {filteredSalesWithFilters.length} sales for {getMonthName(selectedMonth)} {selectedYear}
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
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FPO
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalesWithFilters.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {allSales.length === 0 ? `No sales recorded for ${getMonthName(selectedMonth)} ${selectedYear}` : 'No sales match the filters'}
                  </td>
                </tr>
              ) : (
                filteredSalesWithFilters.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.time || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.fpoName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(sale.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{sale.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sale.status}
                    </span>
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

export default MonitoringAnalytics;

