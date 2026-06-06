import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, HeartHandshake, User, Shield, ClipboardList, CheckCircle } from 'lucide-react';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications if token is present
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Optimistically update list
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
    } catch (err) {
      console.error('Error reading notification:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <HeartHandshake size={28} />
          <span>FoodBridge</span>
        </Link>

        {/* Links */}
        <div className="nav-links">
          {user ? (
            <>
              {user.role === 'donor' && (
                <Link 
                  to="/donor-dashboard" 
                  className={`nav-item ${location.pathname === '/donor-dashboard' ? 'active' : ''}`}
                >
                  <ClipboardList size={18} />
                  <span>Donor Portal</span>
                </Link>
              )}

              {user.role === 'recipient' && (
                <Link 
                  to="/recipient-dashboard" 
                  className={`nav-item ${location.pathname === '/recipient-dashboard' ? 'active' : ''}`}
                >
                  <HeartHandshake size={18} />
                  <span>NGO Dashboard</span>
                </Link>
              )}

              {user.role === 'admin' && (
                <Link 
                  to="/admin-dashboard" 
                  className={`nav-item ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
                >
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* Notification Bell */}
              <div className="notif-bell-container" ref={dropdownRef}>
                <div onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </div>

                {showNotif && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="badge badge-available">{unreadCount} new</span>
                      )}
                    </div>
                    
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No alerts yet.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                          >
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-time">
                              {new Date(notif.created_at).toLocaleString()}
                              {!notif.is_read && (
                                <span style={{ marginLeft: '8px', color: 'hsl(var(--primary))' }}>
                                  • Mark Read
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logged in User Profile Info */}
              <div className="nav-item" style={{ color: 'var(--text)', cursor: 'default' }}>
                <User size={18} style={{ color: 'hsl(var(--primary))' }} />
                <span>{user.name} ({user.role})</span>
              </div>

              {/* Logout Button */}
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ border: 'none' }}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Portal</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
