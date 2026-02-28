import { useEffect, useState } from 'react';

export default function ScoreDisplay({ score, maxScore, label = 'Punctaj' }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(percentage), 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    const getColor = (pct) => {
        if (pct >= 75) return 'var(--success-500)';
        if (pct >= 50) return 'var(--warning-500)';
        return 'var(--error-500)';
    };

    const getGrade = (pct) => {
        if (pct >= 90) return { text: 'Excelent', emoji: '🌟' };
        if (pct >= 75) return { text: 'Foarte bine', emoji: '👏' };
        if (pct >= 50) return { text: 'Bine', emoji: '👍' };
        if (pct >= 30) return { text: 'Suficient', emoji: '📝' };
        return { text: 'Insuficient', emoji: '📚' };
    };

    const grade = getGrade(percentage);

    return (
        <div className="score-circle-container">
            <div className="score-circle">
                <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" className="score-circle-bg" />
                    <circle
                        cx="60" cy="60" r="54"
                        className="score-circle-fill"
                        stroke={getColor(animatedScore)}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className="score-value">
                    <strong style={{ color: getColor(animatedScore) }}>{percentage}%</strong>
                    <span>{score}/{maxScore}</span>
                </div>
            </div>
            <div className="text-center">
                <p style={{ fontSize: '1.2rem' }}>{grade.emoji}</p>
                <p style={{ fontWeight: 600, color: getColor(percentage) }}>{grade.text}</p>
                <p className="text-sm text-muted">{label}</p>
            </div>
        </div>
    );
}
