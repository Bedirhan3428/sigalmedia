import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { API_URL } from '../apiConfig';

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// ─── Password strength rules ──────────────────────────────────────────────────
const RULES = [
  { id: 'len',   label: 'En az 6 karakter',  test: p => p.length >= 6 },
  { id: 'upper', label: 'Büyük harf (A-Z)',   test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Küçük harf (a-z)',   test: p => /[a-z]/.test(p) },
  { id: 'digit', label: 'Rakam (0-9)',         test: p => /[0-9]/.test(p) },
];

const LOGO = () => (
  <div className="auth-logo">
    <span>Şigal</span> Medya
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
export function Login() {
  const navigate = useNavigate();
  const [email,     setEmail]    = useState('');
  const [password,  setPassword] = useState('');
  const [showPass,  setShowPass] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,     setError]    = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await fetch(`${API_URL}/api/init-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: cred.user.uid }),
      });
      navigate('/');
    } catch {
      setError('E-posta veya şifre hatalı.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      await fetch(`${API_URL}/api/init-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:  cred.user.uid,
          username:  cred.user.displayName?.split(' ')[0] || 'kullanici',
          avatarUrl: cred.user.photoURL || null,
        }),
      });
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google ile giriş başarısız.');
      }
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="auth-page">
      <LOGO />

      <div className="auth-card">
        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="auth-input"
            type="email" placeholder="E-posta adresi" value={email}
            onChange={e => setEmail(e.target.value)} required
          />
          <div style={{ position: 'relative' }}>
            <input
              className="auth-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Şifre" value={password}
              onChange={e => setPassword(e.target.value)}
              required style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
              Şifreni mi unuttun?
            </Link>
          </div>

          <button type="submit" className="auth-btn auth-btn--primary" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="auth-divider">veya</div>

        <button className="auth-btn auth-btn--google" onClick={handleGoogle} disabled={googleLoading}>
          <GoogleIcon size={18} />
          {googleLoading ? 'Bağlanıyor...' : 'Google ile Devam Et'}
        </button>
      </div>

      <div className="auth-switch">
        Hesabın yok mu?{' '}
        <button className="auth-link" onClick={() => navigate('/register')}>
          Kayıt Ol
        </button>
      </div>

      {/* Footer links */}
      <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { to: '/privacy-policy',   label: 'Gizlilik' },
          { to: '/terms-of-service', label: 'Kullanım Koşulları' },
          { to: '/safety',           label: 'Aegis' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════════════════════
export function Register() {
  const navigate = useNavigate();

  const [step, setStep]             = useState(1); // 1 = form, 2 = agreements
  const [username,  setUsername]    = useState('');
  const [email,     setEmail]       = useState('');
  const [password,  setPassword]    = useState('');
  const [password2, setPassword2]   = useState('');
  const [showPass,  setShowPass]    = useState(false);
  const [showPass2, setShowPass2]   = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [checkTerms,   setCheckTerms]   = useState(false);
  const [checkPrivacy, setCheckPrivacy] = useState(false);
  const [checkKvkk,    setCheckKvkk]    = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,     setError]       = useState('');

  const allRules   = RULES.every(r => r.test(password));
  const allChecked = checkTerms && checkPrivacy && checkKvkk;
  const strengthScore = RULES.filter(r => r.test(password)).length;
  const strengthColor = ['#27272a','#FF3040','#FCAF45','#FCAF45','#1DB954'][strengthScore];

  const handleRegister = async () => {
    if (!allChecked) { setError('Tüm sözleşmeleri onaylamalısın.'); return; }
    if (!allRules)   { setError('Şifre kriterlerini karşılamalı.'); return; }
    if (password !== password2) { setError('Şifreler eşleşmiyor.'); return; }

    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Register via Resend (verification email)
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid:      cred.user.uid,
          email,
          username: username.trim(),
        }),
      });

      navigate('/verify-email');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta zaten kullanımda.');
      } else {
        setError('Kayıt başarısız. Tekrar dene.');
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!allChecked) { setError('Google ile devam etmek için sözleşmeleri onayla.'); return; }
    setGoogleLoading(true); setError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred     = await signInWithPopup(auth, provider);
      await fetch(`${API_URL}/api/init-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId:  cred.user.uid,
          username:  cred.user.displayName?.split(' ')[0] || 'kullanici',
          avatarUrl: cred.user.photoURL || null,
        }),
      });
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Google ile kayıt başarısız.');
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="auth-page">
      <LOGO />

      <div className="auth-card">
        <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 4 }}>
          Arkadaşlarının fotoğraf ve videolarını gör.
        </p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: step >= n ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="auth-input"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={e => setUsername(e.target.value.slice(0, 30))}
            />
            <input
              className="auth-input"
              type="email" placeholder="E-posta adresi"
              value={email} onChange={e => setEmail(e.target.value)}
            />

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <input
                className="auth-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Şifre oluştur" value={password}
                onChange={e => { setPassword(e.target.value); setPassTouched(true); }}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength */}
            {passTouched && password && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${strengthScore / 4 * 100}%`, background: strengthColor, transition: 'all 0.3s', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {RULES.map(rule => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ok ? '#1DB954' : 'var(--text-3)' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${ok ? '#1DB954' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {ok && <CheckCircle size={9} color="#1DB954" />}
                        </div>
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Password 2 */}
            <div style={{ position: 'relative' }}>
              <input
                className="auth-input"
                type={showPass2 ? 'text' : 'password'}
                placeholder="Şifreyi tekrar gir" value={password2}
                onChange={e => setPassword2(e.target.value)}
                style={{ paddingRight: 44, borderColor: password2 && password !== password2 ? 'var(--red)' : undefined }}
              />
              <button type="button" onClick={() => setShowPass2(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password2 && password !== password2 && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginTop: -4 }}>Şifreler eşleşmiyor</p>
            )}

            <button
              className="auth-btn auth-btn--primary"
              onClick={() => {
                if (!username.trim()) { setError('Kullanıcı adı gerekli.'); return; }
                if (!email)           { setError('E-posta gerekli.'); return; }
                if (!allRules)        { setError('Şifre kriterlerini karşıla.'); return; }
                if (password !== password2) { setError('Şifreler eşleşmiyor.'); return; }
                setError('');
                setStep(2);
              }}
            >
              İleri
            </button>

            <div className="auth-divider">veya</div>

            {/* Agreements first for Google */}
            {!allChecked && (
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                Google ile devam etmek için önce aşağıdaki sözleşmeleri onayla.
              </p>
            )}

            {/* Agreements inline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 8 }}>
              {[
                { key: 'terms',   checked: checkTerms,   set: setCheckTerms,   to: '/terms-of-service', label: 'Kullanım Koşulları' },
                { key: 'privacy', checked: checkPrivacy,  set: setCheckPrivacy, to: '/privacy-policy',   label: 'Gizlilik Politikası' },
                { key: 'kvkk',    checked: checkKvkk,    set: setCheckKvkk,    to: '/kvkk',             label: 'KVKK' },
              ].map(({ key, checked, set, to, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)}
                         style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    <Link to={to} target="_blank" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{label}</Link>
                    'nı okudum ve kabul ediyorum.
                  </span>
                </label>
              ))}
              {!allChecked && (
                <button onClick={() => { setCheckTerms(true); setCheckPrivacy(true); setCheckKvkk(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline', fontFamily: 'var(--font)' }}>
                  Tümünü onayla
                </button>
              )}
            </div>

            <button className="auth-btn auth-btn--google" onClick={handleGoogle} disabled={googleLoading || !allChecked}
                    style={{ opacity: allChecked ? 1 : 0.4 }}>
              <GoogleIcon size={18} />
              {googleLoading ? 'Bağlanıyor...' : 'Google ile Kayıt Ol'}
            </button>
          </div>
        ) : (
          // Step 2: agreements confirmation + register
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center' }}>
              Sözleşmeleri onaylayarak devam et.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: 'var(--surface-3)', borderRadius: 8 }}>
              {[
                { key: 'terms',   checked: checkTerms,   set: setCheckTerms,   to: '/terms-of-service', label: 'Kullanım Koşulları' },
                { key: 'privacy', checked: checkPrivacy,  set: setCheckPrivacy, to: '/privacy-policy',   label: 'Gizlilik Politikası' },
                { key: 'kvkk',    checked: checkKvkk,    set: setCheckKvkk,    to: '/kvkk',             label: 'KVKK' },
              ].map(({ key, checked, set, to, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)}
                         style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    <Link to={to} target="_blank" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{label}</Link>
                    'nı okudum ve kabul ediyorum.
                  </span>
                </label>
              ))}
              {!allChecked && (
                <button onClick={() => { setCheckTerms(true); setCheckPrivacy(true); setCheckKvkk(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline', fontFamily: 'var(--font)' }}>
                  Tümünü onayla
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 15, fontFamily: 'var(--font)' }}>
                Geri
              </button>
              <button className="auth-btn auth-btn--primary" style={{ flex: 2, marginTop: 0 }}
                      onClick={handleRegister} disabled={loading || !allChecked}>
                {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="auth-switch">
        Hesabın var mı?{' '}
        <button className="auth-link" onClick={() => navigate('/login')}>
          Giriş Yap
        </button>
      </div>
    </div>
  );
}
