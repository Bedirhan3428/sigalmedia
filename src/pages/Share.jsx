import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X, AlertTriangle, CheckCircle, ShieldAlert, Shield, Dices } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import Navbar from '../components/Navbar';
import { API_URL } from '../apiConfig';

const MAX_CHARS      = 280;
const MAX_RAW_MB     = 10;
const TARGET_WIDTH   = 1080;
const TARGET_QUALITY = 0.78;

// ─── Dönen placeholder metinleri ─────────────────────────────────────────
const PLACEHOLDERS = [
    'Uzaktan kesişmekten yoruldum, bi adım at artık.',
    'Sence okuldaki platonik aşkım bana bakar mı, taktik?',
    'Kantinde sürekli göz göze geldiğimiz o kişi, instanı sal.',
    'Nöbetçiyken gördüğüm siyah kapüşonlu, vuruldum resmen.',
    'Okulun en toksik çifti net ayrılmalı artık, çok yordunuz.',
    'Yüzüme gülüp arkamdan sallayan o tayfa, her şeyi biliyorum :)',
    'Kantin fiyatları şaka mı, tost için kredi mi çekelim?',
    'Şu okulun internet şifresini bilen sevabına fısıldasın acil.',
    'Eski sevgiliyle aynı koridorda yürümek harbiden büyük eziyet.',
    'Sırf o kişiyle karşılaşmamak için yolumu uzatıyorum, net.',
    'Sınavlardan çok bu okulun dedikodusu yordu beni yeminle.',
    'Koridorda sürekli bağırarak konuşan o tayfa, başımız ağrıyor.',
    'Admin bu kadar sırrı nasıl tutuyon, ben olsam patlardım.',
];

function randomPlaceholder(current) {
    const others = PLACEHOLDERS.filter(p => p !== current);
    return others[Math.floor(Math.random() * others.length)];
}

// ─── Canvas sıkıştırma ────────────────────────────────────────────────────
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img     = new Image();
        const blobUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            let { width, height } = img;
            if (width > TARGET_WIDTH) {
                height = Math.round((height * TARGET_WIDTH) / width);
                width  = TARGET_WIDTH;
            }
            const canvas = document.createElement('canvas');
            canvas.width  = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            const outMime = file.type === 'image/png' ? 'image/jpeg' : (file.type || 'image/jpeg');
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Canvas blob oluşturulamadı'));
                    const sizeKB = Math.round(blob.size / 1024);
                    const reader = new FileReader();
                    reader.onload  = () => resolve({ dataUri: reader.result, sizeKB, mime: outMime });
                    reader.onerror = () => reject(new Error('FileReader hatası'));
                    reader.readAsDataURL(blob);
                },
                outMime,
                TARGET_QUALITY
            );
        };
        img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Görsel yüklenemedi')); };
        img.src = blobUrl;
    });
}

// ─── nsfwjs ön denetim ────────────────────────────────────────────────────
let _nsfwModel = null;
async function frontendNsfwCheck(file) {
    try {
        if (!_nsfwModel) {
            await import('@tensorflow/tfjs');
            const nsfwjs = await import('nsfwjs');
            _nsfwModel = await nsfwjs.load(
  'https://s3.amazonaws.com/ir_public/nsfwjscdn/model/',
  { type: 'graph' }
);
        }
        const img     = new Image();
        const blobUrl = URL.createObjectURL(file);
        img.src = blobUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        URL.revokeObjectURL(blobUrl);
        const preds = await _nsfwModel.classify(img);
        const bad   = preds.find(p =>
            (p.className === 'Porn'   && p.probability > 0.6) ||
            (p.className === 'Hentai' && p.probability > 0.7) ||
            (p.className === 'Sexy'   && p.probability > 0.8)
        );
        return bad
            ? { safe: false, reason: `Ön denetim: uygunsuz içerik (${bad.className} ${(bad.probability*100).toFixed(0)}%)` }
            : { safe: true };
    } catch {
        return { safe: true };
    }
}

// ─── Bileşen ──────────────────────────────────────────────────────────────
export default function Share() {
    const user     = useAuth();
    const navigate = useNavigate();

    const [content,      setContent]      = useState('');
    const [placeholder,  setPlaceholder]  = useState(PLACEHOLDERS[0]);
    const [preview,      setPreview]      = useState(null);
    const [imageData,    setImageData]    = useState(null);
    const [imageUrl,     setImageUrl]     = useState(null);
    const [imagePath,    setImagePath]    = useState(null);
    const [remaining,    setRemaining]    = useState(null);
    const [status,       setStatus]       = useState({ type: '', msg: '' });
    const [phase,        setPhase]        = useState('idle');
    const [diceSpin,     setDiceSpin]     = useState(false);

    const fileRef = useRef();

    // Placeholder her 3 saniyede bir döner (textarea boşken)
    useEffect(() => {
        if (content.trim()) return; // yazı varken döndürme
        const id = setInterval(() => {
            setPlaceholder(prev => randomPlaceholder(prev));
        }, 3000);
        return () => clearInterval(id);
    }, [content]);

    useEffect(() => {
        if (!user?.uid) return;
        fetch(`${API_URL}/api/user/${user.uid}`)
            .then(r => r.json())
            .then(d => setRemaining(d?.user?.dailyLimit ?? 3))
            .catch(() => {});
    }, [user]);

    // ─── Zar: rastgele placeholder'ı inputa yaz ───────────────────────
    const handleDice = () => {
        if (remaining === 0 || isBusy) return;
        setDiceSpin(true);
        setTimeout(() => setDiceSpin(false), 500);
        const picked = randomPlaceholder(content);
        setContent(picked.slice(0, MAX_CHARS));
    };

    // ─── Görsel seç & sıkıştır & yükle ──────────────────────────────
    const handleFileChange = async (e) => {
        const raw = e.target.files?.[0];
        if (!raw) return;

        if (raw.size > MAX_RAW_MB * 1024 * 1024) {
            setStatus({ type: 'error', msg: `Görsel çok büyük (maks. ${MAX_RAW_MB}MB).` });
            return;
        }

        const blobPreview = URL.createObjectURL(raw);
        setPreview(blobPreview);
        setImageData(null);
        setImageUrl(null);
        setImagePath(null);
        setStatus({ type: '', msg: '' });

        setPhase('compressing');
        let compressed;
        try {
            compressed = await compressImage(raw);
        } catch (err) {
            clearImage(blobPreview);
            setStatus({ type: 'error', msg: `Sıkıştırma hatası: ${err.message}` });
            setPhase('idle');
            return;
        }

        setPhase('nsfw-check');
        const check = await frontendNsfwCheck(raw);
        if (!check.safe) {
            clearImage(blobPreview);
            setStatus({ type: 'error', msg: `🚫 ${check.reason}` });
            setPhase('idle');
            return;
        }

        setPhase('uploading');
        try {
            const fetchRes = await fetch(compressed.dataUri);
            const blob     = await fetchRes.blob();
            const ext      = blob.type === 'image/png' ? 'png' : 'jpg';
            const path     = `tweets/${user?.uid || 'anon'}/${Date.now()}.${ext}`;
            const storRef  = ref(storage, path);
            await uploadBytes(storRef, blob, { contentType: blob.type });
            const url = await getDownloadURL(storRef);
            setImageUrl(url);
            setImagePath(path);
            setImageData({ sizeKB: compressed.sizeKB, origKB: Math.round(raw.size / 1024) });
            setPhase('idle');
        } catch (err) {
            clearImage(blobPreview);
            setStatus({ type: 'error', msg: `Görsel yüklenemedi: ${err.message}` });
            setPhase('idle');
        }
    };

    const clearImage = (blobUrl) => {
        const urlToRevoke = blobUrl || preview;
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        setPreview(null);
        setImageData(null);
        setImageUrl(null);
        setImagePath(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    // ─── Tweet gönder ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!user?.uid || phase !== 'idle') return;
        const hasText  = content.trim().length > 0;
        const hasImage = !!imageUrl;
        if (!hasText && !hasImage) return;

        setStatus({ type: '', msg: '' });
        setPhase('sending');

        try {
            const res  = await fetch(`${API_URL}/api/tweet`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    deviceId:  user.uid,
                    content:   hasText  ? content.trim() : '',
                    imageUrl:  hasImage ? imageUrl       : null,
                    imagePath: hasImage ? imagePath      : null,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus({ type: 'error', msg: data.error || 'Bir hata oluştu.' });
                setPhase('error');
            } else {
                setStatus({ type: 'success', msg: '🎉 Tweet gönderildi!' });
                setContent('');
                clearImage();
                setRemaining(data.remainingLimit);
                setPhase('done');
                setTimeout(() => navigate('/'), 1400);
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Sunucuya ulaşılamadı.' });
            setPhase('error');
        }
    };

    // ─── UI Hesapları ─────────────────────────────────────────────────
    const charCount = content.length;
    const charPct   = (charCount / MAX_CHARS) * 100;
    const charColor = charCount > 260 ? '#f43f5e' : charCount > 220 ? '#f97316' : '#6366f1';
    const isBusy    = ['compressing', 'nsfw-check', 'uploading', 'sending'].includes(phase);
    const canPost   = (content.trim() || imageUrl) && remaining !== 0 && !isBusy && phase !== 'done';

    const phaseLabel = {
        compressing:  '🗜️ Görsel sıkıştırılıyor...',
        'nsfw-check': '🔍 Ön güvenlik denetimi...',
        uploading:    '☁️ Görsel yükleniyor...',
        sending:      '🤖 Aegis analiz ediyor...',
    }[phase] || null;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Paylaş</h1>
                {remaining !== null && (
                    <span className={`limit-badge ${remaining === 0 ? 'limit-badge--empty' : ''}`}>
                        {remaining}/3 hak kaldı
                    </span>
                )}
            </header>

            <main style={{ padding: '1rem' }}>
                {remaining === 0 && (
                    <div className="alert alert--warn">
                        <AlertTriangle size={16} />
                        Bugünlük 3 tweet hakkın doldu. Yarın tekrar gel!
                    </div>
                )}

                {status.msg && (
                    <div className={`alert ${status.type === 'error' ? 'alert--error' : 'alert--success'}`}>
                        {status.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                        {status.msg}
                    </div>
                )}

                {phaseLabel && (
                    <div className="alert alert--checking">
                        <span className="spinner-sm" style={{ borderTopColor: '#6366f1', borderColor: '#3730a3' }} />
                        {phaseLabel}
                    </div>
                )}

                <div className="share-box">
                    <textarea
                        className="share-textarea"
                        placeholder={placeholder}
                        value={content}
                        onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                        disabled={remaining === 0 || isBusy}
                        rows={4}
                    />

                    {/* ── Görsel önizleme ── */}
                    {preview && (
                        <div className="image-preview-wrap" style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                            <img
                                src={preview}
                                alt="Önizleme"
                                className="image-preview"
                                style={{ display: 'block', width: '100%', maxHeight: '320px', objectFit: 'cover' }}
                            />

                            {/* Aegis Badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '5px', padding: '5px 0',
                                background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(6px)',
                                borderTop: '1px solid rgba(99,102,241,0.15)',
                            }}>
                                <Shield size={9} color="#818cf8" />
                                <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#818cf8', letterSpacing: '0.1em', fontWeight: 500 }}>
                                    reviewed by aegis · sigal media
                                </span>
                            </div>

                            {imageData && (
                                <div className="image-size-badge">
                                    {imageData.origKB !== imageData.sizeKB
                                        ? `${imageData.origKB}KB → ${imageData.sizeKB}KB ✓`
                                        : `${imageData.sizeKB}KB`}
                                </div>
                            )}
                            {!isBusy && (
                                <button className="image-remove-btn" onClick={() => clearImage()}>
                                    <X size={14} />
                                </button>
                            )}
                            {isBusy && (
                                <div className="image-checking-overlay">
                                    <span className="spinner-sm" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="share-footer">
                        {/* Görsel ekle */}
                        <button
                            className="image-add-btn"
                            onClick={() => fileRef.current?.click()}
                            disabled={!!imageUrl || remaining === 0 || isBusy}
                            title="Görsel ekle"
                        >
                            <ImagePlus size={18} />
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        {/* 🎲 Zar butonu */}
                        <button
                            onClick={handleDice}
                            disabled={remaining === 0 || isBusy}
                            title="Rastgele ilham al"
                            style={{
                                display:         'flex',
                                alignItems:      'center',
                                justifyContent:  'center',
                                width:           34,
                                height:          34,
                                borderRadius:    '9px',
                                background:      'rgba(99,102,241,0.08)',
                                border:          '1px solid rgba(99,102,241,0.2)',
                                cursor:          remaining === 0 || isBusy ? 'not-allowed' : 'pointer',
                                color:           '#818cf8',
                                flexShrink:      0,
                                transition:      'all 0.15s',
                                transform:       diceSpin ? 'rotate(180deg) scale(1.15)' : 'rotate(0deg) scale(1)',
                            }}
                        >
                            <Dices size={16} />
                        </button>

                        {/* Karakter sayacı */}
                        <svg width="28" height="28" viewBox="0 0 28 28" style={{ marginLeft: 'auto' }}>
                            <circle cx="14" cy="14" r="11" fill="none" stroke="#27272a" strokeWidth="3" />
                            <circle
                                cx="14" cy="14" r="11" fill="none"
                                stroke={charColor} strokeWidth="3"
                                strokeDasharray={`${2 * Math.PI * 11}`}
                                strokeDashoffset={`${2 * Math.PI * 11 * (1 - charPct / 100)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 14 14)"
                                style={{ transition: 'stroke-dashoffset 0.2s, stroke 0.2s' }}
                            />
                            {charCount > 220 && (
                                <text x="14" y="18" textAnchor="middle" fontSize="7" fill={charColor} fontWeight="bold">
                                    {MAX_CHARS - charCount}
                                </text>
                            )}
                        </svg>

                        <button className="send-btn" onClick={handleSubmit} disabled={!canPost}>
                            {isBusy ? <span className="spinner-sm" /> : <><Send size={16} />Paylaş</>}
                        </button>
                    </div>

                    {/* Aegis imzası */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '5px', paddingTop: '10px',
                        borderTop: '1px solid rgba(99,102,241,0.1)', marginTop: '10px',
                    }}>
                        <Shield size={10} color="#6366f140" />
                        <span style={{ fontSize: '9.5px', fontFamily: "'DM Mono', monospace", color: '#6366f155', letterSpacing: '0.08em' }}>
                            protected by aegis · sigal media content shield
                        </span>
                    </div>
                </div>

                <div className="share-rules">
                    <div className="rule-row">
                        <ShieldAlert size={13} color="#6366f1" />
                        <span>Paylaşımlar Aegis YZ denetiminden geçer.</span>
                    </div>
                    <div className="rule-row">
                        <ShieldAlert size={13} color="#f97316" />
                        <span>Çıplaklık, şiddet veya kişisel bilgi → otomatik reddedilir.</span>
                    </div>
                    <div className="rule-row">
                        <ShieldAlert size={13} color="#f43f5e" />
                        <span>DM ss paylaşıyorsan <strong>isimleri karalayarak</strong> gönder (KVKK).</span>
                    </div>
                </div>
            </main>

            <Navbar />
        </div>
    );
}