import { useState } from "react";
import { addComment, toggleLike } from "../api/comments";


const Comment = ({ comment, pollId, refresh }) => {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return; // optional safety check

    await addComment(pollId, {
      content: reply,     // ✅ correct variable
      parent: comment.id,
    });

    setReply("");
    setShowReply(false);
    refresh();
  };

  const handleLike = async () => {
    await toggleLike(comment.id);
    refresh();
  };

  return (
    <div style={{ marginLeft: "20px", marginTop: "10px" }}>
      <strong>@{comment.user}</strong>
      <p>{comment.content}</p>

      <button onClick={handleLike}>
        👍 {comment.likes_count}
      </button>

      <button onClick={() => setShowReply(!showReply)}>
        Reply
      </button>

      {showReply && (
        <div>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
          />
          <button onClick={handleReply}>Post</button>
        </div>
      )}

      {comment.replies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          pollId={pollId}
          refresh={refresh}
        />
      ))}
    </div>
  );
};

export default Comment;
