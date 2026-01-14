// src/pages/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/auth/verify-email/${token}/`);
        setMessage(res.data.message);
        // Redirect to login after 2 seconds
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        setError(err.response?.data?.detail || "Verification failed");
        setMessage("");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-container">
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default VerifyEmail;
