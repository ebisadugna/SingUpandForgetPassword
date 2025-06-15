import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

console.log("Firebase API key:", process.env.REACT_APP_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey:"AIzaSyAvBZGx1bZkjx71_Tb_l0wF-CfNSHvLO88",
  authDomain:"dashboard-signup-a12f5.firebaseapp.com",
  projectId:"dashboard-signup-a12f5",
  storageBucket:"dashboard-signup-a12f5.firebasestorage.app",
  messagingSenderId:"654540046644",
  appId:"1:654540046644:web:a001dbe513edcf0609e561",
  measurementId:"G-BSDP5YX82B",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Get Auth instance
const auth = getAuth(app)

export { app, auth }
