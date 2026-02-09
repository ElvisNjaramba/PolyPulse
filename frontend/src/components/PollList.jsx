import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Search, Filter, TrendingUp, Clock, DollarSign, Users, Zap, ChevronRight, ChevronDown } from "lucide-react";

const PollsList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: "all", name: "All Polls", icon: "🌐", color: "from-cyan-500 to-blue-500" },
    { id: "trending", name: "Trending", icon: "🔥", color: "from-orange-500 to-red-500" },
    { id: "politics", name: "Politics", icon: "🏛️", color: "from-red-500 to-pink-500" },
    { id: "sports", name: "Sports", icon: "⚽", color: "from-green-500 to-emerald-500" },
    { id: "crypto", name: "Crypto", icon: "₿", color: "from-yellow-500 to-amber-500" },
    { id: "stocks", name: "Stocks", icon: "📈", color: "from-blue-500 to-cyan-500" },
    { id: "entertainment", name: "Entertainment", icon: "🎬", color: "from-purple-500 to-pink-500" },
    { id: "technology", name: "Tech", icon: "💻", color: "from-indigo-500 to-purple-500" },
  ];

  useEffect(() => {
    const loadPolls = async () => {
      try {
        setLoading(true);
        const res = await api.get("/polls/");
        
        // Transform backend data to match frontend format
        const normalizedPolls = res.data.map(poll => ({
          id: poll.id,
          title: poll.title,
          description: poll.description,
          category: poll.category || "general",
          total_pool: parseFloat(poll.total_pool) || 0,
          participants: poll.active_traders || 0,
          options: poll.options?.map(opt => ({
            id: opt.id,
            text: opt.text,
            price: parseFloat(opt.price) || 0.5,
            volume: parseFloat(opt.total_shares) || 0,
            user_shares: parseFloat(opt.user_shares) || 0,
            avg_price: parseFloat(opt.avg_price) || 0.5,
          })) || [],
          closing_time: poll.closing_time,
          can_accept_bets: poll.can_accept_bets,
          trending: determineIfTrending(poll),
          tags: generateTags(poll),
          is_free: poll.is_free || false,
          created_at: poll.created_at,
          updated_at: poll.updated_at,
        }));
        
        setPolls(normalizedPolls);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
        // Fallback to empty array on error
        setPolls([]);
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, []);

  // Helper function to determine if a poll is trending
  const determineIfTrending = (poll) => {
    // Trending if created recently (within last 7 days) and has activity
    const createdDate = new Date(poll.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isRecent = createdDate > weekAgo;
    const hasActivity = (poll.active_traders || 0) > 10 || (parseFloat(poll.total_pool) || 0) > 1000;
    
    return isRecent && hasActivity;
  };

  // Helper function to generate tags from poll data
  const generateTags = (poll) => {
    const tags = [];
    if (poll.category) tags.push(poll.category.charAt(0).toUpperCase() + poll.category.slice(1));
    
    // Add some generic tags based on poll content
    const title = poll.title.toLowerCase();
    if (title.includes("bitcoin") || title.includes("crypto") || title.includes("ethereum")) {
      tags.push("Crypto");
    }
    if (title.includes("stock") || title.includes("market") || title.includes("nasdaq")) {
      tags.push("Stocks");
    }
    if (title.includes("election") || title.includes("president") || title.includes("politics")) {
      tags.push("Politics");
    }
    if (title.includes("game") || title.includes("sports") || title.includes("tournament")) {
      tags.push("Sports");
    }
    
    return tags;
  };

  const formatTimeRemaining = (closingTime) => {
    if (!closingTime) return "Unknown";
    const now = new Date();
    const close = new Date(closingTime);
    const diffMs = close - now;
    
    if (diffMs <= 0) return "Closed";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    return `${diffHours}h`;
  };

  const calculateMarketTrend = (poll) => {
    if (!poll.options || poll.options.length === 0) {
      return { trend: "neutral", icon: "➡️", color: "text-gray-400", bg: "bg-gray-500/10" };
    }
    
    const prices = poll.options.map(o => o.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    if (avgPrice > 0.6) return { trend: "bullish", icon: "📈", color: "text-green-400", bg: "bg-green-500/10" };
    if (avgPrice < 0.4) return { trend: "bearish", icon: "📉", color: "text-red-400", bg: "bg-red-500/10" };
    return { trend: "neutral", icon: "➡️", color: "text-gray-400", bg: "bg-gray-500/10" };
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : "from-gray-500 to-gray-700";
  };

  const filteredPolls = polls.filter(poll => {
    // Filter by category
    if (filter !== "all" && filter !== "trending" && poll.category !== filter) return false;
    if (filter === "trending" && !poll.trending) return false;
    
    // Filter by search
    if (search && !poll.title.toLowerCase().includes(search.toLowerCase()) && 
        !poll.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected criteria
    switch (sortBy) {
      case "volume":
        return b.total_pool - a.total_pool;
      case "ending":
        return new Date(a.closing_time) - new Date(b.closing_time);
      case "participants":
        return b.participants - a.participants;
      case "trending":
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.total_pool - a.total_pool;
      default:
        return b.total_pool - a.total_pool;
    }
  });

  const handlePollClick = (pollId) => {
    if (expandedPoll === pollId) {
      setExpandedPoll(null);
    } else {
      setExpandedPoll(pollId);
    }
  };

  const PlaceBetButton = ({ poll, option }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/polls/${poll.id}`, { state: { option } });
      }}
      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!poll.can_accept_bets}
    >
      View ${option.price.toFixed(3)}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-cyan-500 rounded-full animate-spin mb-4 mx-auto" />
          <div className="text-gray-400">Loading polls...</div>
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                📋 All Prediction Markets
              </h1>
              <p className="text-gray-400 mt-2">Discover, analyze, and bet on prediction markets across all categories</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Markets</div>
                <div className="text-2xl font-bold text-white">{polls.length}</div>
              </div>
              <button
                onClick={() => navigate("/create/poll")}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Zap size={18} />
                Create Poll
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <DollarSign className="text-cyan-400" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Volume</div>
                  <div className="text-xl font-bold text-white">
                    ${polls.reduce((sum, p) => sum + (p.total_pool || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Users className="text-green-400" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Active Traders</div>
                  <div className="text-xl font-bold text-white">
                    {polls.reduce((sum, p) => sum + (p.participants || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Trending Now</div>
                  <div className="text-xl font-bold text-white">
                    {polls.filter(p => p.trending).length}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <Clock className="text-orange-400" size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Closing Soon</div>
                  <div className="text-xl font-bold text-white">
                    {polls.filter(p => {
                      if (!p.closing_time) return false;
                      const closing = new Date(p.closing_time);
                      const now = new Date();
                      return closing - now < 7 * 24 * 60 * 60 * 1000;
                    }).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search predictions, topics, or categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={20} />
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    showFilters
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                  }`}
                >
                  <Filter size={18} />
                  Filters
                  <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50"
                >
                  <option value="trending">🔥 Trending</option>
                  <option value="volume">💰 High Volume</option>
                  <option value="ending">⏰ Ending Soon</option>
                  <option value="participants">👥 Most Participants</option>
                </select>
              </div>
            </div>

            {/* Category Filter Chips */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilter(cat.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filter === cat.id
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                          : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {search && (
                <div className="px-3 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-lg flex items-center gap-2">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
                    ×
                  </button>
                </div>
              )}
              {filter !== "all" && (
                <div className="px-3 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-lg flex items-center gap-2">
                  Filter: {categories.find(c => c.id === filter)?.name}
                  <button onClick={() => setFilter("all")} className="text-gray-500 hover:text-white">
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Polls List */}
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const marketTrend = calculateMarketTrend(poll);
            const timeRemaining = formatTimeRemaining(poll.closing_time);
            const isExpanded = expandedPoll === poll.id;
            const categoryInfo = categories.find(c => c.id === poll.category) || categories[0];

            return (
              <div
                key={poll.id}
                className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden transition-all duration-300 hover:border-gray-700/50 group"
              >
                {/* Poll Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => handlePollClick(poll.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left Column */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${getCategoryColor(poll.category)} text-white`}>
                          {categoryInfo.icon} {categoryInfo.name}
                        </div>
                        {poll.trending && (
                          <div className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1">
                            <TrendingUp size={12} />
                            Trending
                          </div>
                        )}
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${poll.can_accept_bets ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {poll.can_accept_bets ? "LIVE" : "CLOSED"}
                        </div>
                        {poll.is_free && (
                          <div className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                            FREE
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                        {poll.title}
                      </h3>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">
                        {poll.description}
                      </p>

                      {/* Tags */}
                      {poll.tags && poll.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {poll.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <DollarSign size={16} />
                          <span className="font-semibold text-white">${(poll.total_pool || 0).toLocaleString()}</span>
                          <span className="text-gray-500">volume</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users size={16} />
                          <span className="font-semibold text-white">{poll.participants || 0}</span>
                          <span className="text-gray-500">traders</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={16} />
                          <span className={`font-semibold ${poll.can_accept_bets ? "text-yellow-400" : "text-red-400"}`}>
                            {timeRemaining}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 ${marketTrend.color}`}>
                          <span className="text-lg">{marketTrend.icon}</span>
                          <span className="font-semibold">{marketTrend.trend.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-end gap-3">
                      <ChevronRight
                        className={`text-gray-500 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                        size={20}
                      />
                      
                      {/* Price Preview */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Current Prices</div>
                        <div className="flex gap-2">
                          {poll.options && poll.options.slice(0, 2).map((option, idx) => (
                            <div
                              key={option.id}
                              className={`px-3 py-2 rounded-lg text-sm font-bold ${
                                idx === 0 
                                  ? "bg-green-500/10 text-green-400" 
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              <div className="text-xs opacity-75">{option.text}</div>
                              <div>${option.price.toFixed(3)}</div>
                            </div>
                          ))}
                          {poll.options && poll.options.length > 2 && (
                            <div className="px-3 py-2 rounded-lg text-sm bg-gray-800/50 text-gray-400 flex items-center">
                              +{poll.options.length - 2}
                            </div>
                          )}
                          {(!poll.options || poll.options.length === 0) && (
                            <div className="px-3 py-2 rounded-lg text-sm bg-gray-800/50 text-gray-400">
                              No options
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && poll.options && poll.options.length > 0 && (
                  <div className="border-t border-gray-800/50 p-6 bg-gray-900/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Options Grid */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Available Options</h4>
                        <div className="space-y-3">
                          {poll.options.map((option, idx) => (
                            <div
                              key={option.id}
                              className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50 hover:border-cyan-500/30 transition-all"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    idx === 0 ? "bg-green-500/20 text-green-400" :
                                    idx === 1 ? "bg-red-500/20 text-red-400" :
                                    "bg-blue-500/20 text-blue-400"
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <div className="font-semibold text-white">{option.text}</div>
                                  <div className="text-xs text-gray-500 ml-auto">
                                    {option.volume > 0 ? `$${option.volume.toLocaleString()} volume` : "No volume"}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-400">
                                    Probability: <span className="text-white font-bold">{(option.price * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    Payout: <span className="text-white font-bold">${(1 / option.price).toFixed(2)} per $1</span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4">
                                <PlaceBetButton poll={poll} option={option} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Market Details */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Market Details</h4>
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Market Status</span>
                              <span className={`font-semibold ${poll.can_accept_bets ? "text-green-400" : "text-red-400"}`}>
                                {poll.can_accept_bets ? "Open for Trading" : "Closed"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Closing Time</span>
                              <span className="font-semibold text-white">
                                {poll.closing_time ? new Date(poll.closing_time).toLocaleString() : "No closing time"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Time Remaining</span>
                              <span className={`font-semibold ${timeRemaining === "Closed" ? "text-red-400" : "text-yellow-400"}`}>
                                {timeRemaining}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Type</span>
                              <span className="font-semibold text-cyan-400">
                                {poll.is_free ? "Free Market" : "Paid Market"}
                              </span>
                            </div>
                            <div className="pt-4 border-t border-gray-800/50">
                              <div className="text-sm text-gray-400 mb-2">Market Sentiment</div>
                              <div className={`p-3 rounded-lg ${marketTrend.bg}`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{marketTrend.icon}</span>
                                  <div>
                                    <div className="font-bold text-white">{marketTrend.trend.toUpperCase()} MARKET</div>
                                    <div className="text-sm text-gray-300">
                                      Average price: ${(poll.options.reduce((sum, o) => sum + o.price, 0) / poll.options.length).toFixed(3)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => navigate(`/polls/${poll.id}`)}
                            className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all flex items-center justify-center gap-2"
                          >
                            View Full Market
                          </button>
                          <button
                            onClick={() => navigate(`/polls/${poll.id}`)}
                            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all"
                          >
                            Trade Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredPolls.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No polls found</h3>
            <p className="text-gray-400 mb-6">
              {search ? `No results for "${search}"` : "Try adjusting your filters or create a new poll"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="px-6 py-3 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all"
              >
                Clear Filters
              </button>
              <button
                onClick={() => navigate("/create-poll")}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
              >
                Create Your Own Poll
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredPolls.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 text-gray-400 rounded-xl hover:text-white hover:border-gray-700 transition-all">
                Previous
              </button>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    num === 1
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 text-gray-400 rounded-xl hover:text-white hover:border-gray-700 transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsList;