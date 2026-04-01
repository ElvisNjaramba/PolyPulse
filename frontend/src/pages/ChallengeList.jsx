import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-400 border border-green-500/20",
  resolved: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  expired: "bg-red-500/10 text-red-400 border border-red-500/20",
};

// ── Expandable challenge card ─────────────────────────────────────────────────
const ChallengeCard = ({ challenge: c, currentUser, poll, onRefresh, onError }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [winningOutcome, setWinningOutcome] = useState("");
  const [criteriaConfirmed, setCriteriaConfirmed] = useState(false);

  const isCreator = c.is_creator;
  const isOpponent = c.is_opponent;
  const isParticipant = isCreator || isOpponent;

  // Open challenge: no specific opponent assigned yet, anyone (non-creator) can accept
  const canAcceptOpen =
    c.is_open && c.status === "pending" && currentUser && !isCreator && !c.opponent_username;

  // Direct challenge: you were specifically named as opponent
  const canAcceptDirect = !c.is_open && c.status === "pending" && isOpponent;

  const expiresAt = new Date(c.expires_at);
  const now = new Date();
  const isPastExpiry = now >= expiresAt;
  const msLeft = expiresAt - now;
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minsLeft = Math.floor((msLeft % 3600000) / 60000);

  // Resolve choices: creator_choice vs opponent_choice
  const resolveChoices = [c.creator_choice, c.opponent_choice].filter(Boolean);

  // Poll challenges: resolve once poll is closed/resolved
  // Standalone challenges: resolve once expires_at is past
  const canResolve =
    c.status === "accepted" &&
    isParticipant &&
    (poll
      ? poll.status === "closed" || poll.status === "resolved"
      : isPastExpiry);

  const handleAcceptOpen = async () => {
    setAccepting(true);
    try {
      await api.post(`/challenges/${c.id}/accept-open/`);
      onRefresh();
    } catch (err) {
      onError(err.response?.data?.error || "Failed to accept challenge");
    } finally {
      setAccepting(false);
    }
  };

  const handleAcceptDirect = async () => {
    setAccepting(true);
    try {
      await api.post(`/challenges/${c.id}/accept/`);
      onRefresh();
    } catch (err) {
      onError(err.response?.data?.error || "Failed to accept challenge");
    } finally {
      setAccepting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/challenges/${c.id}/cancel/`);
      onRefresh();
    } catch (err) {
      onError(err.response?.data?.error || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const handleResolve = async () => {
    if (!winningOutcome) return;
    setResolving(true);
    try {
      await api.post(`/challenges/${c.id}/resolve/`, {
        winning_outcome: winningOutcome,
        criteria_confirmed: criteriaConfirmed,
      });
      onRefresh();
    } catch (err) {
      onError(err.response?.data?.error || "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  const handleCardClick = () => {
    // Poll-linked challenge → go to the poll (challenge is visible there)
    if (c.poll) {
      navigate(`/polls/${c.poll}`);
      return;
    }
    // Standalone challenge → expand detail inline
    setExpanded((e) => !e);
  };

  return (
    <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:border-gray-700/50 transition-all overflow-hidden">

      {/* ── Summary row ───────────────────────────────────────────────── */}
      <div
        className="flex flex-col md:flex-row md:items-start gap-4 p-5 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[c.status]}`}>
              {c.status}
            </span>
            {c.is_open && c.status === "pending" && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                🌐 Open — anyone can join
              </span>
            )}
            {c.poll && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                🗳️ Poll Challenge → view in poll
              </span>
            )}
            <span className="text-xs text-gray-500">
              Expires {isPastExpiry ? "— time's up" : `in ${hoursLeft}h ${minsLeft}m`}
            </span>
          </div>

          <h3 className="text-white font-medium text-lg mb-1 truncate">{c.question}</h3>

          <p className="text-gray-400 text-sm truncate">
            <span className="text-cyan-400">{c.creator_username}</span>
            <span className="text-gray-500"> ({c.creator_choice_display}) vs </span>
            {c.opponent_username
              ? <span className="text-purple-400">{c.opponent_username} ({c.opponent_choice || "opposite"})</span>
              : <span className="text-yellow-400/80">Open slot</span>
            }
            <span className="text-gray-500"> · Kes </span>
            <span className="text-white font-medium">{c.amount}</span>
          </p>

          {c.resolution_criteria && (
            <p className="text-yellow-400/60 text-xs mt-1 truncate">📋 {c.resolution_criteria}</p>
          )}

          {/* Resolve hint — tells participants where/when they can resolve */}
          {c.status === "accepted" && isParticipant && !c.poll && (
            <p className="text-xs text-cyan-400/70 mt-1">
              {isPastExpiry
                ? "⚖️ Click to resolve"
                : `⏳ Resolve available in ${hoursLeft}h ${minsLeft}m — click for details`}
            </p>
          )}
          {c.status === "accepted" && isParticipant && c.poll && (
            <p className="text-xs text-cyan-400/70 mt-1">
              🗳️ Click to go to poll — resolve there once poll closes
            </p>
          )}
        </div>

        {/* Expand chevron — only for standalone challenges */}
        {!c.poll && (
          <span className="text-gray-600 text-sm self-start md:self-center shrink-0">
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* ── Action buttons row (always visible, outside click zone) ──── */}
      <div
        className="flex flex-wrap gap-2 px-5 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accept open challenge */}
        {canAcceptOpen && (
          <button
            disabled={accepting}
            onClick={handleAcceptOpen}
            className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all text-sm disabled:opacity-50"
          >
            {accepting ? "Accepting..." : `⚔️ Accept — Kes ${c.amount}`}
          </button>
        )}

        {/* Accept direct challenge */}
        {canAcceptDirect && (
          <button
            disabled={accepting}
            onClick={handleAcceptDirect}
            className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl hover:bg-green-500/20 transition-all text-sm disabled:opacity-50"
          >
            {accepting ? "Accepting..." : "⚔️ Accept Challenge"}
          </button>
        )}

        {/* Cancel — creator only */}
        {isCreator && ["pending", "accepted"].includes(c.status) && (
          <button
            disabled={cancelling}
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/20 transition-all text-sm disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}

        {/* Resolved winner badge */}
        {c.status === "resolved" && c.winner && (
          <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm">
            🏆 Winner: {c.winner === c.creator ? c.creator_username : c.opponent_username}
          </span>
        )}
      </div>

      {/* ── Expanded detail panel (standalone challenges only) ─────────── */}
      {expanded && !c.poll && (
        <div
          className="border-t border-white/10 p-5 space-y-4 bg-black/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-500 mb-1">Creator</p>
              <p className="text-cyan-400 font-medium">{c.creator_username}</p>
              <p className="text-gray-300">backing: <span className="text-white">{c.creator_choice_display}</span></p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-500 mb-1">Opponent</p>
              {c.opponent_username ? (
                <>
                  <p className="text-purple-400 font-medium">{c.opponent_username}</p>
                  <p className="text-gray-300">backing: <span className="text-white">{c.opponent_choice || "opposite"}</span></p>
                </>
              ) : (
                <p className="text-yellow-400">Open — anyone can accept</p>
              )}
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-500 mb-1">Stake each</p>
              <p className="text-white font-semibold">Kes {c.amount}</p>
              <p className="text-gray-400">Total pot: Kes {(parseFloat(c.amount) * 2).toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-500 mb-1">{isPastExpiry ? "Expired" : "Time left"}</p>
              {isPastExpiry
                ? <p className="text-red-400 font-medium">Challenge window closed</p>
                : <p className="text-yellow-400 font-medium">{hoursLeft}h {minsLeft}m</p>
              }
              <p className="text-gray-500">{expiresAt.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Resolution criteria */}
          {c.resolution_criteria && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-400 text-xs font-semibold mb-1">📋 Resolution Criteria</p>
              <p className="text-gray-300 text-xs">{c.resolution_criteria}</p>
            </div>
          )}

          {/* Resolve panel — uses canResolve which accounts for poll vs standalone timing */}
          {canResolve && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-xs text-cyan-400 font-medium">⚖️ Resolve Challenge</p>

              {c.resolution_criteria && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteriaConfirmed}
                    onChange={(e) => setCriteriaConfirmed(e.target.checked)}
                    className="mt-0.5 accent-cyan-500"
                  />
                  <span className="text-xs text-yellow-400">
                    I confirm all criteria are met: <em>{c.resolution_criteria}</em>
                  </span>
                </label>
              )}

              <div className="flex flex-wrap gap-2">
                {resolveChoices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => setWinningOutcome(choice.toLowerCase())}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      winningOutcome === choice.toLowerCase()
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                    }`}
                  >
                    {choice} wins
                  </button>
                ))}
              </div>

              <button
                onClick={handleResolve}
                disabled={
                  resolving ||
                  !winningOutcome ||
                  (c.resolution_criteria && !criteriaConfirmed)
                }
                className="px-4 py-2 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {resolving ? "Resolving..." : "Confirm Resolution"}
              </button>
            </div>
          )}

          {/* Not logged in */}
          {canAcceptOpen && !currentUser && (
            <p className="text-center text-xs text-gray-500 py-1">Log in to accept this challenge</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main list ─────────────────────────────────────────────────────────────────
const ChallengeList = () => {
  const [challenges, setChallenges] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchChallenges = () => {
    api
      .get("/challenges/")
      .then((res) => setChallenges(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load challenges");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Fetch current user so cards know who is creator/opponent
    api.get("/profile/").then((res) => setCurrentUser(res.data)).catch(() => {});
    fetchChallenges();
  }, []);

  const filtered =
    filter === "all" ? challenges : challenges.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          Loading challenges...
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Bet Beshte
          </h1>
          <button
            onClick={() => navigate("/challenges/new")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            + New Challenge
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "pending", "accepted", "resolved", "cancelled", "expired"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === s
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-12 text-center">
            <p className="text-gray-400 text-lg">No challenges found</p>
            <p className="text-gray-600 text-sm mt-2">
              {filter === "all"
                ? "Create one or accept an open challenge"
                : `No ${filter} challenges yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUser={currentUser}
                poll={null}
                onRefresh={fetchChallenges}
                onError={setError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeList;