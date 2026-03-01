import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebaseConfig';

// Guest user for when Firebase is not configured
const GUEST_USER = {
    uid: 'guest',
    displayName: 'Profesor (mod invitat)',
    email: 'guest@corector.app',
    photoURL: null,
    isGuest: true
};

export const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
        sessionStorage.setItem('guest_mode', 'true');
        return GUEST_USER;
    }

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = result._tokenResponse;
        const accessToken = credential?.oauthAccessToken;
        if (accessToken) {
            sessionStorage.setItem('google_access_token', accessToken);
        }
        return result.user;
    } catch (error) {
        console.error('Eroare la autentificare:', error);
        throw error;
    }
};

export const loginAsGuest = () => {
    sessionStorage.setItem('guest_mode', 'true');
    return GUEST_USER;
};

export const logout = async () => {
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('guest_mode');
    if (isFirebaseConfigured && auth) {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Eroare la deconectare:', error);
        }
    }
};

export const onAuthChange = (callback) => {
    // Check for guest mode first (works regardless of Firebase config)
    if (sessionStorage.getItem('guest_mode') === 'true') {
        setTimeout(() => callback(GUEST_USER), 0);
        return () => { };
    }

    // If Firebase is configured, use Firebase Auth
    if (isFirebaseConfigured && auth) {
        return onAuthStateChanged(auth, callback);
    }

    // No Firebase, no guest mode
    setTimeout(() => callback(null), 0);
    return () => { };
};

export const getGoogleAccessToken = () => {
    return sessionStorage.getItem('google_access_token');
};

export { isFirebaseConfigured, GUEST_USER };
