import { useState } from 'react';
import { generateRemedialExercises } from '../services/geminiService';

export default function RemedialExercises({ errors = [] }) {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = async () => {
        if (errors.length === 0) return;
        setLoading(true);
        try {
            const result = await generateRemedialExercises(errors);
            setExercises(result);
            setGenerated(true);
        } catch (error) {
            console.error('Eroare generare exerciții:', error);
            alert('Eroare la generarea exercițiilor. Verificați conexiunea.');
        } finally {
            setLoading(false);
        }
    };

    const difficultyColors = {
        'ușor': 'badge-success',
        'mediu': 'badge-gramatica',
        'avansat': 'badge-ortografie'
    };

    if (!generated) {
        return (
            <div className="card" style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>🎯 Exerciții remediale</h3>
                <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
                    Gemini va genera 3 exerciții personalizate pe baza greșelilor identificate.
                </p>
                <button
                    className="btn btn-success btn-lg"
                    onClick={handleGenerate}
                    disabled={loading || errors.length === 0}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                            Se generează...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Generează exerciții
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div>
            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎯 Exerciții remediale generate
            </h3>
            {exercises.map((exercise, index) => (
                <div key={index} className="exercise-card">
                    <h4>
                        <span style={{ background: 'var(--success-600)', color: 'white', borderRadius: 'var(--radius-full)', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                            {index + 1}
                        </span>
                        {exercise.titlu}
                    </h4>
                    <div className="flex gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                        <span className={`badge ${difficultyColors[exercise.dificultate] || 'badge-primary'}`}>
                            {exercise.dificultate}
                        </span>
                        <span className={`badge badge-${exercise.tip === 'ortografie' ? 'ortografie' : exercise.tip === 'gramatica' ? 'gramatica' : 'continut'}`}>
                            {exercise.tip}
                        </span>
                    </div>
                    <p>{exercise.cerinta}</p>
                </div>
            ))}
            <button
                className="btn btn-secondary"
                onClick={handleGenerate}
                disabled={loading}
                style={{ marginTop: 'var(--space-md)' }}
            >
                {loading ? 'Se regenerează...' : '🔄 Regenerează exercițiile'}
            </button>
        </div>
    );
}
