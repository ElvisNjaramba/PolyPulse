import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/polypulse.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed. Please check your credentials.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e] px-5">
      {/* Background (unchanged) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,224,255,0.1)_0%,transparent_70%)] animate-float" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,119,255,0.1)_0%,transparent_70%)] animate-float-reverse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-50" />
      </div>

      {/* Login Card – single column */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5">
              <span className="text-2xl">🎯</span>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                PolyPulse
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <span>👤</span> Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <span>🔒</span> Password
              </label>
              <Link to="/forgot-password" className="text-xs text-cyan-400 hover:opacity-80">
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 font-semibold text-[#0b0f19] transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-400/30 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0f19]/30 border-t-[#0b0f19]" />
                Signing in…
              </>
            ) : (
              <>
                <span className="text-lg">⚡</span> Sign In
              </>
            )}
          </button>
        </form>

        {/* Register navigation */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 max-w-sm text-center text-xs text-gray-500">
        By signing in, you agree to our{" "}
        <Link to="/terms" className="text-cyan-400 hover:underline">Terms</Link>{" "}
        and{" "}
        <Link to="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  );
};

export default Login;