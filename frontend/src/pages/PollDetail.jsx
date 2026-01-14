import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import Comment from "../components/Comment";
import { fetchComments, addComment } from "../api/comments";

const styles = {
  page: {
    maxWidth: "780px",
    margin: "0 auto",
    padding: "20px",
    color: "#e5e7eb",
  },

  header: {
    marginBottom: "18px",
  },

  title: {
    fontSize: "26px",
    fontWeight: 700,
  },

  desc: {
    color: "#9ca3af",
  },

  sectionTitle: {
    margin: "22px 0 12px",
    fontSize: "18px",
    fontWeight: 600,
  },

  card: {
    background: "#0b0f19",
    border: "1px solid #1f2937",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "18px",
  },

  optionTitle: {
    fontSize: "17px",
    marginBottom: "8px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },

  subRow: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: "6px 0 10px",
    display: "flex",
    justifyContent: "space-between",
  },

  pnlBox: {
    padding: "10px",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "12px",
  },

  actionRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "6px",
  },

  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#fff",
  },

  buy: {
    background: "#00e0ff",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  sell: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0 12px",
    cursor: "pointer",
  },

  max: {
    background: "#374151",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0 10px",
    cursor: "pointer",
  },

  pool: {
    marginTop: "16px",
    color: "#9ca3af",
  },

  closed: {
    marginTop: "8px",
    color: "#f87171",
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "10px",
    background: "#020617",
    border: "1px solid #374151",
    color: "#fff",
  },

  commentBtn: {
    marginTop: "8px",
    background: "#00e0ff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },

  error: {
    background: "#2f0f14",
    color: "#f87171",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "10px",
  },
};

const PollDetail = () => {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);

  const [amount, setAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [activeSellOption, setActiveSellOption] = useState(null);

  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  /* ---------------- FETCH POLL ---------------- */

  const fetchPoll = async () => {
    const res = await api.get(`polls/${id}/`);
    setPoll(res.data);
  };

  const loadComments = async () => {
    const res = await fetchComments(id);
    setComments(res.data);
  };

  /* -------- INITIAL LOAD -------- */

  useEffect(() => {
    fetchPoll().catch(console.error);
    loadComments().catch(console.error);
  }, [id]);

  /* -------- LIVE PRICE / P&L REFRESH -------- */

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPoll().catch(() => {});
    }, 3000); // every 3 seconds

    return () => clearInterval(interval);
  }, [id]);

  /* ---------------- BUY SHARES ---------------- */

  const placeBet = async (optionId) => {
    setError("");
    setLoading(true);

    try {
      await api.post("polls/bet/", {
        poll: poll.id,
        option: optionId,
        amount: poll.is_free ? 0 : Number(amount),
      });

      setAmount("");
      await fetchPoll();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          "Failed to buy shares"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SELL SHARES ---------------- */

  const sellShares = async (optionId) => {
    setError("");
    setSelling(true);

    try {
      await api.post(`polls/${poll.id}/sell/`, {
        option_id: optionId,
        shares: Number(sellAmount),
      });

      setSellAmount("");
      setActiveSellOption(null);
      await fetchPoll();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to sell shares");
    } finally {
      setSelling(false);
    }
  };

  /* ---------------- COMMENTS ---------------- */

  const submitComment = async () => {
    if (!newComment.trim()) return;

    await addComment(id, { content: newComment });
    setNewComment("");
    loadComments();
  };

  /* ---------------- GUARDS ---------------- */

  if (!poll) return <p>Loading poll...</p>;

  const isClosed = !poll.can_accept_bets;

  /* ---------------- UI ---------------- */

  return (
    <div style={{
  minHeight: "100vh",
  background: "#020617",   // deep dark background
  padding: "30px 16px",
}}>
    <div style={styles.page}>
      <h2>{poll.title}</h2>
      <p>{poll.description}</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Market</h3>

<div style={styles.card}>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "14px",
    }}
  >
    {poll.options.map((opt) => {
      const isActiveSell = activeSellOption === opt.id;
      const pnl = opt.pnl ?? 0;
      const isYes = opt.text.toLowerCase() === "yes";

      return (
        <div
          key={opt.id}
          style={{
            padding: "14px",
            borderRadius: "12px",
            background: isYes ? "#071a14" : "#1a0b0b",
            border: isYes
              ? "1px solid #10b981"
              : "1px solid #ef4444",
          }}
        >
          {/* OPTION HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <strong
              style={{
                color: isYes ? "#10b981" : "#ef4444",
                fontSize: "15px",
              }}
            >
              {opt.text.toUpperCase()}
            </strong>

            <span style={{ fontSize: "13px", color: "#9ca3af" }}>
              Price: {opt.price.toFixed(4)}
            </span>
          </div>

          {/* POSITION */}
          <div style={styles.subRow}>
            <span>💼 Your shares</span>
            <strong>{opt.user_shares}</strong>
          </div>

          <div style={styles.subRow}>
            <span>📊 Market shares</span>
            <span>{opt.total_shares}</span>
          </div>

          {/* P/L */}
          {opt.user_shares > 0 && (
            <div
              style={{
                ...styles.pnlBox,
                background: pnl >= 0 ? "#052e1b" : "#2a0f14",
                color: pnl >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              <div>Avg: {opt.avg_price.toFixed(4)}</div>
              <div>
                P/L: {pnl >= 0 ? "+" : ""}
                {pnl.toFixed(2)}
              </div>
            </div>
          )}

          {/* BUY */}
          {!isClosed && (
            <div style={styles.actionRow}>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />

              <button
                style={styles.buy}
                disabled={loading || !amount}
                onClick={() => placeBet(opt.id)}
              >
                Buy
              </button>
            </div>
          )}

          {/* SELL */}
          {opt.user_shares > 0 && !isClosed && (
            <div style={styles.actionRow}>
              <input
                type="number"
                placeholder="Sell shares"
                value={isActiveSell ? sellAmount : ""}
                onChange={(e) => {
                  setActiveSellOption(opt.id);
                  setSellAmount(e.target.value);
                }}
                style={styles.input}
              />

              <button
                style={styles.sell}
                disabled={
                  selling ||
                  !isActiveSell ||
                  Number(sellAmount) <= 0 ||
                  Number(sellAmount) > opt.user_shares
                }
                onClick={() => sellShares(opt.id)}
              >
                Sell
              </button>

              <button
                style={styles.max}
                onClick={() => {
                  setActiveSellOption(opt.id);
                  setSellAmount(String(opt.user_shares));
                }}
              >
                MAX
              </button>
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>


      <h4>Total Pool: {poll.total_pool}</h4>

      {isClosed && <p>❌ Poll is closed</p>}

      <hr />

      {/* COMMENTS */}
      <h3>Comments</h3>

      <textarea
        placeholder="Write a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        style={{ width: "100%", minHeight: "70px" }}
      />

      <br />

      <button onClick={submitComment}>Post Comment</button>

      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          pollId={id}
          refresh={loadComments}
        />
      ))}
    </div>
    </div>
  );
};

export default PollDetail;

