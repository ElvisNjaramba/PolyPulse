import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

const Navbar = ({ onCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);

  const menuRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      // Hide dock when scrolling down, show when scrolling up
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

    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: "🏠", short: "Home" },
    { path: "/polls", label: "Polls", icon: "📊", short: "Polls" },
    { path: "/wallet", label: "Wallet", icon: "💰", short: "Wallet" },
    { path: "/notifications", label: "Alerts", icon: "🔔", short: "Alerts" },
    { path: "/profile", label: "Profile", icon: "👤", short: "Profile" },
    { path: "/positions", label: "Positions", icon: "📈", short: "Positions" },
  ];

  const dockItems = [
    { path: "/", icon: "🏠", label: "Home" },
    { path: "/polls", icon: "📊", label: "Polls" },
    { path: "/wallet", icon: "💰", label: "Wallet" },
    { path: "/profile", icon: "👤", label: "Profile" },
    { path: "/positions", icon: "📈", label: "Positions" },
  ];

  const isActive = (path) => location.pathname === path;

  /* ===========================
     MOBILE NAV
  ============================ */
  if (isMobile) {
    return (
      <>
        {/* Top Header */}
        <nav
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
              ? "bg-[#0b0f19]/95 backdrop-blur-lg border-b border-cyan-500/20"
              : "bg-[#0b0f19] border-b border-white/5"
            }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <span className="text-2xl">🎯</span>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-[length:200%] bg-clip-text text-transparent animate-gradient">
                PolyPulse
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Link
                    to="/notifications"
                    className="relative p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-lg">🔔</span>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0b0f19]" />
                  </Link>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
                  >
                    <span className="text-lg">{isMenuOpen ? "✕" : "☰"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <div
            ref={menuRef}
            className={`fixed inset-0 top-14 bg-gradient-to-b from-[#0b0f19] via-[#0b0f19] to-[#1a1f2e] backdrop-blur-lg transition-all duration-300 ${isMenuOpen
                ? "opacity-100 visible"
                : "opacity-0 invisible"
              }`}
          >
            <div className="p-5 h-full overflow-y-auto">
              {user ? (
                <>
                  {/* User Profile */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-bold text-black">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0b0f19] animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {user.email?.split("@")[0]}
                        </div>
                        <div className="text-sm text-cyan-400">Active Trader</div>
                      </div>
                      <div className="text-white font-bold text-lg">
                        $1,250
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive(item.path)
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                        {isActive(item.path) && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 mb-4 flex gap-2">
                    <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-cyan-400 font-medium hover:from-cyan-500/20 transition-all">
                      ⚡ Quick Trade
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-blue-400 font-medium hover:from-blue-500/20 transition-all">
                      📈 Markets
                    </button>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 text-red-400 font-medium hover:from-red-500/20 transition-all"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <div className="text-center mt-10">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    Welcome
                  </h3>
                  <p className="text-gray-400 mb-6">Predict markets and trade outcomes</p>
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Bottom Dock */}
        {user && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ${dockVisible ? "translate-y-0" : "translate-y-20"
              }`}
          >
            {/* Dock Container */}
            <div className="relative mx-4 mb-4">
              {/* Glass effect background */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-blue-500/5 backdrop-blur-lg rounded-2xl border border-cyan-500/20" />

              {/* Dock Items */}
              <div className="relative flex items-center justify-around p-2">
                {dockItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive(item.path)
                        ? "bg-gradient-to-b from-cyan-500/20 to-transparent"
                        : "hover:bg-white/5"
                      }`}
                  >
                    <div className={`relative p-2.5 rounded-lg mb-1 transition-all ${isActive(item.path)
                        ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black"
                        : "text-gray-400"
                      }`}>
                      <span className="text-xl">{item.icon}</span>
                      {isActive(item.path) && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive(item.path) ? "text-cyan-400" : "text-gray-400"
                      }`}>
                      {item.label}
                    </span>
                  </Link>
                ))}

                {/* Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${isMenuOpen ? "bg-gradient-to-b from-cyan-500/20 to-transparent" : ""
                    }`}
                >
                  <div className={`p-2.5 rounded-lg mb-1 transition-all ${isMenuOpen
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black"
                      : "text-gray-400"
                    }`}>
                    <span className="text-xl">{isMenuOpen ? "✕" : "☰"}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${isMenuOpen ? "text-cyan-400" : "text-gray-400"
                    }`}>
                    More
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spacer for dock */}
        {user && <div className="h-20" />}
      </>
    );
  }

  /* ===========================
     DESKTOP SIDEBAR
  ============================ */
  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-gradient-to-b from-[#0b0f19] to-[#1a1f2e] border-r border-cyan-500/20 transition-all duration-300 shadow-2xl ${isCollapsed ? "w-20" : "w-[280px]"
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

          {/* Collapse Button */}
          <button
            onClick={() => {
              setIsCollapsed((prev) => {
                const next = !prev;
                onCollapse?.(next);
                return next;
              });
            }}

            className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-lg hover:scale-110 transition-transform ${isCollapsed ? "rotate-180" : ""
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive(item.path)
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <span className={`text-xl transition-transform ${isActive(item.path) ? "scale-110" : "group-hover:scale-110"
              }`}>
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
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-white/10">
        {user ? (
          <>
            {!isCollapsed && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm font-bold text-black">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#1a1f2e] animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {user.email?.split("@")[0]}
                    </div>
                    <div className="text-xs text-cyan-400">Trader</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 text-red-400 font-medium hover:from-red-500/20 transition-all ${isCollapsed ? "p-0 w-10 h-10 mx-auto flex items-center justify-center" : ""
                }`}
            >
              {isCollapsed ? "🚪" : "🚪 Sign Out"}
            </button>
          </>
        ) : (
          <div className={`space-y-2 ${isCollapsed ? "text-center" : ""}`}>
            <Link
              to="/login"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all ${isCollapsed ? "p-2" : ""
                }`}
            >
              {isCollapsed ? "🔐" : "Sign In"}
            </Link>
            <Link
              to="/register"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all ${isCollapsed ? "p-2" : ""
                }`}
            >
              {isCollapsed ? "🚀" : "Get Started"}
            </Link>
          </div>
        )}
      </div>

      {/* Live Markets (Expanded Only) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">Live Markets</div>
          <div className="flex justify-between text-sm">
            <div className="text-white">BTC <span className="text-emerald-400">+2.3%</span></div>
            <div className="text-white">ETH <span className="text-rose-400">-1.2%</span></div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Navbar;
