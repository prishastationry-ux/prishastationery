// Utility to store and retrieve large files (PDFs, images, docs) using IndexedDB
// This prevents Firestore 1MB document limit and localStorage 5MB quota crashes.

const DB_NAME = 'PrishaStationeryFilesDB';
const STORE_NAME = 'uploaded_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileToStorage(fileId: string, dataUrl: string, fileName: string, fileType: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: fileId,
      dataUrl,
      fileName,
      fileType,
      updatedAt: Date.now()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

export async function getFileFromStorage(fileId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(fileId);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.dataUrl) {
          resolve(request.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB get warning:', err);
    return null;
  }
}

// Convert data URL (base64) to Blob
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const base64Data = parts[1] || '';
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

// Download file safely as a Blob URL (works in all browsers without base64 size limits)
export function downloadFileSafely(dataUrl: string, fileName: string): boolean {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
    return true;
  } catch (err) {
    console.error('Safe download failed:', err);
    return false;
  }
}

// Open file safely in a new browser tab for viewing or printing
export function openFileInNewTab(dataUrl: string, fileName: string): boolean {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      // If popup blocked, fallback to download
      return downloadFileSafely(dataUrl, fileName);
    }
    return true;
  } catch (err) {
    console.error('Open in new tab failed:', err);
    return false;
  }
}
