import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCorrections } from '../services/firestoreService';
import ProgressChart from '../components/ProgressChart';
import ErrorFeedback from '../components/ErrorFeedback';
import RemedialExercises from '../components/RemedialExercises';
import PdfExport from '../components/PdfExport';

export default function StudentHistoryPage() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (!user?.uid) return;

            let firestoreData = await getCorrections(user.uid);

            if (!firestoreData || firestoreData.length === 0) {
                // Keep demo data if no corrections yet, so user sees something
                console.log('Nicio corectare găsită, se folosesc datele demo');
                const demoData = getDemoData();
                setData(demoData);
                setClasses([...new Set(demoData.map(d => d.clasa).filter(Boolean))]);
                setLoading(false);
                return;
            }

            // Map to unified format expected by the StudentHistory UI
            const sheetsData = firestoreData.map(c => {
                let punctaj = 0;
                if (c.mode === 'test') {
                    punctaj = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0;
                } else {
                    const errCount = c.errors?.length || 0;
                    punctaj = Math.max(10, 100 - errCount * 5);
                }

                return {
                    id: c.id,
                    numeElev: c.studentName || 'Necunoscut',
                    clasa: c.className || '',
                    data: c.date ? new Date(c.date).toLocaleDateString('ro-RO') : '',
                    textOcr: c.ocrText || '',
                    greseliJson: c.mode === 'test'
                        ? (c.baremResult?.items || []).filter(i => !i.corect).map(i => ({ tip: 'continut', textGresit: i.raspunsElev || '-', textCorect: i.raspunsCorect || '-', explicatie: i.feedback }))
                        : (c.errors || []),
                    punctaj: punctaj
                };
            });

            setData(sheetsData);

            // Extract unique classes
            const uniqueClasses = [...new Set(sheetsData.map(d => d.clasa).filter(Boolean))];
            setClasses(uniqueClasses);
        } catch (error) {
            console.error('Eroare încărcare date:', error);
            setData(getDemoData());
        } finally {
            setLoading(false);
        }
    };

    const getDemoData = () => [
        { id: '1', numeElev: 'Maria Ionescu', clasa: 'V A', data: '2026-02-28', textOcr: 'Text exemplu scris de elev cu unele greseli de ortografie si gramatica.', greseliJson: [{ tip: 'ortografie', textGresit: 'greseli', textCorect: 'greșeli', explicatie: 'Se scrie cu ș, nu cu s.' }, { tip: 'gramatica', textGresit: 'si', textCorect: 'și', explicatie: 'Conjuncția „și" se scrie cu î din i.' }], punctaj: 78 },
        { id: '2', numeElev: 'Andrei Popa', clasa: 'V A', data: '2026-02-28', textOcr: 'Exercitiul de matematica a fost rezolvat corect.', greseliJson: [{ tip: 'ortografie', textGresit: 'Exercitiul', textCorect: 'Exercițiul', explicatie: 'Se scrie cu ț.' }], punctaj: 92 },
        { id: '3', numeElev: 'Maria Ionescu', clasa: 'V A', data: '2026-02-27', textOcr: 'Compunerea mea despre natura.', greseliJson: [], punctaj: 85 },
        { id: '4', numeElev: 'Elena Dumitrescu', clasa: 'V B', data: '2026-02-27', textOcr: 'Testul de limba romana a fost greu.', greseliJson: [{ tip: 'ortografie', textGresit: 'romana', textCorect: 'română', explicatie: 'Se scrie cu â.' }, { tip: 'gramatica', textGresit: 'a fost greu', textCorect: 'a fost grea', explicatie: 'Adjectivul trebuie acordat cu substantivul.' }], punctaj: 65 },
        { id: '5', numeElev: 'Andrei Popa', clasa: 'V A', data: '2026-02-26', textOcr: 'Rezolvarea problemelor de algebră.', greseliJson: [], punctaj: 88 },
    ];

    // Group data by student
    const studentMap = {};
    data.forEach(item => {
        const name = item.numeElev;
        if (!name) return;
        if (!studentMap[name]) {
            studentMap[name] = {
                name,
                class: item.clasa,
                corrections: [],
                totalErrors: 0,
                avgScore: 0
            };
        }
        studentMap[name].corrections.push(item);
        const errs = item.greseliJson || [];
        studentMap[name].totalErrors += errs.length;
    });

    // Calculate averages
    Object.values(studentMap).forEach(student => {
        const scores = student.corrections.filter(c => c.punctaj > 0).map(c => c.punctaj);
        student.avgScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
    });

    const students = Object.values(studentMap).filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchClass = !filterClass || s.class === filterClass;
        return matchSearch && matchClass;
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Se încarcă datele elevilor...</p>
            </div>
        );
    }

    // Student Detail View
    if (selectedStudent) {
        const student = studentMap[selectedStudent];
        if (!student) return null;

        const chartData = student.corrections.map(c => ({
            date: c.data,
            score: c.punctaj
        })).reverse();

        const allErrors = student.corrections.flatMap(c => c.greseliJson || []);

        // Top mistakes
        const errorCounts = {};
        allErrors.forEach(e => {
            const key = e.textGresit;
            if (!errorCounts[key]) errorCounts[key] = { ...e, count: 0 };
            errorCounts[key].count++;
        });
        const topErrors = Object.values(errorCounts).sort((a, b) => b.count - a.count).slice(0, 5);

        return (
            <div>
                <button className="btn btn-ghost" onClick={() => setSelectedStudent(null)} style={{ marginBottom: 'var(--space-lg)' }}>
                    ← Înapoi la lista elevilor
                </button>

                <div className="page-header">
                    <h1>👨‍🎓 {student.name}</h1>
                    <p>Clasa {student.class} • {student.corrections.length} corectări • Media: {student.avgScore}%</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue">📝</div>
                        <div className="stat-info">
                            <h3>{student.corrections.length}</h3>
                            <p>Total corectări</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">📊</div>
                        <div className="stat-info">
                            <h3>{student.avgScore}%</h3>
                            <p>Punctaj mediu</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">⚠️</div>
                        <div className="stat-info">
                            <h3>{student.totalErrors}</h3>
                            <p>Total greșeli</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red">🎯</div>
                        <div className="stat-info">
                            <h3>{topErrors.length > 0 ? topErrors[0].tip : '-'}</h3>
                            <p>Tip frecvent</p>
                        </div>
                    </div>
                </div>

                {/* Progress Chart */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <ProgressChart data={chartData} title={`Evoluție punctaj — ${student.name}`} />
                </div>

                {/* Top Mistakes */}
                {topErrors.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="card-header">
                            <h2>🔝 Greșeli frecvente</h2>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Greșeală</th>
                                        <th>Corect</th>
                                        <th>Tip</th>
                                        <th>Frecvență</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topErrors.map((err, i) => (
                                        <tr key={i}>
                                            <td className="error-wrong">{err.textGresit}</td>
                                            <td className="error-correct">{err.textCorect}</td>
                                            <td><span className={`badge badge-${err.tip === 'ortografie' ? 'ortografie' : err.tip === 'gramatica' ? 'gramatica' : 'continut'}`}>{err.tip}</span></td>
                                            <td style={{ fontWeight: 700 }}>{err.count}×</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Correction History */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="card-header">
                        <h2>📋 Istoric corectări</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Punctaj</th>
                                    <th>Greșeli</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.corrections.map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.data}</td>
                                        <td style={{ fontWeight: 700, color: c.punctaj >= 70 ? 'var(--success-700)' : c.punctaj >= 50 ? 'var(--warning-700)' : 'var(--error-700)' }}>
                                            {c.punctaj}%
                                        </td>
                                        <td>{(c.greseliJson || []).length}</td>
                                        <td>
                                            <span className={`badge ${c.punctaj >= 50 ? 'badge-success' : 'badge-ortografie'}`}>
                                                {c.punctaj >= 50 ? '✓ Promovat' : '✗ Nepromovat'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <PdfExport
                                                correctionData={{
                                                    studentName: student.name,
                                                    className: student.class,
                                                    date: c.data,
                                                    score: c.punctaj,
                                                    maxScore: 100,
                                                    errors: c.greseliJson || [],
                                                    ocrText: c.textOcr
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Remedial Exercises */}
                {allErrors.length > 0 && (
                    <RemedialExercises errors={allErrors.slice(0, 5)} />
                )}
            </div>
        );
    }

    // Student List View
    return (
        <div>
            <div className="page-header">
                <h1>👨‍🎓 Istoric elevi</h1>
                <p>Vezi toate corectările și progresul elevilor tăi.</p>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <input
                    type="text"
                    className="input"
                    placeholder="🔍 Caută elev..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="input select"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                >
                    <option value="">Toate clasele</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Students Grid */}
            {students.length === 0 ? (
                <div className="empty-state card">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                    <h3>Niciun elev găsit</h3>
                    <p>Modifică filtrele sau încarcă o corectare nouă.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
                    {students.map((student, index) => (
                        <div
                            key={index}
                            className="card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedStudent(student.name)}
                        >
                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, color: 'var(--primary-800)', fontSize: '1.1rem'
                                }}>
                                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>{student.name}</h3>
                                    <span className="text-sm text-muted">Clasa {student.class}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="text-sm">
                                    <span className="text-muted">{student.corrections.length} corectări</span>
                                    <span style={{ margin: '0 8px', color: 'var(--gray-300)' }}>•</span>
                                    <span className="text-muted">{student.totalErrors} greșeli</span>
                                </div>
                                <div style={{
                                    fontSize: '1.1rem', fontWeight: 800,
                                    color: student.avgScore >= 70 ? 'var(--success-700)' : student.avgScore >= 50 ? 'var(--warning-700)' : 'var(--error-700)'
                                }}>
                                    {student.avgScore}%
                                </div>
                            </div>

                            {/* Mini progress bar */}
                            <div style={{
                                marginTop: 'var(--space-sm)',
                                height: 4, borderRadius: 2, background: 'var(--gray-200)'
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 2,
                                    width: `${student.avgScore}%`,
                                    background: student.avgScore >= 70 ? 'var(--success-500)' : student.avgScore >= 50 ? 'var(--warning-500)' : 'var(--error-500)',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
