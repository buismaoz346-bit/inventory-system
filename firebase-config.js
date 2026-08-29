/* ============================================================
   ElectroParts IMS — Firebase Configuration
   ============================================================
   SETUP GUIDE (Free — Firebase Spark Plan):
   
   1. Go to https://console.firebase.google.com
   2. Click "Create a project" → name it "ElectroParts-IMS"
   3. Go to Build → Authentication → Get Started
   4. Enable "Google" provider (click, toggle ON, save)
   5. Enable "Email/Password" provider (toggle ON, save)
   6. Go to Project Settings (gear icon) → General
   7. Scroll to "Your apps" → click Web icon (</>)
   8. Register app name → copy the firebaseConfig values below
   9. IMPORTANT: Also go to Authentication → Settings → Authorized domains
      and add your GitHub Pages domain (e.g. username.github.io)
   
   Once configured, set FIREBASE_ENABLED = true below.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyADUL0t6Hi2mCOVH94P_1U89Evg1w8XodQ",
  authDomain: "electropart-9b605.firebaseapp.com",
  databaseURL: "https://electropart-9b605-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "electropart-9b605",
  storageBucket: "electropart-9b605.firebasestorage.app",
  messagingSenderId: "397434875831",
  appId: "1:397434875831:web:03be63a347890ccb530232",
  measurementId: "G-BVTLFP9J5D"
};

// ▼▼▼ Set this to true AFTER filling in the config above ▼▼▼
const FIREBASE_ENABLED = true;
// ▲▲▲ When false, a local demo auth system is used ▲▲▲
