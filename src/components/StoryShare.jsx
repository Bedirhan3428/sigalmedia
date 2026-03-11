import React, { useRef, useState, useEffect } from 'react';
import { Share2, Download, X, Loader2, Link, Check, Instagram, Copy } from 'lucide-react';

// ─── Ana Paylaş Butonu: tek buton → bottom sheet menü ───────────────────────
export function LinkShare() { return null; } // geriye dönük uyumluluk için boş export

export default function StoryShare({ tweet }) {
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [storyOpen, setStoryOpen] = useState(false);
    const [copied,    setCopied]    = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [imageUrl,  setImageUrl]  = useState(null);
    const cardRef = useRef(null);

    // Dışarı tıklayınca menüyü kapat
    useEffect(() => {
        if (!menuOpen) return;
        const handler = () => setMenuOpen(false);
        setTimeout(() => document.addEventListener('click', handler), 10);
        return () => document.removeEventListener('click', handler);
    }, [menuOpen]);

    // ── Link kopyala / Web Share ──────────────────────────────────────────
    const handleLinkShare = async (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        const url = `https://sigalmedia.site/post-detail?id=${tweet._id}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Sigal Media', text: tweet.content?.slice(0, 80) || '', url });
                return;
            } catch {}
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    // ── Story modal aç ────────────────────────────────────────────────────
    const handleStoryOpen = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        setImageUrl(null);
        setStoryOpen(true);
    };

    // ── Story görseli oluştur ─────────────────────────────────────────────
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#09090b',
                scale:           3,
                useCORS:         true,
                allowTaint:      false,
                logging:         false,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);

            // Mobil: dosya paylaş
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(url)).blob();
                const file  = new File([blob], 'sigal-story.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Sigal Media' });
                    setLoading(false);
                    setStoryOpen(false);
                    return;
                }
            }
        } catch (err) {
            console.error('Story oluşturma hatası:', err);
        }
        setLoading(false);
    };

    const timeAgo = (date) => {
        const diff = (Date.now() - new Date(date)) / 1000;
        if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
        return `${Math.floor(diff / 3600)} sa önce`;
    };

    return (
        <>
            {/* ── Tek Paylaş Butonu ──────────────────────────────────────────── */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                    title="Paylaş"
                    style={{
                        display:     'flex',
                        alignItems:  'center',
                        gap:         '4px',
                        padding:     '5px 10px',
                        borderRadius:'999px',
                        background:  copied ? 'rgba(34,197,94,0.08)' : 'transparent',
                        border:      `1px solid ${copied ? '#22c55e' : menuOpen ? '#6366f1' : '#27272a'}`,
                        color:       copied ? '#22c55e' : menuOpen ? '#818cf8' : '#52525b',
                        fontSize:    '11px',
                        fontWeight:  600,
                        cursor:      'pointer',
                        transition:  'all 0.18s',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {copied ? <Check size={11} /> : <Share2 size={11} />}
                    {copied ? 'Kopyalandı!' : 'Paylaş'}
                </button>

                {/* ── Açılır Menü ──────────────────────────────────────────── */}
                {menuOpen && !copied && (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position:     'absolute',
                            bottom:       'calc(100% + 8px)',
                            left:         '50%',
                            transform:    'translateX(-50%)',
                            zIndex:       500,
                            background:   '#18181b',
                            border:       '1px solid #27272a',
                            borderRadius: '14px',
                            padding:      '6px',
                            minWidth:     '190px',
                            boxShadow:    '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                            animation:    'menuPop 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                    >
                        {/* Ok */}
                        <div style={{
                            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                            width: 10, height: 10, background: '#18181b',
                            border: '1px solid #27272a', borderTop: 'none', borderLeft: 'none',
                            transform: 'translateX(-50%) rotate(45deg)',
                        }} />

                        {/* Link Kopyala */}
                        <button
                            onClick={handleLinkShare}
                            style={{
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '10px',
                                width:        '100%',
                                padding:      '9px 12px',
                                borderRadius: '8px',
                                background:   'transparent',
                                border:       'none',
                                cursor:       'pointer',
                                color:        '#d4d4d8',
                                fontSize:     '12px',
                                fontWeight:   600,
                                textAlign:    'left',
                                transition:   'background 0.12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{
                                width: 28, height: 28, borderRadius: '8px',
                                background: 'rgba(99,102,241,0.12)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Link size={13} color="#818cf8" />
                            </span>
                            <div>
                                <p style={{ margin: 0, lineHeight: 1.3 }}>Link Kopyala</p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#52525b', fontWeight: 400 }}>
                                    sigalmedia.site'ye bağlantı
                                </p>
                            </div>
                        </button>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#27272a', margin: '4px 0' }} />

                        {/* Instagram Story */}
                        <button
                            onClick={handleStoryOpen}
                            style={{
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '10px',
                                width:        '100%',
                                padding:      '9px 12px',
                                borderRadius: '8px',
                                background:   'transparent',
                                border:       'none',
                                cursor:       'pointer',
                                color:        '#d4d4d8',
                                fontSize:     '12px',
                                fontWeight:   600,
                                textAlign:    'left',
                                transition:   'background 0.12s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(225,48,108,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={{
                                width: 28, height: 28, borderRadius: '8px',
                                background: 'rgba(225,48,108,0.1)',
                                border: '1px solid rgba(225,48,108,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {/* Instagram gradient icon */}
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="url(#igGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%"   stopColor="#f9ce34" />
                                            <stop offset="50%"  stopColor="#ee2a7b" />
                                            <stop offset="100%" stopColor="#6228d7" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                    <circle cx="12" cy="12" r="4"/>
                                    <circle cx="17.5" cy="6.5" r="1" fill="url(#igGrad)" stroke="none"/>
                                </svg>
                            </span>
                            <div>
                                <p style={{ margin: 0, lineHeight: 1.3 }}>Instagram Story</p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#52525b', fontWeight: 400 }}>
                                    görseli indir ve paylaş
                                </p>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Story Oluşturma Modalı ────────────────────────────────────── */}
            {storyOpen && (
                <div
                    onClick={() => setStoryOpen(false)}
                    style={{
                        position:       'fixed',
                        inset:           0,
                        zIndex:          9999,
                        background:     'rgba(0,0,0,0.85)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        padding:        '20px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width:         '100%',
                            maxWidth:      '340px',
                            background:    '#18181b',
                            border:        '1px solid #27272a',
                            borderRadius:  '18px',
                            overflow:      'hidden',
                            display:       'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'space-between',
                            padding:        '14px 16px',
                            borderBottom:   '1px solid #27272a',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                        <circle cx="12" cy="12" r="4"/>
                                        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                                    </svg>
                                </div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>
                                    Instagram Story
                                </p>
                            </div>
                            <button
                                onClick={() => setStoryOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 4 }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Gizli render alanı */}
                        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '390px' }}>
                            <div
                                ref={cardRef}
                                style={{
                                    width:      '390px',
                                    minHeight:  '200px',
                                    background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
                                    padding:    '28px 24px',
                                    fontFamily: "'Outfit', system-ui, sans-serif",
                                    position:   'relative',
                                    overflow:   'hidden',
                                }}
                            >
                                {/* Arka plan glow */}
                                <div style={{
                                    position: 'absolute', top: '-40px', right: '-40px',
                                    width: '200px', height: '200px', borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }} />

                                {/* Logo */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '8px',
                                        background: 'rgba(99,102,241,0.15)',
                                        border: '1px solid rgba(99,102,241,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em' }}>
                                        SİGAL MEDİA
                                    </span>
                                </div>

                                {tweet.content && (
                                    <p style={{
                                        fontSize: '16px', lineHeight: 1.55, color: '#f4f4f5',
                                        fontWeight: 500, marginBottom: '16px', wordBreak: 'break-word',
                                    }}>
                                        {tweet.content.length > 200 ? tweet.content.slice(0, 200) + '…' : tweet.content}
                                    </p>
                                )}

                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: '12px', paddingTop: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.07)',
                                }}>
                                    <span style={{ fontSize: '11px', color: '#52525b' }}>
                                        @{tweet.authorAvatar || 'anonim'} · {timeAgo(tweet.createdAt)}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#3f3f46', letterSpacing: '0.05em' }}>
                                        sigalmedia.site
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '16px' }}>
                            {imageUrl ? (
                                <>
                                    <img
                                        src={imageUrl}
                                        alt="Story önizleme"
                                        style={{ width: '100%', borderRadius: '10px', marginBottom: '12px' }}
                                    />
                                    <a
                                        href={imageUrl}
                                        download="sigal-story.png"
                                        style={{
                                            display:        'flex',
                                            alignItems:     'center',
                                            justifyContent: 'center',
                                            gap:            '6px',
                                            width:          '100%',
                                            padding:        '12px',
                                            borderRadius:   '10px',
                                            background:     'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)',
                                            color:          '#fff',
                                            fontSize:       '13px',
                                            fontWeight:     700,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <Download size={14} />
                                        Görseli İndir
                                    </a>
                                    <p style={{ fontSize: '11px', color: '#52525b', textAlign: 'center', marginTop: '8px' }}>
                                        İndirip Instagram Story'de paylaş
                                    </p>
                                </>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    style={{
                                        display:        'flex',
                                        alignItems:     'center',
                                        justifyContent: 'center',
                                        gap:            '6px',
                                        width:          '100%',
                                        padding:        '13px',
                                        borderRadius:   '10px',
                                        background:     'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)',
                                        color:          '#fff',
                                        border:         'none',
                                        fontSize:       '13px',
                                        fontWeight:     700,
                                        cursor:         loading ? 'not-allowed' : 'pointer',
                                        opacity:        loading ? 0.7 : 1,
                                    }}
                                >
                                    {loading
                                        ? <><Loader2 size={14} className="spin" /> Oluşturuluyor...</>
                                        : <><Share2 size={14} /> Story Oluştur</>
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes menuPop {
                    from { opacity: 0; transform: translateX(-50%) scale(0.92); }
                    to   { opacity: 1; transform: translateX(-50%) scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 0.7s linear infinite; }
            `}</style>
        </>
    );
}