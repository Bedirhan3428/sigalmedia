import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff, AlertTriangle, Eye, EyeOff } from 'lucide-react';

/**
 * AegisBadge — Tweet üzerindeki Aegis durum göstergesi
 * Prop: status = 'active' | 'quarantine' | 'cleared' | 'removed'
 */
export function AegisBadge({ status }) {
    if (!status || status === 'active') return null;

    const configs = {
        quarantine: {
            icon:  <ShieldAlert size={11} />,
            label: 'Under Review',
            bg:    'rgba(245,158,11,0.12)',
            border:'rgba(245,158,11,0.3)',
            color: '#fbbf24',
        },
        cleared: {
            icon:  <ShieldCheck size={11} />,
            label: 'Verified by Aegis',
            bg:    'rgba(16,185,129,0.1)',
            border:'rgba(16,185,129,0.28)',
            color: '#34d399',
        },
        removed: {
            icon:  <ShieldOff size={11} />,
            label: 'Removed by Aegis',
            bg:    'rgba(244,63,94,0.1)',
            border:'rgba(244,63,94,0.28)',
            color: '#fb7185',
        },
    };

    const cfg = configs[status];
    if (!cfg) return null;

    return (
        <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '4px',
            padding:       '2px 7px',
            borderRadius:  '999px',
            fontSize:      '10px',
            fontWeight:    700,
            letterSpacing: '0.03em',
            background:    cfg.bg,
            border:        `1px solid ${cfg.border}`,
            color:         cfg.color,
            fontFamily:    "'DM Mono', monospace",
        }}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

/**
 * QuarantineOverlay — Karantinaya alınan tweetlerin üzerine gelen blur overlay
 * Kullanıcı "Yine de Gör" diyebilir (tercihe göre)
 */
export function QuarantineOverlay({ children, status, reportCount = 0 }) {
    const [revealed, setRevealed] = useState(false);

    if (status !== 'quarantine' || revealed) {
        return <>{children}</>;
    }

    return (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Blur katmanı */}
            <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                {children}
            </div>

            {/* Uyarı overlay */}
            <div style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '10px',
                background:     'rgba(9,9,11,0.72)',
                backdropFilter: 'blur(2px)',
                padding:        '20px',
                textAlign:      'center',
            }}>
                {/* Aegis Logo ikonu */}
                <div style={{
                    width:           44,
                    height:          44,
                    borderRadius:    '50%',
                    background:      'rgba(245,158,11,0.12)',
                    border:          '2px solid rgba(245,158,11,0.35)',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    animation:       'aegisPulse 2s ease-in-out infinite',
                }}>
                    <ShieldAlert size={22} color="#fbbf24" />
                </div>

                <div>
                    <p style={{
                        fontSize:    '11px',
                        fontWeight:  800,
                        color:       '#fbbf24',
                        letterSpacing:'0.08em',
                        textTransform:'uppercase',
                        fontFamily:  "'DM Mono', monospace",
                        marginBottom: '4px',
                    }}>
                        Aegis Military Audit
                    </p>
                    <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, maxWidth: '260px' }}>
                        This content is under Aegis Military Audit due to community reports
                    </p>
                    {reportCount > 0 && (
                        <p style={{
                            fontSize:   '10px',
                            color:      '#52525b',
                            marginTop:  '4px',
                            fontFamily: "'DM Mono', monospace",
                        }}>
                            {reportCount} community signal{reportCount > 1 ? 's' : ''} received
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setRevealed(true)}
                    style={{
                        display:         'flex',
                        alignItems:      'center',
                        gap:             '5px',
                        padding:         '6px 14px',
                        borderRadius:    '999px',
                        background:      'transparent',
                        border:          '1px solid #3f3f46',
                        color:           '#71717a',
                        fontSize:        '11px',
                        fontWeight:      600,
                        cursor:          'pointer',
                        transition:      'all 0.18s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#71717a'; }}
                >
                    <Eye size={11} /> View Anyway
                </button>
            </div>

            <style>{`
                @keyframes aegisPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
                    50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0.15); }
                }
            `}</style>
        </div>
    );
}