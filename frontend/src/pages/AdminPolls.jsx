import { useEffect, useState } from "react";
import { fetchAllPolls, resolvePoll, suspendPoll } from "../api/admin";

const AdminPolls = () => {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    fetchAllPolls().then(res => setPolls(res.data));
  }, []);

  return (
    <div>
      <h2>Poll Moderation</h2>

      {polls.map(poll => (
        <div key={poll.id} style={{ border: "1px solid #ddd", margin: "10px", padding: "10px" }}>
          <h4>{poll.title}</h4>
          <p>Status: {poll.status}</p>

          {poll.status === "open" && (
            <>
              <button onClick={() => suspendPoll(poll.id)}>
                Suspend (Refund)
              </button>

              {poll.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => resolvePoll(poll.id, opt.id)}
                >
                  Resolve → {opt.text}
                </button>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPolls;
