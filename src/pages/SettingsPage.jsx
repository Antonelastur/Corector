import { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey, isGeminiConfigured } from '../services/geminiService';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState(getGeminiApiKey());
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleSave = () => {
        setGeminiApiKey(apiKey.trim());
        setSaved(true);
        setTestResult(null);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleTest = async () => {
        if (!apiKey.trim()) {
            setTestResult({ ok: false, message: 'Introdu o cheie API mai întâi.' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Spune "OK" și nimic altceva.' }] }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });

            if (response.ok) {
                setTestResult({ ok: true, message: '✅ Cheia API funcționează corect!' });
                // Salvăm automat dacă funcționează
                setGeminiApiKey(apiKey.trim());
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const errData = await response.json().catch(() => null);
                const errMsg = errData?.error?.message || `Eroare HTTP ${response.status}`;
                setTestResult({ ok: false, message: `❌ ${errMsg}` });
            }
        } catch (error) {
            setTestResult({ ok: false, message: `❌ Eroare de conexiune: ${error.message}` });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1>⚙️ Setări</h1>
                <p>Configurează cheile API necesare pentru funcționarea aplicației.</p>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h2>🔑 Cheie API Gemini</h2>
                    {isGeminiConfigured() && (
                        <span className="badge badge-success">✓ Configurată</span>
                    )}
                </div>

                <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--primary-50, #e8eaf6)',
                    border: '1px solid var(--primary-200, #9fa8da)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '0.85rem',
                    color: 'var(--primary-800, #283593)'
                }}>
                    <strong>ℹ️ De ce este nevoie de această setare?</strong>
                    <br />
                    Cheia API Gemini este necesară pentru analiza textelor și imaginilor.
                    Se stochează <strong>doar local în browserul tău</strong> — nu ajunge pe niciun server.
                    <br /><br />
                    <strong>Cum obții o cheie:</strong> Mergi la{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                        Google AI Studio → Get API Key
                    </a>{' '}
                    și creează una nouă.
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                    <label>Cheie API Gemini</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="AIzaSy..."
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setSaved(false); setTestResult(null); }}
                        style={{ fontFamily: 'monospace' }}
                    />
                </div>

                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!apiKey.trim()}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Salvează
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleTest}
                        disabled={testing || !apiKey.trim()}
                    >
                        {testing ? (
                            <>
                                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                                Se testează...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                                Testează cheia
                            </>
                        )}
                    </button>
                </div>

                {saved && (
                    <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: 'var(--success-50, #e8f5e9)',
                        border: '1px solid var(--success-200, #a5d6a7)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--success-800, #2e7d32)',
                        fontSize: '0.85rem'
                    }}>
                        ✅ Cheia a fost salvată local în browser.
                    </div>
                )}

                {testResult && (
                    <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: testResult.ok ? 'var(--success-50, #e8f5e9)' : 'var(--error-50, #ffebee)',
                        border: `1px solid ${testResult.ok ? 'var(--success-200, #a5d6a7)' : 'var(--error-200, #ef9a9a)'}`,
                        borderRadius: 'var(--radius-md)',
                        color: testResult.ok ? 'var(--success-800, #2e7d32)' : 'var(--error-800, #c62828)',
                        fontSize: '0.85rem'
                    }}>
                        {testResult.message}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>📋 Alte configurări</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Serviciu</th>
                                <th>Status</th>
                                <th>Detalii</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Gemini API</td>
                                <td>
                                    <span className={`badge ${isGeminiConfigured() ? 'badge-success' : 'badge-ortografie'}`}>
                                        {isGeminiConfigured() ? '✓ Configurat' : '✗ Neconfigurat'}
                                    </span>
                                </td>
                                <td className="text-muted">Analiză text + imagine</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Google Sheets</td>
                                <td><span className="badge badge-success">✓ Configurat</span></td>
                                <td className="text-muted">Citire date OCR</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Google Drive</td>
                                <td><span className="badge badge-gramatica">◐ Opțional</span></td>
                                <td className="text-muted">Upload imagini (necesită Google Auth)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
