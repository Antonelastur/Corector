import { useState, useRef } from 'react';

export default function ImageUploader({ onFileSelected, uploading }) {
    const [preview, setPreview] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            alert('Vă rugăm să selectați o imagine sau un PDF.');
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }

        onFileSelected(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    return (
        <div className="upload-section">
            <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <h3>Încarcă o fotografie sau un document</h3>
                <p>Trage fișierul aici sau apasă pentru a selecta</p>
                <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
                    Formate acceptate: JPG, PNG, PDF • Max 10 MB
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="flex gap-md" style={{ marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                    Captură cameră
                </button>
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
            </div>

            {preview && (
                <div className="upload-preview">
                    <img src={preview} alt="Preview" />
                </div>
            )}

            {uploading && (
                <div className="loading-container" style={{ padding: 'var(--space-lg)' }}>
                    <div className="spinner"></div>
                    <p>Se încarcă fișierul în Google Drive...</p>
                </div>
            )}
        </div>
    );
}
