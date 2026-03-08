import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { applyActionCode } from 'firebase/auth';

export default function VerifyHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Doğrulanıyor...');

  useEffect(() => {
    // URL'den Firebase'in gönderdiği doğrulama kodunu alıyoruz
    const oobCode = searchParams.get('oobCode');

    if (!oobCode) {
      setStatus('Geçersiz veya eksik doğrulama linki.');
      return;
    }

    // Kodu Firebase'e gönderip onaylıyoruz
    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus('Mail başarıyla doğrulandı! Yönlendiriliyorsun...');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((error) => {
        console.error(error);
        setStatus('Doğrulama başarısız oldu veya linkin süresi dolmuş.');
      });
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>
      <h2>{status}</h2>
    </div>
  );
}