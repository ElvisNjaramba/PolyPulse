import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: "220px", padding: "20px", background: "#111", color: "#fff" }}>
        <h3>Admin</h3>
        <nav>
          <Link to="polls">Polls</Link><br />
          <Link to="users">Users</Link><br />
          <Link to="wallet">Wallet</Link><br />
          <Link to="comments">Comments</Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
