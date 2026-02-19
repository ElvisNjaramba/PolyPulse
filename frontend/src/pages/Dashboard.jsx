import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPolls } from "../api/polls";

// Status badge styles
const STATUS_STYLES = {
  open:      "bg-green-500/20 text-green-400 border border-green-500/30",
  closed:    "bg-red-500/20 text-red-400 border border-red-500/30",
  resolved:  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  suspended: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

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
  });
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const navigate = useNavigate();

  // Fetch polls and refresh every 30 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchPolls();
        setPolls(res.data);
        calculateStats(res.data);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const calculateStats = (pollsData) => {
    const totalMarkets = pollsData.length;
    const allUserIds = pollsData.flatMap(poll => poll.all_user_ids || []);
    const uniqueUserCount = new Set(allUserIds).size;
    const totalVolume = pollsData.reduce(
      (sum, p) => sum + Number(p.total_pool || 0),
      0
    );
    setStats({
      totalMarkets,
      activeMarkets: uniqueUserCount,
      totalVolume,
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

  // Categories from polls
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

  // Filtered polls based on search, filter, category
  const filteredPolls = useMemo(() => {
    return polls.filter(poll => {
      // Use actual status from API
      if (filter !== "all" && poll.status !== filter) return false;
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
  }, [polls, filter, category, search]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPolls.length / itemsPerPage);
  const paginatedPolls = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolls.slice(start, start + itemsPerPage);
  }, [filteredPolls, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, category, search, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Poly Pulse Markets
              </h1>
              <p className="text-gray-400 mt-2">Trade predictions on live events and outcomes</p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Total Markets</div>
                <div className="text-2xl font-bold text-white">{stats.totalMarkets}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Active Traders</div>
                <div className="text-2xl font-bold text-green-400">{stats.activeMarkets}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
                <div className="text-sm text-gray-400 mb-1">Gross Volume</div>
                <div className="text-2xl font-bold text-cyan-400">KES {stats.totalVolume.toFixed(0)}</div>
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
                Showing {filteredPolls.length} of {polls.length} markets
              </div>
            </div>

            <div className="relative">
              <div className="categories-scrollbar overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-gray-800">
                <div className="flex gap-2 min-w-max">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat.id] || 0;
                    const isActive = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                          isActive
                            ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                            : 'bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:bg-gray-800/50 hover:text-white'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20' : 'bg-gray-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
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
            <div className="flex gap-2 overflow-x-auto pb-2 categories-scrollbar">
              {["all", "open", "closed", "resolved", "suspended"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap capitalize transition-all ${
                    filter === filterType
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                  }`}
                >
                  {filterType}
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
                        {filteredPolls.length} {filteredPolls.length === 1 ? 'market' : 'markets'} available • KES{" "}
                        {filteredPolls.reduce((sum, p) => sum + Number(p.total_pool || 0), 0).toFixed(0)} volume
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCategory("all")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl text-cyan-400 hover:text-cyan-300 text-sm font-medium hover:border-gray-700 transition-all"
                  >
                    <span>←</span> Back to All Markets
                  </button>
                </div>
              </div>
            )}

            {/* Markets Grid */}
            {paginatedPolls.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{selectedCategory?.icon || "📊"}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {search ? "No markets found" : `No markets in ${selectedCategory?.name || 'this category'}`}
                </h3>
                <p className="text-gray-400 mb-6">
                  {search ? "Try a different search term" : "Check back soon or explore other categories"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => setSearch("")} className="px-6 py-3 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all">
                    Clear Search
                  </button>
                  <button onClick={() => { setSearch(""); setCategory("all"); }} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all">
                    Browse All Markets
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPolls.map((poll) => {
                    const timeRemaining = formatTimeRemaining(poll.closes_at);
                    const marketTrend = getMarketTrend(poll);
                    const pollCategory = categories.find(c => c.id === poll.category);
                    const statusStyle = STATUS_STYLES[poll.status] || STATUS_STYLES.closed;

                    return (
                      <div
                        key={poll.id}
                        onClick={() => navigate(`/polls/${poll.id}`)}
                        className="group cursor-pointer bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5 hover:border-cyan-500/30 hover:bg-gray-900/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {pollCategory && (
                          <div className="absolute top-3 left-3 z-10">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-${pollCategory.color?.split(' ')[0]?.replace('from-', '')}/20`}>
                              <span className="text-xs">{pollCategory.icon}</span>
                              <span className="text-white/90">{pollCategory.name}</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusStyle}`}>
                            {poll.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="relative z-10 pt-8">
                          <h3 className="font-bold text-white text-lg mb-3 line-clamp-2">{poll.title}</h3>
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{poll.description || "No description provided"}</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="text-xs text-gray-500">Volume</div>
                                  <div className={`text-lg font-bold ${getVolumeColor(poll.total_pool)}`}>
                                    KES {Number(poll.total_pool || 0).toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Options</div>
                                  <div className="text-lg font-bold text-white">{poll.options?.length || 0}</div>
                                </div>
                              </div>
                              <div className={`p-2 rounded-lg ${
                                marketTrend === "bullish" ? "bg-green-500/10" : marketTrend === "bearish" ? "bg-red-500/10" : "bg-gray-800/50"
                              }`}>
                                <div className={`text-xs font-medium ${
                                  marketTrend === "bullish" ? "text-green-400" : marketTrend === "bearish" ? "text-red-400" : "text-gray-400"
                                }`}>
                                  {marketTrend === "bullish" ? "📈" : marketTrend === "bearish" ? "📉" : "➡️"} {marketTrend.toUpperCase()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                              <div className="text-xs text-gray-500">
                                {poll.status === "open" ? `Closes in ${timeRemaining}` : poll.status}
                              </div>
                              <div className="text-xs text-cyan-400 font-medium">View Market →</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPolls.length)} of {filteredPolls.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ←
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                                : "bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Dual CTA: Create Market & Duel Challenges */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-8 max-w-2xl mx-auto">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-3">Create or Duel</h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  Start your own prediction market or challenge a friend head‑to‑head.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/create/poll")}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all"
                  >
                    Create New Market
                  </button>
                  <button
                    onClick={() => navigate("/challenges")}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition-all"
                  >
                    Duel Challenges
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;