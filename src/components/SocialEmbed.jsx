import React from 'react';
import { Instagram, Youtube, ExternalLink, Play } from 'lucide-react';

// TikTok için Lucide'da ikon yok, SVG kullanıyoruz
function TikTokIcon({ size = 14, color = 'currentColor' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.99a8.21 8.21 0 0 0 4.79 1.52V7.07a4.85 4.85 0 0 1-1.03-.38z"/>
        </svg>
    );
}

const PLATFORM_CONFIG = {
    instagram: {
        label:   'Instagram',
        color:   '#e1306c',
        bg:      'rgba(225,48,108,0.08)',
        border:  'rgba(225,48,108,0.2)',
        Icon:    Instagram,
    },
    tiktok: {
        label:   'TikTok',
        color:   '#ff0050',
        bg:      'rgba(255,0,80,0.08)',
        border:  'rgba(255,0,80,0.2)',
        Icon:    TikTokIcon,
    },
    youtube: {
        label:   'YouTube',
        color:   '#ff0000',
        bg:      'rgba(255,0,0,0.08)',
        border:  'rgba(255,0,0,0.2)',
        Icon:    Youtube,
    },
    twitter: {
        label:   'X / Twitter',
        color:   '#e7e9ea',
        bg:      'rgba(231,233,234,0.06)',
        border:  'rgba(231,233,234,0.15)',
        Icon:    ({ size }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.741-8.855L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        ),
    },
};

/**
 * SocialEmbed — tweet.socialEmbed objesinden gelen platform önizleme kartı
 * Props: embed = { platform, originalUrl, title, description, thumbnailUrl }
 */
export default function SocialEmbed({ embed }) {
    if (!embed?.platform || !embed?.originalUrl) return null;

    const cfg = PLATFORM_CONFIG[embed.platform];
    if (!cfg) return null;

    const { Icon } = cfg;

    return (
        <a
            href={embed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display:         'block',
                marginTop:       '10px',
                borderRadius:    '12px',
                overflow:        'hidden',
                border:          `1px solid ${cfg.border}`,
                background:      cfg.bg,
                textDecoration:  'none',
                transition:      'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform  = 'scale(1.01)';
                e.currentTarget.style.boxShadow  = `0 4px 20px ${cfg.bg}`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform  = 'scale(1)';
                e.currentTarget.style.boxShadow  = 'none';
            }}
        >
            {/* Thumbnail */}
            {embed.thumbnailUrl && (
                <div style={{ position: 'relative', width: '100%', height: '160px', background: '#18181b' }}>
                    <img
                        src={embed.thumbnailUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.85 }}
                    />
                    {/* Oynat butonu overlay */}
                    <div style={{
                        position:       'absolute',
                        inset:          0,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            width:          44,
                            height:         44,
                            borderRadius:   '50%',
                            background:     'rgba(0,0,0,0.65)',
                            border:         `2px solid ${cfg.color}`,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                        }}>
                            <Play size={18} color={cfg.color} fill={cfg.color} />
                        </div>
                    </div>
                </div>
            )}

            {/* Meta bilgi */}
            <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '8px',
                padding:    '10px 12px',
            }}>
                <div style={{
                    width:          28,
                    height:         28,
                    borderRadius:   '6px',
                    background:     `rgba(0,0,0,0.3)`,
                    border:         `1px solid ${cfg.border}`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                    color:          cfg.color,
                }}>
                    <Icon size={14} color={cfg.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {embed.title && (
                        <p style={{
                            fontSize:     '12px',
                            fontWeight:   600,
                            color:        '#e4e4e7',
                            margin:       0,
                            whiteSpace:   'nowrap',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {embed.title}
                        </p>
                    )}
                    <p style={{
                        fontSize:   '11px',
                        color:      '#52525b',
                        margin:     0,
                        marginTop:  embed.title ? '2px' : 0,
                    }}>
                        {cfg.label}
                    </p>
                </div>

                <ExternalLink size={12} color="#52525b" style={{ flexShrink: 0 }} />
            </div>
        </a>
    );
}