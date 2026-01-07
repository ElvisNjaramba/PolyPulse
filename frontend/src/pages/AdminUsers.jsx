import { useEffect, useState } from "react";
import { fetchUsers } from "../api/admin";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(res => setUsers(res.data));
  }, []);

  return (
    <div>
      <h2>Users</h2>

      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Balance</th>
            <th>Polls</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.balance}</td>
              <td>{u.polls_created}</td>
              <td>{u.is_staff ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
