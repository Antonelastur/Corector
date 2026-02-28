import { useAuth } from '../../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
    const { user, signOut } = useAuth();

    return (
        <nav className="navbar">
            <div className="flex items-center gap-md">
                <button className="hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <Link to="/" className="navbar-brand">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1A237E" />
                                <stop offset="100%" stopColor="#42A5F5" />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="45" fill="url(#navGrad)" />
                        <text x="50" y="62" textAnchor="middle" fill="white" fontFamily="Inter,sans-serif" fontSize="36" fontWeight="700">C</text>
                    </svg>
                    Corector
                </Link>
            </div>

            <div className="navbar-user">
                {user && (
                    <>
                        <span className="text-sm" style={{ color: 'var(--gray-600)' }}>
                            {user.displayName}
                        </span>
                        {user.photoURL && (
                            <img src={user.photoURL} alt="Avatar" className="navbar-avatar" referrerPolicy="no-referrer" />
                        )}
                        <button onClick={signOut} className="btn btn-ghost btn-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Ieșire
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
