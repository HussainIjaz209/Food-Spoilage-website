import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, UploadCloud, FileText, CheckCircle, Clock, Star, Send, X, AlertTriangle, Sparkles } from 'lucide-react';

// Fix Leaflet marker icons by pulling from CDN
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically pan/zoom map on coordinates update
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
      map.setView(coords, 13);
    }
  }, [coords, map]);
  return null;
};

const RecipientDashboard = () => {
  const { token, user } = useAuth();
  
  // Dashboard & listings states
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Search states
  const [searchParams, setSearchParams] = useState({
    city: '',
    category_id: '',
    food_type: '',
    latitude: '',
    longitude: '',
    radius: 15
  });

  // Verification Form states
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Map settings
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // NYC default

  // Feedback states
  const [feedbackModal, setFeedbackModal] = useState({ show: false, donationId: null });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, hygieneRating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Tab views
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'claims', 'verification'

  const loadData = async () => {
    try {
      // 1. Fetch user profile
      const profRes = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
        if (profData.latitude && profData.longitude) {
          setMapCenter([parseFloat(profData.latitude), parseFloat(profData.longitude)]);
          setSearchParams(prev => ({
            ...prev,
            latitude: profData.latitude,
            longitude: profData.longitude,
            city: profData.city || ''
          }));
        }
      }

      // 2. Fetch categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // 3. Fetch Claims
      const claimsRes = await fetch('/api/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      }

      // 4. Fetch uploaded documents
      const docsRes = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setUploadedDocs(docsData.filter(d => d.user_id === user.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Search for Donations
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    try {
      let query = '/api/donations?status=available';
      if (searchParams.city) query += `&city=${encodeURIComponent(searchParams.city)}`;
      if (searchParams.category_id) query += `&category_id=${searchParams.category_id}`;
      if (searchParams.food_type) query += `&food_type=${searchParams.food_type}`;
      
      if (searchParams.latitude && searchParams.longitude) {
        query += `&latitude=${searchParams.latitude}&longitude=${searchParams.longitude}&radius=${searchParams.radius}`;
        setMapCenter([parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)]);
      }

      const res = await fetch(query, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchParams.category_id, searchParams.food_type]);

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchParams(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      (err) => {
        alert('Could not fetch location coordinates. Please enter manually.');
      }
    );
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile) return;

    setUploadLoading(true);
    try {
      const docData = new FormData();
      docData.append('document_name', docName || docFile.name);
      docData.append('document', docFile);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: docData
      });

      if (res.ok) {
        setDocName('');
        setDocFile(null);
        // Reset file input
        document.getElementById('doc-file-input').value = '';
        loadData();
        alert('Document uploaded successfully. Wait for admin approval.');
      } else {
        const err = await res.json();
        alert(err.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleClaimFood = async (donationId) => {
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ donation_id: donationId })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert('Food donation claimed! Details sent to Donor.');
        loadData();
        handleSearch();
      } else {
        alert(result.message || 'Unable to claim donation.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this claim?')) return;
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        loadData();
        handleSearch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donation_id: feedbackModal.donationId,
          rating: feedbackForm.rating,
          hygiene_rating: feedbackForm.hygieneRating,
          comment: feedbackForm.comment
        })
      });

      if (res.ok) {
        alert('Feedback submitted successfully!');
        setFeedbackModal({ show: false, donationId: null });
        setFeedbackForm({ rating: 5, hygieneRating: 5, comment: '' });
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error submitting feedback');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* Top Banner Alert if Pending */}
      {profile && profile.verification_status !== 'approved' && (
        <div className="glass-panel" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          padding: '20px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid rgba(245, 158, 11, 0.2)',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          marginBottom: '30px'
        }}>
          <AlertTriangle style={{ color: 'hsl(var(--secondary))', flexShrink: 0 }} size={28} />
          <div>
            <h4 style={{ color: '#fff' }}>Verification Pending</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
              Your NGO account status is currently <strong>{profile.verification_status.toUpperCase()}</strong>. 
              To claim active donations, please upload registration files under the **Verification Docs** section.
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            NGO Panel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('browse')}
              className={`btn ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Search size={18} />
              Browse Donations
            </button>
            
            <button 
              onClick={() => setActiveTab('claims')}
              className={`btn ${activeTab === 'claims' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Clock size={18} />
              Claims & Pickups
            </button>
            
            <button 
              onClick={() => setActiveTab('verification')}
              className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <FileText size={18} />
              Verification Docs
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          
          {/* TAB 1: Browse Donations */}
          {activeTab === 'browse' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Available Nearby Donations</h2>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                {/* Search Term / City */}
                <div style={{ flex: '1 1 200px' }}>
                  <input 
                    aria-label="City search"
                    type="text" 
                    className="form-input" 
                    placeholder="Search by city (e.g. New York)"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                {/* Category selection */}
                <div style={{ flex: '1 1 150px' }}>
                  <select 
                    aria-label="Category select"
                    className="form-select"
                    value={searchParams.category_id}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>

                {/* Food Type selection */}
                <div style={{ flex: '1 1 120px' }}>
                  <select 
                    aria-label="Food type select"
                    className="form-select"
                    value={searchParams.food_type}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, food_type: e.target.value }))}
                  >
                    <option value="">All Types</option>
                    <option value="Veg">Veg Only</option>
                    <option value="Non-Veg">Non-Veg Only</option>
                  </select>
                </div>

                {/* Geographic Search Toggle */}
                <div style={{ display: 'flex', gap: '8px', flex: '1 1 220px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={getGPSLocation}
                    style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <MapPin size={14} /> My Location
                  </button>
                  {searchParams.latitude && (
                    <input 
                      aria-label="Proximity search radius (km)"
                      type="number"
                      className="form-input"
                      style={{ maxWidth: '80px', padding: '6px' }}
                      placeholder="Radius"
                      value={searchParams.radius}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value, 10) || 15 }))}
                    />
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-sm">
                  Search
                </button>
              </form>

              {/* Map and Cards Grid */}
              <div style={{ display: 'grid', gridTemplateRows: '320px auto', gap: '30px' }}>
                
                {/* Leaflet Map */}
                <div style={{ height: '320px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeMapView coords={mapCenter} />
                    
                    {/* Render active pins */}
                    {donations.map(don => {
                      if (don.latitude && don.longitude) {
                        return (
                          <Marker 
                            key={don.id} 
                            position={[parseFloat(don.latitude), parseFloat(don.longitude)]} 
                            icon={defaultIcon}
                          >
                            <Popup>
                              <div style={{ minWidth: '180px' }}>
                                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{don.title}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#b9f6ca', fontWeight: '600' }}>
                                  Category: {don.category_name}
                                </div>
                                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                                  Qty: {don.quantity} | {don.food_type}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '4px' }}>
                                  Expiry: {new Date(don.expiry_time).toLocaleTimeString()}
                                </div>
                                {profile && profile.verification_status === 'approved' ? (
                                  <button 
                                    onClick={() => handleClaimFood(don.id)}
                                    className="btn btn-primary btn-sm"
                                    style={{ width: '100%', padding: '4px', fontSize: '0.75rem', marginTop: '10px' }}
                                  >
                                    Claim Listing
                                  </button>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '10px', fontStyle: 'italic' }}>
                                    (Approve Account to Claim)
                                  </div>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    })}
                  </MapContainer>
                </div>

                {/* Listing Feed cards */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Listings Available</h3>
                  {donations.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                      No active listings found matches your filter criteria.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {donations.map(don => (
                        <div key={don.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {don.image_url && (
                            <img 
                              src={don.image_url} 
                              alt={don.title} 
                              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                          )}
                          <div>
                            <span className="badge badge-available" style={{ marginBottom: '6px' }}>{don.category_name}</span>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>{don.title}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{don.description}</p>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Qty: <strong style={{ color: '#fff' }}>{don.quantity} ({don.food_type})</strong></div>
                            <div>Donor: <strong style={{ color: '#fff' }}>{don.donor_name}</strong></div>
                            <div style={{ color: '#f87171' }}>Best before: {new Date(don.expiry_time).toLocaleString()}</div>
                          </div>

                          {profile && profile.verification_status === 'approved' ? (
                            <button 
                              onClick={() => handleClaimFood(don.id)}
                              className="btn btn-primary"
                              style={{ width: '100%', padding: '8px', fontSize: '0.85rem', marginTop: 'auto' }}
                            >
                              Claim Now
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: '100%', padding: '8px', fontSize: '0.85rem', cursor: 'not-allowed', marginTop: 'auto' }} 
                              disabled
                            >
                              Awaiting Approval
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Claims and Pickups */}
          {activeTab === 'claims' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Your Claim History</h2>
              
              {claims.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  No claims registered under this account yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px' }}>Food Donation</th>
                        <th style={{ padding: '12px' }}>Donor</th>
                        <th style={{ padding: '12px' }}>Claim Date</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map(claim => (
                        <tr key={claim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                            {claim.donation_title}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {claim.quantity}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {claim.donor_name}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{claim.donor_phone}</div>
                          </td>
                          <td style={{ padding: '12px' }}>{new Date(claim.claim_time).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {['pending', 'approved'].includes(claim.status) && (
                              <button 
                                onClick={() => handleCancelClaim(claim.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Cancel
                              </button>
                            )}
                            
                            {claim.status === 'delivered' && (
                              <button 
                                onClick={() => setFeedbackModal({ show: true, donationId: claim.donation_id })}
                                className="btn btn-accent btn-sm"
                                style={{ display: 'inline-flex', gap: '4px' }}
                              >
                                <Star size={14} /> Review
                              </button>
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

          {/* TAB 3: Verification Docs */}
          {activeTab === 'verification' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Upload NGO Verification Files</h2>
              
              <div className="glass-card" style={{ marginBottom: '40px' }}>
                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Submit New Registration File</h4>
                <form onSubmit={handleDocUpload}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    
                    {/* Document Label */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="doc-name-input">Document Name / Tag</label>
                      <input 
                        id="doc-name-input"
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. NGO Charity Permit"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        required
                      />
                    </div>

                    {/* File upload */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="doc-file-input">Select File (PDF, Image, Word)</label>
                      <input 
                        id="doc-file-input"
                        type="file" 
                        className="form-input"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        required
                      />
                    </div>

                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploadLoading}
                    style={{ marginTop: '10px', display: 'flex', gap: '8px' }}
                  >
                    <UploadCloud size={18} />
                    {uploadLoading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </form>
              </div>

              {/* Uploaded lists */}
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Uploaded Verification Records</h3>
              {uploadedDocs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No documentation uploaded yet. Submit files above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadedDocs.map(doc => (
                    <div key={doc.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={28} style={{ color: 'hsl(var(--primary))' }} />
                        <div>
                          <h5 style={{ color: '#fff' }}>{doc.document_name}</h5>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a 
                        href={`/${doc.document_url}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm"
                      >
                        View File
                      </a>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* FEEDBACK RATING MODAL */}
      {feedbackModal.show && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 500,
          padding: '24px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ 
            width: '100%', 
            maxWidth: '480px', 
            padding: '30px', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--card-border)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setFeedbackModal({ show: false, donationId: null })}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'hsl(var(--secondary))' }} />
              Submit Food Quality Review
            </h3>

            <form onSubmit={submitFeedback}>
              {/* Rating */}
              <div className="form-group">
                <label className="form-label" htmlFor="rating-select">Food Quality Rating (1 - 5 Stars)</label>
                <select 
                  id="rating-select"
                  className="form-select"
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                  <option value="2">★★☆☆☆ (2/5)</option>
                  <option value="1">★☆☆☆☆ (1/5)</option>
                </select>
              </div>

              {/* Hygiene rating */}
              <div className="form-group">
                <label className="form-label" htmlFor="hygiene-rating-select">Packaging & Hygiene Rating (1 - 5 Stars)</label>
                <select 
                  id="hygiene-rating-select"
                  className="form-select"
                  value={feedbackForm.hygieneRating}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, hygieneRating: parseInt(e.target.value, 10) }))}
                >
                  <option value="5">★★★★★ (5/5)</option>
                  <option value="4">★★★★☆ (4/5)</option>
                  <option value="3">★★★☆☆ (3/5)</option>
                  <option value="2">★★☆☆☆ (2/5)</option>
                  <option value="1">★☆☆☆☆ (1/5)</option>
                </select>
              </div>

              {/* Comments */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="feedback-comment">Comments / Notes</label>
                <textarea 
                  id="feedback-comment"
                  className="form-textarea" 
                  placeholder="Tell us about the condition of the food items..."
                  rows="3"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submittingFeedback}
                style={{ width: '100%', display: 'flex', gap: '8px' }}
              >
                <Send size={16} />
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecipientDashboard;
