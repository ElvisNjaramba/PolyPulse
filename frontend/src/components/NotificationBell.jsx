import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllRead } from '../api/notifications';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read failed', err);
    }
  };
const getNotificationIcon = (type) => {
  const icons = {
    mention: '💬',
    bet_won: '🏆',
    bet_refunded: '↩️',
    poll_resolved: '✅',
    challenge_accepted: '🤝',
    challenge_won: '🥇',
    challenge_lost: '😞',
    challenge_cancelled: '❌',
    challenge_received: '⚔️',
    market_challenge: '🔔',
  };
  return icons[type] || '🔔';
};
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
notifications.slice(0, 5).map((n) => (
  <div
    key={n.id}
    className={`px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer ${
      !n.is_read ? 'bg-cyan-500/5' : ''
    }`}
    onClick={() => handleMarkRead(n.id)}
  >
    <div className="flex items-start gap-2">
      <span className="text-base mt-0.5 flex-shrink-0">{getNotificationIcon(n.notification_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 leading-snug">{n.message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(n.created_at).toLocaleString()}
        </p>
      </div>
      {!n.is_read && (
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0 mt-1.5" />
      )}
    </div>
  </div>
))
            )}
          </div>
          <div className="p-2 border-t border-gray-800 text-center">
            <Link
              to="/notifications"
              className="text-xs text-cyan-400 hover:text-cyan-300"
              onClick={() => setShowDropdown(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;