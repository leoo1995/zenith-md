import { gapi } from 'gapi-script';



export const initGoogleDrive = () => {
  return new Promise<void>((resolve) => {
    gapi.load('picker', () => {
        console.log("Google Picker API loaded");
        resolve();
    });
  });
};

export const saveFileToDrive = async (
  name: string,
  content: string,
  accessToken: string,
  fileId?: string
): Promise<{ id: string }> => {
  const metadata = {
    name,
    mimeType: 'text/markdown',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/markdown' }));

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to save file to Drive: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
};

export const loadFileFromDrive = async (fileId: string, accessToken: string): Promise<string> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load file from Drive');
  }

  return response.text();
};

// Picker API requires the Google Picker script to be loaded separately
export const loadPicker = () => {
   return new Promise<void>((resolve) => {
       gapi.load('picker', { callback: resolve });
   });
}

export const openDrivePicker = (accessToken: string, apiKey: string) => {
    return new Promise<{ id: string, name: string } | null>((resolve, reject) => {
        const pickerCallback = (data: any) => {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                const doc = data[google.picker.Response.DOCUMENTS][0];
                resolve({ id: doc[google.picker.Document.ID], name: doc[google.picker.Document.NAME] });
            } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
                resolve(null);
            }
        };

        if (!window.google || !window.google.picker) {
             reject(new Error("Google Picker API not loaded"));
             return;
        }

        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
        view.setMimeTypes("text/markdown,text/plain");

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(import.meta.env.VITE_GOOGLE_CLIENT_ID) 
            .setOAuthToken(accessToken)
            .setDeveloperKey(apiKey)
            .addView(view)
            .setCallback(pickerCallback)
            .build();
        
        picker.setVisible(true);
    });
};
