// Cheia API se citește din localStorage (introdusă de utilizator în Setări)
// NU se mai folosește import.meta.env pentru a evita expunerea cheii pe GitHub
export const getGeminiApiKey = () => localStorage.getItem('gemini_api_key') || '';
export const setGeminiApiKey = (key) => localStorage.setItem('gemini_api_key', key);
export const getGeminiModel = () => localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
export const setGeminiModel = (model) => localStorage.setItem('gemini_model', model);
export const isGeminiConfigured = () => !!getGeminiApiKey();

const getGeminiUrl = () => {
    const key = getGeminiApiKey();
    const model = getGeminiModel();
    if (!key) throw new Error('Cheia API Gemini nu este configurată. Mergi la Setări pentru a o introduce.');
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
};

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
        const response = await fetch(getGeminiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Eroare Gemini API: ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            } catch (e) {
                console.warn('Eroare parsare analiză text:', e);
            }
        }
        return [];
    } catch (error) {
        console.error('Eroare analiză Gemini:', error);
        throw error;
    }
};

/**
 * Extrage itemii unui barem dintr-un fișier (imagine sau PDF)
 */
export const extractBaremFromFile = async (file) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';

    const prompt = `Ești un evaluator extrem de strict care extrage un barem dintr-un document scanat/PDF.
SARCINA TA ESTE CRITICĂ: Extrage fiecare item și ASOCIAZĂ-I PUNCTAJUL EXACT așa cum apare scris pe foaie.

REGULI STRICTE PENTRU PUNCTAJE (Nerespectarea lor este o eroare gravă):
1. NU INVENTA PUNCTAJE! NU pune "10" sau alt număr din burtă.
2. Caută în text numere urmate de "p", "pct", "puncte" (ex: "5p", "(20 puncte)", "1.5p"). Acestea sunt punctajele.
3. Dacă pe foaie scrie un punctaj total pentru un exercițiu (ex: Exercițiul 1 - 20 puncte) și are 4 subpuncte (a, b, c, d), împarte logic punctajul (ex: 5 puncte/subpunct) SAU extrage punctajul specific dacă e trecut (ex: a-5p, b-10p).
4. Doar dacă nu scrie absolut niciun număr legat de punctaj pe toată pagina, poți lăsa punctajul gol sau 0.

Returnează un obiect JSON valid cu structura de mai jos. 
ATENȚIE: În exemplul de mai jos, am pus un text la "points" doar ca să vezi structura. TU TREBUIE SĂ RETURNEZI UN NUMĂR REAL EXTRAS DIN DOCUMENT!

{
  "items": [
    {
      "answer": "Răspunsul sau cerința exactă extrasă.",
      "points": PUNCTAJUL_CA_NUMAR
    }
  ]
}`;

    try {
        console.log(`Trimitem document la Gemini. Tip: ${mimeType}, Base64 length: ${base64.length}`);

        const data = await callGeminiAPI({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        console.log('Răspuns brut Gemini (Barem Extraction):', responseText);

        // Elimină block-urile de cod markdown (ex: ```json ... ```)
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Mai întâi căutăm un obiect JSON (datorită noului prompt)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                // Înlocuim posibilele stringuri lăsate accidental la points de către AI
                let cleanedJsonStr = jsonMatch[0].replace(/"PUNCTAJUL_CA_NUMAR"/g, '0');
                // Se asigură că orice referință ciudată fără ghilimele este tot 0
                cleanedJsonStr = cleanedJsonStr.replace(/(:\s*)PUNCTAJUL_CA_NUMAR/g, '$10');

                const parsed = JSON.parse(cleanedJsonStr);
                if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
                    return parsed.items.map(i => ({ ...i, points: Number(i.points) || 0 }));
                }
            } catch (e) {
                console.warn('Eroare parsare obiect JSON:', e);
            }
        }

        // Fallback în cazul în care a returnat doar un array (cum cerea vechiul prompt)
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try {
                const parsed = JSON.parse(arrayMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {
                console.warn('Eroare parsare array JSON:', e);
            }
        }

        return [];
    } catch (error) {
        console.error('Eroare extragere barem:', error);
        throw error;
    }
};

/**
 * Analizează direct o imagine sau PDF cu Gemini Vision (fără a depinde de n8n/Sheets)
 */
export const analyzeImage = async (file) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';

    const prompt = `Ești un profesor exigent de limba română. Analizează FOARTE ATENT textul scris de mână din această imagine/document.

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
                            mimeType,
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        console.log('Răspuns brut Gemini (Analyze Image):', responseText);
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("Eroare parsare json (analyzeImage):", e);
            }
        }
        return { textExtras: '', greseli: [] };
    } catch (error) {
        console.error('Eroare analiză imagine Gemini:', error);
        throw error;
    }
};

/**
 * Compară direct o imagine sau PDF cu un barem folosind Gemini Vision
 */
export const compareImageWithBarem = async (file, barem) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg';

    const baremText = barem.map((item, i) =>
        `${i + 1}. ${item.answer} (${item.points} puncte)`
    ).join('\n');

    const prompt = `Ești un profesor exigent. Analizează textul scris de mână din această imagine/document și compară răspunsurile elevului cu baremul de corectare.

Baremul (răspunsuri corecte):
${baremText}

Mai întâi, extrage textul din imagine/document. Apoi compară fiecare răspuns cu baremul.

Pentru fiecare item din barem, returnează un obiect JSON cu:
- "itemNr": numărul itemului
- "raspunsElev": ce a răspuns elevul (extras din document)
- "raspunsCorect": răspunsul corect din barem
- "puncteObtinute": punctele obținute (poate fi parțial)
- "puncteMaxime": punctele maxime posibile
- "corect": true/false/"partial"
- "feedback": o scurtă explicație

Returnează un obiect JSON cu:
- "textExtras": textul complet extras
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
                            mimeType,
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                responseMimeType: "application/json"
            }
        });

        let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        console.log('Răspuns brut Gemini (Compare Barem):', responseText);
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("Eroare JSON (compareBarem):", e);
            }
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
        const response = await fetch(getGeminiUrl(), {
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
        const response = await fetch(getGeminiUrl(), {
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

// Helper: comprimă și convertește imagine/PDF în base64
async function fileToBase64(file, maxSize = 1600) {
    if (file.type === 'application/pdf') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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
    const response = await fetch(getGeminiUrl(), {
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

