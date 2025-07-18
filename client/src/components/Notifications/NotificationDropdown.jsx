import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';

const NotificationDropdown = ({ onClose }) => {
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Mock notifications for now - will be replaced with API call
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          message: "Someone answered your question about React hooks",
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          type: 'answer'
        },
        {
          id: 2,
          message: "Your answer was accepted for 'How to use useState?'",
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          type: 'accepted_answer'
        },
        {
          id: 3,
          message: "Someone mentioned you in a comment",
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          type: 'mention'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <>
            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <div className="p-3 border-b border-gray-100">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              </div>
            )}

            {/* Notifications list */}
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${
                        !notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
