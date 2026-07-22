import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Watch from './pages/Watch';
import Roadmap from './pages/Roadmap';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Search from './pages/Search';

function ProtectedRoute({ children, allowUnonboarded = false }: { children: React.ReactNode, allowUnonboarded?: boolean }) {
  const { user, loading, isOnboarded } = useAuth();
  
  if (loading || isOnboarded === null) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (!allowUnonboarded && !isOnboarded) {
    return <Navigate to="/onboarding" />;
  }
  
  if (allowUnonboarded && isOnboarded) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isOnboarded } = useAuth();
  
  if (loading || isOnboarded === null) return <div>Loading...</div>;
  
  if (user) {
    if (isOnboarded) {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/onboarding" />;
    }
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute allowUnonboarded={true}>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
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
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/watch/:id" 
          element={
            <ProtectedRoute>
              <Watch />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
