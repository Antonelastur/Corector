import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
);

export default function ProgressChart({ data = [], title = 'Evoluție punctaj' }) {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <p className="text-muted">Nu există date suficiente pentru grafic.</p>
            </div>
        );
    }

    const labels = data.map(d => d.date || d.data || '');
    const scores = data.map(d => d.score || d.punctaj || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Punctaj',
                data: scores,
                borderColor: '#3F51B5',
                backgroundColor: 'rgba(63, 81, 181, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3F51B5',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            },
            {
                label: 'Media',
                data: Array(scores.length).fill(Math.round(avg)),
                borderColor: '#FF9800',
                borderDash: [6, 4],
                pointRadius: 0,
                borderWidth: 2,
                fill: false
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { family: 'Inter', size: 12 },
                    usePointStyle: true,
                    padding: 20
                }
            },
            title: {
                display: true,
                text: title,
                font: { family: 'Inter', size: 16, weight: 600 },
                color: '#1A237E',
                padding: { bottom: 16 }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 35, 126, 0.9)',
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
                cornerRadius: 8,
                padding: 12
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    font: { family: 'Inter', size: 11 },
                    callback: (val) => val + '%'
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 11 } }
            }
        }
    };

    return (
        <div className="chart-container">
            <Line data={chartData} options={options} />
        </div>
    );
}
