import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import './App.css';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import PetOwnerDashboard from './pages/PetOwnerDashboard';
import VetDashboard from './pages/VetDashboard';
import VetDirectory from './pages/VetDirectory';
import VetDetail from './pages/VetDetail';
import Appointments from './pages/Appointments';
import Emergency from './pages/Emergency';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import VetProfileSetup from './pages/VetProfileSetup';
import PaymentSuccess from './pages/PaymentSuccess';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Protected Route Component
function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`
          }
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-eggshell flex items-center justify-center">
        <div className="text-deepblue">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return React.cloneElement(children, { user });
}

// App Router Component
function AppRouter() {
  const location = useLocation();

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check for session_id in URL fragment synchronously
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vets" 
        element={
          <ProtectedRoute>
            <VetDirectory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vets/:vetId" 
        element={
          <ProtectedRoute>
            <VetDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/appointments" 
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/emergency" 
        element={
          <ProtectedRoute>
            <Emergency />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chats" 
        element={
          <ProtectedRoute>
            <Chats />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chats/:chatId" 
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vet/setup" 
        element={
          <ProtectedRoute>
            <VetProfileSetup />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment/success" 
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

// Dashboard Router - redirects based on user type
function DashboardRouter({ user }) {
  if (!user) return null;
  
  if (user.user_type === 'vet') {
    return <VetDashboard user={user} />;
  }
  
  return <PetOwnerDashboard user={user} />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
