const SHEETS_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

/**
 * Citește datele din Google Sheets
 * Coloane așteptate: Id, Nume elev, Clasa, Data, Text OCR, Greșeli JSON, Punctaj
 */
export const readSheetData = async (range = 'Sheet1!A:G') => {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_ID}/values/${range}?key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Eroare Sheets API: ${response.status}`);
        }

        const data = await response.json();
        const rows = data.values || [];

        if (rows.length < 2) return [];

        const headers = rows[0];
        return rows.slice(1).map(row => {
            const entry = {};
            headers.forEach((header, index) => {
                const key = normalizeHeader(header);
                let value = row[index] || '';

                if (key === 'greseli' || key === 'greseliJson') {
                    try {
                        value = JSON.parse(value);
                    } catch {
                        value = [];
                    }
                }

                if (key === 'punctaj') {
                    value = parseFloat(value) || 0;
                }

                entry[key] = value;
            });
            return entry;
        });
    } catch (error) {
        console.error('Eroare la citirea Sheets:', error);
        throw error;
    }
};

/**
 * Citește datele unui elev specific din Sheets
 */
export const getStudentSheetData = async (studentName) => {
    const allData = await readSheetData();
    return allData.filter(row =>
        row.numeElev?.toLowerCase().includes(studentName.toLowerCase())
    );
};

/**
 * Obține ultima intrare din Sheets (ultima corectare procesată de n8n)
 */
export const getLatestEntry = async () => {
    const allData = await readSheetData();
    return allData.length > 0 ? allData[allData.length - 1] : null;
};

function normalizeHeader(header) {
    const map = {
        'id': 'id',
        'nume elev': 'numeElev',
        'clasa': 'clasa',
        'data': 'data',
        'text ocr': 'textOcr',
        'greșeli json': 'greseliJson',
        'greseli json': 'greseliJson',
        'punctaj': 'punctaj'
    };
    return map[header.toLowerCase().trim()] || header.toLowerCase().replace(/\s+/g, '_');
}
