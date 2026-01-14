import { useEffect, useState } from "react";
import { fetchProfile } from "../api/profile";

const styles = {
  page: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "24px",
    color: "#e5e7eb",
  },

  card: {
    background: "#0b0f19",
    border: "1px solid #1f2937",
    borderRadius: "18px",
    padding: "24px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },

  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#020617",
    border: "1px solid #374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: 700,
    color: "#00e0ff",
  },

  username: {
    fontSize: "22px",
    fontWeight: 700,
  },

  sub: {
    fontSize: "14px",
    color: "#9ca3af",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginTop: "20px",
  },

  statBox: {
    background: "#020617",
    border: "1px solid #374151",
    borderRadius: "14px",
    padding: "16px",
  },

  statLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "6px",
  },

  statValue: {
    fontSize: "20px",
    fontWeight: 700,
  },

  loading: {
    color: "#9ca3af",
    textAlign: "center",
    padding: "40px",
  },
};

const Profile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile().then((res) => setProfile(res.data));
  }, []);

  if (!profile) {
    return <div style={styles.loading}>Loading profile…</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {profile.username?.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={styles.username}>{profile.username}</div>
            <div style={styles.sub}>{profile.email}</div>
          </div>
        </div>

        {/* STATS */}
        <div style={styles.statGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Wallet Balance</div>
            <div style={styles.statValue}>
              {Number(profile.balance).toFixed(2)}
            </div>
          </div>

          {/* Future-ready boxes */}
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Open Positions</div>
            <div style={styles.statValue}>
              {profile.open_positions ?? "—"}
            </div>
          </div>

          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total P/L</div>
            <div style={styles.statValue}>
              {profile.total_pnl ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
