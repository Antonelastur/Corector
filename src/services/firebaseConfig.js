import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDGvGGnB6-lTZCt8wZUAuEmGBBwZDm1ex8',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'project-11842325-1d93-4033-b88.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'project-11842325-1d93-4033-b88',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'project-11842325-1d93-4033-b88.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '738892776448',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:738892776448:web:d1f30f76b280de5a2ac4e5'
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
    googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
}

export { auth, db, googleProvider };
export default app;
