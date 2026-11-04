import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDcz1TSy-sO56memjsnZSeGFo0IJo3BUSQ",
  authDomain: "ahmed--alkholy.firebaseapp.com",
  projectId: "ahmed--alkholy",
  storageBucket: "ahmed--alkholy.firebasestorage.app",
  messagingSenderId: "1046168731455",
  appId: "1:1046168731455:web:4c6039879729bd98355d8a",
  measurementId: "G-3K89KNQY3Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
