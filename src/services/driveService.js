import { getGoogleAccessToken } from './authService';

const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

/**
 * Uploadează un fișier în Google Drive (folderul monitorizat de n8n)
 */
export const uploadToDrive = async (file) => {
    const accessToken = getGoogleAccessToken();

    if (!accessToken) {
        throw new Error('Nu există token de acces Google. Reconectați-vă.');
    }

    const metadata = {
        name: `${Date.now()}_${file.name}`,
        parents: [FOLDER_ID]
    };

    const form = new FormData();
    form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', file);

    try {
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                body: form
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Eroare la upload');
        }

        return await response.json();
    } catch (error) {
        console.error('Eroare upload Drive:', error);
        throw error;
    }
};
