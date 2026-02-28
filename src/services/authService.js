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
    // If Firebase is configured, always use Firebase Auth (ignore guest_mode flag)
    if (isFirebaseConfigured && auth) {
        // Clear any stale guest_mode flag
        sessionStorage.removeItem('guest_mode');
        return onAuthStateChanged(auth, callback);
    }

    // Firebase NOT configured: check for guest mode
    if (sessionStorage.getItem('guest_mode') === 'true') {
        setTimeout(() => callback(GUEST_USER), 0);
        return () => { };
    }

    // No Firebase, no guest mode
    setTimeout(() => callback(null), 0);
    return () => { };
};

export const getGoogleAccessToken = () => {
    return sessionStorage.getItem('google_access_token');
};

export { isFirebaseConfigured, GUEST_USER };
