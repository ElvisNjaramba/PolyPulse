import { useEffect, useState } from "react";
import { fetchNotifications } from "../api/notifications";

const Notifications = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchNotifications().then(res => setItems(res.data));
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      {items.map(n => (
        <div key={n.id}>
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
