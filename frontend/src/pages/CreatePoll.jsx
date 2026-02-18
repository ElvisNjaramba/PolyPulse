import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Clock, DollarSign, Hash, Calendar } from "lucide-react";
import api from "../api/axios";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Categories from backend
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    closing_time: "",
    is_free: false,
    min_bet: 10,               // default min bet
    options: [
      { text: "Yes", price: 0.5 },
      { text: "No", price: 0.5 }
    ]
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories/");  // adjust URL as needed
        setCategories(response.data);
        if (response.data.length > 0) {
          // Preselect first category
          setFormData(prev => ({ ...prev, category: response.data[0].slug }));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        setError("Could not load categories. Please refresh.");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCategorySelect = (slug) => {
    setFormData(prev => ({ ...prev, category: slug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.category) {
        throw new Error("Please select a category");
      }
      if (!formData.closing_time) {
        throw new Error("Closing time is required");
      }
      if (formData.min_bet < 1) {
        throw new Error("Minimum bet must be at least 1");
      }
      if (new Date(formData.closing_time) <= new Date()) {
        throw new Error("Closing time must be in the future");
      }

      // Build payload exactly as backend expects
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,               // slug string
        is_free: formData.is_free,
        min_bet: parseInt(formData.min_bet, 10),   // ensure integer
        closes_at: formData.closing_time,           // renamed field
        options: [
          { text: "Yes" },   // only text, no price
          { text: "No" }
        ]
      };

      const response = await api.post("/polls/create/", payload);
      setSuccess("Market created successfully!");

      setTimeout(() => {
        navigate(`/polls/${response.data.poll_id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  // Display loading while fetching categories
  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-white">Loading categories...</div>
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

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/polls")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to Markets
          </button>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            🚀 Create New Market
          </h1>
          <p className="text-gray-400 mt-2">Create your own prediction market and let others join in</p>
        </div>

        {/* Alerts */}
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
          {/* Market Basics Card */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Basics</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Market Question *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Will Bitcoin reach $100K by end of 2024?"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              {/* Description */}
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

              {/* Category - from backend */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                {categories.length === 0 ? (
                  <p className="text-gray-500">No categories available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.map((cat, index) => {
                      // Assign a consistent gradient based on index or slug
                      const gradients = [
                        "from-gray-500 to-gray-700",
                        "from-red-500 to-pink-500",
                        "from-green-500 to-emerald-500",
                        "from-yellow-500 to-amber-500",
                        "from-blue-500 to-cyan-500",
                        "from-purple-500 to-pink-500",
                        "from-indigo-500 to-purple-500",
                      ];
                      const gradient = gradients[index % gradients.length];
                      const isSelected = formData.category === cat.slug;
                      return (
                        <button
                          type="button"
                          key={cat.slug}
                          onClick={() => handleCategorySelect(cat.slug)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                              : "bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-white border border-gray-800/50"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Market Settings Card */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Closing Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Closing Time *
                </label>
                <input
                  type="datetime-local"
                  name="closing_time"
                  value={formData.closing_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  When should betting close? (Minimum 1 hour from now)
                </p>
              </div>

              {/* Minimum Bet */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Minimum Bet *
                </label>
                <input
                  type="number"
                  name="min_bet"
                  value={formData.min_bet}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Minimum amount users can bet (in your currency)
                </p>
              </div>

              {/* Market Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Market Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_free"
                      checked={!formData.is_free}
                      onChange={() => setFormData(prev => ({ ...prev, is_free: false }))}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !formData.is_free 
                        ? "border-cyan-500 bg-cyan-500/20" 
                        : "border-gray-600"
                    }`}>
                      {!formData.is_free && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                    </div>
                    <span className="text-gray-300">Real Money</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_free"
                      checked={formData.is_free}
                      onChange={() => setFormData(prev => ({ ...prev, is_free: true }))}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.is_free 
                        ? "border-cyan-500 bg-cyan-500/20" 
                        : "border-gray-600"
                    }`}>
                      {formData.is_free && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                    </div>
                    <span className="text-gray-300">Free Play</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.is_free 
                    ? "Users can bet with virtual credits" 
                    : "Users bet with real money"}
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Options Card */}
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Market Options</h2>
            <p className="text-gray-400 text-sm mb-6">
              Every market has exactly two outcomes: Yes and No, each starting at a 50% probability (price 0.50).
            </p>

            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4 opacity-75">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-900/50 border border-gray-800/50 flex items-center justify-center text-sm font-bold text-gray-400">
                        {index === 0 ? "Y" : "N"}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.text}
                          disabled
                          className="w-full px-4 py-2 bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="ml-10">
                      <label className="block text-xs text-gray-400 mb-1">
                        Starting Price
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={option.price}
                          disabled
                          step="0.01"
                          className="w-24 px-3 py-2 bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-400 cursor-not-allowed"
                        />
                        <span className="text-gray-400 text-sm">
                          ({(option.price * 100).toFixed(0)}% probability)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
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
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Prediction Market"
              )}
            </button>
          </div>

          {/* Form Help */}
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