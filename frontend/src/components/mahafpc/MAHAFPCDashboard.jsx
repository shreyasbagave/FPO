import { useState, useRef, useEffect } from 'react';
import { BarChart3, Package, Truck, DollarSign, Store, LogOut, Bell, AlertCircle, Building2, User, ChevronDown, Menu, FileText } from 'lucide-react';
import MonitoringAnalytics from './MonitoringAnalytics';
import InventoryControl from './InventoryControl';
import DispatchManagement from './DispatchManagement';
import PaymentManagement from './PaymentManagement';
import RetailerLinkage from './RetailerLinkage';
import FPOManagement from './FPOManagement';
import FPODailyRecord from './FPODailyRecord';
import Footer from '../common/Footer';

const MAHAFPCDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, right: 0 });
  const [profilePosition, setProfilePosition] = useState({ top: 0, right: 0 });
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const tabs = [
    { id: 'monitoring', name: 'Monitoring & Analytics', icon: BarChart3 },
    { id: 'inventory', name: 'Inventory Control', icon: Package },
    { id: 'dispatch', name: 'Dispatch Management', icon: Truck },
    { id: 'payments', name: 'Payment Management', icon: DollarSign },
    { id: 'retailers', name: 'Market Linkage Partner', icon: Store },
    { id: 'fpo', name: 'FPO Management', icon: Building2 },
    { id: 'fpo-daily', name: 'FPO Daily Record', icon: FileText },
  ];

  const addAlert = (alert) => {
    const alertWithId = { ...alert, id: Date.now(), timestamp: new Date(), read: false };
    // Only add to notifications, not to temporary alerts
    setNotifications((prev) => [alertWithId, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Update dropdown positions when they open
  useEffect(() => {
    if (showNotifications && notificationRef.current) {
      const button = notificationRef.current.querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        setNotificationPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showProfileMenu && profileRef.current) {
      const button = profileRef.current.querySelector('button');
      if (button) {
        const rect = button.getBoundingClientRect();
        setProfilePosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    }
  }, [showProfileMenu]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="bg-white shadow-sm border-b sticky top-0 z-50"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          overflow: 'visible'
        }}
      >
        <div className="py-2 sm:py-4 flex items-center justify-between min-w-0" style={{ overflow: 'visible' }}>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg ml-2 sm:ml-3 md:ml-6 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </button>
            {/* MAHAFPC Logo */}
            <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-3 md:ml-6">
              <img
                src="/logocheck.png"
                alt="MAHAFPC Logo"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-gray-800 truncate">MAHAFPC Dashboard</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mr-2 sm:mr-3 md:mr-6 flex-shrink-0" style={{ overflow: 'visible' }}>
            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div 
                  className="fixed w-[90vw] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] max-h-96 overflow-hidden flex flex-col"
                  style={{ 
                    top: `${notificationPosition.top}px`, 
                    right: `${notificationPosition.right}px`,
                    position: 'fixed'
                  }}
                >
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notif.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 p-1.5 rounded-full ${
                                notif.type === 'success'
                                  ? 'bg-green-100 text-green-600'
                                  : notif.type === 'warning'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : notif.type === 'error'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-blue-100 text-blue-600'
                              }`}
                            >
                              {notif.type === 'success' ? (
                                <Package size={16} />
                              ) : notif.type === 'warning' ? (
                                <AlertCircle size={16} />
                              ) : (
                                <AlertCircle size={16} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`text-sm ${
                                  !notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="text-white" size={16} style={{ width: '16px', height: '16px' }} />
                </div>
                <ChevronDown size={14} className="text-gray-500 hidden sm:block" style={{ width: '14px', height: '14px' }} />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div 
                  className="fixed w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999]"
                  style={{ 
                    top: `${profilePosition.top}px`, 
                    right: `${profilePosition.right}px`,
                    position: 'fixed'
                  }}
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-1">MAHAFPC Admin</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static top-[56px] lg:top-0 inset-y-0 lg:inset-y-0 left-0 z-[45] lg:z-30 w-64 bg-white shadow-lg transition-transform duration-300 lg:translate-x-0 lg:shadow-none`}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full pb-20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full">
          {activeTab === 'monitoring' && (
            <MonitoringAnalytics user={user} onAlert={addAlert} />
          )}
          {activeTab === 'inventory' && (
            <InventoryControl user={user} onAlert={addAlert} />
          )}
          {activeTab === 'dispatch' && (
            <DispatchManagement user={user} onAlert={addAlert} />
          )}
          {activeTab === 'payments' && (
            <PaymentManagement user={user} onAlert={addAlert} />
          )}
          {activeTab === 'retailers' && (
            <RetailerLinkage user={user} onAlert={addAlert} />
          )}
          {activeTab === 'fpo' && (
            <FPOManagement user={user} onAlert={addAlert} />
          )}
          {activeTab === 'fpo-daily' && (
            <FPODailyRecord user={user} onAlert={addAlert} />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MAHAFPCDashboard;

