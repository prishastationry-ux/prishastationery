// Utility to store and retrieve large files (PDFs, images, docs) using IndexedDB & Chunked Firestore
// Supports files up to 1 GB with native Firestore Bytes, zero bit-loss, real-time speed & progress tracking.

import { doc, getDoc, setDoc, deleteDoc, Bytes, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const DB_NAME = 'PrishaStationeryFilesDB';
const STORE_NAME = 'uploaded_files';
const DB_VERSION = 1;

// 450 KB per chunk (binary) => Native Firestore Bytes without Base64 overhead
export const BINARY_CHUNK_SIZE = 450 * 1024;
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB maximum limit for high-res 4K & large files

// In-memory registry of live Blob URLs created within the current active browser session
const activeLocalBlobUrls = new Set<string>();

export function registerLocalBlobUrl(url: string): string {
  if (url && url.startsWith('blob:')) {
    activeLocalBlobUrls.add(url);
  }
  return url;
}

export function isLocalBlobValid(url?: string): boolean {
  if (!url || !url.startsWith('blob:')) return false;
  return activeLocalBlobUrls.has(url);
}

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

// Check if a string is a dead foreign blob URL (e.g. from mobile or another session)
export function isForeignBlobUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('blob:')) return false;
  return !activeLocalBlobUrls.has(url);
}

// Check if a file string is empty, truncated by Firestore sync (...[IDB_STORED]), corrupted, or an invalid foreign blob URL
export function isCorruptedOrNeedsFetch(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.includes('[IDB_STORED]')) return true;
  if (trimmed.includes('...')) return true;
  if (trimmed.startsWith('blob:')) {
    return isForeignBlobUrl(trimmed);
  }
  // If it's a data URL, any legitimate document (PDF/Image) is at least 300 characters
  if (trimmed.startsWith('data:') && trimmed.length < 300) {
    return true;
  }
  return false;
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
          resolve(registerLocalBlobUrl(URL.createObjectURL(res.blob)));
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
// Uses native Firestore Bytes to prevent bit corruption and minimize bandwidth.
// Persistent cache of deleted cloud file IDs to prevent deleted jobs from ever resurrecting
const DELETED_FILES_KEY = 'prisha_deleted_cloud_file_ids';

export function getDeletedCloudFileIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_FILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {}
  return new Set();
}

export function markCloudFileAsDeleted(fileId: string): void {
  if (!fileId || typeof window === 'undefined') return;
  try {
    const set = getDeletedCloudFileIds();
    set.add(fileId);
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(DELETED_FILES_KEY, JSON.stringify(arr));
  } catch (e) {}
}

