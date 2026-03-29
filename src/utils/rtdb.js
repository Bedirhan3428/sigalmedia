import { rtdb } from '../firebase';
import {
  ref, push, set, get, update, onValue,
  query, orderByChild, limitToLast, serverTimestamp,
  off
} from 'firebase/database';

// ─── CONVERSATION ID HELPER ───────────────────────────────────────────────────
export function getConvId(uid1, uid2) {
  return [uid1, uid2].sort().join('__');
}

// ─── START OR GET CONVERSATION ───────────────────────────────────────────────
export async function getOrCreateConversation(myUid, theirUid, theirProfile) {
  const convId   = getConvId(myUid, theirUid);
  const convRef  = ref(rtdb, `conversations/${convId}`);
  const snapshot = await get(convRef);

  if (!snapshot.exists()) {
    await set(convRef, {
      participants:    { [myUid]: true, [theirUid]: true },
      createdAt:       serverTimestamp(),
      lastMessage:     null,
      participantInfo: {
        [theirUid]: {
          username:  theirProfile.username || 'Kullanıcı',
          avatarUrl: theirProfile.avatarUrl || null,
        },
        [myUid]: {
          username:  null, // filled by caller
          avatarUrl: null,
        }
      }
    });

    // Add to user conversation lists
    await Promise.all([
      set(ref(rtdb, `userConversations/${myUid}/${convId}`),   { partnerUid: theirUid, updatedAt: Date.now() }),
      set(ref(rtdb, `userConversations/${theirUid}/${convId}`), { partnerUid: myUid,    updatedAt: Date.now() }),
    ]);
  }

  return convId;
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
export async function sendMessage(convId, senderId, content) {
  const { text, imageUrl, videoUrl, type = 'text' } = content;

  const msgRef = push(ref(rtdb, `messages/${convId}`));
  const msg    = {
    senderId,
    type,
    timestamp: serverTimestamp(),
    read:      false,
    ...(text     && { text }),
    ...(imageUrl && { imageUrl }),
    ...(videoUrl && { videoUrl }),
  };

  await Promise.all([
    set(msgRef, msg),
    update(ref(rtdb, `conversations/${convId}`), {
      lastMessage: {
        text:      text || (type === 'image' ? '📷 Fotoğraf' : '🎬 Video'),
        senderId,
        timestamp: serverTimestamp(),
      }
    }),
    update(ref(rtdb, `userConversations/${senderId}/${convId}`), {
      updatedAt: Date.now(),
    }),
  ]);

  return msgRef.key;
}

// ─── SUBSCRIBE TO MESSAGES ────────────────────────────────────────────────────
export function subscribeToMessages(convId, callback) {
  const msgsRef = query(
    ref(rtdb, `messages/${convId}`),
    orderByChild('timestamp'),
    limitToLast(100)
  );

  const unsub = onValue(msgsRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((child) => {
      messages.push({ id: child.key, ...child.val() });
    });
    callback(messages);
  });

  return () => off(msgsRef, 'value', unsub);
}

// ─── SUBSCRIBE TO CONVERSATIONS ──────────────────────────────────────────────
export function subscribeToConversations(myUid, callback) {
  const userConvsRef = ref(rtdb, `userConversations/${myUid}`);

  const unsub = onValue(userConvsRef, async (snapshot) => {
    const convKeys = [];
    snapshot.forEach((child) => {
      convKeys.push({ id: child.key, ...child.val() });
    });

    if (!convKeys.length) { callback([]); return; }

    // Sort by updatedAt desc
    convKeys.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    // Fetch conversation details
    const convDetails = await Promise.all(
      convKeys.map(async (uc) => {
        const convSnap = await get(ref(rtdb, `conversations/${uc.id}`));
        if (!convSnap.exists()) return null;
        const conv = convSnap.val();
        return {
          id:          uc.id,
          partnerUid:  uc.partnerUid,
          partner:     conv.participantInfo?.[uc.partnerUid] || {},
          lastMessage: conv.lastMessage || null,
          updatedAt:   uc.updatedAt || 0,
        };
      })
    );

    callback(convDetails.filter(Boolean));
  });

  return () => off(userConvsRef, 'value', unsub);
}

// ─── MARK MESSAGES AS READ ────────────────────────────────────────────────────
export async function markMessagesRead(convId, myUid) {
  const msgsRef  = ref(rtdb, `messages/${convId}`);
  const snapshot = await get(msgsRef);
  const updates  = {};

  snapshot.forEach((child) => {
    const msg = child.val();
    if (msg.senderId !== myUid && !msg.read) {
      updates[`messages/${convId}/${child.key}/read`] = true;
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates);
  }
}

// ─── GET UNREAD COUNT ─────────────────────────────────────────────────────────
export function subscribeToUnreadCount(myUid, callback) {
  const userConvsRef = ref(rtdb, `userConversations/${myUid}`);

  const unsub = onValue(userConvsRef, async (snapshot) => {
    const convIds = [];
    snapshot.forEach((child) => { convIds.push(child.key); });

    let total = 0;
    await Promise.all(
      convIds.map(async (convId) => {
        const msgsSnap = await get(ref(rtdb, `messages/${convId}`));
        msgsSnap.forEach((child) => {
          const msg = child.val();
          if (msg.senderId !== myUid && !msg.read) total++;
        });
      })
    );

    callback(total);
  });

  return () => off(userConvsRef, 'value', unsub);
}
