import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const user = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to feed
  React.useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  if (user === undefined) {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', backgroundColor: '#000' 
      }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="landing-container">
      <div className="landing-glow" />
      
      <div className="landing-content">
        <header className="landing-header">
          <div className="ig-logo">
            <span>Şigal</span> Medya
          </div>
        </header>

        <main className="landing-hero">
          <h1 className="landing-title">
            Sosyal Medya Yönetiminde <br />
            <span>Yeni Nesil</span> Deneyim
          </h1>
          
          <p className="landing-subtitle">
            Sigal Media ile dijital dünyadaki varlığınızı tek bir platformdan yönetin. 
            İçeriklerinizi planlayın, takipçilerinizle etkileşime geçin ve 
            topluluğunuzu modern araçlarla büyütün.
          </p>

          <div className="landing-cta-group">
            <button 
              className="landing-btn-primary"
              onClick={() => navigate('/login')}
            >
              Hemen Başla
            </button>
            <button 
              className="landing-btn-secondary"
              onClick={() => navigate('/register')}
            >
              Hesap Oluştur
            </button>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="feature-icon">✨</div>
              <h3>Görsel Odaklı</h3>
              <p>Etkileyici tasarımıyla içeriklerinizi en iyi şekilde sergileyin.</p>
            </div>
            <div className="landing-feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Güvenli platform</h3>
              <p>Verileriniz ve hesaplarınız en üst düzeyde korunur.</p>
            </div>
            <div className="landing-feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Hızlı Erişim</h3>
              <p>Kesintisiz ve hızlı bir kullanıcı deneyimi yaşayın.</p>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <div className="footer-links">
            <Link to="/privacy-policy">Gizlilik Politikası</Link>
            <Link to="/terms-of-service">Kullanım Şartları</Link>
            <Link to="/safety">Güvenlik</Link>
          </div>
          <p>© 2026 Sigal Media. Tüm hakları saklıdır.</p>
        </footer>
      </div>
    </div>
  );
}
