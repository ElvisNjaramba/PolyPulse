import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Clock, DollarSign } from "lucide-react";
import api from "../api/axios";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pollsUsedToday, setPollsUsedToday] = useState(null); // null = not yet fetched

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [options, setOptions] = useState(["Yes", "No"]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resolution_criteria: "",
    category: "",
    closing_time: "",
    is_free: true,
    min_bet: 10,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories/");
        setCategories(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, category: response.data[0].slug }));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        setError("Could not load categories. Please refresh.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Fetch today's poll usage count from profile endpoint
    const fetchPollUsage = async () => {
      try {
        const response = await api.get("/profile/");
        const used = response.data.polls_created_today ?? 0;
        setPollsUsedToday(used);
      } catch {
        // Non-critical — silently ignore
      }
    };

    fetchCategories();
    fetchPollUsage();
  }, []);

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCategorySelect = (slug) => {
    setFormData(prev => ({ ...prev, category: slug }));
  };

  /**
   * Extracts a human-readable error string from any DRF error shape:
   *   { detail }               — standard DRF error
   *   { non_field_errors[] }   — serializer-level ValidationError (was silently dropped before)
   *   { field: [msgs] }        — field-level errors
   */
  const extractErrorMessage = (err) => {
    const data = err.response?.data;
    if (!data) return err.message || "Failed to create market";
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;

    // ← This is the fix: non_field_errors was never read before
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors.join(" ");
    }

    // Collect all remaining field-level messages
    const messages = Object.entries(data)
      .flatMap(([field, msgs]) => {
        const list = Array.isArray(msgs) ? msgs : [msgs];
        return list.map(m => (field !== "non_field_errors" ? `${field}: ${m}` : String(m)));
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(" | ") : "Failed to create market";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.title.trim()) throw new Error("Title is required");
      if (!formData.category) throw new Error("Please select a category");
      if (!formData.closing_time) throw new Error("Closing time is required");
      if (formData.min_bet < 1) throw new Error("Minimum bet must be at least 1");
      if (new Date(formData.closing_time) <= new Date())
        throw new Error("Closing time must be in the future");
      if (options.length < 2) throw new Error("At least 2 options are required");
      if (options.some(opt => !opt.trim())) throw new Error("All options must have text");

      const payload = {
        title: formData.title,
        description: formData.description,
        resolution_criteria: formData.resolution_criteria,
        category: formData.category,
        is_free: true,
        min_bet: parseInt(formData.min_bet, 10),
        closes_at: formData.closing_time,
        options: options.map(text => ({ text })),
      };

      const response = await api.post("/polls/create/", payload);
      setSuccess("Market created successfully!");
      setPollsUsedToday(prev => (prev !== null ? prev + 1 : 1));

      setTimeout(() => {
        navigate(`/polls/${response.data.poll_id}`);
      }, 1500);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Limit is 1 per day (mirrors backend can_create_poll)
  const DAILY_LIMIT = 1;
  const pollsRemaining = pollsUsedToday !== null ? Math.max(0, DAILY_LIMIT - pollsUsedToday) : null;
  const atLimit = pollsRemaining === 0;

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-white">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6">
      <style jsx global>{`
        .categories-scrollbar::-webkit-scrollbar { height: 6px; }
        .categories-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); border-radius: 3px;
        }
        .categories-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #06b6d4, #3b82f6); border-radius: 3px;
        }
        .categories-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #0891b2, #2563eb);
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/polls")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to Markets
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Create New Market
              </h1>
              <p className="text-gray-400 mt-2">
                Create your own prediction market and let others join in
              </p>
            </div>

            {/* Daily limit badge — shown once we know the count */}
            {pollsRemaining !== null && (
              <div
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-medium ${
                  atLimit
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                }`}
              >
                {atLimit ? "🚫 Daily limit reached" : `${pollsRemaining} market left today`}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {atLimit && !error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            ⚠️ You've used your 1 market creation for today. Come back tomorrow!
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-fadeIn">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 animate-fadeIn">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Market Basics */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Basics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Market Question *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Will Bitcoin reach $200K by end of 2026?"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide more context about this prediction..."
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resolution Criteria *
                </label>
                <textarea
                  name="resolution_criteria"
                  value={formData.resolution_criteria}
                  onChange={handleInputChange}
                  placeholder="e.g., This market resolves YES if Bitcoin closes above $200,000 on Binance on Dec 31 2026."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific. These conditions must be met before anyone can resolve this market.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                {categories.length === 0 ? (
                  <p className="text-gray-500">No categories available</p>
                ) : (
                  <div className="relative">
                    <div className="categories-scrollbar overflow-x-auto pb-3 scrollbar-thin">
                      <div className="flex gap-2 min-w-max">
                        {categories.map((cat, index) => {
                          const gradients = [
                            "from-gray-500 to-gray-700",
                            "from-red-500 to-pink-500",
                            "from-green-500 to-emerald-500",
                            "from-yellow-500 to-amber-500",
                            "from-blue-500 to-cyan-500",
                            "from-purple-500 to-pink-500",
                            "from-indigo-500 to-purple-500",
                          ];
                          const isSelected = formData.category === cat.slug;
                          return (
                            <button
                              type="button"
                              key={cat.slug}
                              onClick={() => handleCategorySelect(cat.slug)}
                              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? `bg-gradient-to-r ${gradients[index % gradients.length]} text-white shadow-lg shadow-cyan-500/20`
                                  : "bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:bg-gray-800/50 hover:text-white"
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Market Settings */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Closing Time *
                </label>
                <input
                  type="datetime-local"
                  name="closing_time"
                  value={formData.closing_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Minimum 1 hour from now</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} /> Minimum Bet *
                </label>
                <input
                  type="number"
                  name="min_bet"
                  value={formData.min_bet}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} /> Market Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-50" title="Real money markets are temporarily restricted">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center" />
                    <span className="text-gray-500">Real Money</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-500 bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    </div>
                    <span className="text-gray-300">Free Play</span>
                  </label>
                </div>
                <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                  ⚠️ Real-money markets are temporarily disabled to protect users. Free play markets are available.
                </p>
              </div>
            </div>
          </div>

          {/* Market Options */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Options</h2>
            <p className="text-gray-400 text-sm mb-6">
              Every market has exactly two outcomes: Yes and No, each starting at 50% probability (price 0.50).
            </p>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                disabled={options.length >= 10}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition disabled:opacity-50"
              >
                <Plus size={16} /> Add Option
              </button>
              <p className="text-xs text-gray-500">Minimum 2 options, maximum 10</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/polls")}
              className="flex-1 px-6 py-4 bg-gray-900/50 border border-gray-800/50 text-white font-medium rounded-xl hover:border-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || atLimit}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : atLimit ? (
                "Daily Limit Reached"
              ) : (
                "Create Prediction Market"
              )}
            </button>
          </div>

          <div className="text-center text-gray-500 text-sm">
            <p>Market will be reviewed and activated shortly after creation.</p>
            <p className="mt-1">All markets must comply with our terms of service.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;