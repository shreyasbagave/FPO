import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, DollarSign, User, Calendar } from 'lucide-react';
import { procurementsAPI, paymentsAPI } from '../../services/api';
import { formatQuantity } from '../../utils/unitConverter';

const FarmersRecord = ({ user, onAlert }) => {
  const [procurements, setProcurements] = useState([]);
  const [farmerPayments, setFarmerPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // Fetch procurements and payments from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [procurementsRes, paymentsRes] = await Promise.all([
          procurementsAPI.getAll(),
          paymentsAPI.getAll(),
        ]);

        if (procurementsRes.success) {
          setProcurements(procurementsRes.procurements || []);
        }
        if (paymentsRes.success) {
          setFarmerPayments(paymentsRes.payments || []);
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

  // Helper function to get first and last day of selected month
  const getMonthDateRange = (month, year) => {
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const monthDateRange = getMonthDateRange(selectedMonth, selectedYear);

  // Filter procurements by FPO and selected month/year
  const filteredProcurements = useMemo(() => {
    const fpoProcurements = procurements.filter((p) => p.fpoId === user.id);
    return fpoProcurements.filter((procurement) => {
      return procurement.date >= monthDateRange.firstDay && procurement.date <= monthDateRange.lastDay;
    });
  }, [procurements, user.id, monthDateRange]);
  
  const [expandedFarmers, setExpandedFarmers] = useState(new Set());
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  });

  // Group procurements by farmer (using filtered procurements)
  const farmerRecords = useMemo(() => {
    const grouped = {};
    
    filteredProcurements.forEach((procurement) => {
      const farmerId = procurement.farmerId;
      if (!grouped[farmerId]) {
        grouped[farmerId] = {
          farmerId,
          farmerName: procurement.farmerName,
          procurements: [],
          totalAmount: 0,
        };
      }
      grouped[farmerId].procurements.push(procurement);
      grouped[farmerId].totalAmount += procurement.amount;
    });

    // Sort procurements by date within each farmer group
    Object.keys(grouped).forEach((farmerId) => {
      grouped[farmerId].procurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return Object.values(grouped).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
  }, [filteredProcurements]);

  // Calculate payments and remaining amounts for each farmer (filter payments by selected month/year)
  const farmerRecordsWithPayments = useMemo(() => {
    return farmerRecords.map((record) => {
      // Filter payments by selected month/year
      const monthPayments = farmerPayments.filter((p) => {
        const paymentDate = p.date;
        return paymentDate >= monthDateRange.firstDay && paymentDate <= monthDateRange.lastDay && p.farmerId === record.farmerId;
      });
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = record.totalAmount - totalPaid;

      return {
        ...record,
        payments: monthPayments,
        totalPaid,
        remaining,
      };
    });
  }, [farmerRecords, farmerPayments, monthDateRange]);

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

  const toggleFarmer = (farmerId) => {
    const newExpanded = new Set(expandedFarmers);
    if (newExpanded.has(farmerId)) {
      newExpanded.delete(farmerId);
    } else {
      newExpanded.add(farmerId);
    }
    setExpandedFarmers(newExpanded);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmer) return;

    try {
      const response = await paymentsAPI.create({
        farmerId: selectedFarmer.farmerId,
        date: paymentForm.date,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description || 'Payment to farmer',
      });

      if (response.success) {
        setFarmerPayments([...farmerPayments, response.payment]);
        setShowPaymentForm(false);
        setSelectedFarmer(null);
        setPaymentForm({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          description: '',
        });
        onAlert && onAlert({
          type: 'success',
          message: 'Payment recorded successfully',
        });
      } else {
        onAlert && onAlert({
          type: 'error',
          message: response.message || 'Failed to record payment',
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      onAlert && onAlert({
        type: 'error',
        message: error.message || 'Failed to record payment',
      });
    }
  };

  const openPaymentForm = (record) => {
    setSelectedFarmer(record);
    setShowPaymentForm(true);
  };

  const totalPurchaseAmount = farmerRecordsWithPayments.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaidAmount = farmerRecordsWithPayments.reduce((sum, r) => sum + r.totalPaid, 0);
  const totalRemainingAmount = farmerRecordsWithPayments.reduce((sum, r) => sum + r.remaining, 0);

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Farmers Record</h2>
          <p className="text-sm sm:text-base text-gray-600">Track purchase records and payments to farmers</p>
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
          <p className="text-gray-600 text-sm">Monthly Farmers</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{farmerRecordsWithPayments.length}</p>
          <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Monthly Purchase Amount</p>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{totalPurchaseAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Monthly Amount Paid</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalPaidAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Monthly Remaining</p>
          <p className={`text-3xl font-bold mt-2 ${totalRemainingAmount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            ₹{totalRemainingAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Record Payment - {selectedFarmer.farmerName}
            </h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Payment description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedFarmer(null);
                    setPaymentForm({
                      date: new Date().toISOString().split('T')[0],
                      amount: '',
                      description: '',
                    });
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

      {/* Farmers Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Farmers Record</h3>
            <span className="text-sm text-gray-600">
              Showing {farmerRecordsWithPayments.length} farmers for {getMonthName(selectedMonth)} {selectedYear}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Farmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {farmerRecordsWithPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No farmers records found for {getMonthName(selectedMonth)} {selectedYear}
                  </td>
                </tr>
              ) : (
                farmerRecordsWithPayments.map((record) => {
                  const isExpanded = expandedFarmers.has(record.farmerId);
                  return (
                    <>
                      <tr
                        key={record.farmerId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleFarmer(record.farmerId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={20} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={20} className="text-gray-500" />
                            )}
                            <User size={18} className="text-green-600" />
                            <span className="font-medium text-gray-900">{record.farmerName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900 font-medium">
                            {record.procurements.length} purchase(s)
                          </span>
                          <br />
                          <span className="text-sm text-gray-600">
                            ₹{record.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-blue-600 font-medium">
                            ₹{record.totalPaid.toLocaleString()}
                          </span>
                          {record.payments.length > 0 && (
                            <span className="text-xs text-gray-500 block">
                              ({record.payments.length} payment(s))
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              record.remaining > 0 ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            ₹{record.remaining.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentForm(record);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <DollarSign size={16} />
                            Record Payment
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} />
                                Purchase Records (Date-wise)
                              </h4>
                              <div className="overflow-x-auto table-container">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                        Date
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                        Product
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                        Quantity
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                        Rate (₹/ton)
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                        Amount (₹)
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {record.procurements.map((procurement) => (
                                      <tr key={procurement.id} className="hover:bg-white">
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {new Date(procurement.date).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                          {procurement.productName}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                          {formatQuantity(procurement.quantity)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                          ₹{procurement.rate.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                          ₹{procurement.amount.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-gray-100 font-semibold">
                                    <tr>
                                      <td colSpan="4" className="px-4 py-2 text-sm text-gray-700 text-right">
                                        Total:
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        ₹{record.totalAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>

                              {/* Payment History */}
                              {record.payments.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Payment History
                                  </h5>
                                  <div className="overflow-x-auto table-container">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                            Date
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                            Amount (₹)
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                                            Description
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {record.payments
                                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                                          .map((payment, idx) => (
                                            <tr key={idx} className="hover:bg-white">
                                              <td className="px-4 py-2 text-sm text-gray-900">
                                                {new Date(payment.date).toLocaleDateString('en-IN', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                })}
                                              </td>
                                              <td className="px-4 py-2 text-sm font-medium text-blue-600">
                                                ₹{payment.amount.toLocaleString()}
                                              </td>
                                              <td className="px-4 py-2 text-sm text-gray-700">
                                                {payment.description}
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

export default FarmersRecord;
