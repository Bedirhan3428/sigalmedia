import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
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

            // PNG → JPEG'e çevir (şeffaflık giderse kabul edilebilir, çok daha küçük)
            const outMime = file.type === 'image/png' ? 'image/jpeg' : (file.type || 'image/jpeg');

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Canvas blob oluşturulamadı'));
                    const sizeKB = Math.round(blob.size / 1024);
                    console.log(`🗜️ ${Math.round(file.size/1024)}KB → ${sizeKB}KB (${outMime})`);
                    // base64 data URI olarak döndür
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
            _nsfwModel = await nsfwjs.load();
        }
        const img    = new Image();
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
        return { safe: true }; // Model yüklenemezse backend halleder
    }
}

// ─── Bileşen ──────────────────────────────────────────────────────────────
export default function Share() {
    const user     = useAuth();
    const navigate = useNavigate();

    const [content, setContent]   = useState('');
    const [preview, setPreview]   = useState(null);   // görüntüleme için URL
    const [imageData, setImageData] = useState(null); // { dataUri, sizeKB, origKB } — yükleme öncesi
    const [imageUrl, setImageUrl]   = useState(null); // Firebase Storage download URL
    const [imagePath, setImagePath] = useState(null); // Firebase Storage dosya yolu
    const [remaining, setRemaining] = useState(null);
    const [status, setStatus]     = useState({ type: '', msg: '' });
    const [phase, setPhase]       = useState('idle');
    // idle | compressing | nsfw-check | uploading | sending | done | error

    const fileRef = useRef();

    useEffect(() => {
        if (!user?.uid) return;
        fetch(`${API_URL}/api/user/${user.uid}`)
            .then(r => r.json())
            .then(d => setRemaining(d?.user?.dailyLimit ?? 3))
            .catch(() => {});
    }, [user]);

    // ─── Görsel seç ──────────────────────────────────────────────────
    const handleFileChange = async (e) => {
        const raw = e.target.files?.[0];
        if (!raw) return;

        if (raw.size > MAX_RAW_MB * 1024 * 1024) {
            setStatus({ type: 'error', msg: `Görsel çok büyük (maks. ${MAX_RAW_MB}MB).` });
            return;
        }

        setStatus({ type: '', msg: '' });
        setPreview(URL.createObjectURL(raw));
        setImageData(null);
        setImageUrl(null);

        // 1. Sıkıştır
        setPhase('compressing');
        let compressed;
        try {
            compressed = await compressImage(raw);
        } catch (err) {
            setStatus({ type: 'error', msg: `Sıkıştırma hatası: ${err.message}` });
            setPhase('error');
            clearImage();
            return;
        }

        // 2. nsfwjs ön denetim
        setPhase('nsfw-check');
        const check = await frontendNsfwCheck(raw);
        if (!check.safe) {
            clearImage();
            setStatus({ type: 'error', msg: `🚫 ${check.reason}` });
            setPhase('error');
            return;
        }

        // 3. Firebase Storage'a yükle
        setPhase('uploading');
        try {
            const res = await fetch(compressed.dataUri);
            const blob = await res.blob();
            const ext  = blob.type === 'image/png' ? 'png' : 'jpg';
            const path = `tweets/${user?.uid || 'anon'}/${Date.now()}.${ext}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob, { contentType: blob.type });
            const url = await getDownloadURL(storageRef);
            setImageUrl(url);
            setImagePath(path);
            setImageData({ sizeKB: compressed.sizeKB, origKB: Math.round(raw.size / 1024) });
            setPhase('idle');
        } catch (err) {
            clearImage();
            setStatus({ type: 'error', msg: `Görsel yüklenemedi: ${err.message}` });
            setPhase('error');
        }
    };

    const clearImage = () => {
        setImageData(null);
        setImageUrl(null);
        setImagePath(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    // ─── Gönder ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const hasText  = content.trim().length > 0;
        const hasImage = !!imageUrl;
        if (!hasText && !hasImage) return;
        if (phase !== 'idle') return;

        setStatus({ type: '', msg: '' });
        setPhase('sending');

        try {
            const res  = await fetch(`${API_URL}/api/tweet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: user.uid,
                    content:  hasText ? content.trim() : '',
                    imageUrl: hasImage ? imageUrl   : null,
                    imagePath: hasImage ? imagePath : null,
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

    // ─── UI ──────────────────────────────────────────────────────────
    const charCount = content.length;
    const charPct   = (charCount / MAX_CHARS) * 100;
    const charColor = charCount > 260 ? '#f43f5e' : charCount > 220 ? '#f97316' : '#6366f1';
    const isBusy    = ['compressing','nsfw-check','uploading','sending'].includes(phase);
    const canPost   = (content.trim() || imageUrl) && remaining !== 0 && !isBusy && phase !== 'done';

    const phaseLabel = {
        compressing:  '🗜️ Görsel sıkıştırılıyor...',
        'nsfw-check': '🔍 Ön güvenlik denetimi yapılıyor...',
        uploading:    '☁️ Görsel yükleniyor...',
        sending:      '🤖 Yapay zeka analiz ediyor ve gönderiliyor...',
    }[phase];

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
                        placeholder="Okulda ne oluyor? 👀"
                        value={content}
                        onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                        disabled={remaining === 0 || isBusy}
                        rows={4}
                    />

                    {preview && (
                        <div className="image-preview-wrap">
                            <img src={preview} alt="Önizleme" className="image-preview" />
                            {imageData && (
                                <div className="image-size-badge">
                                    {imageData.origKB !== imageData.sizeKB
                                        ? `${imageData.origKB}KB → ${imageData.sizeKB}KB ✓`
                                        : `${imageData.sizeKB}KB`}
                                </div>
                            )}
                            {!isBusy && (
                                <button className="image-remove-btn" onClick={clearImage}>
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
                </div>

                <div className="share-rules">
                    <div className="rule-row"><ShieldAlert size={13} color="#6366f1" />
                        <span>Görseller önce tarayıcıda sıkıştırılır, sonra 2 aşamalı YZ denetiminden geçer.</span>
                    </div>
                    <div className="rule-row"><ShieldAlert size={13} color="#f97316" />
                        <span>İnsan yüzü, çıplaklık, şiddet veya kişisel bilgi → otomatik reddedilir.</span>
                    </div>
                    <div className="rule-row"><ShieldAlert size={13} color="#f43f5e" />
                        <span>DM ss paylaşıyorsan <strong>isimleri karalayarak</strong> gönder (KVKK).</span>
                    </div>
                </div>
            </main>
            <Navbar />
        </div>
    );
}