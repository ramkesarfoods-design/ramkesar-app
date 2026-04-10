import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔥 Firebase Config (same jo tumne diya)
const firebaseConfig = {
  apiKey: "AIzaSyD4JLhWDWkLl3PJn1feQED2Egu1EzlRt_A",
  authDomain: "ramkesar-delivery-332e3.firebaseapp.com",
  projectId: "ramkesar-delivery-332e3",
  storageBucket: "ramkesar-delivery-332e3.firebasestorage.app",
  messagingSenderId: "934891389570",
  appId: "1:934891389570:web:dded6e382e0e947375ea9b",
};

// 🔥 Initialize App
const app = initializeApp(firebaseConfig);

// 🔐 Auth
const auth = getAuth(app);

// 🔑 Google Provider
const provider = new GoogleAuthProvider();

export { auth, provider };
