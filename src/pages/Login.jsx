import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import '../styles/auth.css';
import { API_URL } from '../apiConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setError('Lütfen önce okul mailini onayla!');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/init-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: userCredential.user.uid }),
      });

      await response.json();
      // FIX: /vitrin yerine doğrudan / — ara redirect gereksizdi
      navigate('/');
    } catch (err) {
      console.error("❌ Hata oluştu:", err);
      setError('Mail veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '22px', marginBottom: '4px' }}>
          Lise Vitrini
        </h1>
        <p style={{ color: '#71717a', textAlign: 'center', marginBottom: '24px', fontSize: '13px' }}>
          Hesabına giriş yap
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '16px',
            fontSize: '13px', color: '#f87171', backgroundColor: '#450a0a',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <Mail className="input-icon" size={17} />
            <input
              className="auth-input"
              type="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" size={17} />
            <input
              className="auth-input"
              type="password"
              placeholder="Şifren"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            style={{ backgroundColor: '#6366f1', color: '#fff', marginTop: '8px' }}
          >
            {loading ? 'Bağlanıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
          <span style={{ color: '#52525b', fontSize: '12px' }}>ya da</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
        </div>

        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button
            className="auth-btn"
            style={{
              backgroundColor: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #3f3f46',
              marginTop: 0,
            }}
          >
            Hesabın yok mu? Kayıt Ol
          </button>
        </Link>
      </div>
    </div>
  );
}