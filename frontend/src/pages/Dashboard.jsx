import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPolls } from "../api/polls";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalMarkets: 0,
    activeMarkets: 0,
    totalVolume: 0,
    avgOdds: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls()
      .then((res) => {
        setPolls(res.data);
        calculateStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const calculateStats = (pollsData) => {
    const totalMarkets = pollsData.length;
    const activeMarkets = pollsData.filter(p => p.can_accept_bets).length;
    const totalVolume = pollsData.reduce(
      (sum, p) => sum + Number(p.total_pool || 0),
      0
    );

    const avgOdds =
      pollsData.length > 0
        ? pollsData.reduce((sum, p) => {
          const prices = p.options?.map(o => o.price) || [];
          if (!prices.length) return sum + 0.5;
          return sum + prices.reduce((a, b) => a + b, 0) / prices.length;
        }, 0) / pollsData.length
        : 0.5;

    setStats({
      totalMarkets,
      activeMarkets,
      totalVolume,
      avgOdds: (avgOdds * 100).toFixed(1),
    });
  };

  const formatTimeRemaining = (closesAt) => {
    if (!closesAt) return "Unknown";

    const now = new Date();
    const close = new Date(closesAt);
    const diffMs = close - now;

    if (diffMs <= 0) return "Closed";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
    return "< 1h";
  };


  const getMarketTrend = (poll) => {
    const prices = poll.options?.map(o => o.price) || [];
    if (!prices.length) return "neutral";
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return avgPrice > 0.5 ? "bullish" : avgPrice < 0.5 ? "bearish" : "neutral";
  };

  const getVolumeColor = (volume) => {
    if (volume > 10000) return "text-green-400";
    if (volume > 1000) return "text-cyan-400";
    if (volume > 100) return "text-yellow-400";
    return "text-gray-400";
  };


  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(polls.map(p => p.category).filter(Boolean))];

    return [
      {
        id: "all",
        name: "All",
        icon: "🌐",
        color: "from-gray-500 to-gray-700",
      },
      ...uniqueCategories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon: "🏷️",
        color: "from-cyan-500 to-blue-500",
      })),
    ];
  }, [polls]);

  const categoryCounts = categories.reduce((acc, cat) => {
    if (cat.id === "all") {
      acc["all"] = polls.length;
    } else {
      acc[cat.id] = polls.filter(poll => poll.category === cat.id).length;
    }
    return acc;
  }, {});

  const filteredPolls = polls.filter(poll => {
    const isClosed = poll.closes_at
      ? new Date(poll.closes_at) <= new Date()
      : true;

    if (filter === "open" && isClosed) return false;
    if (filter === "closed" && !isClosed) return false;

    if (filter === "high-volume" && Number(poll.total_pool || 0) <= 1000) return false;
    if (category !== "all" && poll.category !== category) return false;

    if (
      search &&
      !poll.title.toLowerCase().includes(search.toLowerCase()) &&
      !poll.description?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const trendingPolls = [...polls]
    .sort((a, b) => Number(b.total_pool || 0) - Number(a.total_pool || 0))
    .slice(0, 3);

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        /* Custom scrollbar styles */
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
        
        /* For Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 rgba(30, 41, 59, 0.3);
        }
        
        /* Custom horizontal scrollbar for categories */
        .categories-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        
        .categories-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        
        .categories-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          border-radius: 3px;
        }
        
        .categories-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #0891b2, #2563eb);
        }
        
        /* Hide scrollbar but keep functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Show scrollbar on hover */
        .hover\:scrollbar-default:hover::-webkit-scrollbar {
          display: block;
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
                📊 Active Markets
              </h1>
              <p className="text-gray-400 mt-2">Trade predictions on live events and outcomes</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Total Markets</div>
                <div className="text-2xl font-bold text-white">{stats.totalMarkets}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Active</div>
                <div className="text-2xl font-bold text-green-400">{stats.activeMarkets}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Total Volume</div>
                <div className="text-2xl font-bold text-cyan-400">${stats.totalVolume.toFixed(0)}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Avg Odds</div>
                <div className="text-2xl font-bold text-purple-400">{stats.avgOdds}%</div>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🏷️</span> Categories
              </h2>
              <div className="text-sm text-gray-500">
                Showing {categoryCounts[category] || 0} markets
              </div>
            </div>

            <div className="relative">
              <div className="categories-scrollbar overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max">

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex-shrink-0 group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 min-w-[140px] ${category === cat.id
                          ? "ring-2 ring-offset-2 ring-offset-gray-900 ring-cyan-500 shadow-xl scale-105"
                          : "hover:scale-[1.02]"
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} ${category === cat.id ? 'opacity-100' : 'opacity-20'
                        } group-hover:opacity-30 transition-opacity`} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{cat.icon}</span>
                          <div className="text-right ml-auto">
                            <div className="text-xs text-white/80">Markets</div>
                            <div className="text-lg font-bold text-white">{categoryCounts[cat.id] || 0}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-white text-sm truncate">{cat.name}</div>
                        {category === cat.id && (
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets by title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  🔍
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 categories-scrollbar scrollbar-hide hover:scrollbar-default">
              {["all", "open", "closed", "high-volume"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === filterType
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                    }`}
                >
                  {filterType.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <div className="text-gray-400">Loading markets...</div>
          </div>
        ) : (
          <>
            {/* Category Header */}
            {category !== "all" && selectedCategory && (
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedCategory.color} flex items-center justify-center text-3xl`}>
                      {selectedCategory.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">
                        {selectedCategory.name}
                      </h2>
                      <p className="text-gray-400">
                        {filteredPolls.length} {filteredPolls.length === 1 ? 'market' : 'markets'} available • ${filteredPolls.reduce((sum, p) => sum + Number(p.total_pool || 0), 0).toFixed(0)} volume
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCategory("all")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-cyan-400 hover:text-cyan-300 text-sm font-medium hover:border-gray-700 transition-all"
                  >
                    <span>←</span>
                    Back to All Markets
                  </button>
                </div>
              </div>
            )}

            {/* Markets Grid */}
            {filteredPolls.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">
                  {selectedCategory?.icon || "📊"}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {search ? "No markets found" : `No markets found in ${selectedCategory?.name || 'this category'}`}
                </h3>
                <p className="text-gray-400 mb-6">
                  {search ? "Try a different search term" : "Check back soon or explore other categories"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setSearch("")}
                    className="px-6 py-3 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                  >
                    Browse All Markets
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPolls.map((poll) => {
                    const isClosed = poll.closes_at
                      ? new Date(poll.closes_at) <= new Date()
                      : true;

                    const timeRemaining = formatTimeRemaining(poll.closes_at);

                    const marketTrend = getMarketTrend(poll);
                    const pollCategory = categories.find(c => c.id === poll.category);

                    return (

                      <div
                        key={poll.id}
                        onClick={() => navigate(`/polls/${poll.id}`)}
                        className="group cursor-pointer bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5 hover:border-cyan-500/30 hover:bg-gray-900/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Category Tag */}
                        {pollCategory && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${pollCategory.color?.split(" ")[0]?.replace("from-", "bg-") + "/20"
                              }`}>
                              <span className="text-xs">{pollCategory.icon}</span>
                              <span className="text-white/90">{pollCategory.name}</span>
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${isClosed
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                            }`}>
                            {isClosed ? "CLOSED" : "OPEN"}
                          </div>
                        </div>

                        <div className="relative z-10 pt-8">
                          {/* Market Title */}
                          <h3 className="font-bold text-white text-lg mb-3 line-clamp-2">
                            {poll.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                            {poll.description || "No description provided"}
                          </p>

                          {/* Market Stats */}
                          <div className="space-y-3">
                            {/* Volume & Options */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="text-xs text-gray-500">Volume</div>
                                  <div className={`text-lg font-bold ${getVolumeColor(poll.total_pool)}`}>
                                    ${Number(poll.total_pool || 0).toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Options</div>
                                  <div className="text-lg font-bold text-white">
                                    {poll.options?.length || 0}
                                  </div>
                                </div>
                              </div>

                              {/* Market Trend */}
                              <div className={`p-2 rounded-lg ${marketTrend === "bullish" ? "bg-green-500/10" :
                                  marketTrend === "bearish" ? "bg-red-500/10" : "bg-gray-800/50"
                                }`}>
                                <div className={`text-xs font-medium ${marketTrend === "bullish" ? "text-green-400" :
                                    marketTrend === "bearish" ? "text-red-400" : "text-gray-400"
                                  }`}>
                                  {marketTrend === "bullish" ? "📈" :
                                    marketTrend === "bearish" ? "📉" : "➡️"}
                                  {marketTrend.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            {/* Time & Details */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                              <div className="text-xs text-gray-500">
                                {isClosed ? "Closed" : `Closes in ${timeRemaining}`}
                              </div>
                              <div className="text-xs text-cyan-400 font-medium">
                                View Market →
                              </div>
                            </div>


                            {/* Option Prices Preview */}
                            {poll.options && poll.options.length > 0 && (
                              <div className="pt-3 border-t border-gray-800/50">
                                <div className="text-xs text-gray-500 mb-2">Current Prices</div>
                                <div className="flex gap-2">
                                  {poll.options.slice(0, 3).map((option, idx) => (
                                    <div
                                      key={option.id}
                                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${idx === 0 ? "bg-green-500/10 text-green-400" :
                                          idx === 1 ? "bg-red-500/10 text-red-400" :
                                            "bg-blue-500/10 text-blue-400"
                                        }`}
                                    >
                                      <div className="truncate">{option.text}</div>
                                      <div className="font-bold">${option.price?.toFixed(3) || "0.000"}</div>
                                    </div>
                                  ))}
                                  {poll.options.length > 3 && (
                                    <div className="px-2 py-1.5 rounded-lg text-xs bg-gray-800/50 text-gray-400">
                                      +{poll.options.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Category Navigation (when viewing a specific category) */}
                {category !== "all" && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4">Explore Other Categories</h3>
                    <div className="flex flex-wrap gap-3">
                      {categories
                        .filter(c => c.id !== category && c.id !== "all")
                        .map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-gray-400 hover:text-white hover:border-gray-700 transition-all"
                          >
                            <span>{cat.icon}</span>
                            {cat.name}
                            <span className="ml-1 text-xs bg-gray-800/50 px-1.5 py-0.5 rounded">
                              {categoryCounts[cat.id] || 0}
                            </span>
                          </button>
                        ))}
                      <button
                        onClick={() => setCategory("all")}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl font-medium hover:bg-cyan-500/20 transition-all"
                      >
                        <span>🌐</span>
                        All Categories
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Create Market CTA */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-8 max-w-2xl mx-auto">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-3">Create Your Own Market</h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  Have a prediction you want to trade? Create your own market and let others join in.
                </p>
                <button
                  onClick={() => navigate("/create/poll")}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                >
                  Create New Market
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default Dashboard;


