const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications().then(res => setNotifications(res.data));
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      🔔 {unread}
      {notifications.map(n => (
        <div key={n.id}>
          {n.message}
        </div>
      ))}
    </div>
  );
};
