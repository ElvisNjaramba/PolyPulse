import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPolls } from "../api/polls";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls().then((res) => setPolls(res.data));
  }, []);

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px",
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>📊 Active Markets</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
        }}
      >
        {polls.map((p) => {
          const isClosed = !p.can_accept_bets;

          return (
            <div
              key={p.id}
              onClick={() => navigate(`/polls/${p.id}`)}
              style={{
                cursor: "pointer",
                padding: "18px",
                borderRadius: "16px",
                border: "1px solid #1f2937",
                background: "#0b0f19",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <h3>{p.title}</h3>

                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    background: isClosed ? "#2f0f14" : "#063b3f",
                    color: isClosed ? "#f87171" : "#22d3ee",
                  }}
                >
                  {isClosed ? "CLOSED" : "OPEN"}
                </span>
              </div>

              <p style={{ color: "#9ca3af", fontSize: "13px" }}>
                {p.description || "No description"}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  fontSize: "13px",
                }}
              >
                <div>
                  Pool
                  <div style={{ fontWeight: 700 }}>
                    {Number(p.total_pool).toFixed(2)}
                  </div>
                </div>

                <div>
                  Options
                  <div style={{ fontWeight: 700 }}>
                    {p.options?.length ?? 0}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
