import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      {/* LEFT */}
      <div style={styles.left}>
        <Link to="/" style={styles.logo}>
          PolyPulse
        </Link>

        <Link to="/polls" style={styles.link}>
          Polls
        </Link>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        {user ? (
          <>
            <Link to="/wallet" style={styles.link}>
              Wallet
            </Link>

            <Link to="/notifications" style={styles.link}>
              🔔
            </Link>

            <Link to="/profile" style={styles.link}>
              Profile
            </Link>

            <button onClick={handleLogout} style={styles.logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>

            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#111",
    color: "#fff",
    alignItems: "center",
  },
  left: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  right: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  logo: {
    fontWeight: "bold",
    color: "#00e0ff",
    textDecoration: "none",
    fontSize: "18px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
  },
  logout: {
    background: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    padding: "5px 10px",
    cursor: "pointer",
  },
};

export default Navbar;
