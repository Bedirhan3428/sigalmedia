import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, User, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import '../styles/auth.css';
import { API_URL } from '../apiConfig';

// ─── Şifre kuralları ──────────────────────────────
const RULES = [
  { id: 'len',   label: 'En az 6 karakter',  test: (p) => p.length >= 6 },
  { id: 'upper', label: 'Büyük harf (A-Z)',   test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Küçük harf (a-z)',   test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Rakam (0-9)',         test: (p) => /[0-9]/.test(p) },
];

function PasswordRules({ password, touched }) {
  if (!touched) return null;
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '8px',
      padding: '10px 12px',
      marginTop: '-4px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      {RULES.map(rule => {
        const ok = rule.test(password);
        return (
          <div key={rule.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: ok ? '#34d399' : '#71717a',
            transition: 'color 0.2s',
          }}>
            <span style={{
              width: 16, height: 16,
              borderRadius: '50%',
              border: `1.5px solid ${ok ? '#34d399' : '#3f3f46'}`,
              backgroundColor: ok ? 'rgba(52,211,153,0.12)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
              fontSize: '9px',
            }}>
              {ok ? '✓' : ''}
            </span>
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Renkli Google SVG ikonu ──────────────────────
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function Register() {
  const [step, setStep]             = useState(1);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [password2, setPassword2]   = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showPass2, setShowPass2]   = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [username, setUsername]     = useState('');
  const [avatars, setAvatars]       = useState([]);
  const [selectedAv, setSelectedAv] = useState(null);
  const [status, setStatus]         = useState({ type: '', msg: '' });
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Onay kutuları
  const [checkTerms,   setCheckTerms]   = useState(false);
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [checkKvkk,    setCheckKvkk]    = useState(false);

  const navigate = useNavigate();

  const allRulesPass = RULES.every(r => r.test(password));
  const allChecked   = checkTerms && checkPrivacy && checkKvkk;

  useEffect(() => {
    fetch(`${API_URL}/api/avatars`)
      .then(r => r.json())
      .then(d => setAvatars(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const goToStep2 = (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (!username.trim() || username.trim().length < 2)
      return setStatus({ type: 'error', msg: 'Kullanıcı adı en az 2 karakter olmalı.' });
    if (username.trim().length > 30)
      return setStatus({ type: 'error', msg: 'Kullanıcı adı en fazla 30 karakter olabilir.' });
    if (!email || !password || !password2)
      return setStatus({ type: 'error', msg: 'Tüm alanları doldur.' });
    if (!allRulesPass)
      return setStatus({ type: 'error', msg: 'Şifren tüm güvenlik kurallarını karşılamalı.' });
    if (password !== password2)
      return setStatus({ type: 'error', msg: 'Şifreler eşleşmiyor.' });
    if (!allChecked)
      return setStatus({ type: 'error', msg: 'Devam etmek için tüm sözleşmeleri onaylamalısın.' });

    setStep(2);
  };

  const handleRegister = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      const res = await fetch(`${API_URL}/api/init-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:  userCredential.user.uid,
          username:  username.trim(),
          avatarUrl: selectedAv?.url || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || 'Kayıt başarısız.' });
        setStep(1);
        setLoading(false);
        return;
      }

      navigate('/verify-email');
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Bu mail kullanımda veya geçersiz.' });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!allChecked) {
      setStatus({ type: 'error', msg: 'Google ile devam etmek için tüm sözleşmeleri onaylamalısın.' });
      return;
    }
    setGoogleLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const res = await fetch(`${API_URL}/api/init-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:  user.uid,
          username:  user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'kullanici',
          avatarUrl: user.photoURL || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error || 'Google ile kayıt başarısız.' });
        setGoogleLoading(false);
        return;
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setStatus({ type: 'error', msg: 'Google girişi iptal edildi.' });
      } else {
        setStatus({ type: 'error', msg: 'Google ile giriş yapılamadı. Tekrar dene.' });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Şifre gücü rengi (progress bar için)
  const strengthScore = RULES.filter(r => r.test(password)).length;
  const strengthColor = ['#3f3f46', '#ef4444', '#f97316', '#eab308', '#22c55e'][strengthScore];
  const strengthLabel = ['', 'Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü'][strengthScore];

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: step === 2 ? 420 : 380 }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '4px', fontSize: '22px', fontWeight: 'bold' }}>
          {step === 1 ? "Lise Vitrini'ne Katıl" : 'Profil Görseli Seç'}
        </h2>
        <p style={{ color: '#71717a', textAlign: 'center', marginBottom: '20px', fontSize: '13px' }}>
          {step === 1 ? 'Bilgilerini gir' : 'İstersen atlayabilirsin'}
        </p>

        {/* Adım göstergesi */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              width: 28, height: 4, borderRadius: 2,
              backgroundColor: step >= n ? '#6366f1' : '#27272a',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>

        {status.msg && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '16px',
            fontSize: '13px', lineHeight: 1.45,
            color:           status.type === 'error' ? '#f87171' : '#34d399',
            backgroundColor: status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
            border: `1px solid ${status.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {status.msg}
          </div>
        )}

        {/* ── ADIM 1 ── */}
        {step === 1 && (
          <form onSubmit={goToStep2} noValidate>

            {/* Kullanıcı adı */}
            <div className="input-group">
              <User className="input-icon" size={17} />
              <input
                type="text"
                required
                className="auth-input"
                placeholder="Kullanıcı adı (örn: matikçiKral)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={30}
              />
            </div>

            {/* E-posta */}
            <div className="input-group">
              <Mail className="input-icon" size={17} />
              <input
                type="email"
                required
                className="auth-input"
                placeholder="ad.soyad@okul.edu.tr"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Şifre */}
            <div className="input-group" style={{ position: 'relative' }}>
              <Lock className="input-icon" size={17} />
              <input
                type={showPass ? 'text' : 'password'}
                required
                className="auth-input"
                placeholder="Şifre oluştur"
                value={password}
                onChange={e => { setPassword(e.target.value); setPassTouched(true); }}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={eyeBtnStyle}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Şifre gücü bar + kurallar */}
            {passTouched && password.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-6px', marginBottom: '8px' }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#27272a', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(strengthScore / 4) * 100}%`,
                      backgroundColor: strengthColor,
                      borderRadius: 2,
                      transition: 'width 0.3s, background-color 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColor, minWidth: 56, textAlign: 'right', fontWeight: 600 }}>
                    {strengthLabel}
                  </span>
                </div>
                <PasswordRules password={password} touched={passTouched} />
              </>
            )}

            {/* Şifre tekrar */}
            <div className="input-group" style={{ position: 'relative' }}>
              <Lock className="input-icon" size={17} />
              <input
                type={showPass2 ? 'text' : 'password'}
                required
                className="auth-input"
                placeholder="Şifreni tekrar gir"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                style={{
                  paddingRight: '40px',
                  borderColor: password2 && password !== password2 ? '#ef4444' : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass2(v => !v)}
                style={eyeBtnStyle}
                tabIndex={-1}
              >
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password2 && password !== password2 && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '-6px', marginBottom: '10px', marginLeft: '4px' }}>
                Şifreler eşleşmiyor
              </p>
            )}
            {password2 && password === password2 && password2.length > 0 && (
              <p style={{ color: '#34d399', fontSize: '12px', marginTop: '-6px', marginBottom: '10px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Şifreler eşleşiyor
              </p>
            )}

            {/* ── Onay Kutuları ── */}
            <div style={checkboxContainerStyle}>
              <CheckboxRow
                checked={checkTerms}
                onChange={setCheckTerms}
                to="/terms-of-service"
                linkLabel="Kullanım Koşulları"
                suffix="'nı okudum ve kabul ediyorum."
              />
              <CheckboxRow
                checked={checkPrivacy}
                onChange={setCheckPrivacy}
                to="/privacy-policy"
                linkLabel="Gizlilik Politikası"
                suffix="'nı okudum ve kabul ediyorum."
              />
              <CheckboxRow
                checked={checkKvkk}
                onChange={setCheckKvkk}
                to="/kvkk"
                linkLabel="KVKK Aydınlatma Metni"
                suffix="'ni okudum, verilerimin işlenmesine onay veriyorum."
              />
            </div>

            {!allChecked && (
              <button
                type="button"
                onClick={() => { setCheckTerms(true); setCheckPrivacy(true); setCheckKvkk(true); }}
                style={selectAllStyle}
              >
                Tümünü onayla
              </button>
            )}

            <button
              type="submit"
              className="auth-btn"
              style={{
                backgroundColor: (allChecked && allRulesPass) ? '#6366f1' : '#27272a',
                color:           (allChecked && allRulesPass) ? '#fff'    : '#52525b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginTop: '10px',
                cursor: (allChecked && allRulesPass) ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s, color 0.2s',
              }}
            >
              İleri <ChevronRight size={16} />
            </button>

            <div style={dividerStyle}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
              <span style={{ color: '#52525b', fontSize: '12px' }}>ya da</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a' }} />
            </div>

            {/* ── Google ile Kayıt Ol ── */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading}
              className="auth-btn"
              style={{
                ...googleBtnStyle,
                opacity: allChecked ? 1 : 0.45,
                cursor: allChecked ? 'pointer' : 'not-allowed',
              }}
            >
              {googleLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={spinnerStyle} /> Bağlanıyor...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                  <GoogleIcon size={18} />
                  Google ile Kayıt Ol
                </span>
              )}
            </button>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button type="button" className="auth-btn" style={{ ...secondaryBtnStyle, marginTop: '8px' }}>
                Hesabın var mı? Giriş Yap
              </button>
            </Link>
          </form>
        )}

        {/* ── ADIM 2 ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                border: '3px solid #6366f1',
                backgroundColor: '#18181b',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedAv
                  ? <img src={selectedAv.url} style={{ width: '100%', height: '100%' }} alt="pp" />
                  : <span style={{ color: '#52525b', fontSize: '24px', fontWeight: 700 }}>
                      {username.charAt(0).toUpperCase()}
                    </span>
                }
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
              gap: '10px',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px 2px',
              marginBottom: '16px',
            }}>
              {avatars.map(av => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAv(selectedAv?.id === av.id ? null : av)}
                  style={{
                    width: '100%', aspectRatio: '1/1', borderRadius: '50%',
                    border: selectedAv?.id === av.id ? '3px solid #6366f1' : '2px solid #27272a',
                    backgroundColor: '#18181b', padding: 0, cursor: 'pointer',
                    overflow: 'hidden', flexShrink: 0,
                    boxShadow: selectedAv?.id === av.id ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                >
                  <img src={av.url} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setStep(1); setStatus({ type: '', msg: '' }); }}
                className="auth-btn"
                style={{ backgroundColor: '#27272a', color: '#a1a1aa', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <ChevronLeft size={16} /> Geri
              </button>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="auth-btn"
                style={{ backgroundColor: '#6366f1', color: '#fff', flex: 2 }}
              >
                {loading ? 'Kaydediliyor...' : selectedAv ? 'Kayıt Ol 🎉' : 'Görselsiz Devam Et'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Küçük bileşen: onay satırı ──────────────────
function CheckboxRow({ checked, onChange, to, linkLabel, suffix }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, marginTop: 2, accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0 }}
      />
      <span style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5 }}>
        <Link to={to} target="_blank" style={legalLinkStyle}>{linkLabel}</Link>
        {suffix}
      </span>
    </label>
  );
}

// ─── Stiller ─────────────────────────────────────
const eyeBtnStyle = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: '#52525b', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: '4px',
  WebkitTapHighlightColor: 'transparent',
};

const checkboxContainerStyle = {
  background: '#18181b', border: '1px solid #27272a', borderRadius: '10px',
  padding: '12px 14px', marginTop: '10px', marginBottom: '4px',
  display: 'flex', flexDirection: 'column', gap: '10px',
};

const selectAllStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#52525b', fontSize: '11px', padding: '4px 2px',
  display: 'block', marginBottom: '2px',
  textDecoration: 'underline', textUnderlineOffset: '2px',
  fontFamily: 'inherit',
};

const dividerStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0',
};

const secondaryBtnStyle = {
  backgroundColor: 'transparent', color: '#a1a1aa',
  border: '1px solid #3f3f46', marginTop: 0,
};

const googleBtnStyle = {
  width: '100%',
  backgroundColor: '#18181b',
  color: '#e4e4e7',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s',
  marginTop: 0,
  fontFamily: 'inherit',
};

const spinnerStyle = {
  display: 'inline-block',
  width: 15,
  height: 15,
  border: '2px solid #3f3f46',
  borderTop: '2px solid #a1a1aa',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};

const legalLinkStyle = {
  color: '#818cf8', fontWeight: 600, textDecoration: 'none',
  borderBottom: '1px solid rgba(129,140,248,0.3)', paddingBottom: '1px',
};