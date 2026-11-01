import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Global Quota & Resource Exhaustion Backoff Tracker
const QUOTA_EXHAUSTED_KEY = 'prisha_firestore_quota_exhausted_until';
let quotaExhaustedUntil = 0;

// Immediately clear any stale 24-hour locks from previous versions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
    quotaExhaustedUntil = 0;
  } catch (e) {}
}

export function isQuotaExhausted(): boolean {
  if (Date.now() < quotaExhaustedUntil) return true;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(QUOTA_EXHAUSTED_KEY);
      if (saved) {
        const until = parseInt(saved, 10);
        if (Date.now() < until) {
          quotaExhaustedUntil = until;
          return true;
        } else {
          localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
        }
      }
    } catch (e) {}
  }
  return false;
}

export function handleQuotaError(err: any): void {
  const msg = err?.message || String(err);
  if (
    msg.includes('resource-exhausted') ||
    msg.includes('Quota limit') ||
    msg.includes('Quota exceeded') ||
    msg.includes('429')
  ) {
    // Back off cloud writes/reads for only 20 seconds (instead of 24 hours!)
    quotaExhaustedUntil = Date.now() + 20 * 1000;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(QUOTA_EXHAUSTED_KEY, quotaExhaustedUntil.toString());
      } catch (e) {}
    }
  }
}

export function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.filter(item => item !== undefined).map(item => sanitizeForFirestore(item));
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) result[k] = sanitizeForFirestore(v);
  }
  return result;
}

function compressForStorage(val: any): any {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('data:') && val.length > 50000 && (val.includes('application/pdf') || val.includes('octet-stream'))) {
      return val.slice(0, 100) + '...[IDB_STORED]';
    }
    return val;
  }
  if (Array.isArray(val)) return val.map(compressForStorage);
  if (typeof val === 'object') {
    const copy: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === 'fileDataUrl' || k === 'paymentScreenshot' || k === 'fileData') {
        if (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) {
          copy[k] = v.slice(0, 100) + '...[IDB_STORED]';
          continue;
        }
      }
      copy[k] = compressForStorage(v);
    }
    return copy;
  }
  return val;
}

function safeLocalStorageSet(key: string, value: any): void {
  try {
    const str = JSON.stringify(compressForStorage(value));
    localStorage.setItem(key, str);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || String(err).includes('quota')) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.endsWith('_backup') || k.includes('temp') || k.includes('preview'))) {
            localStorage.removeItem(k);
          }
        }
        const str = JSON.stringify(compressForStorage(value));
        localStorage.setItem(key, str);
      } catch (e) {}
    }
  }
}

