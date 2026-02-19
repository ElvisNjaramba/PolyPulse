import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";

const PollsList = () => {
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // category filter
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "open", "closed"
  const [sortBy, setSortBy] = useState("trending");
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Categories dynamically built from backend data
  const [categories, setCategories] = useState([
    { id: "all", name: "All", icon: "🌐" },
  ]);

  // ---------------------------------------------------
  // FETCH POLLS – strictly from backend, no mock data
  // ---------------------------------------------------
  const loadPolls = async () => {
    try {
      setLoading(true);
      const res = await api.get("/polls/");

      const data = res.data.results || res.data;

      const uniqueCats = [
        ...new Set(data.map((p) => p.category).filter(Boolean)),
      ];

      setCategories((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        const newCats = uniqueCats
          .filter((c) => !existing.has(c))
          .map((c) => ({
            id: c,
            name: c.charAt(0).toUpperCase() + c.slice(1),
            icon: "🏷️",
          }));
        return [...prev, ...newCats];
      });

      const normalized = data.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category || "general",
        status: p.status,
        total_pool: p.total_pool || 0,
        participants: p.all_user_ids?.length || 0,
        options: p.options || [],
        closing_time: p.closes_at,
        can_accept_bets: p.can_accept_bets,
        trending: p.total_pool > 1000 || (p.all_user_ids?.length || 0) > 10,
        is_free: p.is_free,
      }));

      setPolls(normalized);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, statusFilter, sortBy, itemsPerPage]);

  // ---------------------------------------------------
  // HELPERS
  // ---------------------------------------------------
  const formatTimeRemaining = (closingTime) => {
    if (!closingTime) return "Unknown";
    const diff = new Date(closingTime) - new Date();
    if (diff <= 0) return "Closed";

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const marketTrend = (poll) => {
    if (!poll.options?.length) return "neutral";
    const avg =
      poll.options.reduce((s, o) => s + (o.price || 0.5), 0) /
      poll.options.length;
    if (avg > 0.6) return "bullish";
    if (avg < 0.4) return "bearish";
    return "neutral";
  };

  // ---------------------------------------------------
  // FILTER + SORT
  // ---------------------------------------------------
  const filteredPolls = useMemo(() => {
    return polls
      .filter((p) => {
        if (filter !== "all" && filter && p.category !== filter) return false;
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          if (
            !p.title.toLowerCase().includes(s) &&
            !p.description?.toLowerCase().includes(s)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "volume":
            return b.total_pool - a.total_pool;
          case "ending":
            return new Date(a.closing_time) - new Date(b.closing_time);
          case "participants":
            return b.participants - a.participants;
          default:
            return b.total_pool - a.total_pool;
        }
      });
  }, [polls, filter, statusFilter, search, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPolls.length / itemsPerPage);
  const paginatedPolls = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolls.slice(start, start + itemsPerPage);
  }, [filteredPolls, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------
  // STYLED UI
  // ---------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Prediction Markets
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              {filteredPolls.length} markets found
            </p>
          </div>

          <button
            onClick={() => navigate("/create/poll")}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center gap-2 font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
          >
            <Zap size={18} className="group-hover:rotate-12 transition" />
            Create Market
          </button>
        </div>

        {/* SEARCH + FILTER CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition text-white placeholder-gray-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white appearance-none cursor-pointer"
          >
            <option value="volume">🔥 High Volume</option>
            <option value="ending">⏳ Ending Soon</option>
            <option value="participants">👥 Most Participants</option>
          </select>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
              showFilters
                ? "bg-cyan-500 text-black"
                : "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Filter size={18} />
            Filters
            {showFilters && <X size={16} className="ml-1" />}
          </button>
        </div>

        {/* FILTER PANEL (categories + status) */}
        {showFilters && (
          <div className="mb-8 p-4 bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-800 animate-fadeIn space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Status</label>
              <div className="flex gap-2">
                {["all", "open", "closed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/30"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {status === "all" ? "All" : status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFilter(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      filter === c.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/30"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className="mr-1">{c.icon}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POLLS LIST */}
        <div className="space-y-5">
          {paginatedPolls.map((poll, index) => {
            const expanded = expandedPoll === poll.id;
            const trend = marketTrend(poll);
            const trendColors = {
              bullish: "text-green-400",
              bearish: "text-red-400",
              neutral: "text-gray-400",
            };

            return (
              <div
                key={poll.id}
                className="group bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Main card - clicking toggles expand (except on title) */}
                <div
                  onClick={() => setExpandedPoll(expanded ? null : poll.id)}
                  className="p-6 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Title is now a link to detail page */}
                        <h3
                          onClick={(e) => {
                            e.stopPropagation(); // prevent card toggle
                            navigate(`/polls/${poll.id}`);
                          }}
                          className="font-bold text-xl text-white hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {poll.title}
                        </h3>
                        {poll.trending && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-full">
                            <TrendingUp size={12} />
                            Trending
                          </span>
                        )}
                        {poll.is_free && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                            Free
                          </span>
                        )}
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            poll.status === "open"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-600/50 text-gray-300 border border-gray-500/30"
                          }`}
                        >
                          {poll.status === "open" ? "🟢 Open" : "🔴 Closed"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {poll.description}
                      </p>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-300 bg-gray-700/30 px-3 py-1 rounded-full">
                          <DollarSign size={14} className="text-cyan-400" />
                          KES {poll.total_pool.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-300 bg-gray-700/30 px-3 py-1 rounded-full">
                          <Users size={14} className="text-blue-400" />
                          {poll.participants}
                        </span>
                        <span className="flex items-center gap-1 text-gray-300 bg-gray-700/30 px-3 py-1 rounded-full">
                          <Clock size={14} className="text-yellow-400" />
                          {formatTimeRemaining(poll.closing_time)}
                        </span>
                        <span
                          className={`flex items-center gap-1 bg-gray-700/30 px-3 py-1 rounded-full ${
                            trendColors[trend]
                          }`}
                        >
                          <TrendingUp size={14} />
                          {trend}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      size={20}
                      className={`text-gray-500 transition-transform duration-300 ${
                        expanded ? "rotate-90 text-cyan-400" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* EXPANDED OPTIONS */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  {expanded && poll.options?.length > 0 && (
                    <div className="border-t border-gray-700/50 p-6 space-y-3 bg-gray-900/50">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">
                        Trade an option
                      </h4>
                      {poll.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex justify-between items-center bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition border border-gray-700/50"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {opt.text}
                            </div>
                            <div className="text-sm text-gray-400">
                              Price:{" "}
                              <span className="text-cyan-400 font-mono">
                                KES {(opt.price || 0.5).toFixed(3)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/polls/${poll.id}`, {
                                state: { option: opt },
                              });
                            }}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 rounded-xl font-medium text-sm shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105"
                          >
                            Trade
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {filteredPolls.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/50 rounded-full mb-6">
              <Search size={32} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">
              No markets found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {filteredPolls.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredPolls.length)} of{" "}
                {filteredPolls.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                          : "bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsList;