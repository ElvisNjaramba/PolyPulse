import { useEffect, useState } from "react";
import api from "../api/axios";

const Leaderboard = () => {
  const [data, setData] = useState({ leaderboard: [], my_stats: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leaderboard/")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  const { leaderboard, my_stats } = data;

  const medalColor = (rank) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-400 mb-8">Top predictors by total winnings</p>

        {/* My Stats Card */}
        {my_stats && (
          <div className="mb-8 p-5 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-cyan-500/30">
            <h2 className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Global Rank</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {my_stats.rank ? `#${my_stats.rank}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="text-2xl font-bold text-white">{my_stats.accuracy}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-orange-400">
                  🔥 {my_stats.current_streak}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Best Streak</p>
                <p className="text-2xl font-bold text-purple-400">{my_stats.best_streak}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Won</p>
                <p className="text-xl font-bold text-green-400">
                  KES {my_stats.total_won.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-xl font-bold text-white">
                  KES {my_stats.today_winnings.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Yesterday</p>
                <p className="text-xl font-bold text-gray-300">
                  KES {my_stats.yesterday_winnings.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Daily Change</p>
                <p className={`text-xl font-bold ${my_stats.daily_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {my_stats.daily_change >= 0 ? "+" : ""}KES {my_stats.daily_change.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Table */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_90px_80px_80px_90px] gap-2 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>User</span>
            <span className="text-right">Won</span>
            <span className="text-right">Accuracy</span>
            <span className="text-right">Streak</span>
            <span className="text-right">Best</span>
          </div>

          {leaderboard.length === 0 && (
            <p className="text-center text-gray-500 py-12">No data yet</p>
          )}

          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className="grid grid-cols-[40px_1fr_90px_80px_80px_90px] gap-2 px-5 py-4 border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors items-center"
            >
              <span className={`text-lg font-bold ${medalColor(entry.rank)}`}>
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : entry.rank}
              </span>
              <span className="text-white font-medium truncate">{entry.username}</span>
              <span className="text-green-400 font-mono text-right text-sm">
                KES {entry.total_won.toLocaleString()}
              </span>
              <span className="text-cyan-400 text-right text-sm">{entry.accuracy}%</span>
              <span className="text-orange-400 text-right text-sm">
                🔥 {entry.current_streak}
              </span>
              <span className="text-purple-400 text-right text-sm">{entry.best_streak}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;