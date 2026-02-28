import { useState } from 'react';

export default function BaremEditor({ onBaremReady, savedBarems = [] }) {
    const [items, setItems] = useState([{ answer: '', points: 10 }]);
    const [baremName, setBaremName] = useState('');
    const [showSaved, setShowSaved] = useState(false);

    const addItem = () => {
        setItems([...items, { answer: '', points: 10 }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: field === 'points' ? parseFloat(value) || 0 : value };
        setItems(updated);
    };

    const totalPoints = items.reduce((sum, item) => sum + item.points, 0);

    const handleSubmit = () => {
        if (items.some(item => !item.answer.trim())) {
            alert('Completează toate răspunsurile din barem.');
            return;
        }
        onBaremReady({ name: baremName, items, totalPoints });
    };

    const loadBarem = (barem) => {
        setItems(barem.items);
        setBaremName(barem.name);
        setShowSaved(false);
    };

    return (
        <div className="barem-editor">
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <h3>📝 Barem de corectare</h3>
                    {savedBarems.length > 0 && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowSaved(!showSaved)}
                        >
                            📋 Bareme salvate ({savedBarems.length})
                        </button>
                    )}
                </div>

                {showSaved && savedBarems.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                        {savedBarems.map((b, i) => (
                            <div key={i} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                <span className="text-sm">{b.name || `Barem ${i + 1}`} ({b.items.length} itemi)</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => loadBarem(b)}>
                                    Încarcă
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                    <label>Numele baremului (opțional)</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Ex: Test matematică cl. V"
                        value={baremName}
                        onChange={(e) => setBaremName(e.target.value)}
                    />
                </div>

                <div className="barem-items">
                    {items.map((item, index) => (
                        <div key={index} className="barem-item">
                            <div className="barem-item-number">{index + 1}</div>
                            <input
                                type="text"
                                className="input"
                                placeholder="Răspunsul corect..."
                                value={item.answer}
                                onChange={(e) => updateItem(index, 'answer', e.target.value)}
                            />
                            <div className="flex items-center gap-xs">
                                <input
                                    type="number"
                                    className="input"
                                    style={{ width: '70px', textAlign: 'center' }}
                                    value={item.points}
                                    min="0"
                                    onChange={(e) => updateItem(index, 'points', e.target.value)}
                                />
                                <button
                                    className="btn btn-icon btn-ghost"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length <= 1}
                                    title="Șterge item"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-lg)' }}>
                    <button className="btn btn-secondary" onClick={addItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Adaugă item
                    </button>
                    <div className="flex items-center gap-md">
                        <span className="badge badge-primary">Total: {totalPoints} puncte</span>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            Aplică baremul
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
