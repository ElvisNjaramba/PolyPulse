import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { 
  Trash2, 
  CheckCircle, 
  Edit, 
  Eye, 
  Clock, 
  DollarSign, 
  Users,
  AlertCircle,
  Loader2,
  BarChart3
} from "lucide-react";

const ManagePolls = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      const response = await api.get("/polls/my-polls/");
      setPolls(response.data);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      setError("Failed to load your polls");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    setProcessing(prev => ({ ...prev, [pollId]: "deleting" }));
    setError("");
    setSuccess("");

    try {
      await api.delete(`/polls/${pollId}/`);
      setSuccess("Poll deleted successfully");
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete poll");
    } finally {
      setProcessing(prev => ({ ...prev, [pollId]: null }));
    }
  };

  const handleMarkComplete = async (pollId) => {
    if (!window.confirm("Mark this poll as complete? This will close it to new bets.")) {
      return;
    }

    setProcessing(prev => ({ ...prev, [pollId]: "completing" }));
    setError("");
    setSuccess("");

    try {
      await api.patch(`/polls/${pollId}/`, { can_accept_bets: false });
      setSuccess("Poll marked as complete");
      setPolls(prev => prev.map(poll => 
        poll.id === pollId ? { ...poll, can_accept_bets: false } : poll
      ));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to mark poll as complete");
    } finally {
      setProcessing(prev => ({ ...prev, [pollId]: null }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (poll) => {
    if (!poll.can_accept_bets) {
      return { text: "Closed", color: "bg-red-500/20 text-red-400", border: "border-red-500/30" };
    }
    
    const now = new Date();
    const closing = new Date(poll.closing_time);
    if (closing < now) {
      return { text: "Expired", color: "bg-orange-500/20 text-orange-400", border: "border-orange-500/30" };
    }
    
    return { text: "Live", color: "bg-green-500/20 text-green-400", border: "border-green-500/30" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <div className="text-gray-400">Loading your polls...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/polls")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to Markets
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                📊 Manage Your Polls
              </h1>
              <p className="text-gray-400 mt-2">View, edit, and manage your created prediction markets</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Polls</div>
                <div className="text-2xl font-bold text-white">{polls.length}</div>
              </div>
              <button
                onClick={() => navigate("/create/poll")}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
              >
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-center gap-2 animate-fadeIn">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Empty State */}
        {polls.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-white mb-2">No polls created yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You haven't created any prediction markets. Start by creating your first market!
            </p>
            <button
              onClick={() => navigate("/create/poll")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
            >
              Create Your First Poll
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Polls Grid */}
            {polls.map(poll => {
              const status = getStatusBadge(poll);
              const isProcessing = processing[poll.id];
              
              return (
                <div
                  key={poll.id}
                  className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6 hover:border-gray-700/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Poll Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${status.color} border ${status.border}`}>
                          {status.text}
                        </span>
                        {poll.is_free && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            FREE
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Created {formatDate(poll.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{poll.title}</h3>
                      
                      <p className="text-gray-400 mb-6 line-clamp-2">
                        {poll.description || "No description provided"}
                      </p>

                      {/* Poll Stats */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <DollarSign size={16} />
                          <span className="font-semibold text-white">Kes {poll.total_pool || 0}</span>
                          <span className="text-gray-500">volume</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users size={16} />
                          <span className="font-semibold text-white">{poll.participants || 0}</span>
                          <span className="text-gray-500">traders</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={16} />
                          <span className="font-semibold text-white">
                            {poll.can_accept_bets ? "Closes " + formatDate(poll.closing_time) : "Closed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <BarChart3 size={16} />
                          <span className="font-semibold text-white">{poll.options?.length || 0} options</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      <button
                        onClick={() => navigate(`/polls/${poll.id}`)}
                        className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 text-gray-300 rounded-xl hover:border-gray-700 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      
                      <button
                        onClick={() => navigate(`/polls/${poll.id}/edit`)}
                        className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 text-gray-300 rounded-xl hover:border-gray-700 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      
                      {poll.can_accept_bets && (
                        <button
                          onClick={() => handleMarkComplete(poll.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing === "completing" ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          {isProcessing === "completing" ? "Processing..." : "Mark Complete"}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(poll.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing === "deleting" ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        {isProcessing === "deleting" ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {polls.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">Live Polls</div>
              <div className="text-2xl font-bold text-green-400">
                {polls.filter(p => p.can_accept_bets).length}
              </div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">Total Volume</div>
              <div className="text-2xl font-bold text-cyan-400">
                Kes {polls.reduce((sum, p) => sum + (p.total_pool || 0), 0).toFixed(0)}
              </div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">Total Traders</div>
              <div className="text-2xl font-bold text-white">
                {polls.reduce((sum, p) => sum + (p.participants || 0), 0)}
              </div>
            </div>
            
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">Avg. Options</div>
              <div className="text-2xl font-bold text-purple-400">
                {(polls.reduce((sum, p) => sum + (p.options?.length || 0), 0) / polls.length).toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Note: Closed polls cannot be reopened. Delete polls carefully as this action is permanent.</p>
        </div>
      </div>
    </div>
  );
};

export default ManagePolls;