import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, Radar, Users, Sword,
    CheckCircle, XCircle, Lock, Eye,
    ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Static Aegis v3 Data ──────────────────────────────────────────────────
const AEGIS_DATA = {
    title: "AEGIS: Dijital Zırh Protokolü",
    subtitle: "Sigal Media Topluluk Savunma Sistemi",
    lastUpdated: "2026",
    layers: [
        {
            id: 1,
            name: "Sentinel Scan",
            trigger: "PAYLAŞ butonuna basıldığı an",
            description:
                "Sen \"Paylaş\" butonuna bastığın an milisaniyeler içinde devreye girer. Metni sadece kelime bazlı değil, bağlam (context) olarak analiz eder — şakayla hakaret arasındaki farkı ayırt eder. Uygunsuz içeriği daha veri tabanına ulaşmadan karantinaya alır.",
            blocks: [
                "Nefret söylemi ve hedefli hakaretler",
                "Kişisel bilgi ifşası (doxxing)",
                "Açık tehdit ve yıldırma girişimleri",
            ],
            doesNotBlock: [
                "Bağlamsal eleştiri ve sağlıklı tartışma",
                "Kara mizah — şakayla hakaret ayrımı korunur",
                "Akademik / bilgilendirici içerik",
            ],
        },
        {
            id: 2,
            name: "Neural Pool",
            trigger: "YORUM AKIŞI sürekli tarama",
            description:
                "Sadece paylaşımları değil, tüm yorum akışını 7/24 tarar. Tartışmanın alevlendiği veya toksikleştiği anları tespit ederek \"Aegis Onaylı\" güvenli limanlar oluşturur. Agresifleşen içerikleri otomatik olarak gizler ve topluluğun huzurunu korur.",
            blocks: [
                "Koordineli mobbing dizileri",
                "Giderek tırmanan agresif yorum zincirleri",
                "Toksik iğneleme ve duygusal manipülasyon",
            ],
            doesNotBlock: [
                "Farklı görüşlerin saygılı ifadesi",
                "Sert ama yapıcı geri bildirimler",
                "Hızlı ve yüksek hacimli tartışmalar",
            ],
        },
        {
            id: 3,
            name: "Military Audit",
            trigger: "ŞÜPHELİ DURUM veya yoğun raporlama",
            description:
                "Sistemin en üst düzey analiz modudur. Şüpheli bir durum veya yoğun raporlama olduğunda tetiklenir. Bir içeriğin topluluk standartlarına uygunluğunu en ince ayrıntısına kadar denetler ve gerekirse \"Cihaz Parmak İzi\" üzerinden ihlal yapan erişimi kısıtlar.",
            verdicts: {
                safe: {
                    icon: "✅",
                    label: "CLEARED",
                    outcome:
                        "İçerik topluluk standartlarını karşılar. Hiçbir kısıtlama uygulanmaz, tam görünürlük korunur.",
                },
                flagged: {
                    icon: "🚫",
                    label: "RESTRICTED",
                    outcome:
                        "Cihaz Parmak İzi kaydedilir, erişim kısıtlanır. Kimlik ifşa edilmeksizin ihlal kayıt altına alınır.",
                },
            },
            note: "Military Audit yalnızca ciddi vakalarda devreye girer; sıradan içerikler bu aşamaya ulaşmaz.",
        },
    ],
    anonymity: {
        title: "Anonimlik Kalkanı",
        body: "Aegis seni korurken kim olduğunu sormaz. Kimliğin yalnızca sunucularımızda saklanan şifrelenmiş bir cihaz izidir — isim yok, e-posta yok. Aegis bir içeriği engellediğinde bile gerçek kimliğini kimse (biz dahil) göremez. Sen sadece bir GHOST veya SENTINEL'sin.",
    },
    rbac: {
        title: "TOPLULUK ROLLERİ",
        roles: [
            {
                name: "GHOST",
                description:
                    "Varsayılan anonim kullanıcı. Kimliğin tamamen gizlidir; içeriklerine yalnızca Aegis erişebilir, insan moderatörler göremez.",
            },
            {
                name: "SENTINEL",
                description:
                    "Güvenilir topluluk üyesi. Raporlama yetkisi genişletilmiş, içerikleri Aegis kuyruğunda öncelikli incelenir.",
            },
            {
                name: "WARDEN",
                description:
                    "Kıdemli moderatör. Military Audit sonuçlarını inceleme ve itiraz süreçlerini yönetme yetkisine sahiptir.",
            },
        ],
    },
    contact: {
        title: "Güvenlik İhlali mi Bildirmek İstiyorsun?",
        body: "Aegis'in gözden kaçırdığını düşündüğün bir durum varsa topluluk raporlama kanalını kullanabilirsin. Her rapor Military Audit modunu tetikler ve 24 saat içinde sonuçlandırılır. Kimliğin her aşamada korunur.",
    },
};

