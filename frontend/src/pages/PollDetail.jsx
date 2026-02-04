// PollDetail.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import Comment from "../components/Comment";
import { fetchComments, addComment } from "../api/comments";
import MarketChart from "../components/MarketChart";
import { ErrorBoundary } from "../components/ErrorBoundary";

const MAX_CHART_POINTS = 50; // keep last 50 points for scrolling effect

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

  const [chartData, setChartData] = useState([]);
  const wsRef = useRef(null);

  /* ---------------- FETCH POLL ---------------- */
  const fetchPoll = async () => {
    const res = await api.get(`polls/${id}/`);
    setPoll(res.data);
  };

  const loadComments = async () => {
    const res = await fetchComments(id);
    setComments(res.data);
  };

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

  /* ---------------- INITIAL LOAD ---------------- */
useEffect(() => {
  // Fetch poll and comments initially
  fetchPoll().catch(console.error);
  loadComments().catch(console.error);

  // Setup WebSocket
  const ws = new WebSocket(`ws://localhost:8000/ws/polls/${id}/`); // use localhost consistently
  wsRef.current = ws;

  ws.onopen = () => console.log("WebSocket connected");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    setChartData((prev) => {
      const newData = [...prev, data];
      if (newData.length > MAX_CHART_POINTS) newData.shift(); // keep only last 50 points
      return newData;
    });

    // Optionally, update poll prices too if your backend sends them
    if (data.poll_update) {
      setPoll((prev) => ({ ...prev, ...data.poll_update }));
    }
  };

  ws.onclose = () => console.log("WebSocket closed");

  ws.onerror = (err) => console.error("WebSocket error:", err);

  // Cleanup on unmount
  return () => {
    ws.close();
  };
}, [id]);


  /* ---------------- GUARDS ---------------- */
  if (!poll) return <p>Loading poll...</p>;
  const isClosed = !poll.can_accept_bets;

  /* ---------------- UI ---------------- */
  return (
    <div style={{ minHeight: "100vh", background: "#020617", padding: "30px 16px" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", color: "#e5e7eb" }}>
        <h2>{poll.title}</h2>
        <p style={{ color: "#9ca3af" }}>{poll.description}</p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* -------- MARKET CHART -------- */}
        <h3>Market Price</h3>
        <div style={{ height: 300, width: "100%" }}>
          <ErrorBoundary>
          <MarketChart data={chartData} />
          </ErrorBoundary>
        </div>

        {/* -------- OPTIONS (BUY/SELL) -------- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "14px",
            marginTop: "18px",
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
                  border: isYes ? "1px solid #10b981" : "1px solid #ef4444",
                }}
              >
                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong style={{ color: isYes ? "#10b981" : "#ef4444", fontSize: "15px" }}>
                    {opt.text.toUpperCase()}
                  </strong>
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>Price: {opt.price.toFixed(4)}</span>
                </div>

                {/* POSITION */}
                <div style={{ fontSize: "13px", color: "#9ca3af", margin: "6px 0 10px", display: "flex", justifyContent: "space-between" }}>
                  <span>💼 Your shares</span>
                  <strong>{opt.user_shares}</strong>
                </div>
                <div style={{ fontSize: "13px", color: "#9ca3af", margin: "6px 0 10px", display: "flex", justifyContent: "space-between" }}>
                  <span>📊 Market shares</span>
                  <span>{opt.total_shares}</span>
                </div>

                {/* P/L */}
                {opt.user_shares > 0 && (
                  <div style={{ padding: "10px", borderRadius: "10px", fontSize: "14px", marginBottom: "12px", background: pnl >= 0 ? "#052e1b" : "#2a0f14", color: pnl >= 0 ? "#10b981" : "#ef4444" }}>
                    <div>Avg: {opt.avg_price.toFixed(4)}</div>
                    <div>P/L: {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</div>
                  </div>
                )}

                {/* BUY */}
                {!isClosed && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid #374151", background: "#020617", color: "#fff" }}
                    />
                    <button
                      style={{ background: "#00e0ff", color: "#000", border: "none", borderRadius: "8px", padding: "0 14px", fontWeight: 600, cursor: "pointer" }}
                      disabled={loading || !amount}
                      onClick={() => placeBet(opt.id)}
                    >
                      Buy
                    </button>
                  </div>
                )}

                {/* SELL */}
                {opt.user_shares > 0 && !isClosed && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="number"
                      placeholder="Sell shares"
                      value={isActiveSell ? sellAmount : ""}
                      onChange={(e) => {
                        setActiveSellOption(opt.id);
                        setSellAmount(e.target.value);
                      }}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid #374151", background: "#020617", color: "#fff" }}
                    />
                    <button
                      style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "0 12px", cursor: "pointer" }}
                      disabled={selling || !isActiveSell || Number(sellAmount) <= 0 || Number(sellAmount) > opt.user_shares}
                      onClick={() => sellShares(opt.id)}
                    >
                      Sell
                    </button>
                    <button
                      style={{ background: "#374151", color: "#fff", border: "none", borderRadius: "8px", padding: "0 10px", cursor: "pointer" }}
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

        <h4>Total Pool: {poll.total_pool}</h4>
        {isClosed && <p style={{ color: "#f87171" }}>❌ Poll is closed</p>}

        <hr />

        {/* COMMENTS */}
        <h3>Comments</h3>
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ width: "100%", minHeight: "70px", marginTop: "10px", padding: "10px", borderRadius: "10px", background: "#020617", border: "1px solid #374151", color: "#fff" }}
        />

        <br />

        <button onClick={submitComment} style={{ marginTop: "8px", background: "#00e0ff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
          Post Comment
        </button>

        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} pollId={id} refresh={loadComments} />
        ))}
      </div>
    </div>
  );
};

export default PollDetail;
