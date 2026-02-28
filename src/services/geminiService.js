const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Analizează textul OCR și identifică greșeli (mod Caiet liber)
 */
export const analyzeText = async (text) => {
    const prompt = `Analizează următorul text scris de un elev și identifică toate greșelile. 
Pentru fiecare greșeală returnează un obiect JSON cu:
- "tip": una din valorile "ortografie", "gramatica", "continut"
- "textGresit": fragmentul greșit exact din text
- "textCorect": varianta corectă
- "explicatie": explicația regulii gramaticale sau ortografice, pe scurt

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
                    temperature: 0.3,
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
 * Compară răspunsurile elevului cu baremul și generează feedback
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
