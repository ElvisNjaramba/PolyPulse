import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import Comment from "../components/Comment";
import { fetchComments, addComment } from "../api/comments";

const PollDetail = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");


  const fetchPoll = async () => {
    const res = await api.get(`polls/${id}/`);
    setPoll(res.data);
  };

  const loadComments = async () => {
    const res = await fetchComments(id);
      setComments(res.data);
   };


  useEffect(() => {
    fetchPoll().catch(console.error);
    loadComments().catch(console.error);
  }, [id]);

  const placeBet = async (optionId) => {
    setError("");
    setLoading(true);

    try {
      await api.post("polls/bet/", {
        poll: poll.id,
        option: optionId,
        amount: poll.is_free ? 0 : Number(amount),
      });

      await fetchPoll(); // refresh totals
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to place bet"
      );
    } finally {
      setLoading(false);
    }
  };

    const submitComment = async () => {
    if (!newComment.trim()) return;

    await addComment(id, { content: newComment });
    setNewComment("");
    loadComments();
    };



  if (!poll) return <p>Loading poll...</p>;

  const hasVoted = !!poll.user_bet;
  const isClosed = !poll.can_accept_bets;

return (
  <div>
    <h2>{poll.title}</h2>
    <p>{poll.description}</p>

    {error && <p style={{ color: "red" }}>{error}</p>}

    <h3>Options</h3>

    {poll.options.map((opt) => (
      <div key={opt.id} style={{ marginBottom: "10px" }}>
        <strong>{opt.text}</strong> — {opt.total_bet}

        {!hasVoted && !isClosed && (
          <button
            onClick={() => placeBet(opt.id)}
            disabled={loading}
            style={{ marginLeft: "10px" }}
          >
            Vote
          </button>
        )}

        {hasVoted && poll.user_bet.option_id === opt.id && (
          <span style={{ color: "green", marginLeft: "10px" }}>
            ✔ Your vote
          </span>
        )}
      </div>
    ))}

    {!poll.is_free && !hasVoted && !isClosed && (
      <div style={{ marginTop: "10px" }}>
        <input
          type="number"
          placeholder={`Min bet: ${poll.min_bet}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
    )}

    <h4>Total Pool: {poll.total_pool}</h4>

    {isClosed && <p>❌ Poll is closed</p>}

    <hr />

    {/* 💬 COMMENTS SECTION */}
    <h3>Comments</h3>

    <textarea
      placeholder="Write a comment..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
    />

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
);

};

export default PollDetail;
