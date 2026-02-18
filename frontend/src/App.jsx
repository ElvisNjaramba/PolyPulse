import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* 🌍 Public */}
          <Route path="/"element={<Landing />}/>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            <Route path="/manage/polls" element={<ManagePolls />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/challenges" element={<ChallengeList />} />
            <Route path="/challenges/new" element={<ChallengeCreate />} />
            <Route
              path="/wallet"
              element={
                <PrivateRoute>
                  <Wallet />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />

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
