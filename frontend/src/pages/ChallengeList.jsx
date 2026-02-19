import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-400 border border-green-500/20",
  resolved: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  expired: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const ChallengeList = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/challenges/")
      .then((res) => setChallenges(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load challenges");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? challenges
    : challenges.filter((c) => c.status === filter);

  const handleAccept = async (id) => {
    try {
      await api.post(`/challenges/${id}/accept/`);
      // Refresh
      const res = await api.get("/challenges/");
      setChallenges(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Accept failed");
    }
  };

  const handleResolve = async (id, outcome) => {
    try {
      await api.post(`/challenges/${id}/resolve/`, { winning_outcome: outcome });
      const res = await api.get("/challenges/");
      setChallenges(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Resolve failed");
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`/challenges/${id}/cancel/`);
      const res = await api.get("/challenges/");
      setChallenges(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Cancel failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          Loading challenges...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Duel Challenges
          </h1>
          <button
            onClick={() => navigate("/challenges/new")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            New Challenge
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "pending", "accepted", "resolved", "cancelled", "expired"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === s
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-12 text-center">
            <p className="text-gray-400 text-lg">No challenges found</p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((challenge) => {
            const isCreator = challenge.is_creator;
            const isOpponent = challenge.is_opponent;
            return (
              <div
                key={challenge.id}
                className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5 hover:border-gray-700/50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[challenge.status]}`}>
                        {challenge.status}
                      </span>
                      <span className="text-sm text-gray-400">
                        Expires on: {new Date(challenge.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-lg mb-1">{challenge.question}</h3>
                    <p className="text-gray-400">
                      {challenge.creator_username} ({challenge.creator_choice_display}) vs {challenge.opponent_username} ({challenge.opponent_choice}) · Kes {challenge.amount}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {challenge.status === "pending" && isOpponent && (
                      <button
                        onClick={() => handleAccept(challenge.id)}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all text-sm"
                      >
                        Accept
                      </button>
                    )}
                    {challenge.status === "pending" && isCreator && (
                      <button
                        onClick={() => handleCancel(challenge.id)}
                        className="px-4 py-2 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/20 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    {challenge.status === "accepted" && (isCreator || isOpponent) && (
                      <>
                        <button
                          onClick={() => handleResolve(challenge.id, 'yes')}
                          className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all text-sm"
                        >
                          Resolve Yes
                        </button>
                        <button
                          onClick={() => handleResolve(challenge.id, 'no')}
                          className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm"
                        >
                          Resolve No
                        </button>
                      </>
                    )}
                    {challenge.status === "resolved" && challenge.winner && (
                      <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm">
                        Winner: {challenge.winner === challenge.creator ? challenge.creator_username : challenge.opponent_username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChallengeList;