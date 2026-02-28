import { getGoogleAccessToken } from './authService';

const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

/**
 * Verifică dacă upload-ul la Drive este disponibil
 */
export const isDriveUploadAvailable = () => {
    return Boolean(getGoogleAccessToken());
};

/**
 * Uploadează un fișier în Google Drive (folderul monitorizat de n8n)
 */
export const uploadToDrive = async (file) => {
    const accessToken = getGoogleAccessToken();

    if (!accessToken) {
        throw new Error('DRIVE_NO_TOKEN');
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