export function getDeletedIds(localKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(localKey + '_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
}

export function saveDeletedIds(localKey: string, set: Set<string>): void {
  try {
    localStorage.setItem(localKey + '_deleted_ids', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

const pendingWrites: Record<string, { data: any; deletedIds?: string[] }> = {};
const writeDebounceTimers: Record<string, any> = {};
const lastWrittenPayloads: Record<string, string> = {};

export async function executeBatchedFirestoreWrites() {
  if (isQuotaExhausted()) return;

  const docsToCommit = Object.entries(pendingWrites);
  if (docsToCommit.length === 0) return;

  for (const [docName] of docsToCommit) {
    if (writeDebounceTimers[docName]) {
      clearTimeout(writeDebounceTimers[docName]);
      delete writeDebounceTimers[docName];
    }
  }

  for (const [docName, item] of docsToCommit) {
    delete pendingWrites[docName];
    try {
      const sanitized = sanitizeForFirestore(compressForStorage(item.data));
      const payloadStr = JSON.stringify(sanitized);
      if (lastWrittenPayloads[docName] === payloadStr) continue;

      if (Array.isArray(sanitized) && sanitized.length > 35) {
        // Chunk array into groups of 35 items to stay well under Firestore 1MB per-doc limit
        const chunkSize = 35;
        const chunks: any[][] = [];
        for (let i = 0; i < sanitized.length; i += chunkSize) {
          chunks.push(sanitized.slice(i, i + chunkSize));
        }

        const batch = writeBatch(db);
        // Main document has chunk 0 + chunk metadata
        batch.set(doc(db, "store_data", docName), {
          data: chunks[0],
          isChunked: true,
          chunkCount: chunks.length,
          totalItems: sanitized.length,
          deletedIds: item.deletedIds || [],
          updatedAt: Date.now()
        });

        // Write additional chunk documents
        for (let i = 1; i < chunks.length; i++) {
          batch.set(doc(db, "store_data", `${docName}_c${i}`), {
            data: chunks[i],
            chunkIndex: i,
            updatedAt: Date.now()
          });
        }

        await batch.commit();
        lastWrittenPayloads[docName] = payloadStr;
      } else {
        await setDoc(doc(db, "store_data", docName), { 
          data: sanitized, 
          isChunked: false,
          chunkCount: 1,
          deletedIds: item.deletedIds || [], 
          updatedAt: Date.now() 
        });
        lastWrittenPayloads[docName] = payloadStr;
      }
    } catch (err: any) {
      handleQuotaError(err);
    }
  }
}

function registerPendingWrite(docName: string, data: any, localKey?: string) {
  const deletedIds = localKey ? Array.from(getDeletedIds(localKey)) : [];
  pendingWrites[docName] = { data, deletedIds };
  if (writeDebounceTimers[docName]) {
    clearTimeout(writeDebounceTimers[docName]);
  }
  
  // Fast 2-second debounce for quick cloud synchronization
  const delay = 2000; 
  
  writeDebounceTimers[docName] = setTimeout(() => {
    delete writeDebounceTimers[docName];
    executeBatchedFirestoreWrites();
  }, delay);
}

if (typeof window !== 'undefined') {
  const flushAll = () => {
    executeBatchedFirestoreWrites();
  };
  window.addEventListener('beforeunload', flushAll);
  window.addEventListener('pagehide', flushAll);
}

export function forceCloudSyncAll(): void {
  if (typeof window !== 'undefined') {
    executeBatchedFirestoreWrites();
    window.dispatchEvent(new CustomEvent('prisha_force_cloud_sync'));
  }
}

export function clearAllDeletedIds(): void {
  if (typeof window !== 'undefined') {
    // Clear all local deleted IDs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith('_deleted_ids')) {
        localStorage.removeItem(key);
      }
    }
    window.dispatchEvent(new CustomEvent('prisha_rescue_deleted_ids'));
    forceCloudSyncAll();
  }
}

export function deduplicateArray<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;
  const seenKeys = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const key = (item as any).id || 
                (item as any).invoiceNo || 
                ((item as any).nameGu && (item as any).category ? `${(item as any).nameGu}_${(item as any).category}` : null);
    if (key) {
      const strKey = String(key);
      if (seenKeys.has(strKey)) continue;
      seenKeys.add(strKey);
    }
    result.push(item);
  }
  return result;
}

