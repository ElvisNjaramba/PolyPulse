// src/pages/CheckEmail.jsx
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const CheckEmail = () => {
  const location = useLocation();
  const email = location.state?.email;

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b0f19] to-[#1a1f2e] px-5">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,224,255,0.1)_0%,transparent_70%)] animate-float" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,119,255,0.1)_0%,transparent_70%)] animate-float-reverse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-50" />
      </div>

      {/* Card */}
      <div className={`relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-700 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
          Check Your Email
        </h2>
        <p className="text-gray-300 mb-6">
          We sent a verification link to{" "}
          <strong className="text-white">{email}</strong>.
          Please click the link to activate your account before logging in.
        </p>

        <Link
          to="/login"
          className="inline-block w-full text-center py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#0b0f19] font-semibold rounded-xl shadow-lg hover:shadow-cyan-400/40 transition-all"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default CheckEmail;
