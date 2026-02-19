import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // adjust path if needed
import { debounce } from "lodash"; // optional: install lodash or implement simple debounce

const STATUS_STYLES = {
  open:    { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  closed:  { bg: "bg-indigo-500/10",  text: "text-indigo-400",  dot: "bg-indigo-400" },
  resolved:{ bg: "bg-gray-500/10",    text: "text-gray-400",    dot: "bg-gray-400" },
  suspended:{ bg: "bg-rose-500/10",   text: "text-rose-400",    dot: "bg-rose-400" },
};

// ---------- Toast ----------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", icon: "✓" },
    error:   { bg: "bg-rose-500/10 border-rose-500/30 text-rose-400", icon: "✕" },
    info:    { bg: "bg-sky-500/10 border-sky-500/30 text-sky-400", icon: "ℹ" },
  }[type] || { bg: "bg-gray-500/10 border-gray-500/30 text-gray-400", icon: "•" };

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] backdrop-blur-xl border ${colors.bg} rounded-xl px-5 py-4 flex items-center gap-3 font-mono text-sm shadow-2xl animate-slideIn max-w-sm`}>
      <span className="text-lg">{colors.icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-lg opacity-60 hover:opacity-100 transition-opacity">×</button>
    </div>
  );
}

// ---------- Modal ----------
function Modal({ title, children, onClose, danger }) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-md rounded-2xl backdrop-blur-xl border ${danger ? "border-rose-500/50" : "border-white/10"} bg-[#0b0f19]/90 shadow-2xl animate-popIn`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className={`font-bold font-mono ${danger ? "text-rose-400" : "text-white"}`}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ---------- Action Button (used inside PollCard) ----------
function ActionButton({ label, icon, color, hoverColor, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all duration-150 ${color} ${hoverColor} text-white disabled:opacity-40 disabled:pointer-events-none transform active:scale-95`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

// ---------- Poll Card ----------
function PollCard({ poll, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[poll.status] || STATUS_STYLES.closed;

  const canResolve  = poll.status === "open" || poll.status === "closed";
  const canSuspend  = !["resolved", "suspended"].includes(poll.status);
  const canCancel   = ["open", "closed"].includes(poll.status);

  return (
    <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200 font-mono">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {poll.status}
            </span>
            <span className="text-xs text-gray-500">#{poll.id}</span>
          </div>
          <h3 className="text-base font-bold text-white leading-tight line-clamp-2">{poll.title}</h3>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 mt-3 mb-4 text-xs text-gray-400">
        <span>Pool: <span className="font-semibold text-white">Kes {poll.total_pool ?? 0}</span></span>
        <span>Closes: <span className="font-semibold text-white">
          {new Date(poll.closes_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span></span>
        {poll.options?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-indigo-400 underline decoration-dotted text-xs hover:text-indigo-300"
          >
            {expanded ? "hide options" : "show options"}
          </button>
        )}
      </div>

      {/* Expanded options */}
      {expanded && poll.options?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {poll.options.map(opt => {
            const isYes = opt.text?.toLowerCase() === "yes";
            return (
              <div key={opt.id} className={`px-3 py-2 rounded-lg border text-xs ${isYes ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                <div className="font-bold">{opt.text}</div>
                <div className="opacity-75">ID: {opt.id} · ¢{Math.round((opt.price ?? 0.5) * 100)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <ActionButton
          label="Resolve"
          icon="✓"
          color="bg-emerald-500"
          hoverColor="hover:bg-emerald-600"
          disabled={!canResolve}
          onClick={() => onAction("resolve", poll)}
        />
        <ActionButton
          label="Suspend"
          icon="⏸"
          color="bg-amber-500"
          hoverColor="hover:bg-amber-600"
          disabled={!canSuspend}
          onClick={() => onAction("suspend", poll)}
        />
        <ActionButton
          label="Cancel"
          icon="✕"
          color="bg-rose-500"
          hoverColor="hover:bg-rose-600"
          disabled={!canCancel}
          onClick={() => onAction("cancel", poll)}
        />
      </div>
    </div>
  );
}

// ---------- Main Admin Panel ----------
export default function PollAdminPanel() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [resolveOptionId, setResolveOptionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input to avoid filtering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = { creator: "me" };
      // Only send status filter if not "all"
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await api.get("polls/", { params });
      const data = response.data;
      setPolls(Array.isArray(data) ? data : data.results ?? []);
    } catch (error) {
      console.error("Fetch error:", error);
      showToast(error.response?.data?.detail || error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch polls when status filter changes
  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Memoized filtered polls (client‑side search on already fetched data)
  const filteredPolls = useMemo(() => {
    return polls.filter(p =>
      p.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      String(p.id).includes(debouncedSearch)
    );
  }, [polls, debouncedSearch]);

  const openModal = (type, poll) => {
    setResolveOptionId(poll.options?.[0]?.id?.toString() ?? "");
    setModal({ type, poll });
  };
  const closeModal = () => setModal(null);

  const handleResolve = async () => {
    if (!resolveOptionId) return showToast("Select a winning option", "error");
    setActionLoading(true);
    try {
      await api.post(`polls/${modal.poll.id}/resolve/`, {
        winning_option_id: parseInt(resolveOptionId),
      });
      showToast(`Poll #${modal.poll.id} resolved successfully`, "success");
      closeModal();
      fetchPolls();
    } catch (error) {
      showToast(error.response?.data?.detail || error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await api.post(`polls/${modal.poll.id}/suspend/`);
      showToast(`Poll #${modal.poll.id} suspended & bets refunded`, "success");
      closeModal();
      fetchPolls();
    } catch (error) {
      showToast(error.response?.data?.detail || error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`polls/${modal.poll.id}/cancel/`);
      showToast(`Poll #${modal.poll.id} cancelled`, "success");
      closeModal();
      fetchPolls();
    } catch (error) {
      showToast(error.response?.data?.detail || error.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.25s ease; }
        .animate-popIn { animation: popIn 0.2s ease; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e] font-mono">
        {/* Header */}
        <div className="relative border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 rounded-md">
                Admin
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-syne text-white">Poll Control Panel</h1>
            <p className="text-gray-400 text-sm mt-2">
              Resolve, suspend, or cancel polls. Actions are irreversible — proceed carefully.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Filter row */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <input
              type="text"
              placeholder="Search by title or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50"
            />

            {/* Status filter buttons */}
            <div className="flex gap-1 flex-wrap">
              {["all", "open", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === status
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={fetchPolls}
              className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-white/20 transition flex items-center gap-2"
            >
              ↻ Refresh
            </button>

            {/* Clear filters button (visible when any filter is active) */}
            {(search || statusFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-xs text-gray-400 hover:text-white transition"
              >
                ✕ Clear filters
              </button>
            )}
          </div>

          {/* Poll count */}
          <div className="text-xs text-gray-400 mb-6">
            {filteredPolls.length} poll{filteredPolls.length !== 1 ? "s" : ""} shown
            {debouncedSearch && <span className="ml-2">· matching "{debouncedSearch}"</span>}
            {statusFilter !== "all" && <span className="ml-2">· status: {statusFilter}</span>}
          </div>

          {/* Loading / Empty / Poll cards */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-white/10 border-t-indigo-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading polls…</p>
            </div>
          ) : filteredPolls.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <p className="text-gray-400 text-sm">No polls found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} onAction={openModal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {modal?.type === "resolve" && (
        <Modal title={`Resolve Poll #${modal.poll.id}`} onClose={closeModal}>
          <p className="text-sm text-gray-300 mb-4"><span className="font-semibold text-white">"{modal.poll.title}"</span></p>
          <p className="text-xs text-gray-400 mb-5">Select the winning option. Winners will be paid out automatically. This action cannot be undone.</p>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Winning Option</label>
          <select
            value={resolveOptionId}
            onChange={(e) => setResolveOptionId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400/50 mb-6"
          >
            <option value="">— select option —</option>
            {modal.poll.options?.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.text} (¢{Math.round((opt.price ?? 0.5) * 100)} · ID {opt.id})
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white transition">Cancel</button>
            <button
              onClick={handleResolve}
              disabled={actionLoading || !resolveOptionId}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white disabled:opacity-40 disabled:pointer-events-none transition hover:bg-emerald-600"
            >
              {actionLoading ? "Resolving…" : "✓ Confirm Resolve"}
            </button>
          </div>
        </Modal>
      )}

      {/* Suspend Modal */}
      {modal?.type === "suspend" && (
        <Modal title={`Suspend Poll #${modal.poll.id}`} onClose={closeModal} danger>
          <p className="text-sm text-gray-300 mb-4"><span className="font-semibold text-white">"{modal.poll.title}"</span></p>
          <div className="p-3 mb-5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            ⚠ Suspending this poll will immediately refund all bets to each user's balance. The poll will be locked and no further trading will be possible.
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white transition">Go Back</button>
            <button
              onClick={handleSuspend}
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white disabled:opacity-40 disabled:pointer-events-none transition hover:bg-amber-600"
            >
              {actionLoading ? "Suspending…" : "⏸ Suspend & Refund All"}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {modal?.type === "cancel" && (
        <Modal title={`Cancel Poll #${modal.poll.id}`} onClose={closeModal} danger>
          <p className="text-sm text-gray-300 mb-4"><span className="font-semibold text-white">"{modal.poll.title}"</span></p>
          <p className="text-sm text-gray-300 mb-5">Are you sure you want to cancel this poll? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 hover:text-white transition">Go Back</button>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-rose-500 text-white disabled:opacity-40 disabled:pointer-events-none transition hover:bg-rose-600"
            >
              {actionLoading ? "Cancelling…" : "✕ Confirm Cancel"}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}