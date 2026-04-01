import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Search, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToConversations } from '../utils/rtdb';
import { API_URL } from '../apiConfig';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return 'şimdi';
  if (diff < 3600)  return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  return `${Math.floor(diff / 86400)}g`;
}

function NewConvModal({ myUid, onSelect, onClose }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((Array.isArray(data) ? data : data.users || []).filter(u => u.deviceId !== myUid));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, myUid]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet fade-in" onClick={e => e.stopPropagation()}
           style={{ maxHeight: '80dvh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <div className="modal-title">Yeni Mesaj</div>

        <div style={{ padding: '0 16px 12px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Kullanıcı ara..."
            style={{
              width: '100%', background: 'var(--surface-3)', border: 'none',
              borderRadius: 8, padding: '10px 16px 10px 40px',
              color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font)', outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <Loader2 size={20} className="spin" color="var(--text-3)" />
            </div>
          )}
          {results.map(u => (
            <div
              key={u.deviceId}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              }}
              onClick={() => { onSelect(u); onClose(); }}
            >
              {u.avatarUrl
                ? <img src={u.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {(u.username || '?').charAt(0).toUpperCase()}
                  </div>
              }
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
            </div>
          ))}
          {!loading && query && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)', fontSize: 14 }}>
              Sonuç bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const user     = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showNew,       setShowNew]       = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const handleSelectUser = (targetUser) => {
    navigate(`/messages/${targetUser.deviceId}`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="messages-header">
        <button className="ig-icon-btn" onClick={() => navigate(-1)} style={{ marginLeft: -8 }}>
          <ArrowLeft size={22} />
        </button>
        <span className="messages-title">{user?.displayName || 'Mesajlar'}</span>
        <button className="ig-icon-btn" onClick={() => setShowNew(true)}>
          <Edit size={22} />
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="center-loader">
          <div className="spinner" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageCircle size={48} />
          </div>
          <div className="empty-state-title">Henüz mesaj yok</div>
          <div className="empty-state-sub">Birisiyle sohbet başlatmak için düzenle butonuna dokun.</div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 8,
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >
            Mesaj Gönder
          </button>
        </div>
      ) : (
        <div className="message-list">
          {conversations.map(conv => {
            const partner  = conv.partner || {};
            const lastMsg  = conv.lastMessage;
            const isUnread = lastMsg && lastMsg.senderId !== user.uid && lastMsg.read === false;

            return (
              <div
                key={conv.id}
                className="conversation-item"
                onClick={() => navigate(`/messages/${conv.partnerUid}`)}
              >
                <div className="conv-avatar-wrap">
                  {partner.avatarUrl
                    ? <img src={partner.avatarUrl} alt="" className="conv-avatar" />
                    : <div className="conv-avatar-letter">
                        {(partner.username || '?').charAt(0).toUpperCase()}
                      </div>
                  }
                </div>

                <div className="conv-info">
                  <div className="conv-name">{partner.username || 'Kullanıcı'}</div>
                  {lastMsg && (
                    <div className={`conv-preview ${isUnread ? 'conv-preview--unread' : ''}`}>
                      {lastMsg.senderId === user.uid ? 'Sen: ' : ''}
                      {lastMsg.text || (lastMsg.imageUrl ? '📷 Fotoğraf' : '🎬 Video')}
                    </div>
                  )}
                </div>

                <div className="conv-meta">
                  {lastMsg?.timestamp && (
                    <span className="conv-time">{timeAgo(lastMsg.timestamp)}</span>
                  )}
                  {isUnread && <div className="conv-unread-dot" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <NewConvModal
          myUid={user?.uid}
          onSelect={handleSelectUser}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
}