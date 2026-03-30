import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, ImagePlus, X, Loader2, Info } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { storage, database } from '../firebase';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
  markMessagesRead,
} from '../utils/rtdb';
import { API_URL } from '../apiConfig';
import { compressImage } from '../utils/mediaCompressor';

function dayLabel(ts) {
  if (!ts) return '';
  const d     = new Date(ts);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.floor((today - d) / 86400000);
  if (diff === 0)  return 'Bugün';
  if (diff === 1)  return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

// Animated typing dots bubble
function TypingBubble() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '10px 16px',
      background: 'var(--surface-2)',
      borderRadius: '18px 18px 18px 4px',
      width: 'fit-content',
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--text-2)',
          display: 'inline-block',
          animation: 'typingBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0);   opacity: 0.35; }
          30%            { transform: translateY(-5px); opacity: 1;    }
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  const { partnerUid }  = useParams();
  const user            = useAuth();
  const navigate        = useNavigate();
  const messagesEndRef  = useRef(null);
  const fileRef         = useRef();
  const typingTimerRef  = useRef(null);

  const [partner,       setPartner]       = useState(null);
  const [convId,        setConvId]        = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [sending,       setSending]       = useState(false);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Load partner profile + create/get conversation
  useEffect(() => {
    if (!user?.uid || !partnerUid) return;

    Promise.all([
      fetch(`${API_URL}/api/public-user/${partnerUid}`).then(r => r.json()),
      fetch(`${API_URL}/api/user/${user.uid}`).then(r => r.json()),
    ]).then(async ([partnerData, myData]) => {
      const p = partnerData.username ? partnerData : partnerData.user;
      setPartner(p);

      const cid = await getOrCreateConversation(user.uid, partnerUid, {
        username:  p.username,
        avatarUrl: p.avatarUrl || null,
      });
      setConvId(cid);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.uid, partnerUid]);

  // Subscribe to messages
  useEffect(() => {
    if (!convId) return;
    const unsub = subscribeToMessages(convId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });
    markMessagesRead(convId, user.uid).catch(() => {});
    return unsub;
  }, [convId, user?.uid]);

  // Listen for partner typing status
  useEffect(() => {
    if (!convId || !partnerUid) return;
    const r = dbRef(database, `typing/${convId}/${partnerUid}`);
    const unsub = onValue(r, (snap) => setPartnerTyping(!!snap.val()));
    return () => unsub();
  }, [convId, partnerUid]);

  // Clear own typing flag on unmount / page leave
  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (convId && user?.uid) {
        set(dbRef(database, `typing/${convId}/${user.uid}`), false).catch(() => {});
      }
    };
  }, [convId, user?.uid]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (partnerTyping) scrollToBottom();
  }, [partnerTyping]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  // Broadcast own typing status
  const handleTextChange = (e) => {
    setText(e.target.value.slice(0, 1000));
    if (!convId || !user?.uid) return;
    set(dbRef(database, `typing/${convId}/${user.uid}`), true).catch(() => {});
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      set(dbRef(database, `typing/${convId}/${user.uid}`), false).catch(() => {});
    }, 2500);
  };

  // Send message
  const handleSend = async () => {
    if ((!text.trim() && !imagePreview) || sending || !convId) return;
    setSending(true);

    clearTimeout(typingTimerRef.current);
    set(dbRef(database, `typing/${convId}/${user.uid}`), false).catch(() => {});

    try {
      if (imagePreview) {
        const path = `dm-images/${convId}/${Date.now()}.jpg`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, imagePreview.file, { contentType: 'image/jpeg' });
        const imageUrl = await getDownloadURL(sRef);
        await sendMessage(convId, user.uid, { type: 'image', imageUrl, text: text.trim() || '' });
        setImagePreview(null);
      } else {
        await sendMessage(convId, user.uid, { type: 'text', text: text.trim() });
      }
      setText('');
    } catch (err) {
      console.error('Send error:', err);
    } finally { setSending(false); }
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file: compressed, url } = await compressImage(file);
      setImagePreview({ file: compressed, url });
    } catch {}
    e.target.value = '';
  };

  // Group messages by day + streak position
  const grouped = [];
  let lastDay = null;
  let lastSenderId = null;
  messages.forEach((msg, i) => {
    const ts  = msg.timestamp || 0;
    const day = new Date(ts).toDateString();
    if (day !== lastDay) {
      grouped.push({ type: 'day', label: dayLabel(ts), key: `day-${ts}` });
      lastDay = day;
      lastSenderId = null;
    }
    const nextMsg = messages[i + 1];
    const isFirstInStreak = msg.senderId !== lastSenderId;
    const isLastInStreak  = !nextMsg || nextMsg.senderId !== msg.senderId
                            || new Date(nextMsg.timestamp || 0).toDateString() !== day;
    lastSenderId = msg.senderId;
    grouped.push({ type: 'msg', ...msg, isFirstInStreak, isLastInStreak });
  });

  // Border radius: top-left, top-right, bottom-right, bottom-left
  const R = 18, r = 4;
  function bubbleRadius(isMine, isFirst, isLast) {
    if (isFirst && isLast) return `${R}px`;
    if (isMine) {
      if (isFirst) return `${R}px ${R}px ${r}px ${R}px`;
      if (isLast)  return `${R}px ${r}px ${R}px ${R}px`;
      return             `${R}px ${r}px ${r}px ${R}px`;
    } else {
      if (isFirst) return `${R}px ${R}px ${R}px ${r}px`;
      if (isLast)  return `${r}px ${R}px ${R}px ${R}px`;
      return             `${r}px ${R}px ${R}px ${r}px`;
    }
  }

  if (loading) return (
    <div className="page">
      <div className="center-loader"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="chat-header">
        <button className="ig-icon-btn" onClick={() => navigate(-1)} style={{ marginLeft: -8 }}>
          <ArrowLeft size={22} />
        </button>

        <div className="chat-header-user" onClick={() => navigate(`/user/${partnerUid}`)}>
          {partner?.avatarUrl
            ? <img src={partner.avatarUrl} alt="" className="chat-header-avatar" />
            : <div style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {(partner?.username || '?').charAt(0).toUpperCase()}
              </div>
          }
          <div>
            <div className="chat-header-name">{partner?.username || 'Kullanıcı'}</div>
          </div>
        </div>

        <button className="ig-icon-btn">
          <Info size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {grouped.map((item) => {
          if (item.type === 'day') {
            return <div key={item.key} className="chat-day-divider">{item.label}</div>;
          }

          const isMine     = item.senderId === user.uid;
          const showAvatar = !isMine && item.isFirstInStreak;
          const radius     = bubbleRadius(isMine, item.isFirstInStreak, item.isLastInStreak);

          return (
            <div
              key={item.id}
              className={`chat-msg-row ${isMine ? 'chat-msg-row--mine' : ''}`}
              style={{ marginBottom: item.isLastInStreak ? 8 : 2 }}
            >
              {/* Avatar slot */}
              {!isMine && (
                showAvatar
                  ? partner?.avatarUrl
                    ? <img src={partner.avatarUrl} alt="" className="chat-msg-avatar" />
                    : <div className="chat-msg-avatar" style={{ background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {(partner?.username || '?').charAt(0).toUpperCase()}
                      </div>
                  : <div className="chat-msg-avatar" style={{ visibility: 'hidden' }} />
              )}

              {item.imageUrl ? (
                <div className="chat-bubble-img" style={{ borderRadius: radius, overflow: 'hidden' }}>
                  <img src={item.imageUrl} alt="" />
                  {item.text && (
                    <div
                      className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}
                      style={{ borderRadius: '0 0 18px 18px', borderTop: 'none' }}
                    >
                      {item.text}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}
                  style={{ borderRadius: radius }}
                >
                  {item.text}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {partnerTyping && (
          <div className="chat-msg-row" style={{ marginBottom: 8, alignItems: 'flex-end' }}>
            {partner?.avatarUrl
              ? <img src={partner.avatarUrl} alt="" className="chat-msg-avatar" />
              : <div className="chat-msg-avatar" style={{ background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {(partner?.username || '?').charAt(0).toUpperCase()}
                </div>
            }
            <TypingBubble />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', gap: 12 }}>
            {partner?.avatarUrl
              ? <img src={partner.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>
                  {(partner?.username || '?').charAt(0).toUpperCase()}
                </div>
            }
            <div style={{ fontWeight: 700, fontSize: 17 }}>{partner?.username}</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, textAlign: 'center' }}>
              Sohbet başlatmak için bir mesaj gönder.
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{
          position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 470, width: '100%', padding: '0 16px', zIndex: 200,
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={imagePreview.url} alt="" style={{ height: 80, borderRadius: 10, objectFit: 'cover' }} />
            <button
              onClick={() => setImagePreview(null)}
              style={{
                position: 'absolute', top: -8, right: -8,
                width: 22, height: 22, borderRadius: '50%',
                background: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} color="#000" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        <button className="ig-icon-btn" onClick={() => fileRef.current?.click()} style={{ flexShrink: 0 }}>
          <ImagePlus size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />

        <textarea
          className="chat-input"
          placeholder="Mesaj yaz..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          rows={1}
          style={{ resize: 'none' }}
        />

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !imagePreview) || sending}
        >
          {sending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
