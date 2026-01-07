import { useEffect, useState } from "react";
import { fetchPolls } from "../api/polls";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    fetchPolls().then(res => setPolls(res.data));
  }, []);

  return (
    <div>
      <h2>Active Polls</h2>

      {polls.map(p => (
        <div key={p.id}>
          <a href={`/polls/${p.id}`}>{p.title}</a>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
