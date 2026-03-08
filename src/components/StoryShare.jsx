import React, { useRef, useState } from 'react';
import { Share2, Download, X, Loader2 } from 'lucide-react';

/**
 * StoryShare — Tweet'i Instagram Story boyutunda görsel olarak export eder
 *
 * html2canvas ile tweet kartını PNG'e çevirir.
 * Mobilde native share API (Web Share API) varsa direkt paylaşır,
 * yoksa indirme linki sunar.
 *
 * Kullanım: <StoryShare tweet={tweet} />
 */
export default function StoryShare({ tweet }) {
    const [open,      setOpen]      = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [imageUrl,  setImageUrl]  = useState(null);
    const cardRef = useRef(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // html2canvas dinamik import (bundle'a sadece gerektiğinde girer)
            const { default: html2canvas } = await import('html2canvas');

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#09090b',
                scale:            3,           // Yüksek çözünürlük
                useCORS:          true,
                allowTaint:       false,
                logging:          false,
            });

            const url = canvas.toDataURL('image/png');
            setImageUrl(url);

            // Web Share API destekleniyorsa direkt paylaş
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(url)).blob();
                const file  = new File([blob], 'sigal-story.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Sigal Media',
                    });
                    setLoading(false);
                    setOpen(false);
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
            {/* Paylaş butonu */}
            <button
                onClick={() => { setOpen(true); setImageUrl(null); }}
                title="Instagram Story'de Paylaş"
                style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         '4px',
                    padding:     '5px 10px',
                    borderRadius:'999px',
                    background:  'transparent',
                    border:      '1px solid #27272a',
                    color:       '#52525b',
                    fontSize:    '11px',
                    fontWeight:  600,
                    cursor:      'pointer',
                    transition:  'all 0.18s',
                    WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#e1306c'; e.currentTarget.style.color='#e1306c'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#27272a'; e.currentTarget.style.color='#52525b'; }}
            >
                <Share2 size={11} />
                Story
            </button>

            {/* Modal */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position:   'fixed',
                        inset:       0,
                        zIndex:      9999,
                        background: 'rgba(0,0,0,0.85)',
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding:    '20px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width:        '100%',
                            maxWidth:     '340px',
                            background:   '#18181b',
                            border:       '1px solid #27272a',
                            borderRadius: '18px',
                            overflow:     'hidden',
                            display:      'flex',
                            flexDirection:'column',
                        }}
                    >
                        {/* Modal header */}
                        <div style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'space-between',
                            padding:        '14px 16px',
                            borderBottom:   '1px solid #27272a',
                        }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>
                                Instagram Story
                            </p>
                            <button
                                onClick={() => setOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 4 }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Render edilecek kart (gizli ama DOM'da) */}
                        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '390px' }}>
                            <div
                                ref={cardRef}
                                style={{
                                    width:           '390px',
                                    minHeight:       '200px',
                                    background:      'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
                                    padding:         '28px 24px',
                                    fontFamily:      "'Outfit', system-ui, sans-serif",
                                    position:        'relative',
                                    overflow:        'hidden',
                                }}
                            >
                                {/* Arkaplan glow */}
                                <div style={{
                                    position: 'absolute', top: '-40px', right: '-40px',
                                    width: '200px', height: '200px', borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }} />

                                {/* Aegis logo + brand */}
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

                                {/* İçerik */}
                                {tweet.content && (
                                    <p style={{
                                        fontSize: '16px', lineHeight: 1.55, color: '#f4f4f5',
                                        fontWeight: 500, marginBottom: '16px',
                                        wordBreak: 'break-word',
                                    }}>
                                        {tweet.content.length > 200 ? tweet.content.slice(0, 200) + '…' : tweet.content}
                                    </p>
                                )}

                                {/* Alt bilgi */}
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

                        {/* Önizleme veya Oluştur butonu */}
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
                                            background:     'linear-gradient(135deg, #e1306c, #833ab4)',
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
                                        display:         'flex',
                                        alignItems:      'center',
                                        justifyContent:  'center',
                                        gap:             '6px',
                                        width:           '100%',
                                        padding:         '13px',
                                        borderRadius:    '10px',
                                        background:      'linear-gradient(135deg, #e1306c, #833ab4)',
                                        color:           '#fff',
                                        border:          'none',
                                        fontSize:        '13px',
                                        fontWeight:      700,
                                        cursor:          loading ? 'not-allowed' : 'pointer',
                                        opacity:         loading ? 0.7 : 1,
                                    }}
                                >
                                    {loading ? <><Loader2 size={14} className="spin" /> Oluşturuluyor...</> : <><Share2 size={14} /> Story Oluştur</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}