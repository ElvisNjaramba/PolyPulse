import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";

const Footer = ({ isCollapsed }) => {
  const currentYear = new Date().getFullYear();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTraders, setActiveTraders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/poll-stats/");
        setActiveTraders(res.data.active_traders);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const footerMargin = isMobile ? "ml-0" : isCollapsed ? "ml-[80px]" : "ml-[280px]";

  return (
    <footer
      className={`
        border-t border-white/10
        bg-[rgba(11,15,25,0.5)]
        backdrop-blur-md
        transition-[margin-left] duration-300 ease-in-out
        ${footerMargin}
      `}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-3">
        <div className="flex flex-wrap items-center justify-between text-sm">

          {/* Left */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 font-semibold text-gray-400 hover:text-cyan-400 transition"
            >
              <span className="text-lg">🎯</span>
              <span className="hidden sm:inline bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                PolyPulse
              </span>
            </Link>

            <span className="hidden lg:inline text-xs text-gray-500">
              © {currentYear} PolyPulse. All predictions are for entertainment.
            </span>
          </div>

          {/* Center */}
          <div className="hidden md:flex items-center gap-6">
            {["terms", "privacy", "faq"].map((item) => (
              <Link
                key={item}
                to={`/${item}`}
                className="text-xs text-gray-400 hover:text-cyan-400 transition"
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Link>
            ))}

            <a
              href="https://twitter.com/polypulse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-cyan-400 transition"
            >
              Twitter
            </a>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">

            {/* Live Status – now with real trader count */}
            <div className="flex items-center gap-3 text-xs">
              {/* <div className="flex items-center gap-2 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                </span>
                Live
              </div> */}

              <span className="text-gray-500 hidden sm:inline">|</span>

              {/* <span className="text-gray-400">
                <span className="text-emerald-400 font-medium">
                  {loading ? "..." : activeTraders?.toLocaleString() || "0"}
                </span>{" "}
                <span className="hidden sm:inline">traders</span>
              </span> */}
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/polypulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-cyan-400 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" />
                </svg>
              </a>

              <a
                href="https://discord.gg/polypulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-cyan-400 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37C18.393 3.36 16.3 2.643 14.102 2.25c-.227.375-.478.859-.646 1.218-2.277-.386-4.553-.386-6.773 0-.168-.359-.424-.843-.65-1.218C3.834 2.643 1.74 3.36-.183 4.37-3.408 9.567-4.37 14.626-3.985 19.585 1.993 22.392 5.907 23.5 9.82 24c.569-.699 1.076-1.446 1.516-2.234-1.474-.416-2.881-1.017-4.194-1.789.267-.184.523-.379.77-.584 4.452 2.221 9.346 2.221 13.724 0 .247.205.503.4.77.584-1.313.772-2.72 1.373-4.194 1.789.44.788.947 1.535 1.516 2.234 3.914-.5 7.828-1.608 11.806-4.415.385-4.959-.578-10.018-3.802-15.215Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile Links – always visible, includes real trader count */}
          <div className="flex md:hidden w-full justify-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs">
            <Link to="/terms" className="text-gray-400 hover:text-cyan-400">Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-cyan-400">Privacy</Link>
            <Link to="/faq" className="text-gray-400 hover:text-cyan-400">FAQ</Link>
            {/* <span className="text-gray-400">
              {loading ? "..." : activeTraders?.toLocaleString() || "0"} traders
            </span> */}
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;