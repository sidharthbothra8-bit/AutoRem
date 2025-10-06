import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAR2U6I1mz4tNduH03oXdkDY_qLCMg525w",
  authDomain: "autopay-2c24c.firebaseapp.com",
  projectId: "autopay-2c24c",
  storageBucket: "autopay-2c24c.firebasestorage.app",
  messagingSenderId: "958921690853",
  appId: "1:958921690853:web:a4ff6261524c3f19f18e0c",
  measurementId: "G-JZ1YTV3CK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get authentication and database services
export const auth = getAuth(app);
export const db = getFirestore(app); // This is ready for when you add cloud storage