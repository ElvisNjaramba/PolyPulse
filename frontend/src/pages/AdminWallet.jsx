import { useEffect, useState } from "react";
import { fetchWalletLogs } from "../api/admin";

const AdminWallet = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchWalletLogs().then(res => setLogs(res.data));
  }, []);

  return (
    <div>
      <h2>Wallet Audit</h2>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Amount</th>
            <th>Balance After</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.user}</td>
              <td>{log.action}</td>
              <td>{log.amount}</td>
              <td>{log.balance_after}</td>
              <td>{log.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminWallet;
