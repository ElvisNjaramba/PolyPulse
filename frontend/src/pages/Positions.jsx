import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    api
      .get("/positions/")
      .then((res) => setPositions(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load positions");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter positions based on selected status
  const filteredPositions = useMemo(() => {
    if (filter === "all") return positions;
    return positions.filter((p) => p.status === filter);
  }, [positions, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPositions.slice(start, start + itemsPerPage);
  }, [filteredPositions, currentPage, itemsPerPage]);

  // Group paginated positions by status
  const grouped = useMemo(() => {
    const groups = {};
    paginatedPositions.forEach((pos) => {
      const status = pos.status || "unknown";
      if (!groups[status]) groups[status] = [];
      groups[status].push(pos);
    });
    return groups;
  }, [paginatedPositions]);

  // Summary totals (overall, not filtered)
  const totalInvested = positions.reduce(
    (sum, p) => sum + (p.avg_price * p.shares),
    0
  );
  const totalValue = positions.reduce(
    (sum, p) => sum + (p.current_price * p.shares),
    0
  );
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

  const statusConfig = {
    open: { label: "🟢 Open", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    resolved: { label: "🏁 Resolved", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    closed: { label: "🔒 Closed", bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-400" },
    suspended: { label: "⛔ Suspended", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    unknown: { label: "📦 Other", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  };

  // Reset to first page when filter or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          Loading your positions...
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
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Your Positions
          </h1>
          <p className="text-gray-400 mt-2">Track your active and settled prediction markets</p>
        </div>

        {/* Summary Cards */}
        {positions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5">
              <p className="text-sm text-gray-400 mb-1">Total Invested</p>
              <p className="text-2xl font-bold text-white">
                ${totalInvested.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5">
              <p className="text-sm text-gray-400 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-white">
                ${totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5">
              <p className="text-sm text-gray-400 mb-1">Total P&L</p>
              <p
                className={`text-2xl font-bold ${
                  totalPnL >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "open", "resolved", "closed", "suspended"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === status
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              {status === "all" ? "📋 All" : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {/* No positions message */}
        {filteredPositions.length === 0 && (
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-12 text-center">
            <p className="text-gray-400 text-lg">No positions found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === "all"
                ? "Start trading to see your positions here"
                : `No ${filter} positions to display`}
            </p>
          </div>
        )}

        {/* Positions by status (from current page) */}
        {Object.entries(grouped).map(([status, items]) => {
          const config = statusConfig[status] || statusConfig.unknown;
          return (
            <div key={status} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-white">{config.label}</h2>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${config.bg} ${config.text} border ${config.border}`}
                >
                  {items.length}
                </span>
              </div>

              <div className="space-y-4">
                {items.map((pos, idx) => {
                  const pnl = pos.pnl;
                  const pnlClass = pnl >= 0 ? "text-green-400" : "text-red-400";
                  return (
                    <div
                      key={idx}
                      className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-5 hover:border-gray-700/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left side: Poll title and option */}
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{pos.poll_title}</h3>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                pos.option.toLowerCase() === "yes"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {pos.option}
                            </span>
                            <span className="text-sm text-gray-400">
                              {pos.shares.toFixed(4)} shares
                            </span>
                          </div>
                        </div>

                        {/* Right side: Prices and P&L */}
                        <div className="grid grid-cols-3 gap-6 md:gap-8">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Avg Price</p>
                            <p className="text-white font-mono">${pos.avg_price.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Current</p>
                            <p className="text-white font-mono">${pos.current_price.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">P&L</p>
                            <p className={`font-mono font-medium ${pnlClass}`}>
                              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar for open positions */}
                      {status === "open" && (
                        <div className="mt-4">
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (pos.current_price / pos.avg_price) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Enhanced Pagination Controls */}
        {filteredPositions.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPositions.length)} of {filteredPositions.length}
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
        )}
      </div>
    </div>
  );
};

export default Positions;