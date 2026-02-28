import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';

export const loginWithGoogle = async () => {
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

export const logout = async () => {
    try {
        sessionStorage.removeItem('google_access_token');
        await signOut(auth);
    } catch (error) {
        console.error('Eroare la deconectare:', error);
        throw error;
    }
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export const getGoogleAccessToken = () => {
    return sessionStorage.getItem('google_access_token');
};
