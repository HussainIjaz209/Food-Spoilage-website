import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './views/Landing';
import Login from './views/Login';
import Register from './views/Register';
import DonorDashboard from './views/DonorDashboard';
import RecipientDashboard from './views/RecipientDashboard';
import AdminDashboard from './views/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>Loading Application...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'donor') return <Navigate to="/donor-dashboard" replace />;
    if (user.role === 'recipient') return <Navigate to="/recipient-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route 
          path="/login" 
          element={
            user ? (
              user.role === 'donor' ? <Navigate to="/donor-dashboard" replace /> :
              user.role === 'recipient' ? <Navigate to="/recipient-dashboard" replace /> :
              <Navigate to="/admin-dashboard" replace />
            ) : <Login />
          } 
        />
        
        <Route 
          path="/register" 
          element={
            user ? (
              user.role === 'donor' ? <Navigate to="/donor-dashboard" replace /> :
              user.role === 'recipient' ? <Navigate to="/recipient-dashboard" replace /> :
              <Navigate to="/admin-dashboard" replace />
            ) : <Register />
          } 
        />
        
        <Route 
          path="/donor-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/recipient-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['recipient']}>
              <RecipientDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
