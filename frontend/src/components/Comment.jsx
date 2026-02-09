// import { useState } from "react";
// import { addComment, toggleLike } from "../api/comments";


// const Comment = ({ comment, pollId, refresh }) => {
//   const [reply, setReply] = useState("");
//   const [showReply, setShowReply] = useState(false);

//   const handleReply = async () => {
//     if (!reply.trim()) return; // optional safety check

//     await addComment(pollId, {
//       content: reply,     // ✅ correct variable
//       parent: comment.id,
//     });

//     setReply("");
//     setShowReply(false);
//     refresh();
//   };

//   const handleLike = async () => {
//     await toggleLike(comment.id);
//     refresh();
//   };

//   return (
//     <div style={{ marginLeft: "20px", marginTop: "10px" }}>
//       <strong>@{comment.user}</strong>
//       <p>{comment.content}</p>

//       <button onClick={handleLike}>
//         👍 {comment.likes_count}
//       </button>

//       <button onClick={() => setShowReply(!showReply)}>
//         Reply
//       </button>

//       {showReply && (
//         <div>
//           <input
//             value={reply}
//             onChange={(e) => setReply(e.target.value)}
//             placeholder="Write a reply..."
//           />
//           <button onClick={handleReply}>Post</button>
//         </div>
//       )}

//       {comment.replies.map((reply) => (
//         <Comment
//           key={reply.id}
//           comment={reply}
//           pollId={pollId}
//           refresh={refresh}
//         />
//       ))}
//     </div>
//   );
// };

// export default Comment;



import { useState } from "react";
import { addComment, toggleLike } from "../api/comments";

const Comment = ({ comment, pollId, refresh }) => {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;

    setIsReplying(true);
    try {
      await addComment(pollId, {
        content: reply,
        parent: comment.id,
      });

      setReply("");
      setShowReply(false);
      refresh();
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await toggleLike(comment.id);
      refresh();
    } catch (error) {
      console.error("Failed to like comment:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getUserInitial = (username) => {
    return username?.charAt(0)?.toUpperCase() || "U";
  };

  const getGradient = (username) => {
    const gradients = [
      "from-cyan-500 to-blue-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-amber-500",
    ];
    
    // Simple hash function to get consistent gradient per user
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className={`ml-4 md:ml-6 mt-3 relative ${comment.parent ? 'pl-4 border-l border-gray-800/50' : ''}`}>
      {/* Comment Card */}
      <div className="group relative">
        {/* Decorative line for nested comments */}
        {comment.parent && (
          <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gray-700/50 via-gray-600/50 to-transparent" />
        )}
        
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4 hover:border-gray-700/70 transition-all duration-200">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* User Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(comment.user)} flex items-center justify-center text-white font-bold shadow-lg`}>
              {getUserInitial(comment.user)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      @{comment.user}
                    </span>
                    {comment.user === "admin" && (
                      <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                
                {comment.is_edited && (
                  <span className="text-xs text-gray-500 italic">Edited</span>
                )}
              </div>
            </div>
          </div>

          {/* Comment Content */}
          <div className="mb-4">
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
            
            {/* Edited Indicator */}
            {comment.edited_at && comment.edited_at !== comment.created_at && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="opacity-70">✏️ Edited {formatTime(comment.edited_at)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                comment.is_liked 
                  ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30" 
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              {isLiking ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
              ) : (
                <span className={comment.is_liked ? "text-lg" : "text-base"}>
                  {comment.is_liked ? "❤️" : "🤍"}
                </span>
              )}
              <span className="text-sm font-medium">
                {comment.likes_count > 0 ? comment.likes_count : ""}
              </span>
            </button>

            {/* Reply Button */}
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
            >
              <span className="text-base">💬</span>
              <span className="text-sm font-medium">Reply</span>
            </button>

            {/* More Options */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all ml-auto">
              <span className="text-base">⋯</span>
            </button>
          </div>
        </div>

        {/* Reply Indicator */}
        {showReply && (
          <div className="mt-4 ml-4">
            <div className="relative">
              {/* Reply indicator line */}
              <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 to-transparent" />
              
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-4">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full min-h-[80px] bg-gray-900/50 border border-gray-700/50 rounded-xl p-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 resize-none transition-all"
                  rows={3}
                />
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    Press Enter to submit • Shift+Enter for new line
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReply(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!reply.trim() || isReplying}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {isReplying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <span className="text-base">✈️</span>
                          Post Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              pollId={pollId}
              refresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Hover Effects */}
      <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
    </div>
  );
};

export default Comment;