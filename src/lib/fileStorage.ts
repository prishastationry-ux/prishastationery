// Utility to store and retrieve large files (PDFs, images, docs) using IndexedDB & Chunked Firestore
// Supports files up to 1 GB with chunk streaming, zero-byte prevention, real-time speed & progress tracking.

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const DB_NAME = 'PrishaStationeryFilesDB';
const STORE_NAME = 'uploaded_files';
const DB_VERSION = 1;

// 500 KB per chunk (binary) => Base64 size ~667 KB, well below Firestore 1 MB document limit
export const BINARY_CHUNK_SIZE = 500 * 1024;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB maximum limit

export interface StorageProgress {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
  speed: string; // e.g. "2.4 MB/s"
  bytesPerSec: number;
}

// Format file size nicely with KB, MB, GB support
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// Format speed nicely with KB/s or MB/s support
export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  }
  return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. Save dataUrl to local browser IndexedDB
export async function saveFileToStorage(
  fileId: string,
  dataUrl: string,
  fileName: string,
  fileType: string
): Promise<void> {
  if (!fileId || !dataUrl) return;
  try {
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
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

// 2. Save Blob to local browser IndexedDB
export async function saveBlobToStorage(
  fileId: string,
  blob: Blob,
  fileName: string,
  fileType: string
): Promise<void> {
  if (!fileId || !blob) return;
  try {
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: fileId,
      blob,
      fileName,
      fileType,
      updatedAt: Date.now()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveBlob warning:', err);
  }
}

// 3. Get from local browser IndexedDB
export async function getFileFromStorage(fileId: string): Promise<string | null> {
  if (!fileId) return null;
  try {
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(fileId);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const res = request.result;
        if (!res) {
          resolve(null);
          return;
        }
        if (res.blob && res.blob.size > 0) {
          resolve(URL.createObjectURL(res.blob));
          return;
        }
        if (res.dataUrl && !res.dataUrl.startsWith('blob:') && res.dataUrl.length > 50) {
          resolve(res.dataUrl);
          return;
        }
        resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB get warning:', err);
    return null;
  }
}

// 4. Stream upload File/Blob in chunks with real-time speed and progress (Supports up to 1 GB!)
export async function uploadFileObjectInChunks(
  file: File | Blob,
  fileId: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: StorageProgress) => void
): Promise<boolean> {
  if (!file || !fileId) return false;

  const totalBytes = file.size;
  if (totalBytes === 0) return false;

  // Cache in IndexedDB first so sender has instant offline access
  saveBlobToStorage(fileId, file, fileName, fileType).catch(() => {});

  const totalChunks = Math.ceil(totalBytes / BINARY_CHUNK_SIZE);
  const startTime = Date.now();

  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * BINARY_CHUNK_SIZE;
      const end = Math.min(start + BINARY_CHUNK_SIZE, totalBytes);
      const slice = file.slice(start, end);

      const sliceBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(slice);
      });

      await setDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${i}`), {
        fileId,
        chunkIndex: i,
        totalChunks,
        chunkData: sliceBase64,
        createdAt: Date.now()
      });

      const elapsedSec = (Date.now() - startTime) / 1000;
      const loadedBytes = end;
      const bytesPerSec = elapsedSec > 0 ? (loadedBytes / elapsedSec) : 0;
      const percent = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));

      if (onProgress) {
        onProgress({
          percent,
          loadedBytes,
          totalBytes,
          speed: formatSpeed(bytesPerSec),
          bytesPerSec
        });
      }
    }

    // Save final metadata document
    await setDoc(doc(db, 'print_files', fileId), {
      id: fileId,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: totalBytes,
      isChunked: true,
      totalChunks,
      chunkSize: BINARY_CHUNK_SIZE,
      uploadedAt: Date.now()
    });

    const totalElapsedSec = (Date.now() - startTime) / 1000;
    const finalSpeed = totalElapsedSec > 0 ? (totalBytes / totalElapsedSec) : 0;
    if (onProgress) {
      onProgress({
        percent: 100,
        loadedBytes: totalBytes,
        totalBytes,
        speed: formatSpeed(finalSpeed),
        bytesPerSec: finalSpeed
      });
    }

    return true;
  } catch (err) {
    console.error('uploadFileObjectInChunks error:', err);
    return false;
  }
}

// 5. Save dataUrl string to Cloud Firestore (with chunking for legacy base64 strings)
export async function saveFileToCloudStorage(
  fileId: string,
  dataUrl: string,
  fileName: string,
  fileType: string,
  fileSize: number = 0
): Promise<boolean> {
  if (!fileId || !dataUrl || dataUrl.length < 20) return false;

  // Never store client-side transient blob URL in Firestore
  if (dataUrl.startsWith('blob:')) {
    console.warn(`Attempted to save blob URL to cloud storage for ${fileId}, ignoring.`);
    return false;
  }

  // Save to IndexedDB for instant local access
  await saveFileToStorage(fileId, dataUrl, fileName, fileType);

  try {
    const CHUNK_CHAR_SIZE = 650000;
    if (dataUrl.length <= CHUNK_CHAR_SIZE) {
      await setDoc(doc(db, 'print_files', fileId), {
        id: fileId,
        fileName,
        fileType,
        fileSize: fileSize || dataUrl.length,
        isChunked: false,
        totalChunks: 1,
        fileDataUrl: dataUrl,
        createdAt: Date.now()
      });
      return true;
    }

    const totalChunks = Math.ceil(dataUrl.length / CHUNK_CHAR_SIZE);
    for (let i = 0; i < totalChunks; i += 3) {
      const batch = [];
      for (let j = i; j < Math.min(i + 3, totalChunks); j++) {
        const chunkData = dataUrl.substring(j * CHUNK_CHAR_SIZE, (j + 1) * CHUNK_CHAR_SIZE);
        batch.push(
          setDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${j}`), {
            fileId,
            chunkIndex: j,
            totalChunks,
            chunkData,
            createdAt: Date.now()
          })
        );
      }
      await Promise.all(batch);
    }

    await setDoc(doc(db, 'print_files', fileId), {
      id: fileId,
      fileName,
      fileType,
      fileSize: fileSize || dataUrl.length,
      isChunked: true,
      totalChunks,
      createdAt: Date.now()
    });

    return true;
  } catch (err) {
    console.error('saveFileToCloudStorage error:', err);
    return false;
  }
}

