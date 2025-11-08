import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

const AlertNotification = ({ alert }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const getIcon = () => {
    switch (alert.type) {
      case 'success':
        return CheckCircle;
      case 'warning':
      case 'error':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getColor = () => {
    switch (alert.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={`${getColor()} border rounded-lg p-4 shadow-lg min-w-[300px] max-w-md animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 hover:opacity-70"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default AlertNotification;

