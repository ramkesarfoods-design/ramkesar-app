import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔥 Firebase Config (YOUR ORIGINAL KEYS)
const firebaseConfig = {
  apiKey: "AIzaSyD4JLhWDWkLl3PJn1feQED2Egu1EzlRt_A",
  authDomain: "ramkesar-delivery-332e3.firebaseapp.com",
  projectId: "ramkesar-delivery-332e3",
  storageBucket: "ramkesar-delivery-332e3.firebasestorage.app",
  messagingSenderId: "934891389570",
  appId: "1:934891389570:web:dded6e382e0e947375ea9b",
};

// ✅ FIX: multiple init se bachne ke liye
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// 🔥 Firestore
export const db = getFirestore(app);
export const storage = getStorage(app);
// 🔥 Auth (IMPORTANT)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