// 6. Retrieve complete file from Cloud Firestore with real-time download progress & speed
export async function getFileFromCloudStorage(
  fileId: string,
  onProgress?: (progress: StorageProgress) => void
): Promise<string | null> {
  if (!fileId) return null;

  // 1. Check local IndexedDB first
  try {
    const local = await getFileFromStorage(fileId);
    if (local && local.length > 50) {
      if (onProgress) {
        onProgress({ percent: 100, loadedBytes: 1000, totalBytes: 1000, speed: 'Done', bytesPerSec: 0 });
      }
      return local;
    }
  } catch (e) {
    console.warn('IndexedDB read warning:', e);
  }

  // 2. Fetch from Firestore
  try {
    const metaSnap = await getDoc(doc(db, 'print_files', fileId));
    if (!metaSnap.exists()) {
      return null;
    }

    const data = metaSnap.data();

    // Check for dead blob URL
    const inlineData = data.fileDataUrl || data.dataUrl;
    if (inlineData && typeof inlineData === 'string') {
      if (inlineData.startsWith('blob:')) {
        console.warn(`File ${fileId} in Firestore contains dead blob URL from previous upload.`);
        return null;
      }
      if (!data.isChunked && inlineData.length > 50) {
        if (onProgress) {
          onProgress({ percent: 100, loadedBytes: data.fileSize || inlineData.length, totalBytes: data.fileSize || inlineData.length, speed: 'Done', bytesPerSec: 0 });
        }
        return inlineData;
      }
    }

    // Chunked file: download chunks with real-time speed & progress
    const totalChunks = data.totalChunks as number;
    const totalBytes = (data.fileSize as number) || 0;
    if (!totalChunks || totalChunks <= 0) return null;

    const byteArrays: Uint8Array[] = [];
    let downloadedBytes = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${i}`));
      if (!chunkDoc.exists() || !chunkDoc.data()?.chunkData) {
        console.warn(`Missing chunk ${i} for file ${fileId}`);
        return null;
      }

      const chunkBase64 = chunkDoc.data().chunkData.trim();
      const cleanBase64 = chunkBase64.replace(/[\r\n\s]+/g, '');
      const binaryStr = window.atob(cleanBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let b = 0; b < len; b++) {
        bytes[b] = binaryStr.charCodeAt(b);
      }
      byteArrays.push(bytes);
      downloadedBytes += len;

      const elapsedSec = (Date.now() - startTime) / 1000;
      const bytesPerSec = elapsedSec > 0 ? (downloadedBytes / elapsedSec) : 0;
      const percent = Math.min(99, Math.round(((i + 1) / totalChunks) * 100));

      if (onProgress) {
        onProgress({
          percent,
          loadedBytes: downloadedBytes,
          totalBytes: totalBytes || downloadedBytes,
          speed: formatSpeed(bytesPerSec),
          bytesPerSec
        });
      }
    }

    const mime = data.fileType || 'application/octet-stream';
    const finalBlob = new Blob(byteArrays, { type: mime });
    if (finalBlob.size === 0) return null;

    // Cache assembled blob in IndexedDB
    saveBlobToStorage(fileId, finalBlob, data.fileName || 'file', mime).catch(() => {});

    const totalElapsedSec = (Date.now() - startTime) / 1000;
    const finalSpeed = totalElapsedSec > 0 ? (finalBlob.size / totalElapsedSec) : 0;
    if (onProgress) {
      onProgress({
        percent: 100,
        loadedBytes: finalBlob.size,
        totalBytes: finalBlob.size,
        speed: formatSpeed(finalSpeed),
        bytesPerSec: finalSpeed
      });
    }

    return URL.createObjectURL(finalBlob);
  } catch (err) {
    console.error('getFileFromCloudStorage error:', err);
    return null;
  }
}

// Fallback manual base64 to Blob with whitespace stripping and padding correction
export function dataUrlToBlob(input: string): Blob | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();
  if (str.length === 0) return null;

  if (str.startsWith('blob:') || str.startsWith('http://') || str.startsWith('https://')) {
    return null;
  }

  let mime = 'application/octet-stream';
  let base64Data = '';
  let isBase64 = true;

  if (str.startsWith('data:')) {
    const commaIndex = str.indexOf(',');
    if (commaIndex === -1) return null;

    const meta = str.substring(5, commaIndex);
    const metaParts = meta.split(';');
    if (metaParts[0]) {
      mime = metaParts[0].trim();
    }
    isBase64 = metaParts.some(p => p.trim().toLowerCase() === 'base64');
    base64Data = str.substring(commaIndex + 1);
  } else {
    if (str.includes(',')) {
      const commaIndex = str.indexOf(',');
      base64Data = str.substring(commaIndex + 1);
    } else {
      base64Data = str;
    }

    if (base64Data.startsWith('JVBERi')) {
      mime = 'application/pdf';
    } else if (base64Data.startsWith('/9j/')) {
      mime = 'image/jpeg';
    } else if (base64Data.startsWith('iVBORw')) {
      mime = 'image/png';
    }
  }

  if (!isBase64) {
    try {
      const decoded = decodeURIComponent(base64Data);
      return new Blob([decoded], { type: mime });
    } catch {
      return new Blob([base64Data], { type: mime });
    }
  }

  const cleanBase64 = base64Data.replace(/[\r\n\s]+/g, '');
  if (cleanBase64.length === 0) return null;

  let padded = cleanBase64;
  while (padded.length % 4 !== 0) {
    padded += '=';
  }

  try {
    const binaryString = window.atob(padded);
    const len = binaryString.length;
    if (len === 0) return null;

    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch (err) {
    console.error('Base64 decode error in manual fallback:', err);
    return null;
  }
}

// Convert data URL or blob URL to Blob using browser's native engine
export async function dataUrlToBlobAsync(input: string): Promise<Blob | null> {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();
  if (str.length === 0) return null;

  if (str.startsWith('blob:') || str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const res = await fetch(str);
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    } catch (e) {
      // fallback
    }
  }

  return dataUrlToBlob(str);
}

// Create a safe Object URL for in-app viewing or printing
export async function createBlobUrlAsync(input: string): Promise<string | null> {
  if (!input) return null;
  if (input.startsWith('blob:')) return input;
  const blob = await dataUrlToBlobAsync(input);
  if (!blob || blob.size === 0) return null;
  return URL.createObjectURL(blob);
}

export function createBlobUrl(input: string): string | null {
  if (!input) return null;
  if (input.startsWith('blob:')) return input;
  const blob = dataUrlToBlob(input);
  if (!blob || blob.size === 0) return null;
  return URL.createObjectURL(blob);
}

// Download file safely as original binary Blob (works for PDFs, images, docs without 0KB corruption)
export async function downloadFileSafely(dataUrlOrBlobUrl: string, fileName: string): Promise<boolean> {
  if (!dataUrlOrBlobUrl) {
    console.error('Cannot download: URL or data is empty');
    return false;
  }

  // Reject dead foreign blob URLs
  if (dataUrlOrBlobUrl.startsWith('blob:http') && typeof window !== 'undefined' && !dataUrlOrBlobUrl.startsWith(window.location.origin)) {
    console.error('Cannot download: Blob URL originates from a different domain/session');
    return false;
  }

  try {
    let directBlobUrl: string | null = null;
    let shouldRevoke = false;

    if (dataUrlOrBlobUrl.startsWith('blob:') || dataUrlOrBlobUrl.startsWith('http:') || dataUrlOrBlobUrl.startsWith('https:')) {
      directBlobUrl = dataUrlOrBlobUrl;
    } else {
      const blob = await dataUrlToBlobAsync(dataUrlOrBlobUrl);
      if (!blob || blob.size === 0) {
        console.error('Cannot download: Blob is empty or corrupted');
        return false;
      }
      directBlobUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    const cleanFileName = (fileName || `Document_${Date.now()}.pdf`).trim();
    const a = document.createElement('a');
    a.href = directBlobUrl;
    a.download = cleanFileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      if (shouldRevoke && directBlobUrl) {
        URL.revokeObjectURL(directBlobUrl);
      }
    }, 90000);

    return true;
  } catch (err) {
    console.error('Safe download failed:', err);
    return false;
  }
}

// Open file safely in a new browser tab for viewing or printing
export async function openFileInNewTab(dataUrl: string, fileName: string): Promise<boolean> {
  try {
    if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http')) {
      const win = window.open(dataUrl, '_blank');
      return !!win;
    }

    const blob = await dataUrlToBlobAsync(dataUrl);
    if (!blob || blob.size === 0) {
      return false;
    }
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      return await downloadFileSafely(blobUrl, fileName);
    }
    return true;
  } catch (err) {
    console.error('Open in new tab failed:', err);
    return false;
  }
}
