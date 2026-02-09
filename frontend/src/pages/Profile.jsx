import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../api/profile";
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetchProfile();
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock data for demonstration
  const mockTradeHistory = [
    { id: 1, market: "Bitcoin $100K", option: "YES", amount: 50, price: 0.68, pnl: 12.5, timestamp: "2024-01-15T14:30:00Z" },
    { id: 2, market: "Tesla Q4 Results", option: "NO", amount: 25, price: 0.42, pnl: -3.2, timestamp: "2024-01-14T10:15:00Z" },
    { id: 3, market: "Election Winner", option: "Candidate A", amount: 100, price: 0.52, pnl: 24.8, timestamp: "2024-01-13T16:45:00Z" },
    { id: 4, market: "Fed Rate Decision", option: "HOLD", amount: 75, price: 0.38, pnl: 15.6, timestamp: "2024-01-12T09:20:00Z" },
  ];

  const mockAchievements = [
    { id: 1, title: "First Trade", icon: "🥇", description: "Placed your first prediction", unlocked: true },
    { id: 2, title: "Market Maker", icon: "🏆", description: "Created 5+ prediction markets", unlocked: true },
    { id: 3, title: "Big Spender", icon: "💰", description: "Traded over $1,000 total", unlocked: false },
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
      {/* Custom scrollbar styles */}
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
                👤 My Profile
              </h1>
              <p className="text-gray-400 mt-2">Manage your account, track performance, and view trading history</p>
            </div>
            
            <button
              onClick={() => navigate("/settings")}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:text-white hover:border-gray-700 rounded-xl transition-all flex items-center gap-2"
            >
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6 sticky top-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                    <Edit size={14} className="text-gray-400" />
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1">{profile.username}</h2>
                <p className="text-gray-400 text-sm mb-4">{profile.email}</p>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 border border-gray-800/50 rounded-full text-sm text-gray-300">
                  <Shield size={12} />
                  Member since {new Date(profile.created_at || Date.now()).getFullYear()}
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
                    onClick={() => navigate("/deposit")}
                    className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
                  >
                    Add Funds
                  </button>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${Number(profile.balance || 0).toFixed(2)}
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
                  <span className="font-bold text-white">{profile.total_trades || "0"}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-sm text-gray-300">Win Rate</span>
                  </div>
                  <span className="font-bold text-green-400">
                    {profile.win_rate ? `${profile.win_rate}%` : "—"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-yellow-400" />
                    <span className="text-sm text-gray-300">Total P/L</span>
                  </div>
                  <span className={`font-bold ${(profile.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Math.abs(profile.total_pnl || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-800/50 hover:text-white transition-all flex items-center justify-center gap-2">
                  <Bell size={16} />
                  Notification Settings
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

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      {mockTradeHistory.slice(0, 3).map(trade => (
                        <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800/50">
                          <div>
                            <div className="font-medium text-white">{trade.market}</div>
                            <div className="text-sm text-gray-400">
                              {trade.option} • ${trade.amount} @ ${trade.price}
                            </div>
                          </div>
                          <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </div>
                        </div>
                      ))}
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
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">P/L</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTradeHistory.map(trade => (
                          <tr key={trade.id} className="border-b border-gray-800/30 hover:bg-gray-900/50 transition-all">
                            <td className="py-3 px-4">
                              <div className="font-medium text-white">{trade.market}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.option === "YES" || trade.option === "Candidate A" 
                                  ? "bg-green-500/20 text-green-400" 
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {trade.option}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white font-medium">
                              ${trade.amount}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "achievements" && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockAchievements.map(achievement => (
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
                  <h3 className="text-xl font-bold text-white mb-6">Account Activity</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium">Account Security</div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg">Secure</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">Last password change</div>
                        <div className="text-sm text-gray-300">2 weeks ago</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                      <div className="text-white font-medium mb-2">Referral Link</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 text-sm truncate">
                          https://polypulse.com/ref/{profile.username}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`https://polypulse.com/ref/${profile.username}`)}
                          className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all flex items-center gap-1"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Open Positions</div>
                <div className="text-2xl font-bold text-white">{profile.open_positions || "0"}</div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Avg. Return</div>
                <div className="text-2xl font-bold text-green-400">
                  {profile.avg_return ? `+${profile.avg_return}%` : "—"}
                </div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Risk Score</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {profile.risk_score || "Medium"}
                </div>
              </div>
              
              <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Rank</div>
                <div className="text-2xl font-bold text-purple-400">
                  #{profile.rank || "—"}
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