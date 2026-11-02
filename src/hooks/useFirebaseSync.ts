import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { idbSet, idbGet } from '../lib/idbStore';

// Global Quota & Resource Exhaustion Backoff Tracker
const QUOTA_EXHAUSTED_KEY = 'prisha_firestore_quota_exhausted_until';
let quotaExhaustedUntil = 0;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(QUOTA_EXHAUSTED_KEY);
    if (saved) {
      const until = parseInt(saved, 10);
      if (Date.now() < until) {
        quotaExhaustedUntil = until;
      }
    }
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
    // Back off cloud writes/reads for 30 minutes when quota is exhausted
    quotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
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

// Compress large binary data URIs (e.g. photos, base64 images, PDFs) for LocalStorage
// so that LocalStorage NEVER exceeds the browser 5MB limit.
function compressForStorage(val: any): any {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('data:') && val.length > 4000) {
      return val.slice(0, 50) + '...[IDB_STORED]';
    }
    return val;
  }
  if (Array.isArray(val)) return val.map(compressForStorage);
  if (typeof val === 'object') {
    const copy: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 4000) {
        copy[k] = v.slice(0, 50) + '...[IDB_STORED]';
        continue;
      }
      copy[k] = compressForStorage(v);
    }
    return copy;
  }
  return val;
}

