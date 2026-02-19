import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Comment from "../components/Comment";
import { fetchComments, addComment } from "../api/comments";
import MarketChart from "../components/MarketChart";
import { ErrorBoundary } from "../components/ErrorBoundary";

const MAX_CHART_POINTS = 50;

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [activeSellOption, setActiveSellOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const commentsEndRef = useRef(null);

  const fetchPoll = async () => {
    try {
      const res = await api.get(`polls/${id}/`);
      setPoll(res.data);
    } catch (err) {
      console.error("Failed to fetch poll:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("profile/");
      setCurrentUser(res.data);
    } catch (err) {
      // Not logged in — button simply won't show
    }
  };

  const loadComments = async () => {
    try {
      const res = await fetchComments(id);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  const placeBet = async (optionId, optionText) => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      await api.post("polls/bet/", {
        poll: poll.id,
        option: optionId,
        amount: poll.is_free ? 0 : Number(amount),
      });
      setSuccess(`Successfully bought shares in "${optionText}"!`);
      setAmount("");
      await fetchPoll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Failed to buy shares");
    } finally {
      setLoading(false);
    }
  };

  const sellShares = async (optionId, optionText) => {
    setError("");
    setSuccess("");
    setSelling(true);

    try {
      await api.post(`polls/${poll.id}/sell/`, {
        option_id: optionId,
        shares: Number(sellAmount),
      });

      setSuccess(`Successfully sold ${sellAmount} shares of "${optionText}"!`);
      setSellAmount("");
      setActiveSellOption(null);

      await fetchPoll();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.log(err.response?.data);
      setError(err.response?.data?.detail || "Failed to sell shares");
    } finally {
      setSelling(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(id, { content: newComment });
      setNewComment("");
      await loadComments();
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  useEffect(() => {
    fetchPoll();
    loadComments();
    fetchCurrentUser();
  }, [id]);


  if (!poll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e]">
        <div className="w-12 h-12 border-4 border-white/10 border-t-4 border-t-[#00e0ff] rounded-full animate-spin" />
        <span className="mt-5 text-gray-400">Loading poll...</span>
      </div>
    );
  }


  const isClosed = !poll.can_accept_bets;
  const isFreePoll = poll.is_free;

  // Compute yes/no percentages from backend data
  const yesPercentage = poll.yes_percentage ?? 50;
  const noPercentage = poll.no_percentage ?? 50;

  // Show admin button only to the poll creator
  const isCreator = currentUser && poll.creator && currentUser.username === poll.creator;

  return (
    <div className="relative min-h-screen p-6 bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e] overflow-hidden">
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(0,224,255,0.1)_0%,transparent_70%)] animate-[float_20s_infinite_ease-in-out]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_70%)] animate-[float_25s_infinite_ease-in-out_reverse]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">{poll.title}</h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isClosed ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-red-500" : "bg-green-500"}`}></span>
                {isClosed ? "Closed" : "Live"}
              </div>
            </div>

            {/* ── Manage Poll button — only visible to creator ── */}
            {isCreator && (
              <button
                onClick={() => navigate("/manage/polls")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-indigo-500/15 border border-indigo-400/30 text-indigo-300
                  hover:bg-indigo-500/30 hover:border-indigo-400/60 hover:text-white
                  transition-all duration-150 whitespace-nowrap"
              >
                <span>⚙️</span> Manage Poll
              </button>
            )}
          </div>

          <p className="text-gray-400">{poll.description}</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-gray-300">
              <span>💰</span> <span>Total Pool:</span> <span className="font-semibold text-white">Kes {poll.total_pool}</span>
            </div>
            {poll.active_traders != null && (
              <div className="flex items-center gap-2 text-gray-300">
                <span>👥</span> <span>Traders:</span> <span className="font-semibold text-white">{poll.active_traders}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300">
              <span>📊</span> <span>Yes:</span> <span className="font-semibold text-green-400">{yesPercentage}%</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span>📊</span> <span>No:</span> <span className="font-semibold text-red-400">{noPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="flex items-center gap-3 p-4 bg-red-100 border border-red-200 rounded-lg text-red-500 animate-slideDown"><span>⚠️</span>{error}</div>}
        {success && <div className="flex items-center gap-3 p-4 bg-green-100 border border-green-200 rounded-lg text-green-500 animate-slideDown"><span>✅</span>{success}</div>}

        {/* Chart */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Market Price</h2>
          </div>
          <div className="h-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <ErrorBoundary>
              <MarketChart pollId={id} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-5 justify-center">
          {poll.options.map((opt) => {
            const isYes = opt.text.toLowerCase() === "yes";
            const hasPosition = opt.user_shares > 0;
            const maxSell = opt.user_shares;
            const pnl = opt.pnl ?? 0;
            const isActiveSell = activeSellOption === opt.id;

            return (
              <div
                key={opt.id}
                className={`
      flex-1 min-w-[300px] max-w-[500px] p-6 rounded-2xl backdrop-blur-xl border
      ${isYes ? "border-green-300/30 bg-green-500/10" : "border-red-300/30 bg-red-500/10"}
      transition-transform hover:translate-y-1 hover:shadow-2xl
    `}
              >
                <div className="flex justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl ${isYes ? "bg-gradient-to-tr from-green-500 to-green-600" : "bg-gradient-to-tr from-red-500 to-red-600"}`}>{isYes ? "📈" : "📉"}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{opt.text}</h3>
                      <div className="flex items-center gap-2 text-white font-medium">
                        Kes {opt.price.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Volume:</div>
                    <div className="text-white font-semibold">Kes {opt.total_shares}</div>
                  </div>
                </div>

                {/* Position */}
                <div className="flex gap-6 mb-4">
                  <div className="flex flex-col text-gray-400 text-sm">
                    <span>Your Shares:</span>
                    <span className="text-white font-semibold">{opt.user_shares}</span>
                  </div>
                  <div className="flex flex-col text-gray-400 text-sm">
                    <span>Avg Price:</span>
                    <span className="text-white font-semibold">Kes {opt.avg_price.toFixed(4)}</span>
                  </div>
                </div>

                {/* P/L */}
                {hasPosition && (
                  <div className="p-3 mb-4 rounded-lg bg-white/5 flex justify-between text-sm text-gray-300">
                    <span>Profit & Loss</span>
                    <span className={`${pnl >= 0 ? "text-green-500" : "text-red-500"} font-semibold`}>
                      {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} ({pnl >= 0 ? "+" : ""}{((pnl / (opt.avg_price * opt.user_shares)) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* Buy */}
                {!isClosed && (
                  <div className="mb-4 flex gap-3">
                    <input
                      type="number"
                      placeholder={isFreePoll ? "Free bet" : "Amount"}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
                      disabled={loading}
                      min="0"
                      step={isFreePoll ? "1" : "0.01"}
                    />
                    <button
                      className={`px-5 py-3 rounded-xl text-white font-semibold flex items-center gap-2 ${isYes ? "bg-gradient-to-tr from-green-500 to-green-600" : "bg-gradient-to-tr from-red-500 to-red-600"} disabled:opacity-50`}
                      disabled={loading || !amount || Number(amount) <= 0}
                      onClick={() => placeBet(opt.id, opt.text)}
                    >
                      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>⚡</span>Buy {isFreePoll ? "Share" : "Shares"}</>}
                    </button>
                  </div>
                )}

                {/* Sell */}
                {hasPosition && !isClosed && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex gap-3 mb-2">
                      <input
                        type="number"
                        placeholder="Sell shares"
                        value={isActiveSell ? sellAmount : ""}
                        onChange={(e) => { setActiveSellOption(opt.id); setSellAmount(e.target.value); }}
                        min="0"
                        max={maxSell}
                        step="1"
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-red-300 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                        disabled={selling}
                      />
                      <button
                        className="px-4 py-3 rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
                        disabled={selling || !isActiveSell || Number(sellAmount) <= 0 || Number(sellAmount) > maxSell}
                        onClick={() => sellShares(opt.id, opt.text)}
                      >
                        {selling ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sell"}
                      </button>
                      <button
                        className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-semibold hover:bg-white/10"
                        onClick={() => { setActiveSellOption(opt.id); setSellAmount(String(maxSell)); }}
                      >MAX</button>
                    </div>
                    {isActiveSell && (
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Estimated Value:</span>
                        <span className="text-white font-semibold">Kes {(Number(sellAmount || 0) * opt.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {isClosed && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 text-gray-400">
                    <span>🔒</span>Trading Closed
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comments */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">💬 Discussion ({comments.length})</h2>
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="Share your analysis or prediction..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-vertical"
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="px-5 py-3 bg-gradient-to-tr from-cyan-400 to-blue-500 text-[#0b0f19] font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
            ><span>📤</span>Post Comment</button>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-3">
            {comments.map(c => <Comment key={c.id} comment={c} pollId={id} refresh={loadComments} />)}
            <div ref={commentsEndRef} />
          </div>

          {comments.length === 0 && (
            <div className="text-center py-10 text-gray-400 space-y-3">
              <span className="text-5xl block">💭</span>
              <p>No comments yet. Be the first to share your analysis!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollDetail;