import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase avec les clés réelles fournies
const firebaseConfig = {
  apiKey: "AIzaSyCcFfAMoPDlBU2gNWyH-F4_XOSDdFTutIo",
  authDomain: "zuabillet-v27-cff93.firebaseapp.com",
  projectId: "zuabillet-v27-cff93",
  storageBucket: "zuabillet-v27-cff93.firebasestorage.app",
  messagingSenderId: "320354633560",
  appId: "1:320354633560:web:b775d88322f16685a7c72d"
};

// Initialisation de l'App D'ABORD
const app = initializeApp(firebaseConfig);

// Initialisation des services ENSUITE (en passant 'app')
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;