// Dual storage: saves compressed data to LocalStorage + full high-capacity uncompressed data to IndexedDB
export function safeLocalStorageSet(key: string, value: any): void {
  // 1. Asynchronously persist full uncompressed data to IndexedDB (virtually unlimited capacity)
  if (typeof window !== 'undefined') {
    idbSet(key, value).catch(() => {});
  }

  // 2. Save compressed data to LocalStorage for instant synchronous reload
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

// Global tracker for currently active write operations to provide UI feedback
const activeWriteOperations: Record<string, boolean> = {};

export async function executeBatchedFirestoreWrites(onSyncStatusChange?: (docName: string, isWriting: boolean) => void): Promise<void> {
  if (isQuotaExhausted()) return;

  const docsToCommit = Object.entries(pendingWrites);
  if (docsToCommit.length === 0) return;

  for (const [docName] of docsToCommit) {
    if (writeDebounceTimers[docName]) {
      clearTimeout(writeDebounceTimers[docName]);
      delete writeDebounceTimers[docName];
    }
  }

  const validWrites: { docName: string; payload: any; deletedIds?: string[]; payloadStr: string }[] = [];
  for (const [docName, item] of docsToCommit) {
    delete pendingWrites[docName];
    try {
      const sanitized = sanitizeForFirestore(compressForStorage(item.data));
      const payloadStr = JSON.stringify(sanitized);
      if (lastWrittenPayloads[docName] === payloadStr) continue;
      validWrites.push({ docName, payload: sanitized, deletedIds: item.deletedIds, payloadStr });
      
      // Start tracking write
      activeWriteOperations[docName] = true;
      if (onSyncStatusChange) onSyncStatusChange(docName, true);
    } catch (e) {}
  }

  if (validWrites.length === 0) return;

  try {
    if (validWrites.length === 1) {
      const { docName, payload, deletedIds, payloadStr } = validWrites[0];
      await setDoc(doc(db, "store_data", docName), { 
        data: payload, 
        deletedIds: deletedIds || [], 
        updatedAt: Date.now() 
      });
      lastWrittenPayloads[docName] = payloadStr;
    } else {
      const batch = writeBatch(db);
      for (const { docName, payload, deletedIds } of validWrites) {
        batch.set(doc(db, "store_data", docName), { 
          data: payload, 
          deletedIds: deletedIds || [], 
          updatedAt: Date.now() 
        });
      }
      await batch.commit();
      for (const { docName, payloadStr } of validWrites) {
        lastWrittenPayloads[docName] = payloadStr;
      }
    }
    console.log('✅ Firestore sync successful for:', validWrites.map(w => w.docName).join(', '));
  } catch (err: any) {
    handleQuotaError(err);
    console.error('❌ Firestore sync failed:', err);
    throw err;
  } finally {
    for (const { docName } of validWrites) {
      delete activeWriteOperations[docName];
      if (onSyncStatusChange) onSyncStatusChange(docName, false);
    }
  }
}

export function registerPendingWrite(docName: string, data: any, localKey?: string, immediate = false, onSyncStatusChange?: (docName: string, isWriting: boolean) => void) {
  const deletedIds = localKey ? Array.from(getDeletedIds(localKey)) : [];
  pendingWrites[docName] = { data, deletedIds };
  if (writeDebounceTimers[docName]) {
    clearTimeout(writeDebounceTimers[docName]);
    delete writeDebounceTimers[docName];
  }
  
  if (immediate) {
    executeBatchedFirestoreWrites(onSyncStatusChange);
    return;
  }

  // Fast 2-second debounce for quick cloud synchronization
  const delay = 2000; 
  
  writeDebounceTimers[docName] = setTimeout(() => {
    delete writeDebounceTimers[docName];
    executeBatchedFirestoreWrites(onSyncStatusChange);
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

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const isProducts = docName.includes('product') || docName === 'products';
  const isOrders = docName.includes('order');

  const [data, setData] = useState<T>(() => {
    // 1. For products, check if there is a locked master product list
    if (isProducts && typeof window !== 'undefined') {
      try {
        const lockedRaw = localStorage.getItem('prisha_products_locked');
        if (lockedRaw) {
          const parsedLocked = JSON.parse(lockedRaw);
          if (Array.isArray(parsedLocked) && parsedLocked.length > 0) {
            return parsedLocked as unknown as T;
          }
        }
      } catch (e) {}
    }

    // 2. Normal localStorage / backup load
    let saved = typeof window !== 'undefined' ? (localStorage.getItem(localKey) || localStorage.getItem(localKey + '_backup')) : null;
    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed, docName);
        if (Array.isArray(cleaned)) {
          // If this is orders, respect deleted IDs
          if (isOrders) {
            const deletedIds = getDeletedIds(localKey);
            initialVal = cleaned.filter((item: any) => {
              if (!item) return false;
              if (item.id && deletedIds.has(item.id)) return false;
              if (item.invoiceNo && deletedIds.has(item.invoiceNo)) return false;
              return true;
            }) as unknown as T;
          } else {
            // For products and all other collections: NEVER filter out saved products!
            initialVal = cleaned as unknown as T;
          }
        } else if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {}
    } else if (Array.isArray(initialData)) {
      initialVal = initialData as unknown as T;
    }
    return initialVal;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // Asynchronous IndexedDB Recovery on Mount (supports >5MB storage without browser limits)
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined') {
      idbGet<any>(localKey).then((idbVal) => {
        if (!isMounted || !idbVal) return;
        if (Array.isArray(idbVal)) {
          const cleanedIdb = filterMockData(idbVal, docName);
          setData((prev) => {
            if (Array.isArray(prev)) {
              // If IndexedDB has MORE products than current state, restore from IndexedDB immediately!
              if (cleanedIdb.length > prev.length) {
                console.log(`📦 Restored ${cleanedIdb.length} master items from IndexedDB for ${localKey}`);
                safeLocalStorageSet(localKey, cleanedIdb);
                if (isProducts) {
                  try {
                    localStorage.setItem('prisha_products_locked', JSON.stringify(compressForStorage(cleanedIdb)));
                  } catch (e) {}
                }
                return cleanedIdb as unknown as T;
              }
            }
            return prev;
          });
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [localKey, docName, isProducts]);

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    const syncDocFromCloud = async () => {
      if (isQuotaExhausted()) return;
      
      // If we are currently writing THIS document, don't fetch and overwrite
      if (activeWriteOperations[docName]) return;

      setIsSyncing(true);
      try {
        const snapshot = await getDoc(docRef);
        setLastSyncTime(Date.now());
        if (snapshot.exists()) {
          const snapData = snapshot.data();
          const rawData = snapData?.data;
          const cloudUpdatedAt = snapData?.updatedAt || 0;

          if (rawData !== undefined && rawData !== null) {
            const rawCleaned = filterMockData(rawData, docName);
            setData((prevData) => {
              if (Array.isArray(rawCleaned) && Array.isArray(prevData)) {
                const cleanedPrev = filterMockData(prevData, docName);

                // 1. ABSOLUTE PRODUCT SAFETY: Local products must NEVER be reduced or overwritten by cloud sync!
                if (isProducts) {
                  // If local has items (e.g. 135 items), LOCAL ALWAYS WINS and is never reduced to 60!
                  if (cleanedPrev.length > 0) {
                    const localIdMap = new Map();
                    cleanedPrev.forEach((p: any) => { if (p && p.id) localIdMap.set(p.id, p); });
                    
                    // Only add genuinely new items from cloud if they do not exist locally:
                    const missingFromLocal = rawCleaned.filter((c: any) => c && c.id && !localIdMap.has(c.id));
                    if (missingFromLocal.length === 0) {
                      // Local items remain 100% sacred and unchanged!
                      return cleanedPrev;
                    }
                    const safeResult = [...cleanedPrev, ...missingFromLocal];
                    safeLocalStorageSet(localKey, safeResult);
                    safeLocalStorageSet(localKey + '_backup', safeResult);
                    idbSet(localKey, safeResult).catch(() => {});
                    return safeResult as unknown as T;
                  }

                  // If local was completely empty, and only then, accept cloud data:
                  safeLocalStorageSet(localKey, rawCleaned);
                  safeLocalStorageSet(localKey + '_backup', rawCleaned);
                  idbSet(localKey, rawCleaned).catch(() => {});
                  return rawCleaned as unknown as T;
                }

                // 2. ORDER HANDLING: Respect deleted order IDs so deleted orders NEVER return
                if (isOrders) {
                  const deletedIds = getDeletedIds(localKey);
                  const validCloud = rawCleaned.filter((o: any) => o && !deletedIds.has(o.id) && !deletedIds.has(o.invoiceNo));
                  const cloudIds = new Set(validCloud.map((c: any) => c.id || c.invoiceNo));
                  const localUnsynced = cleanedPrev.filter((l: any) => l && !deletedIds.has(l.id) && !deletedIds.has(l.invoiceNo) && !cloudIds.has(l.id || l.invoiceNo));
                  const merged = [...validCloud, ...localUnsynced];
                  safeLocalStorageSet(localKey, merged);
                  safeLocalStorageSet(localKey + '_backup', merged);
                  idbSet(localKey, merged).catch(() => {});
                  return merged as unknown as T;
                }

                // 3. OTHER COLLECTIONS: General safe merge
                const localMap = new Map();
                cleanedPrev.forEach((item: any) => {
                  if (item && item.id) localMap.set(item.id, item);
                });
                const cloudIds = new Set(rawCleaned.map((c: any) => c && c.id));
                const localUnsynced = cleanedPrev.filter((l: any) => l && l.id && !cloudIds.has(l.id));

                const merged = [
                  ...rawCleaned.map((c: any) => {
                    if (!c || !c.id) return c;
                    const local = localMap.get(c.id);
                    if (!local) return c;
                    const localTs = local.updatedAt || 0;
                    const cloudTs = c.updatedAt || cloudUpdatedAt || 0;
                    return localTs >= cloudTs ? local : c;
                  }),
                  ...localUnsynced
                ];

                if (cleanedPrev.length > merged.length) {
                  return cleanedPrev;
                }

                safeLocalStorageSet(localKey, merged);
                safeLocalStorageSet(localKey + '_backup', merged);
                idbSet(localKey, merged).catch(() => {});
                return merged as unknown as T;
              }
              
              // For non-array objects (like settings)
              if (typeof rawCleaned === 'object' && typeof prevData === 'object' && rawCleaned && prevData) {
                const localTs = (prevData as any).updatedAt || 0;
                const cloudTs = (rawCleaned as any).updatedAt || cloudUpdatedAt || 0;
                if (localTs > cloudTs) return prevData;
              }

              safeLocalStorageSet(localKey, rawCleaned);
              safeLocalStorageSet(localKey + '_backup', rawCleaned);
              idbSet(localKey, rawCleaned).catch(() => {});
              return rawCleaned as T;
            });
          }
        }
      } catch (e) {
        handleQuotaError(e);
      } finally {
        setIsSyncing(false);
      }
    };

    syncDocFromCloud();

    const pollInterval = setInterval(syncDocFromCloud, 120 * 1000);
    const handleFocusOrVisible = () => syncDocFromCloud();
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('prisha_force_cloud_sync', handleFocusOrVisible);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('prisha_force_cloud_sync', handleFocusOrVisible);
    };
  }, [docName, localKey, isProducts, isOrders]);

  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      // Force persistence to localStorage immediately with backup and IndexedDB
      safeLocalStorageSet(localKey, next);
      safeLocalStorageSet(localKey + '_backup', next);
      idbSet(localKey, next).catch(() => {});

      if (isProducts && Array.isArray(next)) {
        try {
          localStorage.setItem('prisha_products_locked', JSON.stringify(compressForStorage(next)));
        } catch (e) {}
      }
      
      const onStatusChange = (dName: string, writing: boolean) => {
        if (dName === docName) setIsWriting(writing);
      };

      registerPendingWrite(docName, next, localKey, true, onStatusChange);
      return next;
    });
  };

  return [data, setSyncData, isSyncing, lastSyncTime, isWriting] as const;
}

// Helper to filter out mock/test data from production collections
function filterMockData(val: any, docName: string): any {
  if (!Array.isArray(val)) return val;
  if (docName === 'printJobs') {
    return val.filter((j: any) => j && j.id !== 'prn-demo-1' && j.jobNo !== 'PRN-8821' && j.jobNo !== 'PRN-6065');
  }
  if (docName === 'orders') {
    return val.filter((o: any) => o && o.id !== 'ord-demo-test');
  }
  if (docName === 'trash') {
    return val.filter((t: any) => t && t.id !== 'trash-demo-1');
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
}