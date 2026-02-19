import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PollDetail from "./pages/PollDetail";
import CreatePoll from "./pages/CreatePoll";
import ManagePolls from "./pages/ManagePolls";
import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";

import AdminLayout from "./pages/AdminLayout";
import AdminPolls from "./pages/AdminPolls";
import AdminUsers from "./pages/AdminUsers";
import AdminWallet from "./pages/AdminWallet";
import AdminComments from "./pages/AdminComments";

import Wallet from "./pages/Wallet";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import CheckEmail from "./pages/CheckEmail";
import PollsList from "./components/PollList";
import AppLayout from "./components/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import Positions from "./pages/Positions";
import ChallengeList from "./pages/ChallengeList";
import ChallengeCreate from "./pages/ChallengeCreate";

import Landing from "./pages/LandingPage";
import PollAdminPanel from "./pages/PollAdminPanel";

// Component to handle root route based on auth
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner

  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
};

// Redirect authenticated users away from login/register
const AuthRedirect = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* 🌍 Public with auth-aware redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            }
          />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* 🔐 Authenticated User Layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/polls/:id" element={<PollDetail />} />
            <Route path="/polls" element={<PollsList />} />
            <Route path="/create/poll" element={<CreatePoll />} />
            <Route path="/manage/polls" element={<PollAdminPanel />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/challenges" element={<ChallengeList />} />
            <Route path="/challenges/new" element={<ChallengeCreate />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* 🛠 Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="polls" />} />
            <Route path="polls" element={<AdminPolls />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="wallet" element={<AdminWallet />} />
            <Route path="comments" element={<AdminComments />} />
          </Route>

          {/* ❌ Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;