export async function uploadFileObjectInChunks(
  file: File | Blob,
  fileId: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: StorageProgress) => void,
  extraMetadata?: Record<string, any>
): Promise<boolean> {
  if (!file || !fileId) return false;

  const totalBytes = file.size;
  if (totalBytes === 0) return false;

  // Cache in IndexedDB first so sender has instant offline access
  saveBlobToStorage(fileId, file, fileName, fileType).catch(() => {});

  const totalChunks = Math.ceil(totalBytes / BINARY_CHUNK_SIZE);
  const startTime = Date.now();
  let uploadedBytes = 0;

  try {
    // Process in batches of 2 for fast, non-blocking upload
    const BATCH_SIZE = 2;
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = i; j < Math.min(i + BATCH_SIZE, totalChunks); j++) {
        const start = j * BINARY_CHUNK_SIZE;
        const end = Math.min(start + BINARY_CHUNK_SIZE, totalBytes);
        const slice = file.slice(start, end);

        const task = (async (chunkIdx: number, sliceBlob: Blob, sliceSize: number) => {
          const arrayBuffer = await sliceBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const chunkBytes = Bytes.fromUint8Array(uint8);

          // Retry up to 3 times for bulletproof upload over mobile/slow connections
          let writeSuccess = false;
          let lastErr: any = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await setDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${chunkIdx}`), {
                fileId,
                chunkIndex: chunkIdx,
                totalChunks,
                chunkBytes,
                chunkSize: sliceSize,
                createdAt: Date.now()
              });
              writeSuccess = true;
              break;
            } catch (err) {
              lastErr = err;
              await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
          }

          if (!writeSuccess) {
            throw lastErr || new Error(`Failed to upload chunk ${chunkIdx}`);
          }

          uploadedBytes += sliceSize;
          const elapsedSec = (Date.now() - startTime) / 1000;
          const bytesPerSec = elapsedSec > 0 ? (uploadedBytes / elapsedSec) : 0;
          const percent = Math.min(99, Math.round((uploadedBytes / totalBytes) * 100));

          if (onProgress) {
            onProgress({
              percent,
              loadedBytes: uploadedBytes,
              totalBytes,
              speed: formatSpeed(bytesPerSec),
              bytesPerSec
            });
          }
        })(j, slice, end - start);

        batchPromises.push(task);
      }

      await Promise.all(batchPromises);
    }

    const cleanExtra: Record<string, any> = {};
    if (extraMetadata && typeof extraMetadata === 'object') {
      for (const [k, v] of Object.entries(extraMetadata)) {
        if (v !== undefined) cleanExtra[k] = v;
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
      uploadedAt: Date.now(),
      ...cleanExtra
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

// 5. Save dataUrl string or File/Blob to Cloud Firestore (with chunking)
export async function saveFileToCloudStorage(
  fileId: string,
  dataUrlOrFile: string | File | Blob,
  fileName: string,
  fileType: string,
  fileSize: number = 0,
  onProgress?: (progress: StorageProgress) => void,
  extraMetadata?: Record<string, any>
): Promise<boolean> {
  if (!fileId || !dataUrlOrFile) return false;

  // If a File or Blob is provided, upload directly with zero Base64 overhead
  if (typeof dataUrlOrFile !== 'string') {
    return await uploadFileObjectInChunks(dataUrlOrFile, fileId, fileName, fileType, onProgress, extraMetadata);
  }

  const dataUrl = dataUrlOrFile;
  if (dataUrl.length < 20 || dataUrl.includes('[IDB_STORED]')) return false;

  // Never store client-side transient blob URL in Firestore
  if (dataUrl.startsWith('blob:')) {
    console.warn(`Attempted to save blob URL to cloud storage for ${fileId}, ignoring.`);
    return false;
  }

  // Save to IndexedDB for instant local access
  await saveFileToStorage(fileId, dataUrl, fileName, fileType);

  try {
    const blob = dataUrlToBlob(dataUrl);
    if (blob) {
      return await uploadFileObjectInChunks(blob, fileId, fileName, fileType, onProgress, extraMetadata);
    }
    return false;
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
    if (local && !isCorruptedOrNeedsFetch(local)) {
      if (onProgress) {
        onProgress({ percent: 100, loadedBytes: 1000, totalBytes: 1000, speed: 'Done', bytesPerSec: 0 });
      }
      return local;
    }
  } catch (e) {
    console.warn('IndexedDB read warning:', e);
  }

  // 2. Fetch from Firestore (supports both fileId and human fileName lookups)
  try {
    let resolvedFileId = fileId.trim();
    let metaSnap = await getDoc(doc(db, 'print_files', resolvedFileId));
    let totalChunks = 0;
    let totalBytes = 0;
    let mime = 'application/pdf';
    let fileName = 'document.pdf';

    if (metaSnap.exists()) {
      const data = metaSnap.data();

      // Check for legacy inline dataUrl
      const inlineData = data.fileDataUrl || data.dataUrl;
      if (inlineData && typeof inlineData === 'string' && !isCorruptedOrNeedsFetch(inlineData)) {
        if (onProgress) {
          onProgress({ percent: 100, loadedBytes: data.fileSize || inlineData.length, totalBytes: data.fileSize || inlineData.length, speed: 'Done', bytesPerSec: 0 });
        }
        return inlineData;
      }

      totalChunks = (data.totalChunks as number) || 0;
      totalBytes = (data.fileSize as number) || 0;
      mime = data.fileType || (data.fileName?.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i) ? 'image/jpeg' : 'application/pdf');
      fileName = data.fileName || 'file';
    } else {
      // Resilient Fallback 1: Query print_files by fileName
      try {
        const q = query(collection(db, 'print_files'), where('fileName', '==', resolvedFileId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const foundDoc = qSnap.docs[0];
          resolvedFileId = foundDoc.id;
          const data = foundDoc.data();
          totalChunks = (data.totalChunks as number) || 0;
          totalBytes = (data.fileSize as number) || 0;
          mime = data.fileType || (data.fileName?.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i) ? 'image/jpeg' : 'application/pdf');
          fileName = data.fileName || resolvedFileId;
        }
      } catch (err) {
        console.warn('Query by fileName notice:', err);
      }

      // Resilient Fallback 2: Check chunk 0 directly
      if (!totalChunks) {
        try {
          const chunk0Doc = await getDoc(doc(db, 'print_file_chunks', `${resolvedFileId}_chunk_0`));
          if (chunk0Doc.exists()) {
            const c0Data = chunk0Doc.data();
            totalChunks = (c0Data.totalChunks as number) || 1;
            totalBytes = (c0Data.chunkSize || 0) * totalChunks;
            mime = resolvedFileId.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image/jpeg' : 'application/pdf';
          } else {
            return null;
          }
        } catch {
          return null;
        }
      }
    }

    if (!totalChunks || totalChunks <= 0) return null;

    const byteArrays: Uint8Array[] = new Array(totalChunks);
    let downloadedBytes = 0;
    const startTime = Date.now();

    // Download in parallel batches of 3
    const BATCH_SIZE = 3;
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = i; j < Math.min(i + BATCH_SIZE, totalChunks); j++) {
        const task = (async (chunkIdx: number) => {
          const chunkDoc = await getDoc(doc(db, 'print_file_chunks', `${resolvedFileId}_chunk_${chunkIdx}`));
          if (!chunkDoc.exists()) {
            throw new Error(`Missing chunk ${chunkIdx}`);
          }
          const cData = chunkDoc.data();
          let chunkBytesArray: Uint8Array | null = null;

          if (cData.chunkBytes && typeof cData.chunkBytes.toUint8Array === 'function') {
            // Native Firestore Bytes
            chunkBytesArray = cData.chunkBytes.toUint8Array();
          } else if (cData.chunkData) {
            // Legacy Base64 string fallback
            const chunkBase64 = cData.chunkData.trim().replace(/[\r\n\s]+/g, '');
            const binaryStr = window.atob(chunkBase64);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let b = 0; b < len; b++) {
              bytes[b] = binaryStr.charCodeAt(b);
            }
            chunkBytesArray = bytes;
          }

          if (!chunkBytesArray) {
            throw new Error(`Chunk ${chunkIdx} contains no byte data`);
          }

          byteArrays[chunkIdx] = chunkBytesArray;
          downloadedBytes += chunkBytesArray.length;

          const elapsedSec = (Date.now() - startTime) / 1000;
          const bytesPerSec = elapsedSec > 0 ? (downloadedBytes / elapsedSec) : 0;
          const percent = Math.min(99, Math.round((downloadedBytes / (totalBytes || 1)) * 100));

          if (onProgress) {
            onProgress({
              percent,
              loadedBytes: downloadedBytes,
              totalBytes: totalBytes || downloadedBytes,
              speed: formatSpeed(bytesPerSec),
              bytesPerSec
            });
          }
        })(j);

        batchPromises.push(task);
      }

      await Promise.all(batchPromises);
    }

    const finalBlob = new Blob(byteArrays, { type: mime });
    if (finalBlob.size === 0) return null;

    // Cache assembled blob in IndexedDB under both resolved ID and original key
    saveBlobToStorage(resolvedFileId, finalBlob, fileName, mime).catch(() => {});
    if (resolvedFileId !== fileId) {
      saveBlobToStorage(fileId, finalBlob, fileName, mime).catch(() => {});
    }

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

    return registerLocalBlobUrl(URL.createObjectURL(finalBlob));
  } catch (err) {
    console.error('getFileFromCloudStorage error:', err);
    return null;
  }
}

// Fallback manual base64 to Blob with whitespace stripping and padding correction
export function dataUrlToBlob(input: string): Blob | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();
  if (str.length === 0 || str.includes('[IDB_STORED]') || str.includes('...')) return null;

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
  if (str.length === 0 || str.includes('[IDB_STORED]') || str.includes('...')) return null;

  if (str.startsWith('blob:')) {
    if (isForeignBlobUrl(str)) return null;
    try {
      const res = await fetch(str);
      const blob = await res.blob();
      if (blob && blob.size > 0) return blob;
    } catch {
      return null;
    }
  }

  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://')) {
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
  if (input.startsWith('blob:') || input.startsWith('http:') || input.startsWith('https:')) {
    return input;
  }
  const blob = await dataUrlToBlobAsync(input);
  if (!blob || blob.size === 0) return null;
  return registerLocalBlobUrl(URL.createObjectURL(blob));
}

export function createBlobUrl(input: string): string | null {
  if (!input) return null;
  if (input.startsWith('blob:') || input.startsWith('http:') || input.startsWith('https:')) {
    return input;
  }
  const blob = dataUrlToBlob(input);
  if (!blob || blob.size === 0) return null;
  return registerLocalBlobUrl(URL.createObjectURL(blob));
}

// Download file safely as original binary Blob (works for PDFs, images, docs without 0KB corruption)
export async function downloadFileSafely(
  dataUrlOrBlobUrl: string | undefined | null,
  fileName: string,
  fileId?: string,
  onProgress?: (progress: StorageProgress) => void
): Promise<boolean> {
  const cleanFileName = (fileName || `Document_${Date.now()}.pdf`).trim();
  let candidateUrl = dataUrlOrBlobUrl;

  // 1. If URL is missing, truncated, or a dead foreign blob URL, recover from cloud chunks or IndexedDB!
  if (!candidateUrl || isCorruptedOrNeedsFetch(candidateUrl)) {
    const lookupKey = fileId || cleanFileName;
    candidateUrl = await getFileFromCloudStorage(lookupKey, onProgress);
    if (!candidateUrl && fileId && cleanFileName !== fileId) {
      candidateUrl = await getFileFromCloudStorage(cleanFileName, onProgress);
    }
  }

  if (!candidateUrl) {
    console.warn('Cannot download: File not found in local cache or cloud storage');
    return false;
  }

  try {
    let directBlobUrl: string | null = null;
    let shouldRevoke = false;

    if (candidateUrl.startsWith('blob:')) {
      directBlobUrl = candidateUrl;
    } else {
      const blob = await dataUrlToBlobAsync(candidateUrl);
      if (!blob || blob.size === 0) {
        console.warn('Cannot download: Blob is empty or corrupted');
        return false;
      }
      directBlobUrl = registerLocalBlobUrl(URL.createObjectURL(blob));
      shouldRevoke = true;
    }

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
      if (shouldRevoke && directBlobUrl && directBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(directBlobUrl);
      }
    }, 10000);

    return true;
  } catch (err) {
    console.warn('Safe download attempt encountered issue:', err);
    return false;
  }
}

// Delete file and all its binary chunks from Cloud Firestore
export async function deleteFileFromCloudStorage(fileId: string): Promise<boolean> {
  if (!fileId) return false;
  markCloudFileAsDeleted(fileId);
  try {
    const metaRef = doc(db, 'print_files', fileId);
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      const data = metaSnap.data();
      const totalChunks = data.totalChunks || 0;
      for (let i = 0; i < totalChunks; i++) {
        deleteDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${i}`)).catch(() => {});
      }
      await deleteDoc(metaRef);
    } else {
      await deleteDoc(metaRef).catch(() => {});
    }
    return true;
  } catch (e) {
    console.error('Delete cloud file error:', e);
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
    const blobUrl = registerLocalBlobUrl(URL.createObjectURL(blob));
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      return await downloadFileSafely(blobUrl, fileName);
    }
    return true;
  } catch (err) {
    console.warn('Open in new tab failed:', err);
    return false;
  }
}

