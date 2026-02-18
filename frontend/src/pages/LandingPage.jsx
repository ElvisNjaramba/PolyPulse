import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  Award,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const Landing = () => {
  const { user } = useAuth();

  // If user is already logged in, we'll redirect to dashboard (handled in App.jsx)
  // But we don't want to show landing to authenticated users.

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
      title: "Live Prediction Markets",
      description:
        "Trade on real-world events – from politics to sports to crypto. Prices update in real-time.",
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      title: "Secure & Transparent",
      description:
        "All trades are settled on-chain with verifiable outcomes. Your funds are always safe.",
    },
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      title: "Instant Settlements",
      description:
        "No waiting days for results. As soon as an event ends, winners are paid automatically.",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-400" />,
      title: "Head‑to‑Head Challenges",
      description:
        "Challenge friends or other traders directly. Set your own terms and stakes.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-cyan-400" />,
      title: "Advanced Analytics",
      description:
        "Track your performance with detailed P&L, win rates, and market trends.",
    },
    {
      icon: <Award className="w-6 h-6 text-blue-400" />,
      title: "Achievements & Leaderboards",
      description:
        "Earn badges, climb the rankings, and show off your trading prowess.",
    },
  ];

  const stats = [
    { label: "Active Markets", value: "150+" },
    { label: "Total Traders", value: "12.5k" },
    { label: "Volume Traded", value: "$4.2M" },
    { label: "Avg. Win Rate", value: "72%" },
  ];

  const steps = [
    {
      number: "1",
      title: "Create an account",
      description: "Sign up in seconds – no complex KYC required.",
    },
    {
      number: "2",
      title: "Deposit funds",
      description: "Add funds via credit card, crypto, or bank transfer.",
    },
    {
      number: "3",
      title: "Start predicting",
      description: "Browse markets, pick a side, and place your trade.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Background Effects (reused from other pages) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar (minimal, just logo and auth buttons) */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PolyPulse
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Predict the Future,
          </span>
          <br />
          <span className="text-white">Profit from the Present</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Trade on real‑world events with transparent, instant‑settlement markets.
          No brokers, no delays – just pure prediction.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 group"
          >
            Start Trading <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            to="/about"
            className="px-8 py-4 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-all"
          >
            Learn More
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why Choose PolyPulse?
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Built for traders who want transparency, speed, and real‑time action.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
          Get started in three simple steps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl font-bold text-cyan-400 mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            Create Your Account <CheckCircle className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Testimonial / Trust Bar (optional) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-gray-800/50">
        <p className="text-center text-sm text-gray-500">
          Trusted by thousands of traders worldwide • Fully licensed • 24/7 support
        </p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-gray-800/50 text-sm text-gray-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-semibold text-white">PolyPulse</span>
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-cyan-400 transition">Terms</Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition">Privacy</Link>
            <Link to="/faq" className="hover:text-cyan-400 transition">FAQ</Link>
            <a href="#" className="hover:text-cyan-400 transition">Twitter</a>
          </div>
          <div>© 2026 PolyPulse. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;