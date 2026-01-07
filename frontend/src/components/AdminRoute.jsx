import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || !user.is_admin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
