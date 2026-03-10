import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

export default function VerifyHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('İşlem kontrol ediliyor...');
  const [mode, setMode] = useState(null);
  const [oobCode, setOobCode] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Firebase'in gönderdiği action kodu ve işlem türünü (mode) alıyoruz
    const actionCode = searchParams.get('oobCode');
    const actionMode = searchParams.get('mode');

    if (!actionCode || !actionMode) {
      setStatus('Geçersiz veya eksik link.');
      return;
    }

    setOobCode(actionCode);
    setMode(actionMode);

    // İşlem türüne göre hem URL'i senin istediğin gibi değiştiriyoruz hem de fonksiyonu tetikliyoruz
    if (actionMode === 'verifyEmail') {
      window.location.hash = 'verifyemail';
      handleVerifyEmail(actionCode);
    } else if (actionMode === 'resetPassword') {
      window.location.hash = 'resetpassword';
      handleVerifyPasswordReset(actionCode);
    } else {
      setStatus('Geçersiz işlem türü.');
    }
  }, [searchParams, navigate]);

  // 1. E-posta Doğrulama İşlemi
  const handleVerifyEmail = (code) => {
    setStatus('Mail doğrulanıyor...');
    applyActionCode(auth, code)
      .then(() => {
        setStatus('Mail başarıyla doğrulandı! Yönlendiriliyorsun...');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((error) => {
        console.error(error);
        setStatus('Doğrulama başarısız oldu veya linkin süresi dolmuş.');
      });
  };

  // 2. Şifre Sıfırlama Kodunu Doğrulama (Formu göstermeden önce link geçerli mi diye bakıyoruz)
  const handleVerifyPasswordReset = (code) => {
    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setStatus(`Şifre sıfırlama: ${email}`);
      })
      .catch(() => {
        setStatus('Geçersiz veya süresi dolmuş şifre sıfırlama linki.');
        setMode(null); // Hata varsa formu gizle
      });
  };

  // 3. Yeni Şifreyi Kaydetme İşlemi
  const handlePasswordResetSubmit = (e) => {
    e.preventDefault();
    setStatus('Şifre güncelleniyor...');
    confirmPasswordReset(auth, oobCode, newPassword)
      .then(() => {
        setStatus('Şifren başarıyla güncellendi! Giriş yapabilirsin.');
        setTimeout(() => navigate('/login'), 2000); // İşlem bitince login sayfasına atıyoruz
      })
      .catch((error) => {
        console.error(error);
        setStatus('Şifre güncellenirken bir hata oluştu.');
      });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>
      <h2>{status}</h2>

      {/* Sadece mode 'resetPassword' ise ve link geçerliyse şifre formunu gösteriyoruz */}
      {mode === 'resetPassword' && (
        <form onSubmit={handlePasswordResetSubmit} style={{ marginTop: '20px' }}>
          <input
            type="password"
            placeholder="Yeni Şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ padding: '10px', marginRight: '10px', borderRadius: '5px' }}
          />
          <button type="submit" style={{ padding: '10px', cursor: 'pointer', borderRadius: '5px' }}>
            Şifreyi Güncelle
          </button>
        </form>
      )}
    </div>
  );
}