export function markItemAsDeleted(localKey: string, itemId: string): void {
  if (!itemId) return;
  const current = getDeletedIds(localKey);
  current.add(String(itemId));
  saveDeletedIds(localKey, current);
}

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const filterMockData = (val: any): any => {
    if (!Array.isArray(val)) return val;
    if (docName === 'printJobs') {
      return val.filter((j: any) => j && j.id !== 'prn-demo-1' && j.jobNo !== 'PRN-8821' && j.jobNo !== 'PRN-6065');
    }
    if (docName === 'orders') {
      return val.filter((o: any) => o && o.id !== 'ord-demo-test');
    }
    if (docName === 'trash') {
      return val.filter((t: any) => {
        if (!t) return false;
        if (t.id === 'trash-demo-1') return false;
        return true;
      });
    }
    if (docName === 'expenses') {
      return val.filter((e: any) => {
        if (!e) return false;
        if (
          e.title === 'દુકાન ચા-નાસ્તો' ||
          e.title === 'લાઈટ બિલ / ઇન્ટરનેટ' ||
          e.title?.includes('ચા-નાસ્તો') ||
          e.title?.includes('લાઈટ બિલ') ||
          (e.amount === 120 && e.category === 'દૈનિક ખર્ચ') ||
          (e.amount === 450 && e.category === 'યુટિલિટી')
        ) {
          return false;
        }
        return true;
      });
    }
    if (docName === 'purchases') {
      return val.filter((p: any) => {
        if (!p) return false;
        if (p.billNo === 'PUR-1' || !p.supplierName || p.totalAmount <= 0 || p.supplierName === 'ટેસ્ટ સપ્લાયર') return false;
        return true;
      });
    }
    return val;
  };

  const [data, setData] = useState<T>(() => {
    // Preserve deleted IDs at all times so deleted items NEVER resurrect!
    const deletedIds = getDeletedIds(localKey);
    
    let saved = localStorage.getItem(localKey) || localStorage.getItem(localKey + '_backup');
    if (!saved && typeof window !== 'undefined') {
      const baseKey = localKey.replace(/_v\d+$/, '');
      saved = localStorage.getItem(baseKey) ||
              localStorage.getItem(baseKey + '_v4') ||
              localStorage.getItem(baseKey + '_v3') ||
              localStorage.getItem(baseKey + '_v2') ||
              localStorage.getItem('prisha_products_v4') ||
              localStorage.getItem('prisha_products') ||
              localStorage.getItem('products') ||
              localStorage.getItem('prisha_pos_items');
    }

    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        if (Array.isArray(cleaned)) {
          const filtered = cleaned.filter((item: any) => {
            if (!item) return false;
            const id = String(item.id || '');
            const inv = String(item.invoiceNo || '');
            const dataId = String(item.data?.id || '');
            const dataInv = String(item.data?.invoiceNo || '');
            if (id && deletedIds.has(id)) return false;
            if (inv && deletedIds.has(inv)) return false;
            if (dataId && deletedIds.has(dataId)) return false;
            if (dataInv && deletedIds.has(dataInv)) return false;
            return true;
          });
          initialVal = deduplicateArray(filtered) as unknown as T;
        } else if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {}
    } else if (Array.isArray(initialData)) {
      const filtered = (initialData as any[]).filter((item: any) => {
        if (!item) return false;
        const id = String(item.id || '');
        const inv = String(item.invoiceNo || '');
        if (id && deletedIds.has(id)) return false;
        if (inv && deletedIds.has(inv)) return false;
        return true;
      });
      initialVal = deduplicateArray(filtered) as unknown as T;
    }
    return initialVal;
  });

  useEffect(() => {
    // Initial mount check: If local data exists and has items, auto-register write to push to cloud
    if (Array.isArray(data) && data.length > 0) {
      registerPendingWrite(docName, data, localKey);
      setTimeout(() => {
        executeBatchedFirestoreWrites();
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (isQuotaExhausted()) return;

    const docRef = doc(db, "store_data", docName);
    
    const processCloudSnapshot = async (snapshot: any) => {
      if (!snapshot.exists()) return;

      const snapData = snapshot.data();
      let rawData = snapData?.data;
      const cloudDeletedIds: string[] = snapData?.deletedIds || [];
      
      // Update local deleted IDs with any newly deleted IDs from cloud
      if (cloudDeletedIds.length > 0) {
        const curDeleted = getDeletedIds(localKey);
        let updated = false;
        cloudDeletedIds.forEach(id => {
          if (id && !curDeleted.has(String(id))) {
            curDeleted.add(String(id));
            updated = true;
          }
        });
        if (updated) saveDeletedIds(localKey, curDeleted);
      }

      // Reassemble chunked documents if present
      if (snapData?.isChunked && snapData?.chunkCount > 1 && Array.isArray(rawData)) {
        try {
          const count = snapData.chunkCount;
          const chunkPromises: Promise<any>[] = [];
          for (let i = 1; i < count; i++) {
            chunkPromises.push(getDoc(doc(db, "store_data", `${docName}_c${i}`)));
          }
          const chunkSnaps = await Promise.all(chunkPromises);
          const allChunks = [rawData];
          chunkSnaps.forEach(cs => {
            if (cs.exists()) {
              const cData = cs.data()?.data;
              if (Array.isArray(cData)) allChunks.push(cData);
            }
          });
          rawData = allChunks.flat();
        } catch (e) {
          console.warn('Error reading chunks:', e);
        }
      }

      if (rawData !== undefined && rawData !== null) {
        const rawCleaned = filterMockData(rawData);
        setData((prevData) => {
          const deletedIds = getDeletedIds(localKey);
          
          if (Array.isArray(rawCleaned)) {
            const isItemDeleted = (item: any) => {
              if (!item) return true;
              const id = String(item.id || '');
              const inv = String(item.invoiceNo || '');
              const dataId = String(item.data?.id || '');
              const dataInv = String(item.data?.invoiceNo || '');
              if (id && deletedIds.has(id)) return true;
              if (inv && deletedIds.has(inv)) return true;
              if (dataId && deletedIds.has(dataId)) return true;
              if (dataInv && deletedIds.has(dataInv)) return true;
              return false;
            };

            const validCloudItems = rawCleaned.filter((item: any) => !isItemDeleted(item));
            const cloudKeySet = new Set<string>();
            validCloudItems.forEach((c: any) => {
              if (c.id) cloudKeySet.add(String(c.id));
              if (c.invoiceNo) cloudKeySet.add(String(c.invoiceNo));
              if (c.nameEn) cloudKeySet.add(String(c.nameEn));
              if (c.nameGu) cloudKeySet.add(String(c.nameGu));
            });

            const cleanedPrev = Array.isArray(prevData) ? filterMockData(prevData) : [];
            const validPrev = cleanedPrev.filter((item: any) => !isItemDeleted(item));

            // Merge local state first (so imported backup/edited local items take priority!), then append any new cloud items
            const mergedRaw = [...validPrev, ...validCloudItems];
            const merged = deduplicateArray(mergedRaw);

            // Always write merged state to Cloud Firestore so cloud is kept in 100% sync
            registerPendingWrite(docName, merged, localKey);
            setTimeout(() => {
              executeBatchedFirestoreWrites();
            }, 300);

            safeLocalStorageSet(localKey, merged);
            return merged as unknown as T;
          }

          safeLocalStorageSet(localKey, rawCleaned);
          return rawCleaned as T;
        });
      }
    };

    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(docRef, (snapshot) => {
        processCloudSnapshot(snapshot);
      }, (err) => {
        handleQuotaError(err);
      });
    } catch (e) {
      handleQuotaError(e);
    }

    const handleForceSync = async () => {
      try {
        const snapshot = await getDoc(docRef);
        processCloudSnapshot(snapshot);
      } catch (e) {
        handleQuotaError(e);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleForceSync();
      }
    };

    window.addEventListener('focus', handleForceSync);
    window.addEventListener('prisha_force_cloud_sync', handleForceSync);
    window.addEventListener('prisha_rescue_deleted_ids', handleForceSync);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (unsub) unsub();
      window.removeEventListener('focus', handleForceSync);
      window.removeEventListener('prisha_force_cloud_sync', handleForceSync);
      window.removeEventListener('prisha_rescue_deleted_ids', handleForceSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [docName, localKey]);

  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      
      // Save state cleanly to local storage & queue cloud sync
      safeLocalStorageSet(localKey, next);
      
      // Attempt write to server safely with fast sync
      registerPendingWrite(docName, next, localKey);
      executeBatchedFirestoreWrites(); 
      
      return next;
    });
  };

  return [data, setSyncData] as const;
}