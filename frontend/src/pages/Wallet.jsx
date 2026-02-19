import { useEffect, useState, useMemo } from "react";
import { fetchWalletHistory } from "../api/wallet";

const Wallet = () => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchWalletHistory()
      .then(res => {
        const sorted = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setTxs(sorted);
        if (sorted.length > 0) {
          setCurrentBalance(sorted[0].balance_after);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, itemsPerPage]);

  const isProfitTx = (tx) => {
    const profitTypes = [
      "win",
      "refund",
      "admin_adjustment",
      "deposit",
      "bonus",
    ];
    return profitTypes.includes(tx.transaction_type);
  };

  const getTransactionIcon = (type) => {
    const icons = {
      bet: "🎯",
      deposit: "💰",
      withdrawal: "🏦",
      win: "🏆",
      refund: "↩️",
      admin_adjustment: "⚙️",
      bonus: "🎁",
      fee: "📝",
      transfer: "🔄",
    };
    return icons[type] || "💼";
  };

  const formatTransactionType = (type) => {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return txs.filter(tx => {
      if (filter === "all") return true;
      if (filter === "profit") return isProfitTx(tx);
      if (filter === "cost") return !isProfitTx(tx);
      return tx.transaction_type === filter;
    }).filter(tx => 
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.transaction_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [txs, filter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stats
  const totalProfit = txs
    .filter(tx => isProfitTx(tx))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalCost = txs
    .filter(tx => !isProfitTx(tx))
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

  const betTransactions = txs.filter(tx => tx.transaction_type === "bet");
  const winTransactions = txs.filter(tx => tx.transaction_type === "win");
  const avgBetSize = betTransactions.length > 0
    ? (betTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) / betTransactions.length).toFixed(2)
    : '0.00';
  const winRate = betTransactions.length > 0
    ? `${Math.round((winTransactions.length / betTransactions.length) * 100)}%`
    : '0%';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Wallet History
              </h1>
              <p className="text-gray-400 mt-2">Track all your transactions and earnings</p>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Current Balance</div>
                <div className="text-2xl font-bold text-white">Kes {currentBalance.toFixed(2)}</div>
              </div>
              <div className="h-12 w-px bg-gray-800" />
              <div className="text-center">
                <div className="text-sm text-green-400">Total Profit</div>
                <div className="text-lg font-semibold text-white">Kes {totalProfit.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions by description or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {["all", "profit", "cost", "bet", "deposit", "withdrawal", "win", "refund", "bonus"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === filterType
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                  }`}
                >
                  {filterType === "profit" ? "Credits" : 
                   filterType === "cost" ? "Debits" : 
                   filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Summary with clear labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">📊 Total Transactions</div>
              <div className="text-2xl font-bold text-white">{txs.length}</div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">💰 Net Profit</div>
              <div className={`text-2xl font-bold ${totalProfit - totalCost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Kes {(totalProfit - totalCost).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Credits - Debits</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">🎲 Avg Bet Size</div>
              <div className="text-2xl font-bold text-white">Kes {avgBetSize}</div>
              <div className="text-xs text-gray-500 mt-1">Per wager</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4">
              <div className="text-sm text-gray-400 mb-1">🏆 Win Rate</div>
              <div className="text-2xl font-bold text-green-400">{winRate}</div>
              <div className="text-xs text-gray-500 mt-1">{winTransactions.length} wins / {betTransactions.length} bets</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <div className="text-gray-400">Loading transactions...</div>
          </div>
        ) : (
          <>
            {/* No Transactions */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-2xl font-bold text-white mb-2">No transactions found</h3>
                <p className="text-gray-400">
                  {search ? "Try a different search term" : "Start trading to see your transaction history"}
                </p>
              </div>
            ) : (
              <>
                {/* Transactions List */}
                <div className="space-y-3">
                  {paginatedTransactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    const isProfit = isProfitTx(tx);

                    return (
                      <div
                        key={tx.id}
                        className="group bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-4 hover:border-cyan-500/30 hover:bg-gray-900/50 transition-all duration-300 relative overflow-hidden"
                      >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Left Section */}
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                              isProfit
                                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                                : "bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30"
                            }`}>
                              {getTransactionIcon(tx.transaction_type)}
                            </div>

                            {/* Details */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white">
                                  {formatTransactionType(tx.transaction_type)}
                                </h3>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  isProfit
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}>
                                  {isProfit ? "Credit" : "Debit"}
                                </span>
                              </div>
                              
                              {tx.description && (
                                <p className="text-sm text-gray-400 mb-2 max-w-2xl">
                                  {tx.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{formatDate(tx.created_at)}</span>
                                <span>•</span>
                                <span>ID: #{String(tx.id).slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Section */}
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              isCredit ? "text-green-400" : "text-red-400"
                            }`}>
                              {isCredit ? "+" : "-"}Kes {Math.abs(Number(tx.amount)).toFixed(2)}
                            </div>
                            
                            <div className="flex items-center justify-end gap-4 mt-2 text-sm">
                              <div className="text-gray-500">
                                Balance: <span className="text-white font-medium">Kes {Number(tx.balance_after).toFixed(2)}</span>
                              </div>
                              
                              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                isProfit
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}>
                                {isProfit ? "Profit" : "Cost"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {filteredTransactions.length > 0 && (
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
                        {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
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
              </>
            )}

            {/* Export Buttons */}
            {/* <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
  
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:bg-gray-800/50 transition-colors">
                  Export CSV
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                  Download Statement
                </button>
              </div>
            </div> */}
          </>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>❓</span> Understanding Your Wallet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <div className="text-green-400 font-bold mb-2">Credits (+) — Incoming funds</div>
              <div className="text-sm text-gray-400">
                Wins, deposits, refunds, bonuses increase your balance.
              </div>
            </div>
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <div className="text-red-400 font-bold mb-2">Debits (–) — Outgoing funds</div>
              <div className="text-sm text-gray-400">
                Bets, withdrawals, fees decrease your balance.
              </div>
            </div>
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <div className="text-cyan-400 font-bold mb-2">Balance after transaction</div>
              <div className="text-sm text-gray-400">
                Your remaining balance right after this transaction.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;