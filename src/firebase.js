import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDNA6j76_dJn1RCwTR2m_FGPYgwvrh4m8o",
  authDomain: "sigalmedia.firebaseapp.com",
  projectId: "sigalmedia",
  storageBucket: "sigalmedia.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const storage = getStorage(app);