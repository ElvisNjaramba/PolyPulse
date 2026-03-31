import { useEffect, useState } from 'react';
import { fetchNotifications, markNotificationRead, markAllRead } from '../api/notifications';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white">Loading notifications...</div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            🔔 Notifications
          </h1>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm bg-gray-900/50 border border-gray-800 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-12 text-center">
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-gray-900/30 backdrop-blur-sm rounded-2xl border p-5 transition-all ${
                  n.is_read
                    ? 'border-gray-800/50 opacity-75'
                    : 'border-cyan-500/30 bg-cyan-500/5'
                }`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
<div className="flex items-start justify-between gap-4">
  <div className="flex items-start gap-3 flex-1">
    <span className="text-xl mt-0.5">{getNotificationIcon(n.notification_type)}</span>
    <div className="flex-1">
      <p className="text-white">{n.message}</p>
      <p className="text-xs text-gray-500 mt-2">
        {new Date(n.created_at).toLocaleString()}
      </p>
    </div>
  </div>
  {!n.is_read && (
    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse flex-shrink-0 mt-2" />
  )}
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;