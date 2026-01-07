import { useEffect, useState } from "react";
import api from "../api/axios";

const AdminComments = () => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    api.get("admin/comments/").then(res => setComments(res.data));
  }, []);

  const hideComment = (id) => {
    api.post(`comments/${id}/moderate/`, { action: "hide" });
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div>
      <h2>Comment Moderation</h2>

      {comments.map(c => (
        <div key={c.id}>
          <b>{c.user}</b>: {c.content}
          <button onClick={() => hideComment(c.id)}>Hide</button>
        </div>
      ))}
    </div>
  );
};

export default AdminComments;
