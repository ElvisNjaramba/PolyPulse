import { useEffect, useState } from "react";
import api from "../api/axios";

const styles = {
  page: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "24px",
    color: "#e5e7eb",
  },

  title: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "20px",
  },

  card: {
    background: "#0b0f19",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "14px",
  },

  poll: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "10px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
    fontSize: "14px",
    gap: "10px",
    marginBottom: "6px",
  },

  header: {
    color: "#9ca3af",
    fontSize: "13px",
    marginBottom: "8px",
  },

  pnlPos: { color: "#22c55e", fontWeight: 600 },
  pnlNeg: { color: "#ef4444", fontWeight: 600 },

  empty: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: "40px",
  },
};

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("positions/")
      .then((res) => setPositions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.title}>📊 Your Positions</div>

      {loading && <p>Loading positions…</p>}

      {!loading && positions.length === 0 && (
        <div style={styles.empty}>No open positions.</div>
      )}

      {positions.map((p, idx) => (
        <div key={idx} style={styles.card}>
          <div style={styles.poll}>{p.poll_title}</div>

          <div style={{ ...styles.row, ...styles.header }}>
            <div>Option</div>
            <div>Shares</div>
            <div>Avg</div>
            <div>Price</div>
            <div>P/L</div>
          </div>

          <div style={styles.row}>
            <div>{p.option}</div>
            <div>{p.shares}</div>
            <div>{p.avg_price}</div>
            <div>{p.current_price}</div>
            <div style={p.pnl >= 0 ? styles.pnlPos : styles.pnlNeg}>
              {p.pnl >= 0 ? "+" : ""}
              {p.pnl}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Positions;
