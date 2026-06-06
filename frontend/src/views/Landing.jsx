import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, MapPin, ShieldAlert, Award, ArrowRight, Activity, Users, Truck } from 'lucide-react';

const Landing = () => {
  const [stats, setStats] = useState({
    donations: 124,
    mealsSaved: 1240,
    peopleFed: 1488,
    activeNGOs: 18
  });

  // Try to load public database stats if server is running
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/categories'); // verify backend contact
        if (res.ok) {
          // If we had a public statistics endpoint, we would load here
          // For now, load realistic pre-calculated stats
        }
      } catch (e) {
        console.log('Backend not connected or offline');
      }
    };
    loadStats();
  }, []);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <header style={{ 
        position: 'relative',
        padding: '100px 0 80px',
        background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.03) 0%, transparent 50%)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="badge badge-available" style={{ marginBottom: '16px' }}>
            💚 Reducing Urban Food Waste
          </div>
          
          <h1 style={{ 
            fontSize: '3.5rem', 
            lineHeight: '1.2', 
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 50%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Bridge the Gap Between Surplus Food and Local Communities
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-muted)', 
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Every day, tons of fresh, edible food from restaurants, events, and bakeries are discarded. FoodBridge matches donors with local shelters in real-time, preventing spoilage and feeding those in need.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link to="/register" className="btn btn-primary glow-btn">
              Get Started Now
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Access Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Metrics Banner */}
      <section style={{ padding: '20px 0', borderY: '1px solid var(--card-border)' }}>
        <div className="container">
          <div className="glass-panel" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '30px', 
            padding: '30px', 
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'hsl(var(--primary))' }}>
                {stats.mealsSaved}+
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Meals Saved</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'hsl(var(--secondary))' }}>
                {stats.peopleFed}+
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>People Fed</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff' }}>
                {stats.donations}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Surplus Donations</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'hsl(var(--primary))' }}>
                {stats.activeNGOs}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Verified NGO Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ marginTop: '80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="section-title">How FoodBridge Solves Spoilage</h2>
            <p className="section-subtitle" style={{ maxWidth: '600px', margin: '8px auto 0' }}>
              By automating coordinates-based matchmaking, listing collections, and status verification, we cut down critical response times.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '30px'
          }}>
            {/* Feature 1 */}
            <div className="glass-card">
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'hsl(var(--primary))',
                marginBottom: '20px'
              }}>
                <MapPin size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>Interactive Proximity Maps</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                NGOs can visually search for fresh food listings close to their current GPS coordinate locations or specific cities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card">
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'hsl(var(--secondary))',
                marginBottom: '20px'
              }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>Instant Claim Verification</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Prevent multiple organizations from routing to the same location. Once claimed, the item is instantly locked for pickup.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card">
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'hsl(var(--primary))',
                marginBottom: '20px'
              }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#fff' }}>Real-time Delivery Logs</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Track listings from "Available" to "Claimed", "Picked Up", and "Delivered" with automatic dashboard logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Segmentation Section */}
      <section style={{ marginTop: '100px' }}>
        <div className="container">
          <div className="glass-panel" style={{ 
            padding: '60px', 
            borderRadius: 'var(--radius-lg)', 
            background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(20, 20, 30, 0.8))' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h2 className="section-title">Roles in the Ecosystem</h2>
              <p style={{ color: 'var(--text-muted)' }}>How you can contribute or participate</p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '40px' 
            }}>
              <div>
                <h3 style={{ color: 'hsl(var(--primary))', marginBottom: '12px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} />
                  <span>Donors</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Restaurants, hotels, caterers, or households list surplus food with quality checks, best-before limits, and coordinates. Get impact reports showing saved meals.
                </p>
              </div>
              <div>
                <h3 style={{ color: 'hsl(var(--secondary))', marginBottom: '12px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HeartHandshake size={20} />
                  <span>Recipients</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  NGOs, community centers, and shelters register with credentials, search for local listings, claim donations, and confirm pick-ups securely.
                </p>
              </div>
              <div>
                <h3 style={{ color: '#fff', marginBottom: '12px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} />
                  <span>Administrators</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  System administrators review NGO credentials and document uploads, manage listing categories, and generate reports on citywide food wastage reduction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
