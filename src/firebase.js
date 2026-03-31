import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  databaseURL:   import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const storage = getStorage(app);
export const rtdb    = getDatabase(app); // Firebase Realtime Database for DMs
