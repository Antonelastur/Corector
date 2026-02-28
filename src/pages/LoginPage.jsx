import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    const { user, login, guestLogin, loading, isFirebaseConfigured } = useAuth();

    if (loading) {
        return (
            <div className="login-page">
                <div className="loading-container">
                    <div className="spinner" style={{ borderTopColor: 'white' }}></div>
                </div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            console.error('Eroare autentificare:', error);
        }
    };

    const handleGuestLogin = () => {
        guestLogin();
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1A237E" />
                                <stop offset="100%" stopColor="#42A5F5" />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="45" fill="url(#loginGrad)" />
                        <text x="50" y="62" textAnchor="middle" fill="white" fontFamily="Inter,sans-serif" fontSize="36" fontWeight="700">C</text>
                        <path d="M25 72 L40 55 L48 63 L75 32" stroke="#4CAF50" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    </svg>
                </div>

                <h1>Corector</h1>
                <p>Corectare automată a testelor și caietelor elevilor</p>

                {isFirebaseConfigured ? (
                    <button className="btn-google" onClick={handleLogin}>
                        <svg viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Conectare cu Google
                    </button>
                ) : (
                    <button className="btn btn-primary btn-lg w-full" onClick={handleGuestLogin} style={{ padding: '14px 32px', fontSize: '1rem' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Intră în aplicație
                    </button>
                )}

                {!isFirebaseConfigured && (
                    <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)' }}>
                        <p className="text-sm" style={{ color: 'var(--primary-800)', textAlign: 'center' }}>
                            ℹ️ Mod demo — Google Sheets & Gemini API sunt active
                        </p>
                    </div>
                )}

                <div style={{ marginTop: 'var(--space-xl)', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                    <p>Aplicație pentru uz școlar</p>
                    <p style={{ marginTop: '4px' }}>Integrată cu workflow n8n</p>
                </div>
            </div>
        </div>
    );
}
