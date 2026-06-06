import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Users, Truck, PlusCircle, CheckCircle, ShieldAlert, Award, FileText, ChevronRight, Activity } from 'lucide-react';

// Register Chart.js plugins/scales
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const { token } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'verification', 'categories'

  // Admin stats states
  const [reportsData, setReportsData] = useState({
    user_summary: [],
    city_trends: [],
    donation_status_summary: [],
    impact_summary: { total_delivered_donations: 0, estimated_waste_reduced_kg: 0, estimated_people_fed: 0 }
  });

  // Verification requests state
  const [verifications, setVerifications] = useState([]);

  // Category states
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadAdminData = async () => {
    try {
      // 1. Fetch Reports
      const reportRes = await fetch('/api/dashboard/admin-reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReportsData(reportData);
      }

      // 2. Fetch Verification documents
      const docsRes = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const verifData = await docsRes.json();
        setVerifications(verifData);
      }

      // 3. Fetch Categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleVerifyUser = async (userId, status) => {
    try {
      const res = await fetch(`/api/documents/verify-user/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        alert(`User status successfully updated to ${status}.`);
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_name: newCategoryName })
      });

      if (res.ok) {
        setNewCategoryName('');
        loadAdminData();
        alert('Category added successfully.');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Prepare chart data configurations
  const cityChartData = {
    labels: reportsData.city_trends.map(c => c.city || 'Unknown'),
    datasets: [
      {
        label: 'Donation listings count',
        data: reportsData.city_trends.map(c => c.donation_count),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      }
    ]
  };

  const roleChartData = {
    labels: reportsData.user_summary.map(u => u.role.toUpperCase()),
    datasets: [
      {
        data: reportsData.user_summary.map(u => u.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)', // Recipient - Blue
          'rgba(245, 158, 11, 0.6)',  // Donor - Orange
          'rgba(16, 185, 129, 0.6)'  // Admin - Emerald
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          font: { family: 'Inter' }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#a1a1aa' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#a1a1aa' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* Top statistics overview bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Meals Saved (Citywide)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'hsl(var(--primary))', marginTop: '4px' }}>
            {reportsData.impact_summary.estimated_people_fed}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Food waste successfully repurposed</div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tons of Waste Reduced (Kg)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'hsl(var(--secondary))', marginTop: '4px' }}>
            {reportsData.impact_summary.estimated_waste_reduced_kg} kg
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Rescued from municipal landfills</div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed Deliveries</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
            {reportsData.impact_summary.total_delivered_donations}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Individual donation collections logged</div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Verifications</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'hsl(var(--danger))', marginTop: '4px' }}>
            {verifications.filter(v => v.verification_status === 'pending').length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>NGO permit requests awaiting review</div>
        </div>

      </div>

      <div className="dashboard-grid">
        {/* Sidebar */}
        <aside className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Admin Dashboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Activity size={18} />
              Impact Analytics
            </button>
            <button 
              onClick={() => setActiveTab('verification')}
              className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <ShieldAlert size={18} />
              NGO Verifications
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <PlusCircle size={18} />
              Food Categories
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', minHeight: '400px' }}>
          
          {/* TAB 1: Analytical reports */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '25px' }}>Analytical Reports</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                
                {/* City wise trends */}
                <div className="glass-card" style={{ height: '340px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem' }}>City-wise Donation Trends</h4>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {reportsData.city_trends.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '100px' }}>No city logs recorded yet.</div>
                    ) : (
                      <Bar data={cityChartData} options={chartOptions} />
                    )}
                  </div>
                </div>

                {/* Role distribution */}
                <div className="glass-card" style={{ height: '340px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem' }}>User Role Distribution</h4>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {reportsData.user_summary.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '100px' }}>No user records.</div>
                    ) : (
                      <Pie 
                        data={roleChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: { color: '#fff', font: { family: 'Inter' } }
                            }
                          }
                        }} 
                      />
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: NGO verification files */}
          {activeTab === 'verification' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>NGO Verification Review</h2>
              
              {verifications.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No verification permits uploaded by NGOs.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px' }}>NGO Name / Contact</th>
                        <th style={{ padding: '12px' }}>Document Name</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map(ver => (
                        <tr key={ver.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ color: '#fff', fontWeight: '600' }}>{ver.organization_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ver.full_name} ({ver.email})</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <a 
                              href={`/${ver.document_url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--primary))', textDecoration: 'underline' }}
                            >
                              <FileText size={14} />
                              {ver.document_name}
                            </a>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge badge-${ver.verification_status}`}>{ver.verification_status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {ver.verification_status !== 'approved' && (
                              <button 
                                onClick={() => handleVerifyUser(ver.user_id, 'approved')}
                                className="btn btn-primary btn-sm"
                                style={{ marginRight: '8px' }}
                              >
                                Approve NGO
                              </button>
                            )}
                            {ver.verification_status !== 'rejected' && (
                              <button 
                                onClick={() => handleVerifyUser(ver.user_id, 'rejected')}
                                className="btn btn-danger btn-sm"
                              >
                                Reject
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

          {/* TAB 3: Category control */}
          {activeTab === 'categories' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px' }}>Manage Food Categories</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px', alignItems: 'flex-start' }}>
                {/* List categories */}
                <div className="glass-card">
                  <h4 style={{ color: '#fff', marginBottom: '16px' }}>Existing Categories</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {categories.map(cat => (
                      <span 
                        key={cat.id} 
                        className="badge badge-pending" 
                        style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', gap: '6px' }}
                      >
                        🏷️ {cat.category_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add new */}
                <div className="glass-card">
                  <h4 style={{ color: '#fff', marginBottom: '16px' }}>Add Category</h4>
                  <form onSubmit={handleAddCategory}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-category-input">Category Title</label>
                      <input 
                        id="new-category-input"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dairy / Bakery"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      Create Category
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default AdminDashboard;
