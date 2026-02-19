import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../api/profile";
import api from "../api/axios";
import {
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trophy,
  Settings,
  Edit,
  Clock,
  DollarSign,
  Percent,
  Shield,
  Bell,
  LogOut,
  Copy,
  Check
} from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Avatar upload state
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Pagination for trades table
  const [tradesPage, setTradesPage] = useState(1);
  const [tradesPerPage, setTradesPerPage] = useState(10);

  // Pagination for activity log
  const [activityPage, setActivityPage] = useState(1);
  const [activityPerPage, setActivityPerPage] = useState(5);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileRes, positionsRes] = await Promise.all([
          fetchProfile(),
          api.get("/positions/")
        ]);
        setProfile(profileRes.data);
        if (profileRes.data.avatar) {
          setAvatarPreview(profileRes.data.avatar);
        }
        setPositions(positionsRes.data);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.patch('/auth/profile/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update profile with new avatar URL from server
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
      // If the server returns a different URL, we might want to use that
      // For now, keep preview (or replace with server URL)
      if (res.data.avatar) {
        setAvatarPreview(res.data.avatar);
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
      // Rollback preview on error
      setAvatarPreview(profile?.avatar || null);
    } finally {
      setUploading(false);
      // Clean up object URL after upload (important)
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Derived stats from positions
  const totalTrades = positions.length;
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const winningTrades = positions.filter(p => p.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgReturn = totalTrades > 0 ? (totalPnL / totalTrades) : 0;
  const openPositions = positions.filter(p => p.status === "open").length;

  // Mock activity log (replace with real API call later)
  const activityLog = [
    { id: 1, type: "login", description: "Logged in from Chrome on Windows", timestamp: "2024-01-15T10:30:00Z" },
    { id: 2, type: "trade", description: "Placed a YES bet on 'Bitcoin $100K'", timestamp: "2024-01-14T14:20:00Z" },
    { id: 3, type: "withdrawal", description: "Withdrew Kes 500 to bank account", timestamp: "2024-01-12T09:15:00Z" },
    { id: 4, type: "deposit", description: "Deposited Kes 1000 via credit card", timestamp: "2024-01-10T18:45:00Z" },
    { id: 5, type: "security", description: "Changed password", timestamp: "2024-01-05T22:10:00Z" },
    { id: 6, type: "login", description: "Logged in from Safari on iPhone", timestamp: "2024-01-03T08:05:00Z" },
  ];

  // Pagination for trades
  const totalTradePages = Math.ceil(positions.length / tradesPerPage);
  const paginatedTrades = useMemo(() => {
    const start = (tradesPage - 1) * tradesPerPage;
    return positions.slice(start, start + tradesPerPage);
  }, [positions, tradesPage, tradesPerPage]);

  // Pagination for activity
  const totalActivityPages = Math.ceil(activityLog.length / activityPerPage);
  const paginatedActivity = useMemo(() => {
    const start = (activityPage - 1) * activityPerPage;
    return activityLog.slice(start, start + activityPerPage);
  }, [activityLog, activityPage, activityPerPage]);

  // Reset pagination when tab changes (optional)
  useEffect(() => {
    setTradesPage(1);
    setActivityPage(1);
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Static achievements (can be expanded later)
  const achievements = [
    { id: 1, title: "First Trade", icon: "🥇", description: "Placed your first prediction", unlocked: totalTrades > 0 },
    { id: 2, title: "Market Maker", icon: "🏆", description: "Created 5+ prediction markets", unlocked: false },
    { id: 3, title: "Big Spender", icon: "💰", description: "Traded over Kes 1,000 total", unlocked: Math.abs(totalPnL) > 1000 },
    { id: 4, title: "Perfect Predictor", icon: "🎯", description: "10 consecutive winning trades", unlocked: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-cyan-500 rounded-full animate-spin mb-4 mx-auto" />
          <div className="text-gray-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Scrollbar styles */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #2563eb);
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 rgba(30, 41, 59, 0.3);
        }
      `}</style>

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-400 mt-2">Manage your account, track performance, and view trading history</p>
            </div>
            {/* Settings button removed */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6 sticky top-6">
              {/* Profile Header with Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4 group">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {profile?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-cyan-400 rounded-full animate-spin" />
                    ) : (
                      <Edit size={14} className="text-gray-400" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1">{profile?.username}</h2>
                <p className="text-gray-400 text-sm mb-4">{profile?.email}</p>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 border border-gray-800/50 rounded-full text-sm text-gray-300">
                  <Shield size={12} />
                  Member since {new Date().getFullYear()}
                </div>
              </div>

              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Wallet size={18} />
                    <span className="text-sm font-medium">Wallet Balance</span>
                  </div>
                  <button
                    onClick={() => navigate("/wallet")}
                    className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
                  >
                    Manage
                  </button>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(profile?.balance || 0)}
                </div>
                <div className="text-xs text-gray-400">Available for trading</div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Total Trades</span>
                  </div>
                  <span className="font-bold text-white">{totalTrades}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-sm text-gray-300">Win Rate</span>
                  </div>
                  <span className="font-bold text-green-400">
                    {winRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-yellow-400" />
                    <span className="text-sm text-gray-300">Total P/L</span>
                  </div>
                  <span className={`font-bold Kes {totalPnL >= 0 ? 'text-white-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/notifications")}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-800/50 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Bell size={16} />
                  Notifications
                </button>
                <button className="w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["overview", "trades", "achievements", "activity"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white mb-4">Trading Overview</h3>
                  
                  {/* Performance Chart Placeholder */}
                  <div className="h-48 bg-gray-900/50 rounded-xl border border-gray-800/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-gray-400">Performance chart coming soon</div>
                    </div>
                  </div>

                  {/* Recent Activity (last 3 positions) */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      {positions.slice(0, 3).map((trade, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <div className="font-medium text-white">{trade.poll_title}</div>
                            <div className="text-sm text-gray-400">
                              {trade.option} • {trade.shares.toFixed(2)} shares @ Kes {trade.avg_price.toFixed(3)}
                            </div>
                          </div>
                          <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                          </div>
                        </div>
                      ))}
                      {positions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No trading activity yet. Start trading to see your performance.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "trades" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Trade History</h3>
                    <button className="px-4 py-2 text-sm bg-gray-900/50 border border-gray-800/50 text-gray-400 rounded-xl hover:text-white hover:border-gray-700 transition-all">
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800/50">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Market</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Position</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Shares</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Avg Price</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Current Price</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">P/L</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTrades.map((trade, idx) => (
                          <tr key={idx} className="border-b border-gray-800/30 hover:bg-gray-900/50 transition-all">
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">{trade.poll_title}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.option.toLowerCase() === "yes" 
                                  ? "bg-green-500/20 text-green-400" 
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {trade.option}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white font-medium">
                              {trade.shares.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-white">
                            Kes {trade.avg_price.toFixed(3)}
                            </td>
                            <td className="py-3 px-4 text-white">
                              Kes {trade.current_price.toFixed(3)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                trade.status === "open" ? "bg-green-500/20 text-green-400" : "bg-gray-600/50 text-gray-300"
                              }`}>
                                {trade.status === "open" ? "Open" : "Closed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {positions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No trades yet.
                      </div>
                    )}

                    {/* Pagination for trades */}
                    {positions.length > 0 && (
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Show</span>
                          <select
                            value={tradesPerPage}
                            onChange={(e) => {
                              setTradesPerPage(Number(e.target.value));
                              setTradesPage(1);
                            }}
                            className="bg-gray-900/50 border border-gray-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                          </select>
                          <span>per page</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {(tradesPage - 1) * tradesPerPage + 1} - {Math.min(tradesPage * tradesPerPage, positions.length)} of {positions.length}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setTradesPage(p => Math.max(1, p - 1))}
                              disabled={tradesPage === 1}
                              className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              ←
                            </button>
                            {Array.from({ length: Math.min(5, totalTradePages) }, (_, i) => {
                              let pageNum;
                              if (totalTradePages <= 5) {
                                pageNum = i + 1;
                              } else if (tradesPage <= 3) {
                                pageNum = i + 1;
                              } else if (tradesPage >= totalTradePages - 2) {
                                pageNum = totalTradePages - 4 + i;
                              } else {
                                pageNum = tradesPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setTradesPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                    tradesPage === pageNum
                                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                                      : "bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setTradesPage(p => Math.min(totalTradePages, p + 1))}
                              disabled={tradesPage === totalTradePages}
                              className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "achievements" && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-xl border transition-all ${
                          achievement.unlocked
                            ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20"
                            : "bg-gray-900/50 border-gray-800/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-white">{achievement.title}</h4>
                              {achievement.unlocked ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">Unlocked</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-800/50 text-gray-400 text-xs rounded-lg">Locked</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    {paginatedActivity.map((activity) => (
                      <div key={activity.id} className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-white font-medium">{activity.description}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</div>
                          </div>
                          <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for activity */}
                  {activityLog.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Show</span>
                        <select
                          value={activityPerPage}
                          onChange={(e) => {
                            setActivityPerPage(Number(e.target.value));
                            setActivityPage(1);
                          }}
                          className="bg-gray-900/50 border border-gray-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                        </select>
                        <span>per page</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {(activityPage - 1) * activityPerPage + 1} - {Math.min(activityPage * activityPerPage, activityLog.length)} of {activityLog.length}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                            disabled={activityPage === 1}
                            className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            ←
                          </button>
                          {Array.from({ length: Math.min(5, totalActivityPages) }, (_, i) => {
                            let pageNum;
                            if (totalActivityPages <= 5) {
                              pageNum = i + 1;
                            } else if (activityPage <= 3) {
                              pageNum = i + 1;
                            } else if (activityPage >= totalActivityPages - 2) {
                              pageNum = totalActivityPages - 4 + i;
                            } else {
                              pageNum = activityPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setActivityPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                  activityPage === pageNum
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                                    : "bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                            disabled={activityPage === totalActivityPages}
                            className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Open Positions</div>
                <div className="text-2xl font-bold text-white">{openPositions}</div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Avg. Return</div>
                <div className="text-2xl font-bold text-green-400">
                  {avgReturn >= 0 ? '+' : ''}{formatCurrency(avgReturn)}
                </div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Risk Score</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {positions.length > 10 ? "High" : positions.length > 5 ? "Medium" : "Low"}
                </div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Rank</div>
                <div className="text-2xl font-bold text-purple-400">
                  —
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;