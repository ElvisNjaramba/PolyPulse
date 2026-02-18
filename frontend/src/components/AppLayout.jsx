import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const AppLayout = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1525]">
      <Navbar onCollapse={setIsCollapsed} />
      
      <div className="flex flex-1 min-h-0"> {/* min-h-0 ensures flex child can shrink */}
        <main
          className={`
            flex-1 overflow-y-auto transition-all duration-300
            ${isMobile ? "pt-16" : ""}
            ${isMobile && user ? "pb-24" : ""}
          `}
          style={{
            marginLeft: isMobile ? 0 : isCollapsed ? 80 : 280,
            padding: isMobile ? "0 20px" : "30px",
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Spacer when dock is present to keep footer above it */}
      {isMobile && user && <div className="h-20" />}
      
      <Footer isCollapsed={isCollapsed} />
    </div>
  );
};

export default AppLayout;