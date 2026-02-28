import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { readSheetData } from '../services/sheetsService';
import { getCorrections } from '../services/firestoreService';

export default function DashboardPage() {
    const { user } = useAuth();
    const [recentData, setRecentData] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, avgScore: 0, students: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Try to load from Sheets
            let data = [];
            try {
                data = await readSheetData();
            } catch (e) {
                console.log('Sheets nu este configurat:', e.message);
            }

            // Stats
            const today = new Date().toLocaleDateString('ro-RO');
            const todayItems = data.filter(d => d.data === today);
            const scores = data.filter(d => d.punctaj > 0).map(d => d.punctaj);
            const avgScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;
            const uniqueStudents = new Set(data.map(d => d.numeElev)).size;

            setStats({
                total: data.length,
                today: todayItems.length,
                avgScore,
                students: uniqueStudents
            });

            setRecentData(data.slice(-5).reverse());
        } catch (error) {
            console.error('Eroare încărcare dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bună dimineața';
        if (hour < 18) return 'Bună ziua';
        return 'Bună seara';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Se încarcă datele...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>
                    👋 {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Profesor'}!
                </h1>
                <p>Iată o privire de ansamblu asupra activității tale de corectare.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">📝</div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Total corectări</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">📅</div>
                    <div className="stat-info">
                        <h3>{stats.today}</h3>
                        <p>Corectări azi</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">📊</div>
                    <div className="stat-info">
                        <h3>{stats.avgScore}%</h3>
                        <p>Punctaj mediu</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon red">👨‍🎓</div>
                    <div className="stat-info">
                        <h3>{stats.students}</h3>
                        <p>Elevi unici</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h2>⚡ Acțiuni rapide</h2>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <Link to="/corectare" className="btn btn-primary btn-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        Corectare nouă
                    </Link>
                    <Link to="/istoric" className="btn btn-secondary btn-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        Istoric elevi
                    </Link>
                </div>
            </div>

            {/* Recent Corrections */}
            <div className="card">
                <div className="card-header">
                    <h2>📋 Corectări recente</h2>
                    <Link to="/istoric" className="btn btn-ghost btn-sm">
                        Vezi toate →
                    </Link>
                </div>

                {recentData.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <h3>Nicio corectare încă</h3>
                        <p>Începe prin a încărca un test sau caiet.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Elev</th>
                                    <th>Clasă</th>
                                    <th>Data</th>
                                    <th>Punctaj</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentData.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 600 }}>{item.numeElev || 'N/A'}</td>
                                        <td>{item.clasa || 'N/A'}</td>
                                        <td className="text-muted">{item.data || 'N/A'}</td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: item.punctaj >= 70 ? 'var(--success-700)' : item.punctaj >= 50 ? 'var(--warning-700)' : 'var(--error-700)'
                                            }}>
                                                {item.punctaj || 0}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${item.punctaj >= 50 ? 'badge-success' : 'badge-ortografie'}`}>
                                                {item.punctaj >= 50 ? '✓ Promovat' : '✗ Nepromovat'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
