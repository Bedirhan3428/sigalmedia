import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, ShieldAlert, ShieldCheck, ShieldOff,
    BarChart3, RefreshCw, CheckCircle, XCircle,
    Trash2, Sword, Users, FileText, AlertTriangle,
    ChevronRight, Clock, Loader2, Crown, RotateCcw,
    List, PauseCircle
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

function adminHeaders(deviceId) {
    return {
        'Content-Type': 'application/json',
        'x-admin-id':   deviceId,
    };
}

// ─── Audit Score Bar ───────────────────────────────────────────────────────
function AuditScoreBar({ score = 0 }) {
    const color = score >= 75 ? '#f43f5e' : score >= 40 ? '#fbbf24' : '#34d399';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: "'DM Mono', monospace" }}>AUDIT CONFIDENCE</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{score}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '2px', background: '#27272a', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '2px', width: `${score}%`, background: color,
                    transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 8px ${color}66`,
                }} />
            </div>
        </div>
    );
}

// ─── Stat Kartı ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = '#6366f1', sub }) {
    return (
        <div style={{
            background: 'rgba(18,18,24,0.8)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
            <div style={{
                width: 34, height: 34, borderRadius: '10px', background: `${color}18`,
                border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={16} color={color} />
            </div>
            <div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#f4f4f5', margin: 0, lineHeight: 1 }}>{value ?? '—'}</p>
                <p style={{ fontSize: '11px', color: '#52525b', margin: 0, marginTop: '3px' }}>{label}</p>
                {sub && <p style={{ fontSize: '10px', color, margin: 0, marginTop: '2px' }}>{sub}</p>}
            </div>
        </div>
    );
}

// ─── Delete Reason Modal ───────────────────────────────────────────────────
function DeleteReasonModal({ onConfirm, onCancel }) {
    const [reason, setReason] = useState('');
    const PRESETS = [
        'Topluluk kurallarına aykırı içerik.',
        'Ağır hakaret veya tehdit içeriği.',
        'Kişisel gizlilik ihlali.',
        'Spam veya yanıltıcı içerik.',
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
            <div style={{
                background: '#0d0d10', border: '1px solid #27272a', borderRadius: '16px',
                padding: '20px', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldOff size={18} color="#f43f5e" />
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>
                        Silme Sebebi Belirt
                    </p>
                </div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
                    Bu sebep tweet sahibine bildirilecek.
                </p>

                {/* Hazır sebepler */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {PRESETS.map(p => (
                        <button key={p} onClick={() => setReason(p)} style={{
                            textAlign: 'left', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: reason === p ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                            border: reason === p ? '1px solid rgba(244,63,94,0.35)' : '1px solid #1c1c22',
                            color: reason === p ? '#fb7185' : '#a1a1aa', fontSize: '12px',
                        }}>
                            {p}
                        </button>
                    ))}
                </div>

                {/* Manuel giriş */}
                <textarea
                    placeholder="Veya özel sebep yaz..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={2}
                    style={{
                        background: '#18181b', border: '1px solid #27272a', borderRadius: '8px',
                        color: '#e4e4e7', fontSize: '12px', padding: '8px 10px',
                        resize: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif",
                    }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '9px', borderRadius: '8px', cursor: 'pointer',
                        background: 'transparent', border: '1px solid #27272a',
                        color: '#52525b', fontSize: '12px', fontWeight: 600,
                    }}>İptal</button>
                    <button
                        onClick={() => reason.trim() && onConfirm(reason.trim())}
                        disabled={!reason.trim()}
                        style={{
                            flex: 1, padding: '9px', borderRadius: '8px', cursor: reason.trim() ? 'pointer' : 'not-allowed',
                            background: reason.trim() ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${reason.trim() ? 'rgba(244,63,94,0.4)' : '#1c1c22'}`,
                            color: reason.trim() ? '#fb7185' : '#3f3f46', fontSize: '12px', fontWeight: 700,
                        }}
                    >
                        Kaldır
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Quarantine/Suspended Tweet Satırı ───────────────────────────────────
function QuarantineRow({ tweet, deviceId, onAction }) {
    const [loading,      setLoading]      = useState('');
    const [showDeleteDlg, setShowDeleteDlg] = useState(false);

    const isSuspended = tweet.aegisStatus === 'suspended';
    const lastLog     = tweet.aegisAuditLog?.[tweet.aegisAuditLog.length - 1];

    const makeDecision = async (decision, reason) => {
        setLoading(decision);
        try {
            const res = await fetch(`${API_URL}/api/admin/decision/${tweet._id}`, {
                method:  'POST',
                headers: adminHeaders(deviceId),
                body:    JSON.stringify({ decision, reason }),
            });
            if (res.ok) onAction(tweet._id, decision);
        } catch (err) { console.error(err); }
        finally { setLoading(''); }
    };

    const handleAdminDelete = async (reason) => {
        setShowDeleteDlg(false);
        setLoading('delete');
        try {
            const res = await fetch(`${API_URL}/api/admin/tweet/${tweet._id}`, {
                method:  'DELETE',
                headers: adminHeaders(deviceId),
                body:    JSON.stringify({ reason }),
            });
            if (res.ok) onAction(tweet._id, 'removed');
        } catch (err) { console.error(err); }
        finally { setLoading(''); }
    };

    const forceAudit = async () => {
        setLoading('audit');
        try {
            await fetch(`${API_URL}/api/admin/force-audit/${tweet._id}`, {
                method: 'POST', headers: adminHeaders(deviceId),
            });
            setTimeout(() => onAction(tweet._id, 'reloaded'), 4000);
        } catch {}
        finally { setLoading(''); }
    };

    return (
        <>
            {showDeleteDlg && (
                <DeleteReasonModal
                    onConfirm={handleAdminDelete}
                    onCancel={() => setShowDeleteDlg(false)}
                />
            )}
            <div style={{
                background: '#0d0d10', border: `1px solid ${isSuspended ? '#3b1d1d' : '#1c1c22'}`,
                borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
                {/* Üst: yazar + durum + şikayet */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', background: '#18181b',
                            border: '1px solid #27272a', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: isSuspended ? '#f43f5e' : '#6366f1',
                        }}>
                            {tweet.authorAvatar?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', margin: 0 }}>
                                {tweet.authorAvatar || 'Anonim'}
                            </p>
                            <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                                {new Date(tweet.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Aegis Status Badge */}
                        <div style={{
                            padding: '3px 8px', borderRadius: '999px',
                            background: isSuspended ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${isSuspended ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700,
                                color: isSuspended ? '#f43f5e' : '#fbbf24',
                                fontFamily: "'DM Mono', monospace",
                            }}>
                                {isSuspended ? '⚔ SUSPENDED' : '⚠ QUARANTINE'}
                            </span>
                        </div>
                        {tweet.reportCount > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', borderRadius: '999px',
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                            }}>
                                <AlertTriangle size={11} color="#fbbf24" />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', fontFamily: "'DM Mono', monospace" }}>
                                    {tweet.reportCount}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* İçerik */}
                {tweet.content && (
                    <p style={{
                        fontSize: '13px', color: '#a1a1aa', lineHeight: 1.55, margin: 0,
                        padding: '10px 12px', background: '#18181b', borderRadius: '8px',
                        borderLeft: `2px solid ${isSuspended ? '#f43f5e40' : '#fbbf2440'}`,
                        wordBreak: 'break-word',
                    }}>
                        {tweet.content.slice(0, 300)}{tweet.content.length > 300 ? '…' : ''}
                    </p>
                )}

                {/* Audit log */}
                {lastLog && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <AuditScoreBar score={lastLog.score || 0} />
                        {lastLog.reason && (
                            <p style={{ fontSize: '11px', color: '#52525b', margin: 0, fontStyle: 'italic' }}>
                                "{lastLog.reason}"
                            </p>
                        )}
                    </div>
                )}

                {/* Aksiyon butonları */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Restore (suspended için) */}
                    {isSuspended && (
                        <button
                            onClick={() => makeDecision('active', 'Admin tarafından yayına alındı.')}
                            disabled={!!loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center',
                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                opacity: loading && loading !== 'active' ? 0.5 : 1,
                            }}
                        >
                            {loading === 'active' ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
                            Restore
                        </button>
                    )}

                    {/* Approve (quarantine için) */}
                    {!isSuspended && (
                        <button
                            onClick={() => makeDecision('cleared', 'İçerik incelendi, temiz.')}
                            disabled={!!loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center',
                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                opacity: loading && loading !== 'cleared' ? 0.5 : 1,
                            }}
                        >
                            {loading === 'cleared' ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
                            Approve
                        </button>
                    )}

                    {/* Remove (her ikisi için de — sebep modal'ı açar) */}
                    <button
                        onClick={() => setShowDeleteDlg(true)}
                        disabled={!!loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center',
                            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                            color: '#fb7185', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            opacity: loading && loading !== 'delete' ? 0.5 : 1,
                        }}
                    >
                        {loading === 'delete' ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />}
                        Remove
                    </button>

                    {/* Re-Audit */}
                    <button
                        onClick={forceAudit}
                        disabled={!!loading}
                        title="Military Audit'i yeniden başlat"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '7px 10px', borderRadius: '8px',
                            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                            color: '#818cf8', fontSize: '11px', cursor: 'pointer',
                            opacity: loading && loading !== 'audit' ? 0.5 : 1,
                        }}
                    >
                        {loading === 'audit' ? <Loader2 size={12} className="spin" /> : <Sword size={12} />}
                        Re-Audit
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── All Tweets Satırı ────────────────────────────────────────────────────
function AllTweetRow({ tweet, deviceId, onDeleted }) {
    const [loading,       setLoading]       = useState(false);
    const [showDeleteDlg, setShowDeleteDlg] = useState(false);

    const statusColors = {
        active:     '#34d399', quarantine: '#fbbf24', suspended: '#f43f5e',
        cleared:    '#818cf8', removed:    '#3f3f46',
    };
    const statusColor = statusColors[tweet.aegisStatus] || '#52525b';

    const handleDelete = async (reason) => {
        setShowDeleteDlg(false);
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/tweet/${tweet._id}`, {
                method:  'DELETE',
                headers: adminHeaders(deviceId),
                body:    JSON.stringify({ reason }),
            });
            if (res.ok) onDeleted(tweet._id);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <>
            {showDeleteDlg && (
                <DeleteReasonModal
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteDlg(false)}
                />
            )}
            <div style={{
                background: '#0d0d10', border: '1px solid #1c1c22',
                borderRadius: '10px', padding: '12px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                opacity: tweet.aegisStatus === 'removed' ? 0.5 : 1,
            }}>
                {/* Avatar */}
                <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: '#18181b',
                    border: '1px solid #27272a', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    color: '#818cf8', flexShrink: 0,
                }}>
                    {tweet.authorAvatar?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>
                            {tweet.authorAvatar || 'Anonim'}
                        </span>
                        {/* Status badge */}
                        <span style={{
                            fontSize: '9px', fontWeight: 700, color: statusColor,
                            fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
                            padding: '1px 5px', borderRadius: '4px',
                            background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                        }}>
                            {tweet.aegisStatus}
                        </span>
                        {tweet.reportCount > 0 && (
                            <span style={{ fontSize: '10px', color: '#fbbf24', fontFamily: "'DM Mono', monospace" }}>
                                ⚠ {tweet.reportCount}
                            </span>
                        )}
                        <span style={{ fontSize: '10px', color: '#3f3f46', marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>
                            {new Date(tweet.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                    {tweet.content ? (
                        <p style={{ fontSize: '12px', color: '#71717a', margin: 0, wordBreak: 'break-word' }}>
                            {tweet.content.slice(0, 200)}{tweet.content.length > 200 ? '…' : ''}
                        </p>
                    ) : (
                        <p style={{ fontSize: '11px', color: '#3f3f46', margin: 0, fontStyle: 'italic' }}>
                            (Görsel tweet)
                        </p>
                    )}
                </div>

                {/* Sil butonu */}
                {tweet.aegisStatus !== 'removed' && (
                    <button
                        onClick={() => setShowDeleteDlg(true)}
                        disabled={loading}
                        title="Tweeti kaldır"
                        style={{
                            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                            borderRadius: '7px', padding: '6px', cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {loading ? <Loader2 size={13} color="#f43f5e" className="spin" /> : <Trash2 size={13} color="#f43f5e" />}
                    </button>
                )}
            </div>
        </>
    );
}

// ─── Audit Log Satırı ─────────────────────────────────────────────────────
function AuditLogRow({ entry }) {
    const actionColors = {
        quarantine: '#fbbf24', removed: '#f43f5e', cleared: '#34d399',
        suspended: '#f97316', active: '#34d399',
        sentinel_block: '#a78bfa', audit_error: '#71717a',
    };
    const color = actionColors[entry.lastAction?.action] || '#71717a';

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #18181b' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: '5px', flexShrink: 0, boxShadow: `0 0 6px ${color}66` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {entry.lastAction?.action || 'unknown'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#3f3f46', fontFamily: "'DM Mono', monospace" }}>{entry.lastAction?.modelUsed || '—'}</span>
                    {entry.lastAction?.score != null && (
                        <span style={{ fontSize: '10px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{entry.lastAction.score}% confidence</span>
                    )}
                </div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.content || '(görsel tweet)'}
                </p>
                {entry.lastAction?.reason && (
                    <p style={{ fontSize: '11px', color: '#3f3f46', margin: '2px 0 0', fontStyle: 'italic' }}>
                        {entry.lastAction.reason.slice(0, 100)}
                    </p>
                )}
            </div>
            <span style={{ fontSize: '10px', color: '#3f3f46', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {entry.lastAction?.at ? new Date(entry.lastAction.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
        </div>
    );
}

// ─── Ana Dashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const user     = useAuth();
    const deviceId = user?.uid || '';

    const [tab,        setTab]        = useState('quarantine');
    const [stats,      setStats]      = useState(null);
    const [quarantine, setQuarantine] = useState([]);
    const [allTweets,  setAllTweets]  = useState([]);
    const [auditLog,   setAuditLog]   = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');
    const [allPage,    setAllPage]    = useState(1);
    const [allTotal,   setAllTotal]   = useState(0);

    const fetchStats = useCallback(async () => {
        try {
            const res  = await fetch(`${API_URL}/api/admin/stats`, { headers: adminHeaders(deviceId) });
            const data = await res.json();
            if (res.ok) setStats(data);
            else setError(data.error || 'Yetki hatası');
        } catch { setError('Bağlantı hatası'); }
    }, [deviceId]);

    const fetchQuarantine = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/admin/quarantine?limit=30`, { headers: adminHeaders(deviceId) });
            const data = await res.json();
            if (res.ok) setQuarantine(data.tweets || []);
        } catch {}
        finally { setLoading(false); }
    }, [deviceId]);

    const fetchAllTweets = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/admin/all-tweets?limit=30&page=${page}`, { headers: adminHeaders(deviceId) });
            const data = await res.json();
            if (res.ok) { setAllTweets(data.tweets || []); setAllTotal(data.total || 0); }
        } catch {}
        finally { setLoading(false); }
    }, [deviceId]);

    const fetchAuditLog = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/admin/audit-log?limit=50`, { headers: adminHeaders(deviceId) });
            const data = await res.json();
            if (res.ok) setAuditLog(Array.isArray(data) ? data : []);
        } catch {}
        finally { setLoading(false); }
    }, [deviceId]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => {
        if (tab === 'quarantine') fetchQuarantine();
        if (tab === 'all')        fetchAllTweets(allPage);
        if (tab === 'log')        fetchAuditLog();
    }, [tab]);

    const handleAction = (tweetId, decision) => {
        if (decision === 'reloaded') { fetchQuarantine(); return; }
        setQuarantine(prev => prev.filter(t => t._id !== tweetId));
        fetchStats();
    };

    const handleTweetDeleted = (tweetId) => {
        setAllTweets(prev => prev.map(t => t._id === tweetId ? { ...t, aegisStatus: 'removed' } : t));
        fetchStats();
    };

    const TABS = [
        { id: 'quarantine', label: 'Quarantine', icon: ShieldAlert,  badge: (stats?.tweets?.quarantine || 0) + (stats?.tweets?.suspended || 0) },
        { id: 'all',        label: 'All Tweets', icon: List,          badge: 0 },
        { id: 'log',        label: 'Audit Log',  icon: FileText,      badge: 0 },
    ];

    return (
        <div style={{ minHeight: '100dvh', background: '#09090b', fontFamily: "'Outfit', system-ui, sans-serif", paddingBottom: '40px' }}>

            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #18181b', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                maxWidth: '720px', margin: '0 auto',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Shield size={18} color="#818cf8" />
                </div>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>Aegis Control Room</p>
                    <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace" }}>SIGAL MEDIA — MOD DASHBOARD</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={() => {
                            fetchStats();
                            if (tab === 'quarantine') fetchQuarantine();
                            else if (tab === 'all') fetchAllTweets(allPage);
                            else fetchAuditLog();
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 12px', borderRadius: '8px',
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                            color: '#818cf8', fontSize: '12px', cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={13} /> Yenile
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px' }}>
                {error && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldOff size={16} /> {error}
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        <StatCard icon={FileText}    label="Toplam Tweet"     value={stats.tweets?.total}      color="#6366f1" />
                        <StatCard icon={ShieldAlert} label="İnceleme"         value={(stats.tweets?.quarantine || 0) + (stats.tweets?.suspended || 0)} color="#fbbf24" sub={(stats.tweets?.suspended || 0) > 0 ? `${stats.tweets?.suspended} askıda` : 'Temiz'} />
                        <StatCard icon={PauseCircle} label="Askıya Alınan"    value={stats.tweets?.suspended}  color="#f97316" sub="Admin onayı bekliyor" />
                        <StatCard icon={ShieldCheck} label="Cleared"          value={stats.tweets?.cleared}    color="#34d399" />
                        <StatCard icon={ShieldOff}   label="Removed"          value={stats.tweets?.removed}    color="#f43f5e" />
                        <StatCard icon={Users}       label="Toplam Kullanıcı" value={stats.users?.total}       color="#8b5cf6" />
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #18181b', marginBottom: '16px', gap: '4px' }}>
                    {TABS.map(({ id, label, icon: Icon, badge }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 14px', background: 'transparent', border: 'none',
                                borderBottom: tab === id ? '2px solid #6366f1' : '2px solid transparent',
                                color: tab === id ? '#818cf8' : '#52525b',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '-1px',
                            }}
                        >
                            <Icon size={14} />
                            {label}
                            {badge > 0 && (
                                <span style={{
                                    padding: '1px 6px', borderRadius: '999px',
                                    background: 'rgba(245,158,11,0.15)',
                                    color: '#fbbf24', fontSize: '10px', fontWeight: 700,
                                }}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* İçerik */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: '#52525b' }}>
                        <Loader2 size={18} className="spin" />
                        <span style={{ fontSize: '13px' }}>Yükleniyor...</span>
                    </div>
                ) : tab === 'quarantine' ? (
                    quarantine.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>
                            <ShieldCheck size={32} color="#34d399" style={{ margin: '0 auto 12px' }} />
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#34d399' }}>Karantinada tweet yok</p>
                            <p style={{ fontSize: '12px', color: '#52525b', marginTop: '4px' }}>Topluluk temiz!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quarantine.map(tweet => (
                                <QuarantineRow key={tweet._id} tweet={tweet} deviceId={deviceId} onAction={handleAction} />
                            ))}
                        </div>
                    )
                ) : tab === 'all' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>
                                {allTotal} tweet toplam
                            </span>
                        </div>
                        {allTweets.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '30px' }}>Tweet yok.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {allTweets.map(tweet => (
                                    <AllTweetRow key={tweet._id} tweet={tweet} deviceId={deviceId} onDeleted={handleTweetDeleted} />
                                ))}
                            </div>
                        )}
                        {/* Pagination */}
                        {allTotal > 30 && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                                <button
                                    disabled={allPage === 1}
                                    onClick={() => { const p = allPage - 1; setAllPage(p); fetchAllTweets(p); }}
                                    style={{ padding: '6px 14px', borderRadius: '8px', cursor: allPage === 1 ? 'not-allowed' : 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', opacity: allPage === 1 ? 0.4 : 1 }}
                                >← Önceki</button>
                                <span style={{ padding: '6px 10px', fontSize: '12px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>
                                    {allPage} / {Math.ceil(allTotal / 30)}
                                </span>
                                <button
                                    disabled={allPage >= Math.ceil(allTotal / 30)}
                                    onClick={() => { const p = allPage + 1; setAllPage(p); fetchAllTweets(p); }}
                                    style={{ padding: '6px 14px', borderRadius: '8px', cursor: allPage >= Math.ceil(allTotal / 30) ? 'not-allowed' : 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', opacity: allPage >= Math.ceil(allTotal / 30) ? 0.4 : 1 }}
                                >Sonraki →</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {auditLog.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '30px' }}>Kayıt yok.</p>
                        ) : (
                            auditLog.map((entry, i) => <AuditLogRow key={i} entry={entry} />)
                        )}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.7s linear infinite}`}</style>
        </div>
    );
}