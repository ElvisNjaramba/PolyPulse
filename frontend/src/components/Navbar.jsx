import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={styles.header}>
      <nav style={styles.nav}>
        {/* LOGO */}
        <Link to="/" style={styles.logo}>
          PolyPulse
        </Link>

        {/* HAMBURGER (MOBILE) */}
        <button
          onClick={() => setOpen(!open)}
          style={styles.hamburger}
        >
          ☰
        </button>

        {/* LINKS */}
        <div
          style={{
            ...styles.links,
            ...(open ? styles.linksOpen : {}),
          }}
        >
          <Link to="/polls" style={styles.link} onClick={() => setOpen(false)}>
            Polls
          </Link>

          {user ? (
            <>
              <Link to="/wallet" style={styles.link} onClick={() => setOpen(false)}>
                Wallet
              </Link>

              <Link to="/notifications" style={styles.link} onClick={() => setOpen(false)}>
                🔔
              </Link>

              <Link to="/profile" style={styles.link} onClick={() => setOpen(false)}>
                Profile
              </Link>

              <Link to="/positions" style={styles.link}>
                Positions
              </Link>


              <button onClick={handleLogout} style={styles.logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link} onClick={() => setOpen(false)}>
                Login
              </Link>

              <Link to="/register" style={styles.cta} onClick={() => setOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "#0b0f19",
  },

  nav: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#00e0ff",
    textDecoration: "none",
    letterSpacing: "0.5px",
  },

  hamburger: {
    display: "none",
    fontSize: "22px",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  link: {
    color: "#e5e7eb",
    textDecoration: "none",
    fontSize: "14px",
    transition: "0.2s",
  },

  cta: {
    background: "#00e0ff",
    color: "#000",
    padding: "6px 12px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },

  logout: {
    background: "transparent",
    border: "1px solid #444",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },

  /* 🔽 MOBILE */
  linksOpen: {
    position: "absolute",
    top: "64px",
    left: 0,
    right: 0,
    background: "#0b0f19",
    flexDirection: "column",
    padding: "20px",
    gap: "16px",
    borderTop: "1px solid #1f2937",
  },

  /* MEDIA QUERIES */
  "@media (max-width: 768px)": {
    hamburger: {
      display: "block",
    },
    links: {
      display: "none",
    },
  },
};