// Calculate estimated rate for print/xerox/pvc file based on store settings
export function calculateFilePrice(file: any, storeSettings: any): number {
  if (!file) return 0;

  const bwSingleRate = storeSettings?.xeroxBwSingleRate ?? 2;
  const bwDoubleRate = storeSettings?.xeroxBwDoubleRate ?? 3;
  const colorSingleRate = storeSettings?.xeroxColorSingleRate ?? 10;
  const colorDoubleRate = storeSettings?.xeroxColorDoubleRate ?? 15;
  const laminationRate = storeSettings?.xeroxLaminationRate ?? 20;
  const pvcCardRate = storeSettings?.pvcCardRate ?? 100;

  const copies = file.copies || 1;
  const pages = file.pages || 1;

  if (file.paperSize === 'PVC Card' || file.colorMode === 'pvc_card') {
    return (file.pricePerUnit || pvcCardRate) * copies;
  }

  if (file.paperSize === '4x6 Photo') {
    return (file.pricePerUnit || 15) * copies;
  }

  let rate = 0;
  if (file.colorMode === 'color') {
    rate = file.sideOption === 'double_side' ? colorDoubleRate : colorSingleRate;
  } else {
    rate = file.sideOption === 'double_side' ? bwDoubleRate : bwSingleRate;
  }

  let total = rate * pages * copies;
  if (file.lamination) {
    total += laminationRate * pages * copies;
  }

  return Math.max(0, total);
}
