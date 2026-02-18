import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export default function Register() {
  const navigate = useNavigate();
  const fingerprint = getDeviceFingerprint();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  /* ---------------- helpers ---------------- */

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const strengthColor =
    passwordStrength < 50
      ? "bg-red-500"
      : passwordStrength < 75
      ? "bg-amber-500"
      : "bg-emerald-500";

  const strengthLabel =
    passwordStrength < 50
      ? "Weak"
      : passwordStrength < 75
      ? "Medium"
      : "Strong";

  /* ---------------- handlers ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError("");

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 50) {
      setError(
        "Use a stronger password (8+ chars, uppercase, number & symbol)"
      );
      setIsLoading(false);
      return;
    }

    try {
      await axios.post("auth/register/", formData, {
        headers: { "X-Device-Fingerprint": fingerprint },
      });

      setSuccess("Account created successfully! Redirecting…");
      setTimeout(
        () => navigate("/check-email", { state: { email: formData.email } }),
        1500
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.username?.[0] ||
          err.response?.data?.email?.[0] ||
          err.response?.data?.phone_number?.[0] ||
          "Registration failed."
      );
      setIsLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e] px-4 overflow-hidden">

      {/* background glow */}
      <div className="absolute -top-1/3 -right-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -bottom-1/3 -left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

      {/* card – two columns */}
      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">

        {/* header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 px-5 py-3 rounded-2xl border border-white/10 bg-white/5">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              PolyPulse
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Start trading predictions in minutes
          </p>
        </div>

        {/* alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            ✅ {success}
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="👤 Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your_username"
              disabled={isLoading}
            />

            <Input
              label="📧 Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          {/* row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="📱 Phone number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+254 700 000 000"
              disabled={isLoading}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">🔒 Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-cyan-400 hover:opacity-80"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Create a strong password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              />

              {/* strength meter */}
              <div className="mt-3">
                <div className="h-1 w-full rounded bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${strengthColor}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span className="capitalize">{strengthLabel}</span>
                  <span>{passwordStrength}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="✅ Confirm password"
              type={showPassword ? "text" : "password"}
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="Repeat password"
              disabled={isLoading}
            />

            <div className="flex items-center gap-3 mt-8 md:mt-0">
              <input type="checkbox" required className="accent-cyan-400" />
              <p className="text-xs text-gray-400">
                I agree to the{" "}
                <Link to="/terms" className="text-cyan-400 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-cyan-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* submit */}
          <button
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 font-semibold text-[#0b0f19] transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-400/30 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0b0f19]/30 border-t-[#0b0f19]" />
                Creating account…
              </>
            ) : (
              <>
                🚀 Create account
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ---------------- reusable input ---------------- */

function Input({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">{label}</label>
      <input
        {...props}
        required
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
      />
    </div>
  );
}