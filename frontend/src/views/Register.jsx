import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Building } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'donor',
    organization_name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingGPS, setFetchingGPS] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingGPS(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setFetchingGPS(false);
      },
      (err) => {
        console.error('GPS retrieval error:', err);
        setError('Unable to retrieve location automatically. Please enter coordinates manually.');
        setFetchingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 70px)',
      paddingTop: '40px',
      paddingBottom: '40px'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '560px', 
        padding: '40px', 
        borderRadius: 'var(--radius-lg)' 
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(142, 222, 160, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'hsl(var(--primary))'
          }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '6px' }}>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join our food redistribution network</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: '#f87171', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '20px',
            fontSize: '0.88rem' 
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            color: '#34d399', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '20px',
            fontSize: '0.88rem' 
          }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Toggle Selector */}
          <div className="form-group">
            <label className="form-label">I want to register as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => setFormData(prev => ({ ...prev, role: 'donor' }))}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${formData.role === 'donor' ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.08)'}`,
                  backgroundColor: formData.role === 'donor' ? 'rgba(142, 222, 160, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: formData.role === 'donor' ? '#fff' : 'var(--text-muted)',
                  transition: 'var(--transition-fast)'
                }}
              >
                Food Donor
              </div>
              <div 
                onClick={() => setFormData(prev => ({ ...prev, role: 'recipient' }))}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${formData.role === 'recipient' ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.08)'}`,
                  backgroundColor: formData.role === 'recipient' ? 'rgba(142, 222, 160, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: formData.role === 'recipient' ? '#fff' : 'var(--text-muted)',
                  transition: 'var(--transition-fast)'
                }}
              >
                NGO / Shelter
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="full-name-input">Contact Person Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="full-name-input"
                  type="text" 
                  name="full_name"
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email-register-input">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="email-register-input"
                  type="email" 
                  name="email"
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password-register-input">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="password-register-input"
                  type="password" 
                  name="password"
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="phone-input"
                  type="text" 
                  name="phone"
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  placeholder="+15550100"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Org name */}
          <div className="form-group">
            <label className="form-label" htmlFor="org-name-input">
              {formData.role === 'donor' ? 'Restaurant / Bakery / Entity Name' : 'NGO / Shelter / Foundation Name'}
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                id="org-name-input"
                type="text" 
                name="organization_name"
                className="form-input" 
                style={{ paddingLeft: '44px' }}
                placeholder="Gourmet Garden Cafe"
                value={formData.organization_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            {/* Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="address-input">Street Address</label>
              <input 
                id="address-input"
                type="text" 
                name="address"
                className="form-input" 
                placeholder="123 Food Street"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* City */}
            <div className="form-group">
              <label className="form-label" htmlFor="city-input">City</label>
              <input 
                id="city-input"
                type="text" 
                name="city"
                className="form-input" 
                placeholder="New York"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location coordinate select */}
          <div className="form-group" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Geographic GPS Coordinates (Required for Proximity Maps)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={getGPSLocation}
                disabled={fetchingGPS}
                style={{ display: 'flex', gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <MapPin size={12} />
                {fetchingGPS ? 'Locating...' : 'Get GPS'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input 
                aria-label="Latitude coordinate"
                type="number" 
                step="any"
                name="latitude"
                className="form-input" 
                placeholder="Latitude (e.g. 40.7128)"
                value={formData.latitude}
                onChange={handleChange}
              />
              <input 
                aria-label="Longitude coordinate"
                type="number" 
                step="any"
                name="longitude"
                className="form-input" 
                placeholder="Longitude (e.g. -74.0060)"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'hsl(var(--primary))', fontWeight: '500' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
