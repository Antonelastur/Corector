import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageUploader from '../components/ImageUploader';
import BaremEditor from '../components/BaremEditor';
import ErrorFeedback from '../components/ErrorFeedback';
import ScoreDisplay from '../components/ScoreDisplay';
import RemedialExercises from '../components/RemedialExercises';
import PdfExport from '../components/PdfExport';
import { uploadToDrive } from '../services/driveService';
import { readSheetData, getLatestEntry } from '../services/sheetsService';
import { analyzeText, compareWithBarem } from '../services/geminiService';
import { addCorrection, addBarem, getBarems } from '../services/firestoreService';

export default function NewCorrectionPage() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [mode, setMode] = useState(null); // 'test' or 'caiet'
    const [processing, setProcessing] = useState(false);
    const [ocrData, setOcrData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [baremResult, setBaremResult] = useState(null);
    const [savedBarems, setSavedBarems] = useState([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');

    useEffect(() => {
        if (user) {
            loadSavedBarems();
        }
    }, [user]);

    const loadSavedBarems = async () => {
        try {
            const barems = await getBarems(user.uid);
            setSavedBarems(barems);
        } catch (e) {
            console.log('Nu s-au putut încărca baremele:', e);
        }
    };

    // Step 1: Upload
    const handleFileSelected = (selectedFile) => {
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            await uploadToDrive(file);
            setStep(2);
        } catch (error) {
            console.error('Eroare upload:', error);
            alert('Eroare la încărcare: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSkipUpload = () => {
        setStep(2);
    };

    // Step 2: Select mode
    const handleModeSelect = (selectedMode) => {
        setMode(selectedMode);
        setStep(3);
    };

    // Step 3: Process
    const handleBaremReady = async (baremData) => {
        setProcessing(true);
        try {
            // Save barem
            if (baremData.name) {
                await addBarem({
                    teacherId: user.uid,
                    name: baremData.name,
                    items: baremData.items
                });
            }

            // Get latest OCR data from Sheets
            let ocrText = '';
            try {
                const latest = await getLatestEntry();
                if (latest) {
                    setOcrData(latest);
                    ocrText = latest.textOcr || '';
                }
            } catch (e) {
                console.log('Nu s-a putut citi din Sheets:', e);
            }

            if (!ocrText) {
                ocrText = 'Nu s-a putut extrage textul OCR. Verificați Google Sheets.';
            }

            // Compare with barem using Gemini
            const result = await compareWithBarem(ocrText, baremData.items);
            setBaremResult(result);

            // Save correction to Firestore
            await addCorrection({
                teacherId: user.uid,
                studentName: studentName || ocrData?.numeElev || 'Necunoscut',
                className: className || ocrData?.clasa || '',
                mode: 'test',
                ocrText,
                baremResult: result,
                score: result.punctajTotal || 0,
                maxScore: result.punctajMaxim || baremData.totalPoints,
                date: new Date().toISOString()
            });

            setStep(4);
        } catch (error) {
            console.error('Eroare procesare barem:', error);
            alert('Eroare la procesarea baremului. Verificați conexiunea.');
        } finally {
            setProcessing(false);
        }
    };

    const handleCaietProcess = async () => {
        setProcessing(true);
        try {
            // Get OCR data from Sheets
            let ocrText = '';
            let ocrErrors = [];
            try {
                const latest = await getLatestEntry();
                if (latest) {
                    setOcrData(latest);
                    ocrText = latest.textOcr || '';
                    ocrErrors = latest.greseliJson || [];
                }
            } catch (e) {
                console.log('Nu s-a putut citi din Sheets:', e);
            }

            // If we have errors from n8n/Sheets, use them
            // If not, analyze with Gemini
            let finalErrors = ocrErrors;
            if (ocrText && (!finalErrors || finalErrors.length === 0)) {
                finalErrors = await analyzeText(ocrText);
            }

            setErrors(finalErrors);

            // Save correction to Firestore
            await addCorrection({
                teacherId: user.uid,
                studentName: studentName || ocrData?.numeElev || 'Necunoscut',
                className: className || ocrData?.clasa || '',
                mode: 'caiet',
                ocrText,
                errors: finalErrors,
                date: new Date().toISOString()
            });

            setStep(4);
        } catch (error) {
            console.error('Eroare procesare caiet:', error);
            alert('Eroare la procesarea textului. Verificați conexiunea.');
        } finally {
            setProcessing(false);
        }
    };

    // Step rendering
    const renderSteps = () => (
        <div className="steps">
            {[
                { num: 1, label: 'Upload' },
                { num: 2, label: 'Mod corectare' },
                { num: 3, label: mode === 'test' ? 'Barem' : 'Procesare' },
                { num: 4, label: 'Rezultate' }
            ].map((s, i) => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                        <div className="step-number">
                            {step > s.num ? '✓' : s.num}
                        </div>
                        <span>{s.label}</span>
                    </div>
                    {i < 3 && <div className={`step-connector ${step > s.num ? 'active' : ''}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="new-correction">
            <div className="page-header">
                <h1>📝 Corectare nouă</h1>
                <p>Încarcă un test sau caiet și primește feedback automat.</p>
            </div>

            {renderSteps()}

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>📸 Încarcă documentul</h2>

                    <div className="flex gap-lg" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                            <label>Numele elevului</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: Ion Popescu"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
                            <label>Clasa</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Ex: V A"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                            />
                        </div>
                    </div>

                    <ImageUploader onFileSelected={handleFileSelected} uploading={uploading} />

                    <div className="flex gap-md" style={{ marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={handleSkipUpload}>
                            Sari peste upload
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Se încarcă...' : 'Încarcă și continuă'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Select Mode */}
            {step === 2 && (
                <div className="card">
                    <h2 style={{ marginBottom: 'var(--space-lg)' }}>📋 Selectează modul de corectare</h2>
                    <div className="mode-cards">
                        <div
                            className={`mode-card ${mode === 'test' ? 'selected' : ''}`}
                            onClick={() => handleModeSelect('test')}
                        >
                            <div className="mode-card-icon">📄</div>
                            <h3>Test cu barem</h3>
                            <p>Introdu răspunsurile corecte și aplicația compară automat cu răspunsurile elevului.</p>
                        </div>
                        <div
                            className={`mode-card ${mode === 'caiet' ? 'selected' : ''}`}
                            onClick={() => handleModeSelect('caiet')}
                        >
                            <div className="mode-card-icon">📓</div>
                            <h3>Caiet liber</h3>
                            <p>Gemini analizează textul și identifică greșeli ortografice, gramaticale și de conținut.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Barem or Processing */}
            {step === 3 && mode === 'test' && (
                <div>
                    <BaremEditor onBaremReady={handleBaremReady} savedBarems={savedBarems} />
                    {processing && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Se procesează cu Gemini AI...</p>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && mode === 'caiet' && (
                <div className="card" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>📓 Procesare caiet liber</h2>
                    <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
                        Se va citi textul OCR din Google Sheets (procesat de n8n) și se va analiza cu Gemini AI.
                    </p>
                    {processing ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Se analizează textul cu Gemini AI...</p>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={handleCaietProcess}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            Analizează textul
                        </button>
                    )}
                </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && (
                <div>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2>📊 Rezultate corectare</h2>
                        <div className="flex gap-sm">
                            <PdfExport correctionData={{
                                studentName: studentName || ocrData?.numeElev || '',
                                className: className || ocrData?.clasa || '',
                                date: new Date().toLocaleDateString('ro-RO'),
                                score: mode === 'test' ? (baremResult?.punctajTotal || 0) : undefined,
                                maxScore: mode === 'test' ? (baremResult?.punctajMaxim || 100) : undefined,
                                errors: mode === 'caiet' ? errors : (baremResult?.items || []).filter(i => !i.corect).map(i => ({
                                    tip: 'continut',
                                    textGresit: i.raspunsElev,
                                    textCorect: i.raspunsCorect,
                                    explicatie: i.feedback
                                })),
                                ocrText: ocrData?.textOcr || ''
                            }} />
                            <button className="btn btn-primary" onClick={() => { setStep(1); setFile(null); setMode(null); setErrors([]); setBaremResult(null); setOcrData(null); }}>
                                Corectare nouă
                            </button>
                        </div>
                    </div>

                    {/* OCR Text */}
                    {ocrData?.textOcr && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--space-md)' }}>📄 Text extras (OCR)</h3>
                            <div style={{
                                background: 'var(--gray-50)', padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)', fontFamily: 'monospace',
                                fontSize: '0.85rem', lineHeight: 1.8, whiteSpace: 'pre-wrap'
                            }}>
                                {ocrData.textOcr}
                            </div>
                        </div>
                    )}

                    {/* Test Results */}
                    {mode === 'test' && baremResult && (
                        <div className="flex gap-xl" style={{ flexWrap: 'wrap' }}>
                            <div style={{ flex: '0 0 200px' }}>
                                <div className="card">
                                    <ScoreDisplay
                                        score={baremResult.punctajTotal || 0}
                                        maxScore={baremResult.punctajMaxim || 100}
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 300 }}>
                                <div className="card">
                                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Detalii per item</h3>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Răspuns elev</th>
                                                    <th>Corect</th>
                                                    <th>Puncte</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(baremResult.items || []).map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.itemNr || i + 1}</td>
                                                        <td>{item.raspunsElev || '-'}</td>
                                                        <td>{item.raspunsCorect || '-'}</td>
                                                        <td>{item.puncteObtinute}/{item.puncteMaxime}</td>
                                                        <td>
                                                            <span className={`badge ${item.corect === true ? 'badge-success' : item.corect === 'partial' ? 'badge-gramatica' : 'badge-ortografie'}`}>
                                                                {item.corect === true ? '✓ Corect' : item.corect === 'partial' ? '◐ Parțial' : '✗ Greșit'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Caiet Results */}
                    {mode === 'caiet' && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                            <ErrorFeedback errors={errors} />
                        </div>
                    )}

                    {/* Remedial Exercises */}
                    <div style={{ marginTop: 'var(--space-xl)' }}>
                        <RemedialExercises errors={
                            mode === 'caiet' ? errors :
                                (baremResult?.items || []).filter(i => !i.corect).map(i => ({
                                    tip: 'continut',
                                    textGresit: i.raspunsElev,
                                    textCorect: i.raspunsCorect,
                                    explicatie: i.feedback
                                }))
                        } />
                    </div>
                </div>
            )}
        </div>
    );
}
