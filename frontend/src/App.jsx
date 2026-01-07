import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PollDetail from "./pages/PollDetail";

import AdminRoute from "./components/AdminRoute";
import PrivateRoute from "./components/PrivateRoute";

import AdminLayout from "./pages/AdminLayout";
import AdminPolls from "./pages/AdminPolls";
import AdminUsers from "./pages/AdminUsers";
import AdminWallet from "./pages/AdminWallet";
import AdminComments from "./pages/AdminComments";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* 🌍 Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔐 Protected User Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/polls/:id"
            element={
              <PrivateRoute>
                <PollDetail />
              </PrivateRoute>
            }
          />

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
