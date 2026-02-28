const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Analizează textul OCR și identifică greșeli (mod Caiet liber)
 */
export const analyzeText = async (text) => {
    const prompt = `Ești un profesor exigent de limba română. Analizează FOARTE ATENT următorul text scris de un elev și identifică TOATE greșelile, inclusiv:
- greșeli de ortografie (î/â, diacritice lipsă, litere greșite)
- greșeli de punctuație (virgule lipsă, puncte lipsă)
- greșeli gramaticale (acorduri greșite, timpuri verbale, forme greșite)
- greșeli de conținut sau exprimare

Fii riguros! Nu ignora nicio greșeală, oricât de mică.

Pentru fiecare greșeală returnează un obiect JSON cu:
- "tip": una din valorile "ortografie", "gramatica", "continut"
- "textGresit": fragmentul greșit exact din text
- "textCorect": varianta corectă
- "explicatie": explicația regulii gramaticale sau ortografice, pe scurt

Dacă textul are greșeli, returnează un array JSON cu toate greșelile găsite.
Dacă textul este într-adevăr perfect (fără nicio greșeală), returnează un array gol: []

Returnează DOAR un array JSON valid, fără alte explicații.

Textul elevului:
"""
${text}
"""`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Eroare Gemini API: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Eroare analiză Gemini:', error);
        throw error;
    }
};

/**
 * Analizează direct o imagine cu Gemini Vision (fără a depinde de n8n/Sheets)
 */
export const analyzeImage = async (file) => {
    const base64 = await imageToBase64(file);

    const prompt = `Ești un profesor exigent de limba română. Analizează FOARTE ATENT textul scris de mână din această imagine.

Mai întâi, extrage textul complet din imagine (OCR).
Apoi identifică TOATE greșelile din text:
- greșeli de ortografie (î/â, diacritice lipsă, litere greșite, cuvinte scrise greșit)
- greșeli de punctuație (virgule lipsă, puncte lipsă)
- greșeli gramaticale (acorduri greșite, timpuri verbale, forme greșite)
- greșeli de conținut sau exprimare

Fii foarte riguros! Verifică fiecare cuvânt.

Returnează un obiect JSON cu:
- "textExtras": textul complet extras din imagine
- "greseli": un array de obiecte, fiecare cu:
  - "tip": "ortografie", "gramatica" sau "continut"
  - "textGresit": fragmentul greșit exact
  - "textCorect": varianta corectă
  - "explicatie": explicația regulii, pe scurt

Returnează DOAR JSON valid, fără alte explicații.`;

    try {
        const data = await callGeminiAPI({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
            }
        });

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { textExtras: '', greseli: [] };
    } catch (error) {
        console.error('Eroare analiză imagine Gemini:', error);
        throw error;
    }
};

/**
 * Compară direct o imagine cu un barem folosind Gemini Vision
 */
export const compareImageWithBarem = async (file, barem) => {
    const base64 = await imageToBase64(file);

    const baremText = barem.map((item, i) =>
        `${i + 1}. ${item.answer} (${item.points} puncte)`
    ).join('\n');

    const prompt = `Ești un profesor exigent. Analizează textul scris de mână din această imagine și compară răspunsurile elevului cu baremul de corectare.

Baremul (răspunsuri corecte):
${baremText}

Mai întâi, extrage textul din imagine. Apoi compară fiecare răspuns cu baremul.

Pentru fiecare item din barem, returnează un obiect JSON cu:
- "itemNr": numărul itemului
- "raspunsElev": ce a răspuns elevul (extras din imagine)
- "raspunsCorect": răspunsul corect din barem
- "puncteObtinute": punctele obținute (poate fi parțial)
- "puncteMaxime": punctele maxime posibile
- "corect": true/false/"partial"
- "feedback": o scurtă explicație

Returnează un obiect JSON cu:
- "textExtras": textul complet extras din imagine
- "items": array-ul de mai sus
- "punctajTotal": suma punctelor obținute
- "punctajMaxim": suma punctelor maxime
- "procentaj": procentajul obținut

Returnează DOAR JSON valid, fără alte explicații.`;

    try {
        const data = await callGeminiAPI({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
            }
        });

        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { textExtras: '', items: [], punctajTotal: 0, punctajMaxim: 0, procentaj: 0 };
    } catch (error) {
        console.error('Eroare comparare barem:', error);
        throw error;
    }
};

/**
 * Generează exerciții remediale personalizate
 */
export const generateRemedialExercises = async (errors) => {
    const errorSummary = errors.map(e =>
        `- Tip: ${e.tip}, Greșit: "${e.textGresit}", Corect: "${e.textCorect}"`
    ).join('\n');

    const prompt = `Pe baza următoarelor greșeli identificate în textul unui elev, generează exact 3 exerciții remediale de consolidare.

Greșeli identificate:
${errorSummary}

Pentru fiecare exercițiu returnează un obiect JSON cu:
- "titlu": titlul exercițiului
- "cerinta": cerința completă a exercițiului
- "tip": tipul greșelii vizate ("ortografie", "gramatica" sau "continut")
- "dificultate": "ușor", "mediu" sau "avansat"

Exercițiile trebuie să fie potrivite pentru un elev de gimnaziu.
Returnează DOAR un array JSON valid cu exact 3 obiecte, fără alte explicații.`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Eroare Gemini API: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Eroare generare exerciții:', error);
        throw error;
    }
};

/**
 * Compară răspunsurile elevului cu baremul (pe bază de text OCR)
 */
export const compareWithBarem = async (ocrText, barem) => {
    const baremText = barem.map((item, i) =>
        `${i + 1}. ${item.answer} (${item.points} puncte)`
    ).join('\n');

    const prompt = `Compară răspunsurile elevului cu baremul de corectare și calculează punctajul.

Textul OCR al elevului:
"""
${ocrText}
"""

Baremul (răspunsuri corecte):
${baremText}

Pentru fiecare item din barem, returnează un obiect JSON cu:
- "itemNr": numărul itemului
- "raspunsElev": ce a răspuns elevul (extras din OCR)
- "raspunsCorect": răspunsul corect din barem
- "puncteObtinute": punctele obținute (poate fi parțial)
- "puncteMaxime": punctele maxime posibile
- "corect": true/false/partial
- "feedback": o scurtă explicație

Returnează un obiect JSON cu:
- "items": array-ul de mai sus
- "punctajTotal": suma punctelor obținute
- "punctajMaxim": suma punctelor maxime
- "procentaj": procentajul obținut

Returnează DOAR JSON valid, fără alte explicații.`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Eroare Gemini API: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { items: [], punctajTotal: 0, punctajMaxim: 0, procentaj: 0 };
    } catch (error) {
        console.error('Eroare comparare barem:', error);
        throw error;
    }
};

// Helper: comprimă și convertește imagine în base64
async function imageToBase64(file, maxSize = 1600) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Redimensionare dacă e prea mare
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convertire în JPEG base64 (mai mic ca PNG)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            // Fallback: citim fișierul direct
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        };

        img.src = url;
    });
}

// Helper: apel Gemini API cu error handling detaliat
async function callGeminiAPI(body) {
    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        let errorMsg = `Eroare Gemini API: ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.error?.message || errorMsg;
            console.error('Gemini API error details:', errData);
        } catch (e) {
            // nu putem parsa eroarea
        }
        throw new Error(errorMsg);
    }

    return await response.json();
}

