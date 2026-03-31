import { useState } from "react";
import { useNavigate, useSearchParams} from "react-router-dom";
import api from "../api/axios";

const ChallengeCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [pollOptions, setPollOptions] = useState([]);
const [formData, setFormData] = useState({
  opponent_username: "",
  amount: "",
  question: searchParams.get("question") || "",
  expires_at: "",
  creator_choice: "yes",
  is_open: searchParams.get("poll") ? true : false,
  poll: searchParams.get("poll") || "",
});

useEffect(() => {
  const pollId = searchParams.get("poll");
  if (!pollId) return;
  api.get(`/polls/${pollId}/`)
    .then(res => {
      const opts = res.data.options?.map(o => o.text) || [];
      setPollOptions(opts);
      // pre-select first option
      if (opts.length > 0) {
        setFormData(prev => ({ ...prev, creator_choice: opts[0] }));
      }
    })
    .catch(console.error);
}, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // For radio buttons, value is already the selected value
    setFormData({ ...formData, [name]: value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    if (!formData.is_open && !formData.opponent_username.trim()) throw new Error("Opponent username required");
    if (!formData.amount || formData.amount <= 0) throw new Error("Valid amount required");
    if (!formData.question.trim()) throw new Error("Question required");
    if (!formData.expires_at) throw new Error("Expiration time required");
    if (new Date(formData.expires_at) <= new Date()) throw new Error("Expiration must be in future");

    const payload = {
      ...formData,
      poll: formData.poll || undefined,
      opponent_username: formData.is_open ? "" : formData.opponent_username,
    };
    await api.post("/challenges/", payload);   
    navigate("/challenges");
  } catch (err) {
    setError(err.response?.data?.error || err.message || "Failed to create challenge");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-8">
          <button
            onClick={() => navigate("/challenges")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to Challenges
          </button>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Create a Challenge
          </h1>
          <p className="text-gray-400 mt-2">Bet head‑to‑head against another user</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <div className="space-y-4">

{/* Challenge Type Toggle */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Type *</label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => setFormData(prev => ({ ...prev, is_open: false }))}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
          !formData.is_open ? "border-cyan-500 bg-cyan-500/20" : "border-gray-600"
        }`}
      >
        {!formData.is_open && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
      </div>
      <span className="text-gray-300">Direct (specific user)</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => setFormData(prev => ({ ...prev, is_open: true }))}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
          formData.is_open ? "border-cyan-500 bg-cyan-500/20" : "border-gray-600"
        }`}
      >
        {formData.is_open && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
      </div>
      <span className="text-gray-300">Open (anyone can accept)</span>
    </label>
  </div>
</div>

{/* Conditionally show opponent field */}
{!formData.is_open && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">Opponent Username *</label>
    <input
      type="text"
      name="opponent_username"
      value={formData.opponent_username}
      onChange={handleChange}
      placeholder="Enter username"
      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      required={!formData.is_open}
    />
  </div>
)}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bet Amount (Kes) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="10.00"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Both you and your opponent will stake this amount</p>
              </div>

<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Your Prediction *
  </label>

  {pollOptions.length > 0 ? (
    <div className="flex flex-wrap gap-3">
      {pollOptions.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setFormData(prev => ({ ...prev, creator_choice: opt }))}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              formData.creator_choice === opt
                ? "border-cyan-500 bg-cyan-500/20"
                : "border-gray-600"
            }`}
          >
            {formData.creator_choice === opt && (
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
            )}
          </div>
          <span className="text-gray-300">{opt}</span>
        </label>
      ))}
    </div>
  ) : (
    <div className="flex gap-4">
      {["yes", "no"].map((choice) => (
        <label key={choice} className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setFormData(prev => ({ ...prev, creator_choice: choice }))}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              formData.creator_choice === choice
                ? choice === "yes" ? "border-green-500 bg-green-500/20" : "border-red-500 bg-red-500/20"
                : "border-gray-600"
            }`}
          >
            {formData.creator_choice === choice && (
              <div className={`w-2 h-2 rounded-full ${choice === "yes" ? "bg-green-500" : "bg-red-500"}`} />
            )}
          </div>
          <span className="text-gray-300 capitalize">{choice}</span>
        </label>
      ))}
    </div>
  )}

  <p className="text-xs text-gray-500 mt-2">
    Opponent gets the opposite side automatically
  </p>
</div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Question / Bet Description *</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="e.g., Will the Lakers win tonight?"
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expiration Time *</label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Opponent must accept before this time</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/challenges")}
              className="flex-1 px-6 py-4 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Challenge"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeCreate;