// src/pages/CheckEmail.jsx
import { useLocation } from "react-router-dom";

const CheckEmail = () => {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="auth-container">
      <h2>Check Your Email</h2>
      <p>
        We sent a verification link to <strong>{email}</strong>.
        Please click the link to activate your account before logging in.
      </p>
    </div>
  );
};

export default CheckEmail;
