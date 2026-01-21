
// import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJaqFcglzv-TgxJF5uFpktjf8AOw6gmXQ",
  authDomain: "gate-id.firebaseapp.com",
  projectId: "gate-id",
  storageBucket: "gate-id.firebasestorage.app",
  messagingSenderId: "447898068887",
  appId: "1:447898068887:web:b541a4e103e0495af906d2",
  measurementId: "G-JK74N4R6WJ"
};

// Init Firebase
export const app = initializeApp(firebaseConfig);
// export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
// src/firebase.js

