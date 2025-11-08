import { useState, useMemo } from 'react';
import { Calendar, Package, TrendingUp, DollarSign, FileText, Filter, Download } from 'lucide-react';
import { mockUsers, mockProcurements, mockSales, mockInventory, getFPOById } from '../../mockData';
import { formatQuantity, formatQuantityAllUnits } from '../../utils/unitConverter';
import { exportFPODailyRecordToPDF } from '../../utils/pdfExport';

const FPODailyRecord = ({ user, onAlert }) => {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  // Default to custom range that includes mock data (September to November 2025)
  // Or use today if you want to see today's data
  const defaultDateFrom = '2025-09-01';
  const defaultDateTo = '2025-11-30';
  const [dateFilterType, setDateFilterType] = useState('custom'); // 'today' or 'custom'
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [selectedFPO, setSelectedFPO] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  // Individual FPO filters - state for each FPO's product filter
  const [fpoFilters, setFpoFilters] = useState({});
  const [fpoSearchTerms, setFpoSearchTerms] = useState({});

  // Get all FPOs
  const fpos = mockUsers.fpo;

  // Filter procurements by date range and FPO
  const filteredProcurements = useMemo(() => {
    return mockProcurements.filter((p) => {
      let matchDate = true;
      if (dateFilterType === 'today') {
        matchDate = p.date === today;
      } else if (dateFilterType === 'custom') {
        matchDate = p.date >= dateFrom && p.date <= dateTo;
      }
      const matchFPO = !selectedFPO || p.fpoId === parseInt(selectedFPO);
      const matchProduct = !selectedProduct || p.productId === parseInt(selectedProduct);
      return matchDate && matchFPO && matchProduct;
    });
  }, [dateFilterType, dateFrom, dateTo, today, selectedFPO, selectedProduct]);

  // Filter sales by date range and FPO
  const filteredSales = useMemo(() => {
    return mockSales.filter((s) => {
      let matchDate = true;
      if (dateFilterType === 'today') {
        matchDate = s.date === today;
      } else if (dateFilterType === 'custom') {
        matchDate = s.date >= dateFrom && s.date <= dateTo;
      }
      const matchFPO = !selectedFPO || s.fpoId === parseInt(selectedFPO);
      const matchProduct = !selectedProduct || s.productId === parseInt(selectedProduct);
      return matchDate && matchFPO && matchProduct;
    });
  }, [dateFilterType, dateFrom, dateTo, today, selectedFPO, selectedProduct]);

  // Calculate daily record for each FPO
  const getFPODailyRecord = (fpoId) => {
    const fpo = getFPOById(fpoId);
    if (!fpo) return null;

    const fpoProcurements = filteredProcurements.filter((p) => p.fpoId === fpoId);
    const fpoSales = filteredSales.filter((s) => s.fpoId === fpoId);

    // Calculate inventory for this FPO based on procurements and sales
    // Inventory = (Initial stock + Procurements) - Sales
    // Get base inventory for this FPO, or use default if not found
    const baseInventory = mockInventory.filter((item) => item.fpoId === fpoId);
    const allProducts = Array.from(new Set([...fpoProcurements, ...fpoSales].map((p) => p.productId)));
    
    const fpoInventory = allProducts.map((productId) => {
      const baseItem = baseInventory.find((item) => item.productId === productId);
      const productProcurements = fpoProcurements.filter((p) => p.productId === productId);
      const productSales = fpoSales.filter((s) => s.productId === productId);
      const totalProcured = productProcurements.reduce((sum, p) => sum + p.quantity, 0);
      const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
      
      // Get product name from first procurement or sale
      const productName = productProcurements[0]?.productName || productSales[0]?.productName || 'Unknown';
      
      // Base inventory + procurement - sales (simplified calculation)
      const baseQty = baseItem?.quantity || 0;
      const calculatedQuantity = baseQty + totalProcured - totalSold;
      
      return {
        productId,
        productName,
        quantity: Math.max(0, calculatedQuantity), // Ensure non-negative
        unit: 'kg',
      };
    });

    // Calculate totals
    const totalProcurementQuantity = fpoProcurements.reduce((sum, p) => sum + p.quantity, 0);
    const totalProcurementAmount = fpoProcurements.reduce((sum, p) => sum + p.amount, 0);
    const totalSalesQuantity = fpoSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalSalesAmount = fpoSales.reduce((sum, s) => sum + s.amount, 0);
    const totalInventory = fpoInventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalBusiness = totalProcurementAmount + totalSalesAmount;

    // Group by product
    const productWiseData = {};
    
    fpoProcurements.forEach((p) => {
      if (!productWiseData[p.productId]) {
        productWiseData[p.productId] = {
          productId: p.productId,
          productName: p.productName,
          procurementQuantity: 0,
          procurementAmount: 0,
          procurementRate: 0,
          salesQuantity: 0,
          salesAmount: 0,
          salesRate: 0,
          inventory: 0,
        };
      }
      productWiseData[p.productId].procurementQuantity += p.quantity;
      productWiseData[p.productId].procurementAmount += p.amount;
      productWiseData[p.productId].procurementRate = 
        productWiseData[p.productId].procurementAmount / productWiseData[p.productId].procurementQuantity;
    });

    fpoSales.forEach((s) => {
      if (!productWiseData[s.productId]) {
        productWiseData[s.productId] = {
          productId: s.productId,
          productName: s.productName,
          procurementQuantity: 0,
          procurementAmount: 0,
          procurementRate: 0,
          salesQuantity: 0,
          salesAmount: 0,
          salesRate: 0,
          inventory: 0,
        };
      }
      productWiseData[s.productId].salesQuantity += s.quantity;
      productWiseData[s.productId].salesAmount += s.amount;
      productWiseData[s.productId].salesRate = 
        productWiseData[s.productId].salesAmount / productWiseData[s.productId].salesQuantity;
    });

    fpoInventory.forEach((item) => {
      if (productWiseData[item.productId]) {
        productWiseData[item.productId].inventory = item.quantity;
      }
    });

    return {
      fpo,
      procurements: fpoProcurements,
      sales: fpoSales,
      inventory: fpoInventory,
      totals: {
        procurementQuantity: totalProcurementQuantity,
        procurementAmount: totalProcurementAmount,
        salesQuantity: totalSalesQuantity,
        salesAmount: totalSalesAmount,
        inventory: totalInventory,
        totalBusiness,
      },
      productWiseData: Object.values(productWiseData),
    };
  };

  // Get all FPO daily records
  const fpoRecords = useMemo(() => {
    const fpoIds = selectedFPO 
      ? [parseInt(selectedFPO)] 
      : fpos.map((fpo) => fpo.id);
    
    return fpoIds.map((fpoId) => getFPODailyRecord(fpoId)).filter((record) => record !== null);
  }, [filteredProcurements, filteredSales, selectedFPO, fpos]);

  // Overall totals
  const overallTotals = useMemo(() => {
    return fpoRecords.reduce(
      (acc, record) => ({
        procurementQuantity: acc.procurementQuantity + record.totals.procurementQuantity,
        procurementAmount: acc.procurementAmount + record.totals.procurementAmount,
        salesQuantity: acc.salesQuantity + record.totals.salesQuantity,
        salesAmount: acc.salesAmount + record.totals.salesAmount,
        inventory: acc.inventory + record.totals.inventory,
        totalBusiness: acc.totalBusiness + record.totals.totalBusiness,
      }),
      {
        procurementQuantity: 0,
        procurementAmount: 0,
        salesQuantity: 0,
        salesAmount: 0,
        inventory: 0,
        totalBusiness: 0,
      }
    );
  }, [fpoRecords]);

  const handleExportPDF = () => {
    const dateLabel = dateFilterType === 'today' 
      ? today 
      : dateFilterType === 'custom' 
        ? `${dateFrom} to ${dateTo}`
        : 'All Dates';
    exportFPODailyRecordToPDF(fpoRecords, dateLabel, overallTotals);
    onAlert({
      type: 'success',
      message: 'FPO Daily Record exported to PDF successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">FPO Daily Record</h2>
          <p className="text-sm sm:text-base text-gray-600">Daily records of FPO procurement, sales, inventory, and business</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export to PDF</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>
          {(dateFilterType !== 'custom' || dateFrom !== defaultDateFrom || dateTo !== defaultDateTo || selectedFPO || selectedProduct) && (
            <button
              onClick={() => {
                setDateFilterType('custom');
                setDateFrom(defaultDateFrom);
                setDateTo(defaultDateTo);
                setSelectedFPO('');
                setSelectedProduct('');
              }}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Date Filter Section */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Filter
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Filter Type Selection */}
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateFilterType"
                    value="today"
                    checked={dateFilterType === 'today'}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Today</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateFilterType"
                    value="custom"
                    checked={dateFilterType === 'custom'}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Custom Range</span>
                </label>
              </div>
              
              {/* Date Range Inputs */}
              {dateFilterType === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      max={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom}
                      max={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  {(dateFrom !== today || dateTo !== today) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setDateFrom(today);
                          setDateTo(today);
                        }}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm whitespace-nowrap"
                        title="Set to today"
                      >
                        Today
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FPO
            </label>
            <select
              value={selectedFPO}
              onChange={(e) => setSelectedFPO(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All FPOs</option>
              {fpos.map((fpo) => (
                <option key={fpo.id} value={fpo.id}>
                  {fpo.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              {Array.from(new Set([...mockProcurements, ...mockSales].map((p) => p.productId))).map((productId) => {
                const product = mockProcurements.find((p) => p.productId === productId) || mockSales.find((s) => s.productId === productId);
                return (
                  <option key={productId} value={productId}>
                    {product?.productName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        {/* Quick Date Filters */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Date Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setDateFilterType('today');
                setDateFrom(today);
                setDateTo(today);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dateFilterType === 'today'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setDateFilterType('custom');
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDateFrom(yesterday.toISOString().split('T')[0]);
                setDateTo(yesterday.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                setDateFilterType('custom');
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                setDateFrom(weekAgo.toISOString().split('T')[0]);
                setDateTo(today);
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                setDateFilterType('custom');
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                setDateFrom(monthAgo.toISOString().split('T')[0]);
                setDateTo(today);
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-blue-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Total Procurement</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {formatQuantityAllUnits(overallTotals.procurementQuantity)}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Total Sales</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {formatQuantityAllUnits(overallTotals.salesQuantity)}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-purple-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Total Inventory</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {formatQuantityAllUnits(overallTotals.inventory)}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-yellow-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Procurement Amount</p>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            ₹{overallTotals.procurementAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Sales Amount</p>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            ₹{overallTotals.salesAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-indigo-600" size={20} />
            <p className="text-gray-600 text-xs sm:text-sm">Total Business</p>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            ₹{overallTotals.totalBusiness.toLocaleString()}
          </p>
        </div>
      </div>

      {/* FPO Records */}
      {fpoRecords.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No records found for the selected filters</p>
        </div>
      ) : (
        fpoRecords.map((record) => (
          <div key={record.fpo.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* FPO Header */}
            <div className="px-4 sm:px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">{record.fpo.name}</h3>
                  <p className="text-sm text-gray-600">{record.fpo.location}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date: </span>
                    <span className="font-semibold">
                      {dateFilterType === 'today' 
                        ? new Date(today).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : dateFilterType === 'custom'
                          ? `${new Date(dateFrom).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })} - ${new Date(dateTo).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}`
                          : 'All Dates'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Business: </span>
                    <span className="font-semibold text-green-700">
                      ₹{record.totals.totalBusiness.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Products: </span>
                    <span className="font-semibold">{record.productWiseData.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FPO Summary Cards */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Procurement Quantity</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {formatQuantity(record.totals.procurementQuantity)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Procurement Amount</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    ₹{record.totals.procurementAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Sales Quantity</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {formatQuantity(record.totals.salesQuantity)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Sales Amount</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    ₹{record.totals.salesAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Inventory</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {formatQuantity(record.totals.inventory)}
                  </p>
                </div>
              </div>
            </div>

            {/* FPO Filters */}
            <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Product
                  </label>
                  <select
                    value={fpoFilters[record.fpo.id] || ''}
                    onChange={(e) => {
                      setFpoFilters({
                        ...fpoFilters,
                        [record.fpo.id]: e.target.value,
                      });
                    }}
                    className="w-full sm:w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Products</option>
                    {record.productWiseData.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search Product
                  </label>
                  <input
                    type="text"
                    value={fpoSearchTerms[record.fpo.id] || ''}
                    onChange={(e) => {
                      setFpoSearchTerms({
                        ...fpoSearchTerms,
                        [record.fpo.id]: e.target.value,
                      });
                    }}
                    placeholder="Search by product name..."
                    className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {(fpoFilters[record.fpo.id] || fpoSearchTerms[record.fpo.id]) && (
                  <button
                    onClick={() => {
                      setFpoFilters({
                        ...fpoFilters,
                        [record.fpo.id]: '',
                      });
                      setFpoSearchTerms({
                        ...fpoSearchTerms,
                        [record.fpo.id]: '',
                      });
                    }}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full sm:w-auto"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Product-wise Details Table */}
            <div className="overflow-x-auto table-container">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procurement Qty (ton)
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Rate (₹/ton)
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Qty (ton)
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rate (₹/ton)
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Amount (₹)
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory (ton)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Filter products for this FPO
                    let filteredProducts = record.productWiseData;
                    
                    // Apply product filter
                    if (fpoFilters[record.fpo.id]) {
                      filteredProducts = filteredProducts.filter(
                        (p) => p.productId === parseInt(fpoFilters[record.fpo.id])
                      );
                    }
                    
                    // Apply search filter
                    if (fpoSearchTerms[record.fpo.id]) {
                      const searchTerm = fpoSearchTerms[record.fpo.id].toLowerCase();
                      filteredProducts = filteredProducts.filter(
                        (p) => p.productName.toLowerCase().includes(searchTerm)
                      );
                    }
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            No products found matching the filters
                          </td>
                        </tr>
                      );
                    }
                    
                    return filteredProducts.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.productName}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatQuantity(product.procurementQuantity)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.procurementQuantity > 0 && product.procurementRate > 0
                            ? `₹${(product.procurementRate * 1000).toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatQuantity(product.salesQuantity)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.salesQuantity > 0 && product.salesRate > 0
                            ? `₹${(product.salesRate * 1000).toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{(product.procurementAmount + product.salesAmount).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatQuantity(product.inventory)}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FPODailyRecord;

