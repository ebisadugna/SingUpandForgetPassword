import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

console.log("Firebase API key:", process.env.REACT_APP_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAvBZGx1bZkjx71_Tb_l0wF-CfNSHvLO88",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "dashboard-signup-a12f5.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "dashboard-signup-a12f5",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "dashboard-signup-a12f5.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "654540046644",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:654540046644:web:a001dbe513edcf0609e561",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-BSDP5YX82B",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Get Auth instance
const auth = getAuth(app)

export { app, auth }
