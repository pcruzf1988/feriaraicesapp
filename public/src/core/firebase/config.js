// Firebase Web config.
//
// IMPORTANT: this is NOT a secret. The Firebase web config (apiKey, etc.) is
// designed to be public and ships to every browser. What protects your data are
// the Firestore/Storage Security Rules (see firestore.rules), not hiding these
// values. That's why this file is committed to the repo.
//
// HOW TO FILL IT:
//   1. Firebase Console -> Project settings -> "Your apps" -> Web app (</>).
//   2. Register the app (no Hosting setup needed there) and copy the config.
//   3. Replace the placeholders below with the real values.
//
// While the placeholders are here, the app loads but Firebase calls will fail —
// that's expected until you connect a real project.

export const firebaseConfig = {
  apiKey: "AIzaSyAiHclF39mYiSDeFtaSwsDxPF7Zm7-Dm_s",
  authDomain: "feria-raices-app.firebaseapp.com",
  projectId: "feria-raices-app",
  storageBucket: "feria-raices-app.firebasestorage.app",
  messagingSenderId: "531672159034",
  appId: "1:531672159034:web:33ee838e97b98b6d49f603",
  measurementId: "G-1JBCS9LZC0",
};

// Set to true to point Auth/Firestore/Storage at the local Firebase Emulators.
export const USE_EMULATORS = false;