// ─── Layer Card ────────────────────────────────────────────────────────────
function LayerCard({ layer, index }) {
    const [expanded, setExpanded] = useState(false);

    const icons    = [<Radar size={22} />, <Users size={22} />, <Sword size={22} />];
    const colors   = ['#818cf8', '#fbbf24', '#f43f5e'];
    const bgColors = ['rgba(99,102,241,0.08)', 'rgba(245,158,11,0.08)', 'rgba(244,63,94,0.08)'];
    const borders  = ['rgba(99,102,241,0.2)',  'rgba(245,158,11,0.2)',  'rgba(244,63,94,0.2)'];

    const color  = colors[index];
    const bg     = bgColors[index];
    const border = borders[index];

    return (
        <div style={{
            border:       `1px solid ${border}`,
            borderRadius: '16px',
            overflow:     'hidden',
            background:   bg,
            transition:   'transform 0.2s',
        }}>
            <button
                onClick={() => setExpanded(v => !v)}
                style={{
                    width:       '100%',
                    display:     'flex',
                    alignItems:  'center',
                    gap:         '14px',
                    padding:     '18px 20px',
                    background:  'transparent',
                    border:      'none',
                    cursor:      'pointer',
                    textAlign:   'left',
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <div style={{
                    position:       'relative',
                    width:           48,
                    height:          48,
                    borderRadius:    '14px',
                    background:      `${color}18`,
                    border:          `1.5px solid ${color}35`,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                    color:           color,
                }}>
                    {icons[index]}
                    <span style={{
                        position:   'absolute',
                        top: -6, right: -6,
                        width: 18, height: 18,
                        borderRadius: '50%',
                        background:  color,
                        color:       '#09090b',
                        fontSize:    '10px',
                        fontWeight:  900,
                        display:     'flex',
                        alignItems:  'center',
                        justifyContent: 'center',
                        fontFamily:  "'DM Mono', monospace",
                    }}>
                        {layer.id}
                    </span>
                </div>

                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>
                        {layer.name}
                    </p>
                    <p style={{
                        fontSize: '11px', color: '#52525b', margin: '3px 0 0',
                        fontFamily: "'DM Mono', monospace",
                    }}>
                        TRIGGER: {layer.trigger}
                    </p>
                </div>

                {expanded
                    ? <ChevronUp size={16} color="#52525b" />
                    : <ChevronDown size={16} color="#52525b" />
                }
            </button>

            {expanded && (
                <div style={{
                    padding:       '0 20px 20px',
                    borderTop:     `1px solid ${border}`,
                    paddingTop:    '16px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '14px',
                }}>
                    <p style={{ fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.65, margin: 0 }}>
                        {layer.description}
                    </p>

                    {layer.blocks?.length > 0 && (
                        <div>
                            <p style={{
                                fontSize: '11px', fontWeight: 700, color: color,
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                                fontFamily: "'DM Mono', monospace", marginBottom: '8px',
                            }}>
                                Engellenir
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {layer.blocks.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <XCircle size={13} color="#f43f5e" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', color: '#71717a' }}>{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {layer.doesNotBlock?.length > 0 && (
                        <div>
                            <p style={{
                                fontSize: '11px', fontWeight: 700, color: '#34d399',
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                                fontFamily: "'DM Mono', monospace", marginBottom: '8px',
                            }}>
                                İzin Verilir
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {layer.doesNotBlock.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <CheckCircle size={13} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', color: '#71717a' }}>{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {layer.verdicts && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.values(layer.verdicts).map((v, i) => (
                                <div key={i} style={{
                                    padding: '10px 12px', borderRadius: '10px',
                                    background: i === 0 ? 'rgba(16,185,129,0.07)' : 'rgba(244,63,94,0.07)',
                                    border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                                }}>
                                    <p style={{
                                        fontSize: '11px', fontWeight: 800,
                                        color: i === 0 ? '#34d399' : '#fb7185',
                                        margin: '0 0 4px',
                                        fontFamily: "'DM Mono', monospace",
                                        letterSpacing: '0.05em',
                                    }}>
                                        {v.icon} {v.label}
                                    </p>
                                    <p style={{ fontSize: '12.5px', color: '#71717a', margin: 0, lineHeight: 1.55 }}>
                                        {v.outcome}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {layer.note && (
                        <p style={{
                            fontSize: '12px', color: '#52525b', lineHeight: 1.55, margin: 0,
                            padding: '10px 12px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid #18181b',
                            fontStyle: 'italic',
                        }}>
                            💡 {layer.note}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Role Card ─────────────────────────────────────────────────────────────
function RoleCard({ role, index }) {
    const icons  = ['👤', '🛡️', '👑'];
    const colors = ['#71717a', '#818cf8', '#fbbf24'];
    return (
        <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(18,18,24,0.7)', border: '1px solid #1c1c22',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <span style={{ fontSize: '16px' }}>{icons[index]}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors[index] }}>
                    {role.name}
                </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#71717a', margin: 0, lineHeight: 1.55 }}>
                {role.description}
            </p>
        </div>
    );
}

// ─── Divider ───────────────────────────────────────────────────────────────
function SectionDivider({ label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ flex: 1, height: '1px', background: '#18181b' }} />
            <span style={{
                fontSize: '10px', fontWeight: 700, color: '#3f3f46',
                letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace",
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: '1px', background: '#18181b' }} />
        </div>
    );
}

// ─── Main Safety Page ──────────────────────────────────────────────────────
export default function SafetyPage() {
    const navigate = useNavigate();
    const data = AEGIS_DATA;

    return (
        <div style={{
            minHeight:  '100dvh',
            background: '#05050a',
            fontFamily: "'Outfit', system-ui, sans-serif",
            color:      '#f4f4f5',
        }}>
            {/* Header */}
            <div style={{
                position:      'sticky', top: 0, zIndex: 10,
                background:    'rgba(5,5,10,0.92)',
                backdropFilter:'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderBottom:  '1px solid #18181b',
                padding:       '12px 16px',
                paddingTop:    'max(12px, env(safe-area-inset-top))',
                display:       'flex', alignItems: 'center',
                justifyContent:'space-between',
                maxWidth:      '680px', margin: '0 auto',
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none', border: 'none', color: '#71717a',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        width: 36, height: 36, borderRadius: '8px',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={17} color="#818cf8" />
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Aegis Safety</span>
                </div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 64px' }}>

                {/* ── Hero ── */}
                <div style={{ textAlign: 'center', marginBottom: '36px', padding: '0 8px' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '20px', margin: '0 auto 16px',
                        background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(99,102,241,0.15)',
                    }}>
                        <Shield size={36} color="#818cf8" />
                    </div>
                    <h1 style={{
                        fontSize: '22px', fontWeight: 900, color: '#f4f4f5',
                        letterSpacing: '-0.03em', margin: '0 0 8px',
                    }}>
                        {data.title}
                    </h1>
                    <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 20px' }}>
                        {data.subtitle}
                    </p>

                    {/* Intro blurb */}
                    <div style={{
                        padding: '16px 18px', borderRadius: '14px',
                        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
                        textAlign: 'left',
                    }}>
                        <p style={{ fontSize: '13.5px', color: '#a1a1aa', lineHeight: 1.7, margin: 0 }}>
                            Sigal Media'da paylaşılan her kelime,{' '}
                            <span style={{ color: '#818cf8', fontWeight: 700 }}>Aegis v3</span>{' '}
                            yapay zeka çekirdeği tarafından korunur. Aegis bir moderasyon aracından fazlasıdır —
                            lise ekosistemindeki zorbalığı, tacizi ve nefret söylemini{' '}
                            <em>daha ekrana düşmeden</em> durdurmak için tasarlanmış,
                            topluluğun huzurunu sağlayan otonom bir nöbetçidir.
                        </p>
                    </div>
                </div>

                {/* ── Defense Layers ── */}
                <div style={{ marginBottom: '32px' }}>
                    <SectionDivider label="DEFENSE LAYERS" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.layers.map((layer, i) => (
                            <LayerCard key={layer.id} layer={layer} index={i} />
                        ))}
                    </div>
                </div>

                {/* ── Anonymity ── */}
                <div style={{ marginBottom: '20px' }}>
                    <SectionDivider label="PRIVACY & ANONYMITY" />
                    <div style={{
                        padding: '18px 20px', borderRadius: '14px',
                        background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Lock size={16} color="#a78bfa" />
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#c4b5fd', margin: 0 }}>
                                {data.anonymity.title}
                            </p>
                        </div>
                        <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.65, margin: 0 }}>
                            {data.anonymity.body}
                        </p>
                    </div>
                </div>

                {/* ── Roles ── */}
                <div style={{ marginBottom: '20px' }}>
                    <SectionDivider label={data.rbac.title} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.rbac.roles.map((role, i) => (
                            <RoleCard key={i} role={role} index={i} />
                        ))}
                    </div>
                </div>

                {/* ── Contact ── */}
                <div style={{ marginBottom: '20px' }}>
                    <SectionDivider label="RAPORLAMA" />
                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid #18181b',
                    }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', marginBottom: '6px' }}>
                            {data.contact.title}
                        </p>
                        <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.55, margin: 0 }}>
                            {data.contact.body}
                        </p>
                    </div>
                </div>

                {/* ── Footer ── */}
                <p style={{
                    marginTop: '32px', textAlign: 'center',
                    fontSize: '11px', color: '#27272a',
                    fontFamily: "'DM Mono', monospace",
                }}>
                    AEGIS v3 · SIGAL MEDIA · {data.lastUpdated}
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
            `}</style>
        </div>
    );
}