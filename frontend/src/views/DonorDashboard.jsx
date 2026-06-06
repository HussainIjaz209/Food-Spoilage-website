import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Utensils, Calendar, MapPin, ClipboardList, CheckCircle2, History, MessageSquare, Heart } from 'lucide-react';

const DonorDashboard = () => {
  const { token, user } = useAuth();
  
  // Stats & Listings states
  const [stats, setStats] = useState({ total_listings: 0, active_listings: 0, delivered_listings: 0, claimed_listings: 0, meals_saved: 0, impact_message: '' });
  const [activeListings, setActiveListings] = useState([]);
  const [historyListings, setHistoryListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [claims, setClaims] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    food_type: 'Veg',
    quantity: '',
    expiry_time: '',
    pickup_address: '',
    city: '',
    latitude: '',
    longitude: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'new-donation', 'feedback', 'claims'

  // Load everything
  const loadDashboardData = async () => {
    try {
      // 1. Load Stats and Active Listings
      const statsRes = await fetch('/api/dashboard/donor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.metrics);
        setActiveListings(statsData.active_listings || []);
      }

      // 2. Load Categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: catData[0].id }));
        }
      }

      // 3. Load historical listings
      const historyRes = await fetch('/api/donations?status=delivered', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        // Filter by current donor
        setHistoryListings(historyData.filter(d => d.donor_id === user.id));
      }

      // 4. Load Feedback
      const feedbackRes = await fetch(`/api/feedback/donor/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbacks(feedbackData.reviews || []);
      }

      // 5. Load Claims on donor listings
      const claimsRes = await fetch('/api/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // Autofill address details from user profile when tab opens
  useEffect(() => {
    if (activeTab === 'new-donation') {
      const autofill = async () => {
        try {
          const res = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const profile = await res.json();
            setFormData(prev => ({
              ...prev,
              pickup_address: profile.address || '',
              city: profile.city || '',
              latitude: profile.latitude || '',
              longitude: profile.longitude || ''
            }));
          }
        } catch (e) {
          console.error(e);
        }
      };
      autofill();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (!formData.title || !formData.category_id || !formData.quantity || !formData.expiry_time) {
      setFormError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const uploadData = new FormData();
      Object.keys(formData).forEach(key => {
        uploadData.append(key, formData[key]);
      });
      if (imageFile) {
        uploadData.append('image', imageFile);
      }

      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Listing creation failed');
      }

      setFormSuccess('Food donation listed successfully!');
      setFormData({
        title: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        food_type: 'Veg',
        quantity: '',
        expiry_time: '',
        pickup_address: formData.pickup_address, // keep address
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      setImageFile(null);
      
      // Reload stats and tables
      loadDashboardData();
      
      // Redirect back to listings tab after a short delay
      setTimeout(() => {
        setFormSuccess('');
        setActiveTab('listings');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Error submitting donation details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimStatusUpdate = async (claimId, status) => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* Metrics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Meals Saved (Estimated)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={28} style={{ color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }} />
            <span>{stats.meals_saved}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
            {stats.impact_message || 'Thank you for reducing local food waste!'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Listings</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{stats.active_listings}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Awaiting claim or pickup</div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Claims</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'hsl(var(--secondary))', marginTop: '4px' }}>{stats.claimed_listings}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Claimed by local NGOs</div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Delivered / Rescued</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'hsl(var(--primary))', marginTop: '4px' }}>{stats.delivered_listings}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Safely handed over to shelters</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Sidebar Nav */}
        <aside className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Actions Dashboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('listings')}
              className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <ClipboardList size={18} />
              Active Listings
            </button>
            <button 
              onClick={() => setActiveTab('new-donation')}
              className={`btn ${activeTab === 'new-donation' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <PlusCircle size={18} />
              List Food Donation
            </button>
            <button 
              onClick={() => setActiveTab('claims')}
              className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <History size={18} />
              Manage NGO Claims
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <MessageSquare size={18} />
              NGO Feedback
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          
          {/* TAB 1: Active Listings */}
          {activeTab === 'listings' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Active Food Listings</h2>
              {activeListings.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  <Utensils size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>You have no active listings. Create one to support local shelters!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {activeListings.map(listing => (
                    <div key={listing.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {listing.image_url && (
                        <img 
                          src={listing.image_url} 
                          alt={listing.title} 
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                      )}
                      <div>
                        <span className={`badge badge-${listing.status}`} style={{ marginBottom: '6px' }}>{listing.status}</span>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>{listing.title}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{listing.description}</p>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Quantity:</span>
                          <span style={{ color: '#fff' }}>{listing.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Food Type:</span>
                          <span style={{ color: '#fff' }}>{listing.food_type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                          <span>Expiry:</span>
                          <span>{new Date(listing.expiry_time).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* History block */}
              {historyListings.length > 0 && (
                <div style={{ marginTop: '50px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Delivered Donation History</span>
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px' }}>Food Item</th>
                          <th style={{ padding: '12px' }}>Quantity</th>
                          <th style={{ padding: '12px' }}>Food Type</th>
                          <th style={{ padding: '12px' }}>Delivered Date</th>
                          <th style={{ padding: '12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyListings.map(history => (
                          <tr key={history.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '12px', color: '#fff' }}>{history.title}</td>
                            <td style={{ padding: '12px' }}>{history.quantity}</td>
                            <td style={{ padding: '12px' }}>{history.food_type}</td>
                            <td style={{ padding: '12px' }}>{new Date(history.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '12px' }}><span className="badge badge-delivered">delivered</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: List Food Donation Form */}
          {activeTab === 'new-donation' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>List Food Donation</h2>
              
              {formError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem' }}>
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.88rem' }}>
                  ✓ {formSuccess}
                </div>
              )}

              <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="title-input">Donation Title *</label>
                    <input 
                      id="title-input"
                      type="text" 
                      name="title"
                      className="form-input" 
                      placeholder="e.g. Leftover Bread & Muffins"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="category-select">Food Category *</label>
                    <select 
                      id="category-select"
                      name="category_id"
                      className="form-select"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" htmlFor="description-input">Description (Include item list or packing notes)</label>
                  <textarea 
                    id="description-input"
                    name="description"
                    className="form-textarea" 
                    placeholder="Fresh bakery items. Please bring a box or bags for collection."
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                  {/* Food Type */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="food-type-select">Food Type *</label>
                    <select 
                      id="food-type-select"
                      name="food_type"
                      className="form-select"
                      value={formData.food_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="quantity-input">Quantity (kg or servings) *</label>
                    <input 
                      id="quantity-input"
                      type="text" 
                      name="quantity"
                      className="form-input" 
                      placeholder="e.g. 15 Servings / 4 Kg"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Best Before */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="expiry-input">Best Before Time *</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        id="expiry-input"
                        type="datetime-local" 
                        name="expiry_time"
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        value={formData.expiry_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  {/* Pickup address */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="pickup-address-input">Pickup Address</label>
                    <input 
                      id="pickup-address-input"
                      type="text" 
                      name="pickup_address"
                      className="form-input"
                      value={formData.pickup_address}
                      onChange={handleInputChange}
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
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Coordinate overrides */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="latitude-input">GPS Latitude</label>
                    <input 
                      id="latitude-input"
                      type="number" 
                      step="any"
                      name="latitude"
                      className="form-input"
                      value={formData.latitude}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="longitude-input">GPS Longitude</label>
                    <input 
                      id="longitude-input"
                      type="number" 
                      step="any"
                      name="longitude"
                      className="form-input"
                      value={formData.longitude}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Image upload */}
                <div className="form-group" style={{ marginBottom: '30px' }}>
                  <label className="form-label" htmlFor="image-file">Food Photo Listing</label>
                  <input 
                    id="image-file"
                    type="file" 
                    className="form-input" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '12px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Listing...' : 'Publish Listing'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Manage claims */}
          {activeTab === 'claims' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Claims on Your Listings</h2>
              {claims.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No NGO recipient claims listed yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px' }}>NGO Organization</th>
                        <th style={{ padding: '12px' }}>Food Title</th>
                        <th style={{ padding: '12px' }}>Claim Time</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map(claim => (
                        <tr key={claim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                            {claim.recipient_name}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.recipient_phone}</div>
                          </td>
                          <td style={{ padding: '12px' }}>{claim.donation_title}</td>
                          <td style={{ padding: '12px' }}>{new Date(claim.claim_time).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {claim.status === 'pending' && (
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button 
                                  onClick={() => handleClaimStatusUpdate(claim.id, 'approved')}
                                  className="btn btn-primary btn-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleClaimStatusUpdate(claim.id, 'cancelled')}
                                  className="btn btn-danger btn-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {claim.status === 'approved' && (
                              <button 
                                onClick={() => handleClaimStatusUpdate(claim.id, 'picked_up')}
                                className="btn btn-accent btn-sm"
                              >
                                Mark Picked Up
                              </button>
                            )}

                            {claim.status === 'picked_up' && (
                              <button 
                                onClick={() => handleClaimStatusUpdate(claim.id, 'delivered')}
                                className="btn btn-primary btn-sm"
                              >
                                Mark Delivered
                              </button>
                            )}

                            {claim.status === 'delivered' && (
                              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={14} /> Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NGO Feedback */}
          {activeTab === 'feedback' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Received Feedback & Ratings</h2>
              {feedbacks.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>You have not received any feedback reviews yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {feedbacks.map(f => (
                    <div key={f.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: '#fff' }}>{f.reviewer_organization || 'NGO Recipient'}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Review by: {f.reviewer_name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span className="badge badge-available">Quality: {f.rating}/5 ★</span>
                          <span className="badge badge-claimed">Hygiene: {f.hygiene_rating}/5 ★</span>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '6px' }}>
                        "{f.comment || 'No comment provided'}"
                      </p>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
                        Submitted on {new Date(f.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default DonorDashboard;
