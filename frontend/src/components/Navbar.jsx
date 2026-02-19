import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "./NotificationBell";
import api from "../api/axios";

const Navbar = ({ onCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);
  const [marketStats, setMarketStats] = useState({ totalMarkets: 0, totalVolume: 0 });

  const lastScrollY = useRef(0);

  // Fetch live market stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/poll-stats/");
        setMarketStats(res.data);
      } catch (error) {
        console.error("Failed to fetch market stats", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setDockVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setDockVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Main navigation items (desktop sidebar)
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/polls", label: "Polls", icon: "📊" },
    { path: "/positions", label: "Positions", icon: "📈" },
    { path: "/challenges", label: "Bet-Beshte", icon: "⚔️" },
    { path: "/wallet", label: "Wallet", icon: "💰" },
    { path: "/profile", label: "Profile", icon: "👤" },
  ];

  // Mobile dock items – now always includes "Manage"
  const dockItems = [
    { path: "/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/polls", icon: "📊", label: "Polls" },
    { path: "/positions", icon: "📈", label: "Positions" },
    { path: "/challenges", icon: "⚔️", label: "Bet-Beshte" },
    { path: "/wallet", icon: "💰", label: "Wallet" },
    { path: "/manage/polls", icon: "⚙️", label: "Manage" },
  ];

  const isActive = (path) => location.pathname === path;

  // Helper to get user's display name (username or email fallback)
  const getDisplayName = () => user?.username || user?.email || "User";

  // Helper to get avatar fallback initial
  const getInitial = () => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "?";
  };

  /* ===========================
     MOBILE NAV (phones only)
  ============================ */
  if (isMobile) {
    return (
      <>
        {/* Top Header */}
        <nav
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
            scrolled
              ? "bg-[#0b0f19]/95 backdrop-blur-lg border-b border-cyan-500/20"
              : "bg-[#0b0f19] border-b border-white/5"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="relative">
                <span className="text-2xl">🎯</span>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-[length:200%] bg-clip-text text-transparent animate-gradient">
                PolyPulse
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <NotificationBell />
                  <div className="flex items-center gap-2">
                    {/* Username next to avatar */}
                    <span className="text-sm text-gray-300 hidden xs:inline">
                      {getDisplayName()}
                    </span>
                    <Link
                      to="/profile"
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold text-black hover:scale-105 transition-transform overflow-hidden"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={getDisplayName()}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = getInitial();
                          }}
                        />
                      ) : (
                        getInitial()
                      )}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom Dock */}
        {user && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ${
              dockVisible ? "translate-y-0" : "translate-y-20"
            }`}
          >
            <div className="relative mx-2 mb-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-gray-800">
              <div className="flex gap-1 min-w-max px-1">
                {dockItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                      isActive(item.path)
                        ? "bg-gradient-to-b from-cyan-500/20 to-transparent"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`relative p-2.5 rounded-lg mb-1 transition-all ${
                        isActive(item.path)
                          ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black"
                          : "text-gray-400"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {isActive(item.path) && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive(item.path) ? "text-cyan-400" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spacer for dock */}
        {user && <div className="h-24" />}
      </>
    );
  }

  /* ===========================
     DESKTOP / TABLET SIDEBAR
  ============================ */
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-gradient-to-b from-[#0b0f19] to-[#1a1f2e] border-r border-cyan-500/20 transition-all duration-300 shadow-2xl ${
        isCollapsed ? "w-20" : "w-[280px]"
      }`}
    >
      {/* Header with Logo */}
      <div className="relative p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎯</span>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-[length:200%] bg-clip-text text-transparent animate-gradient">
                PolyPulse
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link to="/" className="mx-auto">
              <div className="relative">
                <span className="text-2xl hover:scale-110 transition-transform">🎯</span>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
            </Link>
          )}

          <button
            onClick={() => {
              setIsCollapsed((prev) => {
                const next = !prev;
                onCollapse?.(next);
                return next;
              });
            }}
            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-lg hover:scale-110 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              isActive(item.path)
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <span
              className={`text-xl transition-transform ${
                isActive(item.path) ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>
            {!isCollapsed && (
              <>
                <span className="font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </>
            )}
          </Link>
        ))}

        {/* Manage link – visible to all logged‑in users */}
        {user && (
          <Link
            to="/manage/polls"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              isActive("/manage/polls")
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <span className="text-xl transition-transform group-hover:scale-110">⚙️</span>
            {!isCollapsed && (
              <>
                <span className="font-medium">Manage</span>
                {isActive("/manage/polls") && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </>
            )}
          </Link>
        )}

        {/* Alerts link – always present */}
        {!isCollapsed && (
          <Link
            to="/notifications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <span className="text-xl">🔔</span>
            <span className="font-medium">Alerts</span>
          </Link>
        )}
        {isCollapsed && (
          <Link
            to="/notifications"
            className="flex items-center justify-center px-2 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            title="Alerts"
          >
            <span className="text-xl">🔔</span>
          </Link>
        )}
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-white/10">
        {user ? (
          <>
            {!isCollapsed && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  {/* Avatar with fallback */}
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={getDisplayName()}
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold text-black">${getInitial()}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold text-black">
                        {getInitial()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#1a1f2e] animate-pulse" />
                  </div>

                  {/* Username and email (username replaces "Trader") */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-cyan-400 truncate">
                      @{user.username || "user"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 text-red-400 font-medium hover:from-red-500/20 transition-all ${
                isCollapsed ? "p-0 w-10 h-10 mx-auto flex items-center justify-center" : ""
              }`}
            >
              {isCollapsed ? "🚪" : "🚪 Sign Out"}
            </button>
          </>
        ) : (
          <div className={`space-y-2 ${isCollapsed ? "text-center" : ""}`}>
            <Link
              to="/login"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all ${
                isCollapsed ? "p-2" : ""
              }`}
            >
              {isCollapsed ? "🔐" : "Sign In"}
            </Link>
            <Link
              to="/register"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all ${
                isCollapsed ? "p-2" : ""
              }`}
            >
              {isCollapsed ? "🚀" : "Get Started"}
            </Link>
          </div>
        )}
      </div>

      {/* Live Market Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">📊 Market Snapshot</div>
          <div className="flex justify-between text-sm">
            <div className="text-white">
              Markets <span className="text-cyan-400">{marketStats.totalMarkets}</span>
            </div>
            <div className="text-white">
              Volume <span className="text-emerald-400">Kes {(marketStats.totalVolume || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Navbar;