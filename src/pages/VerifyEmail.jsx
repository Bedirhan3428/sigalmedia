import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { reload } from 'firebase/auth';
import { Mail, CheckCircle2, RefreshCw, LogIn } from 'lucide-react';
import '../styles/auth.css';
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight';


export default function VerifyEmail() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus]     = useState({ type: '', msg: '' });
  const navigate = useNavigate();

  const checkVerification = async () => {
    setChecking(true);
    setStatus({ type: '', msg: '' });
    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus({ type: 'error', msg: 'Oturum bulunamadı. Lütfen tekrar kayıt ol.' });
        setChecking(false);
        return;
      }

      // Firebase'den güncel durumu çek
      await reload(user);

      if (user.emailVerified) {
        setStatus({ type: 'success', msg: 'Mail doğrulandı! Giriş sayfasına yönlendiriliyorsun...' });
        setTimeout(() => navigate('/login'), 1800);
      } else {
        setStatus({ type: 'error', msg: 'Mail henüz doğrulanmamış. Gelen kutunu kontrol et.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Bir hata oluştu, tekrar dene.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: 360, textAlign: 'center' }}>

        {/* İkon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: '#1e1b4b',
          border: '2px solid #6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Mail size={28} color="#818cf8" />
        </div>

        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Mailini Doğrula
        </h2>
        <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '8px', lineHeight: 1.6 }}>
          Kayıt olduğun mail adresine bir doğrulama linki gönderdik.
        </p>
        <p style={{ color: '#52525b', fontSize: '12px', marginBottom: '24px' }}>
          Gelen kutunu <p style={{ fontWeight: 'bold', color: '#cacaca' }}>(ve spam klasörünü)</p> kontrol et, linke tıkladıktan sonra aşağıdaki butona bas.
        </p>

        {status.msg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '16px',
            fontSize: '13px', textAlign: 'left',
            color: status.type === 'error' ? '#f87171' : '#34d399',
            backgroundColor: status.type === 'error' ? '#450a0a' : '#064e3b',
          }}>
            {status.type === 'error'
              ? <Mail size={15} style={{ flexShrink: 0 }} />
              : <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            }
            {status.msg}
          </div>
        )}

        {/* Durumu Kontrol Et */}
        <button
          onClick={checkVerification}
          disabled={checking}
          className="auth-btn"
          style={{
            backgroundColor: '#6366f1', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {checking
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Kontrol ediliyor...</>
            : <><CheckCircle2 size={15} /> Doğrulamayı Kontrol Et</>
          }
        </button>

        {/* Giriş yap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
          <span style={{ color: '#52525b', fontSize: '12px' }}>ya da</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
        </div>

        <button
          onClick={() => navigate('/login')}
          className="auth-btn"
          style={{
            backgroundColor: 'transparent', color: '#a1a1aa',
            border: '1px solid #3f3f46', marginTop: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <LogIn size={15} /> Giriş Sayfasına Git
        </button>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
