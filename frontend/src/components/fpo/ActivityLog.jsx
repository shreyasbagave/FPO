import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Package } from 'lucide-react';
import { activitiesAPI } from '../../services/api';
import { formatQuantityAllUnits, formatQuantity } from '../../utils/unitConverter';

const ActivityLog = ({ user, onAlert }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await activitiesAPI.getAll();
        
        if (response.success) {
          setActivities(response.activities || []);
        } else {
          onAlert && onAlert({
            type: 'error',
            message: 'Failed to load activities',
          });
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        onAlert && onAlert({
          type: 'error',
          message: 'Failed to load activities. Please check your connection.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [onAlert]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'procurement':
        return Package;
      case 'sale':
        return TrendingUp;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'procurement':
        return 'bg-blue-100 text-blue-700';
      case 'sale':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalQuantity = activities.reduce((sum, a) => sum + (a.quantity || 0), 0);
  const todayDate = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter((a) => a.date === todayDate);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Daily Activity Log</h2>
        <p className="text-sm sm:text-base text-gray-600">Track all transactions and activities</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Activities</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{activities.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Quantity Transacted</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{formatQuantityAllUnits(totalQuantity)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Today's Activities</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {todayActivities.length}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Activity Timeline</h3>
        </div>
        <div className="p-6">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No activities recorded yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {activity.type === 'procurement' ? 'Procurement' : activity.type === 'sale' ? 'Sale' : 'Activity'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.productName || 'N/A'} - {formatQuantity(activity.quantity || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {activity.date ? new Date(activity.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">{activity.time || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;

