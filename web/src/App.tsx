import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import HomeFeed from './pages/HomeFeed';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Watch from './pages/Watch';
import Roadmap from './pages/Roadmap';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Search from './pages/Search';

/**
 * ProtectedRoute — redirects to login if not authenticated.
 * Redirects to onboarding if authenticated but not yet onboarded.
 */
function ProtectedRoute({ children, allowUnonboarded = false }: { children: React.ReactNode, allowUnonboarded?: boolean }) {
  const { user, loading, isOnboarded } = useAuth();

  if (loading || isOnboarded === null) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (!allowUnonboarded && !isOnboarded) {
    return <Navigate to="/onboarding" />;
  }

  if (allowUnonboarded && isOnboarded) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

/**
 * AuthRoute — redirects logged-in users away from login/register pages.
 */
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isOnboarded } = useAuth();

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Loading...</div>;

  if (user) {
    return <Navigate to={isOnboarded ? '/' : '/onboarding'} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* PUBLIC — Root is now the HomeFeed. Accessible to everyone. */}
        <Route path="/" element={<HomeFeed />} />

        {/* AUTH PAGES — redirect away if already logged in */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ONBOARDING — must be logged in but not yet onboarded */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowUnonboarded={true}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* WATCH — public (guests can watch), session tracking only for logged-in users */}
        <Route path="/watch/:id" element={<Watch />} />

        {/* SEARCH — public for guests, personalized for logged-in users */}
        <Route path="/search" element={<Search />} />

        {/* PROTECTED PAGES — require login + onboarding */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
