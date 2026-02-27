import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import User from './components/User';
import Admin from './components/Admin';
import Login from './components/Login';
import Footer from './components/Footer';

const Navigation = () => {
  const location = useLocation();
  const isAdmin = localStorage.getItem('adminAuth') === 'true';

  return (
    <nav className="nav-container">
      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Student Check</Link>
      {isAdmin && <Link to="/admin/dashboard" className={`nav-link ${location.pathname.includes('/admin') ? 'active' : ''}`}>Admin Dashboard</Link>}
      {!isAdmin && <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>Admin Login</Link>}
      {isAdmin && <button onClick={() => { localStorage.removeItem('adminAuth'); window.location.href = '/'; }} className="nav-link" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>}
    </nav>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <div className="page-wrapper">
          <h1 className="title">Student Result System</h1>
          <Navigation />
          <Routes>
            <Route path="/" element={<User />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            {/* Redirect old admin route for compatibility or catch-all */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
