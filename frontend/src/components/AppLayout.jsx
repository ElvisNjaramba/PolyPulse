// import { Outlet } from "react-router-dom";
// import Navbar from "./Navbar";
// import { useState, useEffect } from "react";

// const AppLayout = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth < 1024);
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   return (
//     <div style={{
//       display: "flex",
//       minHeight: "100vh",
//       backgroundColor: "#0f1525",
//     }}>
//       <Navbar />
//       <main style={{
//         flex: 1,
//         marginLeft: isMobile ? "0" : "280px",
//         padding: isMobile ? "20px" : "30px",
//         paddingBottom: isMobile ? "80px" : "30px",
//         overflowY: "auto",
//         transition: "margin-left 0.3s ease",
//         width: "100%",
//       }}>
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default AppLayout;

import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useState, useEffect } from "react";

const AppLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#0f1525",
    }}>
      <Navbar onCollapse={setIsCollapsed} />
      <div style={{ display: "flex", flex: 1 }}>
        <main style={{
          flex: 1,
          marginLeft: isMobile ? "0" : (isCollapsed ? "80px" : "280px"),
          padding: isMobile ? "20px" : "30px",
          paddingBottom: isMobile ? "20px" : "30px",
          overflowY: "auto",
          transition: "all 0.3s ease",
          width: "100%",
        }}>
          <Outlet />
        </main>
      </div>
      <Footer isCollapsed={isCollapsed}/>
    </div>
  );
};

export default AppLayout;