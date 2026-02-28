import { useState, useEffect } from 'react';
import { readSheetData } from '../services/sheetsService';
import ProgressChart from '../components/ProgressChart';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatisticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            let sheetsData = [];
            try {
                sheetsData = await readSheetData();
            } catch {
                sheetsData = getDemoData();
            }
            setData(sheetsData);
        } catch (error) {
            setData(getDemoData());
        } finally {
            setLoading(false);
        }
    };

    const getDemoData = () => [
        { numeElev: 'Maria Ionescu', clasa: 'V A', data: '2026-02-20', greseliJson: [{ tip: 'ortografie' }, { tip: 'gramatica' }], punctaj: 72 },
        { numeElev: 'Andrei Popa', clasa: 'V A', data: '2026-02-21', greseliJson: [{ tip: 'ortografie' }], punctaj: 88 },
        { numeElev: 'Maria Ionescu', clasa: 'V A', data: '2026-02-22', greseliJson: [{ tip: 'gramatica' }], punctaj: 85 },
        { numeElev: 'Elena Dumitrescu', clasa: 'V B', data: '2026-02-23', greseliJson: [{ tip: 'ortografie' }, { tip: 'continut' }], punctaj: 65 },
        { numeElev: 'Andrei Popa', clasa: 'V A', data: '2026-02-24', greseliJson: [], punctaj: 92 },
        { numeElev: 'Maria Ionescu', clasa: 'V A', data: '2026-02-25', greseliJson: [], punctaj: 90 },
        { numeElev: 'Elena Dumitrescu', clasa: 'V B', data: '2026-02-26', greseliJson: [{ tip: 'gramatica' }], punctaj: 74 },
        { numeElev: 'Ion Marin', clasa: 'V B', data: '2026-02-27', greseliJson: [{ tip: 'ortografie' }, { tip: 'ortografie' }, { tip: 'gramatica' }], punctaj: 58 },
        { numeElev: 'Andrei Popa', clasa: 'V A', data: '2026-02-28', greseliJson: [], punctaj: 95 },
    ];

    // Compute stats
    const allErrors = data.flatMap(d => d.greseliJson || []);
    const errorByType = {
        ortografie: allErrors.filter(e => e.tip === 'ortografie').length,
        gramatica: allErrors.filter(e => e.tip === 'gramatica').length,
        continut: allErrors.filter(e => e.tip === 'continut').length
    };

    // Scores over time (grouped by date)
    const dateMap = {};
    data.forEach(d => {
        if (!d.data || !d.punctaj) return;
        if (!dateMap[d.data]) dateMap[d.data] = [];
        dateMap[d.data].push(d.punctaj);
    });

    const timelineData = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, scores]) => ({
            date,
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }));

    // Scores by class
    const classMap = {};
    data.forEach(d => {
        if (!d.clasa || !d.punctaj) return;
        if (!classMap[d.clasa]) classMap[d.clasa] = [];
        classMap[d.clasa].push(d.punctaj);
    });

    const classBarData = {
        labels: Object.keys(classMap),
        datasets: [{
            label: 'Punctaj mediu',
            data: Object.values(classMap).map(scores =>
                Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            ),
            backgroundColor: [
                'rgba(63, 81, 181, 0.7)',
                'rgba(76, 175, 80, 0.7)',
                'rgba(255, 152, 0, 0.7)',
                'rgba(244, 67, 54, 0.7)',
            ],
            borderColor: [
                '#3F51B5',
                '#4CAF50',
                '#FF9800',
                '#F44336',
            ],
            borderWidth: 2,
            borderRadius: 8
        }]
    };

    const errorBarData = {
        labels: ['Ortografie', 'Gramatică', 'Conținut'],
        datasets: [{
            label: 'Număr greșeli',
            data: [errorByType.ortografie, errorByType.gramatica, errorByType.continut],
            backgroundColor: [
                'rgba(198, 40, 40, 0.7)',
                'rgba(230, 81, 0, 0.7)',
                'rgba(21, 101, 192, 0.7)',
            ],
            borderColor: ['#C62828', '#E65100', '#1565C0'],
            borderWidth: 2,
            borderRadius: 8
        }]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(26, 35, 126, 0.9)',
                cornerRadius: 8,
                padding: 12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { family: 'Inter' } }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', weight: 600 } }
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Se încarcă statisticile...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>📊 Statistici</h1>
                <p>Analiză generală a performanței elevilor.</p>
            </div>

            {/* Overview Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">📝</div>
                    <div className="stat-info">
                        <h3>{data.length}</h3>
                        <p>Total corectări</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">🔴</div>
                    <div className="stat-info">
                        <h3>{errorByType.ortografie}</h3>
                        <p>Greșeli ortografie</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">🟠</div>
                    <div className="stat-info">
                        <h3>{errorByType.gramatica}</h3>
                        <p>Greșeli gramatică</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">🔵</div>
                    <div className="stat-info">
                        <h3>{errorByType.continut}</h3>
                        <p>Greșeli conținut</p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-lg)' }}>
                {/* Progress over time */}
                <div className="card">
                    <ProgressChart data={timelineData} title="Evoluție punctaj mediu general" />
                </div>

                {/* Errors by type */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--primary-900)' }}>
                        Distribuție greșeli pe categorii
                    </h3>
                    <div className="chart-container">
                        <Bar data={errorBarData} options={barOptions} />
                    </div>
                </div>

                {/* Scores by class */}
                {Object.keys(classMap).length > 1 && (
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--primary-900)' }}>
                            Punctaj mediu per clasă
                        </h3>
                        <div className="chart-container">
                            <Bar data={classBarData} options={barOptions} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
