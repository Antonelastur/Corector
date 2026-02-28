export default function ErrorFeedback({ errors = [] }) {
    if (!errors || errors.length === 0) {
        return (
            <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h3>Nu au fost identificate greșeli</h3>
                <p>Textul elevului pare corect! 🎉</p>
            </div>
        );
    }

    const grouped = {
        ortografie: errors.filter(e => e.tip === 'ortografie'),
        gramatica: errors.filter(e => e.tip === 'gramatica'),
        continut: errors.filter(e => e.tip === 'continut')
    };

    const categoryLabels = {
        ortografie: { label: 'Ortografie', icon: '🔴', badge: 'badge-ortografie' },
        gramatica: { label: 'Gramatică', icon: '🟠', badge: 'badge-gramatica' },
        continut: { label: 'Conținut', icon: '🔵', badge: 'badge-continut' }
    };

    return (
        <div className="error-feedback">
            <div className="flex gap-md" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                {Object.entries(grouped).map(([cat, items]) => (
                    items.length > 0 && (
                        <span key={cat} className={`badge ${categoryLabels[cat].badge}`}>
                            {categoryLabels[cat].icon} {categoryLabels[cat].label}: {items.length}
                        </span>
                    )
                ))}
                <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                    Total: {errors.length} greșeli
                </span>
            </div>

            {Object.entries(grouped).map(([category, items]) => (
                items.length > 0 && (
                    <div key={category} style={{ marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {categoryLabels[category].icon} {categoryLabels[category].label}
                            <span className="text-sm text-muted">({items.length})</span>
                        </h3>
                        <div className="error-list">
                            {items.map((error, index) => (
                                <div key={index} className={`error-item ${category}`}>
                                    <div className="error-item-header">
                                        <div>
                                            <span className="error-wrong">{error.textGresit}</span>
                                            <span className="error-arrow">→</span>
                                            <span className="error-correct">{error.textCorect}</span>
                                        </div>
                                        <span className={`badge ${categoryLabels[category].badge}`}>
                                            {categoryLabels[category].label}
                                        </span>
                                    </div>
                                    {error.explicatie && (
                                        <p className="error-explanation">
                                            💡 {error.explicatie}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}
