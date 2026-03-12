import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, ShieldAlert, ShieldCheck, ShieldOff,
    BarChart3, RefreshCw, CheckCircle, XCircle,
    Trash2, Sword, Users, FileText, AlertTriangle,
    ChevronRight, Clock, Loader2, Crown, RotateCcw,
    List, PauseCircle, Bot, Plus, MessageSquare, Twitter,
    Calendar, GraduationCap, Star, Sparkles, PartyPopper,
    Power, PowerOff, ToggleLeft, ToggleRight
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

async function adminHeaders(user) {
    try {
        const token = await user.getIdToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    } catch {
        return { 'Content-Type': 'application/json' };
    }
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
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>Silme Sebebi Belirt</p>
                </div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>Bu sebep tweet sahibine bildirilecek.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {PRESETS.map(p => (
                        <button key={p} onClick={() => setReason(p)} style={{
                            textAlign: 'left', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: reason === p ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                            border: reason === p ? '1px solid rgba(244,63,94,0.35)' : '1px solid #1c1c22',
                            color: reason === p ? '#fb7185' : '#a1a1aa', fontSize: '12px',
                        }}>{p}</button>
                    ))}
                </div>
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
                    >Kaldır</button>
                </div>
            </div>
        </div>
    );
}

// ─── Quarantine/Suspended Tweet Satırı ───────────────────────────────────
function QuarantineRow({ tweet, user, onAction }) {
    const [loading,       setLoading]       = useState('');
    const [showDeleteDlg, setShowDeleteDlg] = useState(false);
    const isSuspended = tweet.aegisStatus === 'suspended';
    const lastLog     = tweet.aegisAuditLog?.[tweet.aegisAuditLog.length - 1];

    const makeDecision = async (decision, reason) => {
        setLoading(decision);
        try {
            const headers = await adminHeaders(user);
            const res = await fetch(`${API_URL}/api/admin/decision/${tweet._id}`, {
                method: 'POST', headers,
                body: JSON.stringify({ decision, reason }),
            });
            if (res.ok) onAction(tweet._id, decision);
        } catch (err) { console.error(err); }
        finally { setLoading(''); }
    };

    const handleAdminDelete = async (reason) => {
        setShowDeleteDlg(false);
        setLoading('delete');
        try {
            const headers = await adminHeaders(user);
            const res = await fetch(`${API_URL}/api/admin/tweet/${tweet._id}`, {
                method: 'DELETE', headers,
                body: JSON.stringify({ reason }),
            });
            if (res.ok) onAction(tweet._id, 'removed');
        } catch (err) { console.error(err); }
        finally { setLoading(''); }
    };

    const forceAudit = async () => {
        setLoading('audit');
        try {
            const headers = await adminHeaders(user);
            await fetch(`${API_URL}/api/admin/force-audit/${tweet._id}`, { method: 'POST', headers });
            setTimeout(() => onAction(tweet._id, 'reloaded'), 4000);
        } catch {}
        finally { setLoading(''); }
    };

    return (
        <>
            {showDeleteDlg && <DeleteReasonModal onConfirm={handleAdminDelete} onCancel={() => setShowDeleteDlg(false)} />}
            <div style={{
                background: '#0d0d10', border: `1px solid ${isSuspended ? '#3b1d1d' : '#1c1c22'}`,
                borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', background: '#18181b',
                            border: '1px solid #27272a', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: isSuspended ? '#f43f5e' : '#6366f1',
                        }}>{tweet.authorAvatar?.charAt(0)?.toUpperCase() || '?'}</div>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', margin: 0 }}>{tweet.authorAvatar || 'Anonim'}</p>
                            <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace" }}>
                                {new Date(tweet.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            padding: '3px 8px', borderRadius: '999px',
                            background: isSuspended ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${isSuspended ? 'rgba(244,63,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: isSuspended ? '#f43f5e' : '#fbbf24', fontFamily: "'DM Mono', monospace" }}>
                                {isSuspended ? '⚔ SUSPENDED' : '⚠ QUARANTINE'}
                            </span>
                        </div>
                        {tweet.reportCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                <AlertTriangle size={11} color="#fbbf24" />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', fontFamily: "'DM Mono', monospace" }}>{tweet.reportCount}</span>
                            </div>
                        )}
                    </div>
                </div>
                {tweet.content && (
                    <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.55, margin: 0, padding: '10px 12px', background: '#18181b', borderRadius: '8px', borderLeft: `2px solid ${isSuspended ? '#f43f5e40' : '#fbbf2440'}`, wordBreak: 'break-word' }}>
                        {tweet.content.slice(0, 300)}{tweet.content.length > 300 ? '…' : ''}
                    </p>
                )}
                {lastLog && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <AuditScoreBar score={lastLog.score || 0} />
                        {lastLog.reason && <p style={{ fontSize: '11px', color: '#52525b', margin: 0, fontStyle: 'italic' }}>"{lastLog.reason}"</p>}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {isSuspended && (
                        <button onClick={() => makeDecision('active', 'Admin tarafından yayına alındı.')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: loading && loading !== 'active' ? 0.5 : 1 }}>
                            {loading === 'active' ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />} Restore
                        </button>
                    )}
                    {!isSuspended && (
                        <button onClick={() => makeDecision('cleared', 'İçerik incelendi, temiz.')} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: loading && loading !== 'cleared' ? 0.5 : 1 }}>
                            {loading === 'cleared' ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />} Approve
                        </button>
                    )}
                    <button onClick={() => setShowDeleteDlg(true)} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', flex: 1, justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: loading && loading !== 'delete' ? 0.5 : 1 }}>
                        {loading === 'delete' ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />} Remove
                    </button>
                    <button onClick={forceAudit} disabled={!!loading} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 10px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '11px', cursor: 'pointer', opacity: loading && loading !== 'audit' ? 0.5 : 1 }}>
                        {loading === 'audit' ? <Loader2 size={12} className="spin" /> : <Sword size={12} />} Re-Audit
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── All Tweets Satırı ────────────────────────────────────────────────────
function AllTweetRow({ tweet, user, onDeleted }) {
    const [loading, setLoading] = useState(false);
    const [showDeleteDlg, setShowDeleteDlg] = useState(false);
    const statusColors = { active: '#34d399', quarantine: '#fbbf24', suspended: '#f43f5e', cleared: '#818cf8', removed: '#3f3f46' };
    const statusColor = statusColors[tweet.aegisStatus] || '#52525b';

    const handleDelete = async (reason) => {
        setShowDeleteDlg(false);
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res = await fetch(`${API_URL}/api/admin/tweet/${tweet._id}`, {
                method: 'DELETE', headers,
                body: JSON.stringify({ reason }),
            });
            if (res.ok) onDeleted(tweet._id);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <>
            {showDeleteDlg && <DeleteReasonModal onConfirm={handleDelete} onCancel={() => setShowDeleteDlg(false)} />}
            <div style={{ background: '#0d0d10', border: '1px solid #1c1c22', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start', opacity: tweet.aegisStatus === 'removed' ? 0.5 : 1 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>
                    {tweet.authorAvatar?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>{tweet.authorAvatar || 'Anonim'}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: statusColor, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>{tweet.aegisStatus}</span>
                        {tweet.reportCount > 0 && <span style={{ fontSize: '10px', color: '#fbbf24', fontFamily: "'DM Mono', monospace" }}>⚠ {tweet.reportCount}</span>}
                        <span style={{ fontSize: '10px', color: '#3f3f46', marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>{new Date(tweet.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {tweet.content
                        ? <p style={{ fontSize: '12px', color: '#71717a', margin: 0, wordBreak: 'break-word' }}>{tweet.content.slice(0, 200)}{tweet.content.length > 200 ? '…' : ''}</p>
                        : <p style={{ fontSize: '11px', color: '#3f3f46', margin: 0, fontStyle: 'italic' }}>(Görsel tweet)</p>
                    }
                </div>
                {tweet.aegisStatus !== 'removed' && (
                    <button onClick={() => setShowDeleteDlg(true)} disabled={loading} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '7px', padding: '6px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {loading ? <Loader2 size={13} color="#f43f5e" className="spin" /> : <Trash2 size={13} color="#f43f5e" />}
                    </button>
                )}
            </div>
        </>
    );
}

// ─── Audit Log Satırı ─────────────────────────────────────────────────────
function AuditLogRow({ entry }) {
    const actionColors = { quarantine: '#fbbf24', removed: '#f43f5e', cleared: '#34d399', suspended: '#f97316', active: '#34d399', sentinel_block: '#a78bfa', audit_error: '#71717a' };
    const color = actionColors[entry.lastAction?.action] || '#71717a';
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #18181b' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: '5px', flexShrink: 0, boxShadow: `0 0 6px ${color}66` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{entry.lastAction?.action || 'unknown'}</span>
                    <span style={{ fontSize: '10px', color: '#3f3f46', fontFamily: "'DM Mono', monospace" }}>{entry.lastAction?.modelUsed || '—'}</span>
                    {entry.lastAction?.score != null && <span style={{ fontSize: '10px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{entry.lastAction.score}% confidence</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.content || '(görsel tweet)'}</p>
                {entry.lastAction?.reason && <p style={{ fontSize: '11px', color: '#3f3f46', margin: '2px 0 0', fontStyle: 'italic' }}>{entry.lastAction.reason.slice(0, 100)}</p>}
            </div>
            <span style={{ fontSize: '10px', color: '#3f3f46', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {entry.lastAction?.at ? new Date(entry.lastAction.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
        </div>
    );
}

// ─── Bot Örnek Kartı ──────────────────────────────────────────────────────
function BotExampleCard({ example, user, onDeleted }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Bu örneği silmek istiyor musun?')) return;
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res = await fetch(`${API_URL}/api/admin/bot-examples/${example._id}`, {
                method: 'DELETE', headers,
            });
            if (res.ok) onDeleted(example._id);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const isTweet = example.type === 'tweet';

    return (
        <div style={{
            background: '#0d0d10',
            border: `1px solid ${isTweet ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`,
            borderRadius: '10px', padding: '12px',
            display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
            <div style={{
                width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                background: isTweet ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                border: `1px solid ${isTweet ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {isTweet
                    ? <Twitter size={13} color="#818cf8" />
                    : <MessageSquare size={13} color="#34d399" />
                }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: isTweet ? '#818cf8' : '#34d399',
                        fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
                        padding: '1px 5px', borderRadius: '4px',
                        background: isTweet ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                    }}>
                        {isTweet ? 'TWEET' : 'YORUM'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#3f3f46', fontFamily: "'DM Mono', monospace", marginLeft: 'auto' }}>
                        {example.addedBy === 'system' ? '⚙ sistem' : `👤 ${example.addedBy}`}
                    </span>
                </div>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, wordBreak: 'break-word', lineHeight: 1.55 }}>
                    {example.content}
                </p>
            </div>
            <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                    borderRadius: '7px', padding: '6px', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {loading ? <Loader2 size={13} color="#f43f5e" className="spin" /> : <Trash2 size={13} color="#f43f5e" />}
            </button>
        </div>
    );
}

// ─── Bot Örnekleri Tab ────────────────────────────────────────────────────
function BotExamplesTab({ user }) {
    const [examples,    setExamples]    = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [filterType,  setFilterType]  = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newType,     setNewType]     = useState('tweet');
    const [newContent,  setNewContent]  = useState('');
    const [adding,      setAdding]      = useState(false);
    const [error,       setError]       = useState('');

    const fetchExamples = useCallback(async () => {
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const qs  = filterType !== 'all' ? `?type=${filterType}` : '';
            const res = await fetch(`${API_URL}/api/admin/bot-examples${qs}`, { headers });
            const data = await res.json();
            if (res.ok) setExamples(Array.isArray(data.examples) ? data.examples : []);
            else setError(data.error || 'Yüklenemedi.');
        } catch { setError('Bağlantı hatası.'); }
        finally { setLoading(false); }
    }, [user, filterType]);

    useEffect(() => { fetchExamples(); }, [fetchExamples]);

    const handleAdd = async () => {
        if (!newContent.trim()) return;
        setAdding(true);
        setError('');
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/bot-examples`, {
                method: 'POST', headers,
                body: JSON.stringify({ type: newType, content: newContent.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setExamples(prev => [data.example, ...prev]);
                setNewContent('');
                setShowAddForm(false);
            } else {
                setError(data.error || 'Eklenemedi.');
            }
        } catch { setError('Bağlantı hatası.'); }
        finally { setAdding(false); }
    };

    const tweetCount   = examples.filter(e => e.type === 'tweet').length;
    const commentCount = examples.filter(e => e.type === 'comment').length;

    return (
        <div>
            {/* İstatistik */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#818cf8', margin: 0 }}>{tweetCount}</p>
                    <p style={{ fontSize: '11px', color: '#52525b', margin: 0, marginTop: '2px' }}>Tweet Örneği</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', margin: 0 }}>{commentCount}</p>
                    <p style={{ fontSize: '11px', color: '#52525b', margin: 0, marginTop: '2px' }}>Yorum Örneği</p>
                </div>
            </div>

            {/* Açıklama */}
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
                    🤖 <strong style={{ color: '#818cf8' }}>Bot Sistemi:</strong> Her 15 dakikada bir bot hesabı rastgele tweet atar, yorum yapar veya beğeni bırakır. Bu örnekler, YZ'nin içerik üretirken ilham alacağı şablonlardır. Günde 1 yeni bot hesabı otomatik oluşturulur.
                </p>
            </div>

            {/* Filtreler + Ekle butonu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {['all', 'tweet', 'comment'].map(t => (
                    <button key={t} onClick={() => setFilterType(t)} style={{
                        padding: '5px 12px', borderRadius: '999px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                        background: filterType === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                        border: filterType === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid #27272a',
                        color: filterType === t ? '#818cf8' : '#52525b',
                    }}>
                        {t === 'all' ? 'Tümü' : t === 'tweet' ? '🐦 Tweet' : '💬 Yorum'}
                    </button>
                ))}
                <button
                    onClick={() => setShowAddForm(v => !v)}
                    style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                        background: showAddForm ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '12px', fontWeight: 700,
                    }}
                >
                    <Plus size={13} /> Örnek Ekle
                </button>
            </div>

            {/* Yeni Örnek Formu */}
            {showAddForm && (
                <div style={{ background: '#0d0d10', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>Yeni Bot Örneği</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['tweet', 'comment'].map(t => (
                            <button key={t} onClick={() => setNewType(t)} style={{
                                flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                background: newType === t ? (t === 'tweet' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)') : 'transparent',
                                border: newType === t ? `1px solid ${t === 'tweet' ? 'rgba(99,102,241,0.4)' : 'rgba(16,185,129,0.4)'}` : '1px solid #27272a',
                                color: newType === t ? (t === 'tweet' ? '#818cf8' : '#34d399') : '#52525b',
                            }}>
                                {t === 'tweet' ? '🐦 Tweet Örneği' : '💬 Yorum Örneği'}
                            </button>
                        ))}
                    </div>
                    <textarea
                        placeholder={newType === 'tweet'
                            ? 'Örnek tweet metni... (lise öğrencisi gibi)'
                            : 'Örnek yorum metni... (kısa, samimi)'}
                        value={newContent}
                        onChange={e => setNewContent(e.target.value.slice(0, 280))}
                        rows={3}
                        style={{
                            background: '#18181b', border: '1px solid #27272a', borderRadius: '8px',
                            color: '#e4e4e7', fontSize: '13px', padding: '10px 12px',
                            resize: 'none', outline: 'none', fontFamily: "'Outfit', sans-serif",
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>
                            {newContent.length}/280
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setShowAddForm(false); setNewContent(''); }} style={{ padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid #27272a', color: '#52525b', fontSize: '12px', fontWeight: 600 }}>İptal</button>
                            <button onClick={handleAdd} disabled={!newContent.trim() || adding} style={{ padding: '7px 14px', borderRadius: '8px', cursor: newContent.trim() && !adding ? 'pointer' : 'not-allowed', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', opacity: newContent.trim() && !adding ? 1 : 0.5 }}>
                                {adding ? <Loader2 size={12} className="spin" /> : <Plus size={12} />} Ekle
                            </button>
                        </div>
                    </div>
                    {error && <p style={{ fontSize: '12px', color: '#f43f5e', margin: 0 }}>{error}</p>}
                </div>
            )}

            {/* Liste */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '10px', color: '#52525b' }}>
                    <Loader2 size={16} className="spin" />
                    <span style={{ fontSize: '13px' }}>Yükleniyor...</span>
                </div>
            ) : examples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#52525b' }}>
                    <Bot size={28} color="#3f3f46" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '13px' }}>Henüz örnek eklenmemiş.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {examples.map(ex => (
                        <BotExampleCard
                            key={ex._id}
                            example={ex}
                            user={user}
                            onDeleted={(id) => setExamples(prev => prev.filter(e => e._id !== id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Bot Yönetimi Tab ─────────────────────────────────────────────────────
function BotsManagementTab({ user }) {
    const [bots,          setBots]          = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [togglingId,    setTogglingId]    = useState(null);
    const [bulkLoading,   setBulkLoading]   = useState(false);
    const [error,         setError]         = useState('');

    const fetchBots = useCallback(async () => {
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/bots`, { headers });
            const data = await res.json();
            if (res.ok) setBots(data.bots || []);
            else setError(data.error || 'Yüklenemedi.');
        } catch { setError('Bağlantı hatası.'); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchBots(); }, [fetchBots]);

    const handleToggle = async (botId, currentActive) => {
        setTogglingId(botId);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/bot/${botId}/toggle`, { method: 'PUT', headers });
            const data = await res.json();
            if (res.ok) setBots(prev => prev.map(b => b._id === botId ? { ...b, isActive: data.isActive } : b));
        } catch { setError('İşlem başarısız.'); }
        finally { setTogglingId(null); }
    };

    const handleDisableAll = async (active) => {
        setBulkLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/bots/disable-all`, {
                method: 'PUT', headers,
                body: JSON.stringify({ active }),
            });
            const data = await res.json();
            if (res.ok) setBots(prev => prev.map(b => ({ ...b, isActive: active })));
        } catch { setError('İşlem başarısız.'); }
        finally { setBulkLoading(false); }
    };

    const activeCount   = bots.filter(b => b.isActive).length;
    const inactiveCount = bots.length - activeCount;

    return (
        <div>
            {/* İstatistik */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', margin: 0 }}>{activeCount}</p>
                    <p style={{ fontSize: '11px', color: '#52525b', margin: 0, marginTop: '2px' }}>Aktif Bot</p>
                </div>
                <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#f43f5e', margin: 0 }}>{inactiveCount}</p>
                    <p style={{ fontSize: '11px', color: '#52525b', margin: 0, marginTop: '2px' }}>Devre Dışı Bot</p>
                </div>
            </div>

            {/* Toplu aksiyon butonları */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                    onClick={() => handleDisableAll(true)}
                    disabled={bulkLoading || activeCount === bots.length}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px 14px', borderRadius: '9px', cursor: bulkLoading || activeCount === bots.length ? 'not-allowed' : 'pointer',
                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                        color: '#34d399', fontSize: '12px', fontWeight: 700,
                        opacity: bulkLoading || activeCount === bots.length ? 0.45 : 1,
                    }}
                >
                    {bulkLoading ? <Loader2 size={13} className="spin" /> : <Power size={13} />}
                    Hepsini Aç
                </button>
                <button
                    onClick={() => handleDisableAll(false)}
                    disabled={bulkLoading || activeCount === 0}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px 14px', borderRadius: '9px', cursor: bulkLoading || activeCount === 0 ? 'not-allowed' : 'pointer',
                        background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                        color: '#f43f5e', fontSize: '12px', fontWeight: 700,
                        opacity: bulkLoading || activeCount === 0 ? 0.45 : 1,
                    }}
                >
                    {bulkLoading ? <Loader2 size={13} className="spin" /> : <PowerOff size={13} />}
                    Hepsini Kapat
                </button>
            </div>

            {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185', fontSize: '12px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '10px', color: '#52525b' }}>
                    <Loader2 size={16} className="spin" /><span style={{ fontSize: '13px' }}>Yükleniyor...</span>
                </div>
            ) : bots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#52525b' }}>
                    <Bot size={28} color="#3f3f46" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '13px' }}>Henüz bot hesabı yok.</p>
                    <p style={{ fontSize: '11px', color: '#3f3f46', marginTop: '4px' }}>Her gece 02:00'de otomatik oluşturulur.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bots.map(bot => {
                        const isToggling = togglingId === bot._id;
                        return (
                            <div key={bot._id} style={{
                                background: '#0d0d10',
                                border: `1px solid ${bot.isActive ? 'rgba(52,211,153,0.18)' : '#1c1c22'}`,
                                borderRadius: '10px', padding: '12px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                opacity: bot.isActive ? 1 : 0.55,
                                transition: 'opacity 0.25s, border-color 0.25s',
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                    background: bot.isActive ? 'rgba(167,139,250,0.15)' : '#18181b',
                                    border: `1px solid ${bot.isActive ? 'rgba(167,139,250,0.3)' : '#27272a'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '13px', fontWeight: 700,
                                    color: bot.isActive ? '#a78bfa' : '#52525b',
                                }}>
                                    {bot.avatar?.charAt(0)?.toUpperCase() || '🤖'}
                                </div>

                                {/* Bilgi */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7' }}>{bot.username || 'bot'}</span>
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700, fontFamily: "'DM Mono', monospace",
                                            padding: '1px 5px', borderRadius: '4px',
                                            color: bot.isActive ? '#34d399' : '#52525b',
                                            background: bot.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(82,82,91,0.15)',
                                            border: `1px solid ${bot.isActive ? 'rgba(52,211,153,0.25)' : 'rgba(82,82,91,0.25)'}`,
                                        }}>
                                            {bot.isActive ? '● AKTİF' : '○ KAPALI'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '10px', color: '#3f3f46', margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
                                        {new Date(bot.createdAt).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>

                                {/* Toggle butonu */}
                                <button
                                    onClick={() => handleToggle(bot._id, bot.isActive)}
                                    disabled={isToggling}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '6px 12px', borderRadius: '8px', cursor: isToggling ? 'not-allowed' : 'pointer',
                                        fontSize: '11px', fontWeight: 700, flexShrink: 0,
                                        background: bot.isActive ? 'rgba(244,63,94,0.08)' : 'rgba(52,211,153,0.08)',
                                        border: `1px solid ${bot.isActive ? 'rgba(244,63,94,0.25)' : 'rgba(52,211,153,0.25)'}`,
                                        color: bot.isActive ? '#fb7185' : '#34d399',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {isToggling
                                        ? <Loader2 size={12} className="spin" />
                                        : bot.isActive
                                            ? <><PowerOff size={12} /> Kapat</>
                                            : <><Power size={12} /> Aç</>
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Etkinlik Takvimi Tab ─────────────────────────────────────────────────
const EVENT_TYPE_META = {
    exam:     { label: 'Sınav',         color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.25)',    icon: GraduationCap },
    holiday:  { label: 'Tatil / Özel Gün', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', icon: PartyPopper },
    special:  { label: 'Özel Etkinlik', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)', icon: Star },
    other:    { label: 'Diğer',         color: '#52525b', bg: 'rgba(82,82,91,0.1)',      border: 'rgba(82,82,91,0.25)',    icon: Sparkles },
};

function BotEventsTab({ user }) {
    const [events,      setEvents]      = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [showPast,    setShowPast]    = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle,    setNewTitle]    = useState('');
    const [newDate,     setNewDate]     = useState('');
    const [newType,     setNewType]     = useState('exam');
    const [newDesc,     setNewDesc]     = useState('');
    const [adding,      setAdding]      = useState(false);
    const [error,       setError]       = useState('');

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const qs  = showPast ? '?past=1' : '';
            const res = await fetch(`${API_URL}/api/admin/bot-events${qs}`, { headers });
            const data = await res.json();
            if (res.ok) setEvents(Array.isArray(data.events) ? data.events : []);
            else setError(data.error || 'Yüklenemedi.');
        } catch { setError('Bağlantı hatası.'); }
        finally { setLoading(false); }
    }, [user, showPast]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleAdd = async () => {
        if (!newTitle.trim() || !newDate) return;
        setAdding(true); setError('');
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/bot-events`, {
                method: 'POST', headers,
                body: JSON.stringify({ title: newTitle.trim(), date: newDate, type: newType, description: newDesc.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setEvents(prev => [...prev, data.event].sort((a, b) => new Date(a.date) - new Date(b.date)));
                setNewTitle(''); setNewDate(''); setNewDesc(''); setShowAddForm(false);
            } else setError(data.error || 'Eklenemedi.');
        } catch { setError('Bağlantı hatası.'); }
        finally { setAdding(false); }
    };

    const handleDelete = async (id) => {
        try {
            const headers = await adminHeaders(user);
            const res = await fetch(`${API_URL}/api/admin/bot-events/${id}`, { method: 'DELETE', headers });
            if (res.ok) setEvents(prev => prev.filter(e => e._id !== id));
        } catch { }
    };

    const today = new Date(); today.setHours(0,0,0,0);

    const formatDate = (d) => {
        const date = new Date(d);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getDayLabel = (d) => {
        const date = new Date(d); date.setHours(0,0,0,0);
        const diff = Math.round((date - today) / 86400000);
        if (diff === 0)  return { text: 'BUGÜN',  color: '#34d399' };
        if (diff === 1)  return { text: 'YARIN',  color: '#fbbf24' };
        if (diff === -1) return { text: 'DÜN',    color: '#71717a' };
        if (diff > 0)    return { text: `${diff} gün sonra`,  color: '#818cf8' };
        return                  { text: `${Math.abs(diff)} gün önce`, color: '#3f3f46' };
    };

    return (
        <div>
            {/* Açıklama */}
            <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
                    📅 <strong style={{ color: '#fbbf24' }}>Etkinlik Takvimi:</strong> Botlar sadece buraya girilen etkinlikleri kullanır. Uydurma tarih, not veya sınav puanı <strong style={{ color: '#f43f5e' }}>yazmaz</strong>. Etkinlik yoksa günlük hayat tarzında içerik üretir.
                </p>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setShowPast(v => !v)} style={{ padding: '5px 12px', borderRadius: '999px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: showPast ? 'rgba(82,82,91,0.2)' : 'transparent', border: showPast ? '1px solid #3f3f46' : '1px solid #27272a', color: showPast ? '#a1a1aa' : '#52525b' }}>
                    {showPast ? '📂 Geçmişler dahil' : '📅 Sadece gelecek'}
                </button>
                <button onClick={() => setShowAddForm(v => !v)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', background: showAddForm ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontSize: '12px', fontWeight: 700 }}>
                    <Plus size={13} /> Etkinlik Ekle
                </button>
            </div>

            {/* Yeni Etkinlik Formu */}
            {showAddForm && (
                <div style={{ background: '#0d0d10', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>Yeni Etkinlik</p>

                    {/* Tür seçimi */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {Object.entries(EVENT_TYPE_META).map(([key, meta]) => {
                            const Icon = meta.icon;
                            return (
                                <button key={key} onClick={() => setNewType(key)} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', background: newType === key ? meta.bg : 'transparent', border: newType === key ? `1px solid ${meta.border}` : '1px solid #1c1c22', color: newType === key ? meta.color : '#52525b', fontSize: '12px', fontWeight: 600 }}>
                                    <Icon size={13} /> {meta.label}
                                </button>
                            );
                        })}
                    </div>

                    <input
                        placeholder="Etkinlik başlığı (ör: Matematik Sınavı, Sevgililer Günü)"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value.slice(0, 80))}
                        style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7', fontSize: '13px', padding: '9px 12px', outline: 'none', fontFamily: "'Outfit', sans-serif" }}
                    />

                    <input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7', fontSize: '13px', padding: '9px 12px', outline: 'none', fontFamily: "'DM Mono', monospace", colorScheme: 'dark' }}
                    />

                    <input
                        placeholder="Ek not (isteğe bağlı, ör: 12-A için, 1. dönem)"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value.slice(0, 200))}
                        style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7', fontSize: '12px', padding: '9px 12px', outline: 'none', fontFamily: "'Outfit', sans-serif" }}
                    />

                    {error && <p style={{ fontSize: '12px', color: '#f43f5e', margin: 0 }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDate(''); setNewDesc(''); }} style={{ padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid #27272a', color: '#52525b', fontSize: '12px', fontWeight: 600 }}>İptal</button>
                        <button onClick={handleAdd} disabled={!newTitle.trim() || !newDate || adding} style={{ padding: '7px 16px', borderRadius: '8px', cursor: newTitle.trim() && newDate && !adding ? 'pointer' : 'not-allowed', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', opacity: newTitle.trim() && newDate && !adding ? 1 : 0.5 }}>
                            {adding ? <Loader2 size={12} className="spin" /> : <Plus size={12} />} Ekle
                        </button>
                    </div>
                </div>
            )}

            {/* Etkinlik Listesi */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '10px', color: '#52525b' }}>
                    <Loader2 size={16} className="spin" /><span style={{ fontSize: '13px' }}>Yükleniyor...</span>
                </div>
            ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#52525b' }}>
                    <Calendar size={28} color="#3f3f46" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '13px' }}>Takvimde etkinlik yok.</p>
                    <p style={{ fontSize: '11px', color: '#3f3f46', marginTop: '4px' }}>Etkinlik ekleyince botlar tarih bazlı içerik üretir.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {events.map(ev => {
                        const meta  = EVENT_TYPE_META[ev.type] || EVENT_TYPE_META.other;
                        const Icon  = meta.icon;
                        const day   = getDayLabel(ev.date);
                        return (
                            <div key={ev._id} style={{ background: '#0d0d10', border: `1px solid ${meta.border}`, borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '9px', flexShrink: 0, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={15} color={meta.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7' }}>{ev.title}</span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: day.color, fontFamily: "'DM Mono', monospace", padding: '1px 5px', borderRadius: '4px', background: `${day.color}15`, border: `1px solid ${day.color}30` }}>{day.text}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                                        <span style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{formatDate(ev.date)}</span>
                                        <span style={{ fontSize: '10px', color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                                    </div>
                                    {ev.description && <p style={{ fontSize: '11px', color: '#52525b', margin: '4px 0 0', fontStyle: 'italic' }}>{ev.description}</p>}
                                </div>
                                <button onClick={() => handleDelete(ev._id)} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '7px', padding: '6px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={13} color="#f43f5e" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Ana Dashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const user = useAuth();

    const [tab,        setTab]        = useState('quarantine');
    const [stats,      setStats]      = useState(null);
    const [quarantine, setQuarantine] = useState([]);
    const [allTweets,  setAllTweets]  = useState([]);
    const [auditLog,   setAuditLog]   = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');
    const [allPage,      setAllPage]      = useState(1);
    const [allTotal,     setAllTotal]     = useState(0);
    const [unauthorized, setUnauthorized] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/stats`, { headers });
            const data = await res.json();
            if (res.ok) setStats(data);
            else if (res.status === 403 || (data.error && data.error.toLowerCase().includes('yetki'))) setUnauthorized(true);
            else setError(data.error || 'Yetki hatası');
        } catch { setError('Bağlantı hatası'); }
    }, [user]);

    const fetchQuarantine = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/quarantine?limit=30`, { headers });
            const data = await res.json();
            if (res.ok) setQuarantine(data.tweets || []);
        } catch {}
        finally { setLoading(false); }
    }, [user]);

    const fetchAllTweets = useCallback(async (page = 1) => {
        if (!user) return;
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/all-tweets?limit=30&page=${page}`, { headers });
            const data = await res.json();
            if (res.ok) { setAllTweets(data.tweets || []); setAllTotal(data.total || 0); }
        } catch {}
        finally { setLoading(false); }
    }, [user]);

    const fetchAuditLog = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const headers = await adminHeaders(user);
            const res  = await fetch(`${API_URL}/api/admin/audit-log?limit=50`, { headers });
            const data = await res.json();
            if (res.ok) setAuditLog(Array.isArray(data) ? data : []);
        } catch {}
        finally { setLoading(false); }
    }, [user]);

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
        { id: 'quarantine', label: 'Quarantine',  icon: ShieldAlert, badge: (stats?.tweets?.quarantine || 0) + (stats?.tweets?.suspended || 0) },
        { id: 'all',        label: 'All Tweets',  icon: List,        badge: 0 },
        { id: 'log',        label: 'Audit Log',   icon: FileText,    badge: 0 },
        { id: 'bots',         label: 'Bot Örnekleri', icon: Bot,       badge: 0 },
        { id: 'events',       label: 'Takvim',        icon: Calendar,  badge: 0 },
        { id: 'bots-manage',  label: 'Bot Yönetimi',  icon: Power,     badge: 0 },
    ];

    if (unauthorized) {
        return (
            <div style={{
                minHeight: '100dvh', background: '#05050a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace",
            }}>
                <p style={{ fontSize: '13px', color: '#27272a', letterSpacing: '0.04em', userSelect: 'none' }}>
                    ne yani buraya öylece erişebileceğini mi zannettin
                </p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100dvh', background: '#09090b', fontFamily: "'Outfit', system-ui, sans-serif", paddingBottom: '40px' }}>
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #18181b', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                maxWidth: '720px', margin: '0 auto',
            }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} color="#818cf8" />
                </div>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#f4f4f5', margin: 0 }}>Aegis Control Room</p>
                    <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace" }}>SIGAL MEDIA — MOD DASHBOARD</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={() => { fetchStats(); if (tab === 'quarantine') fetchQuarantine(); else if (tab === 'all') fetchAllTweets(allPage); else if (tab === 'log') fetchAuditLog(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', cursor: 'pointer' }}
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

                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        <StatCard icon={FileText}    label="Toplam Tweet"     value={stats.tweets?.total}      color="#6366f1" />
                        <StatCard icon={ShieldAlert} label="İnceleme"         value={(stats.tweets?.quarantine || 0) + (stats.tweets?.suspended || 0)} color="#fbbf24" sub={(stats.tweets?.suspended || 0) > 0 ? `${stats.tweets?.suspended} askıda` : 'Temiz'} />
                        <StatCard icon={PauseCircle} label="Askıya Alınan"    value={stats.tweets?.suspended}  color="#f97316" />
                        <StatCard icon={ShieldCheck} label="Cleared"          value={stats.tweets?.cleared}    color="#34d399" />
                        <StatCard icon={ShieldOff}   label="Removed"          value={stats.tweets?.removed}    color="#f43f5e" />
                        <StatCard icon={Bot}         label="Bot Hesapları"    value={stats.users?.bots ?? '—'} color="#a78bfa" sub="Aktif bot" />
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #18181b', marginBottom: '16px', gap: '2px', overflowX: 'auto' }}>
                    {TABS.map(({ id, label, icon: Icon, badge }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 12px', background: 'transparent', border: 'none',
                                borderBottom: tab === id ? '2px solid #6366f1' : '2px solid transparent',
                                color: tab === id ? '#818cf8' : '#52525b',
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '-1px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Icon size={13} />
                            {label}
                            {badge > 0 && (
                                <span style={{ padding: '1px 6px', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '10px', fontWeight: 700 }}>{badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab İçerikleri */}
                {tab === 'bots' ? (
                    <BotExamplesTab user={user} />
                ) : tab === 'events' ? (
                    <BotEventsTab user={user} />
                ) : tab === 'bots-manage' ? (
                    <BotsManagementTab user={user} />
                ) : loading ? (
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
                            {quarantine.map(tweet => <QuarantineRow key={tweet._id} tweet={tweet} user={user} onAction={handleAction} />)}
                        </div>
                    )
                ) : tab === 'all' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{allTotal} tweet toplam</span>
                        </div>
                        {allTweets.length === 0
                            ? <p style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '30px' }}>Tweet yok.</p>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {allTweets.map(tweet => <AllTweetRow key={tweet._id} tweet={tweet} user={user} onDeleted={handleTweetDeleted} />)}
                              </div>
                        }
                        {allTotal > 30 && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                                <button disabled={allPage === 1} onClick={() => { const p = allPage - 1; setAllPage(p); fetchAllTweets(p); }} style={{ padding: '6px 14px', borderRadius: '8px', cursor: allPage === 1 ? 'not-allowed' : 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', opacity: allPage === 1 ? 0.4 : 1 }}>← Önceki</button>
                                <span style={{ padding: '6px 10px', fontSize: '12px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>{allPage} / {Math.ceil(allTotal / 30)}</span>
                                <button disabled={allPage >= Math.ceil(allTotal / 30)} onClick={() => { const p = allPage + 1; setAllPage(p); fetchAllTweets(p); }} style={{ padding: '6px 14px', borderRadius: '8px', cursor: allPage >= Math.ceil(allTotal / 30) ? 'not-allowed' : 'pointer', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', opacity: allPage >= Math.ceil(allTotal / 30) ? 0.4 : 1 }}>Sonraki →</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {auditLog.length === 0
                            ? <p style={{ textAlign: 'center', color: '#52525b', fontSize: '13px', padding: '30px' }}>Kayıt yok.</p>
                            : auditLog.map((entry, i) => <AuditLogRow key={i} entry={entry} />)
                        }
                    </div>
                )}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.7s linear infinite}`}</style>
        </div>
    );
}