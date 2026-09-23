import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Recursively removes all `undefined` values and properties from objects and arrays,
 * because Firebase Firestore setDoc() throws an error if any field is undefined:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore(val: any): any {
  if (val === undefined) {
    return null;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      result[k] = sanitizeForFirestore(v);
    }
  }
  return result;
}

/**
 * Strips huge binary base64 strings from documents before pushing to Firestore.
 * Attached print files (PDFs, high-res scans) are preserved safely in IndexedDB and Chunked storage.
 * Note: Product imageUrl and icons are kept intact!
 */
function compressForStorage(val: any): any {
  if (!val) return val;
  if (typeof val === 'string') {
    // Only truncate huge attachments (>50KB) that are stored in fileStorage
    if (val.startsWith('data:') && val.length > 50000 && (val.includes('application/pdf') || val.includes('octet-stream'))) {
      return val.slice(0, 100) + '...[IDB_STORED]';
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(compressForStorage);
  }
  if (typeof val === 'object') {
    const copy: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      // Keep file identifiers, product images, and metadata intact
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

// Safe LocalStorage setter with automatic quota recovery
function safeLocalStorageSet(key: string, value: any): void {
  try {
    const str = JSON.stringify(compressForStorage(value));
    localStorage.setItem(key, str);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || String(err).includes('quota')) {
      try {
        // Clear old temporary caches to free space
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.endsWith('_backup') || k.includes('temp') || k.includes('preview'))) {
            localStorage.removeItem(k);
          }
        }
        const str = JSON.stringify(compressForStorage(value));
        localStorage.setItem(key, str);
      } catch (e) {
        // Graceful silent fallback
      }
    }
  }
}

// Persistent Tombstone Tracker (Deleted IDs)
export function getDeletedIds(localKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(localKey + '_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {}
  return new Set();
}

export function saveDeletedIds(localKey: string, set: Set<string>): void {
  try {
    localStorage.setItem(localKey + '_deleted_ids', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

// Pending writes registry and debounce timers
const pendingWrites: Record<string, any> = {};
const writeDebounceTimers: Record<string, any> = {};

function executeFirestoreWrite(docName: string, data: any) {
  try {
    const firestorePayload = compressForStorage(data);
    setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(firestorePayload) }).catch(err => {
      const msg = err?.message || String(err);
      if (!msg.includes('resource-exhausted') && !msg.includes('Quota limit')) {
        console.warn(`Firebase sync warning for ${docName}:`, err);
      }
    });
  } catch (err) {
    console.warn("Firebase sync error:", err);
  }
}

function registerPendingWrite(docName: string, data: any) {
  pendingWrites[docName] = data;
  if (writeDebounceTimers[docName]) {
    clearTimeout(writeDebounceTimers[docName]);
  }
  // 350ms snappy debounce
  writeDebounceTimers[docName] = setTimeout(() => {
    delete writeDebounceTimers[docName];
    const toWrite = pendingWrites[docName];
    delete pendingWrites[docName];
    if (toWrite !== undefined) {
      executeFirestoreWrite(docName, toWrite);
    }
  }, 350);
}

// Flush all pending writes immediately when browser is closed, refreshed, or backgrounded
if (typeof window !== 'undefined') {
  const flushAll = () => {
    for (const [docName, data] of Object.entries(pendingWrites)) {
      if (writeDebounceTimers[docName]) {
        clearTimeout(writeDebounceTimers[docName]);
        delete writeDebounceTimers[docName];
      }
      executeFirestoreWrite(docName, data);
    }
  };
  window.addEventListener('beforeunload', flushAll);
  window.addEventListener('pagehide', flushAll);
}

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  // Helper to filter out legacy starter demo mock records
  const filterMockData = (val: any): any => {
    if (!Array.isArray(val)) return val;
    if (docName === 'printJobs') {
      return val.filter((j: any) => {
        if (!j) return false;
        const isMockId = j.id === 'prn-demo-1';
        const isMockJobNo = j.jobNo === 'PRN-8821' || j.jobNo === 'PRN-6065';
        const isSampleCustomer = typeof j.customerName === 'string' && j.customerName.toLowerCase().includes('sample');
        const hasSampleFile = Array.isArray(j.files) && j.files.some((f: any) => 
          typeof f.fileName === 'string' && (f.fileName.toLowerCase().includes('sample document') || f.fileName.toLowerCase().includes('sample'))
        );
        return !(isMockId || isMockJobNo || isSampleCustomer || hasSampleFile);
      });
    }
    if (docName === 'orders') {
      return val.filter((o: any) => {
        if (!o) return false;
        const isMockId = o.id === 'ord-101';
        const isMockInvoice = o.invoiceNo === 'prisha000001';
        const isSampleCustomer = typeof o.customerName === 'string' && o.customerName.toLowerCase().includes('sample');
        const isMockJob = typeof o.notes === 'string' && (o.notes.includes('PRN-6065') || o.notes.includes('PRN-8821') || o.notes.toLowerCase().includes('sample'));
        const hasSampleItem = Array.isArray(o.items) && o.items.some((it: any) => 
          typeof it.name === 'string' && (it.name.toLowerCase().includes('sample document') || it.name.toLowerCase().includes('sample'))
        );
        return !(isMockId || isMockInvoice || isSampleCustomer || isMockJob || hasSampleItem);
      });
    }
    return val;
  };

  // Load from local storage first with tombstone filter
  const [data, setData] = useState<T>(() => {
    const deletedIds = getDeletedIds(localKey);
    let saved = localStorage.getItem(localKey);
    if (!saved) {
      saved = localStorage.getItem(localKey + '_backup');
    }
    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        if (Array.isArray(cleaned)) {
          initialVal = cleaned.filter((item: any) => {
            const id = item?.id || item?.invoiceNo;
            return !deletedIds.has(id);
          }) as unknown as T;
        } else if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {
        console.error(e);
      }
    } else if (Array.isArray(initialData)) {
      initialVal = (initialData as any[]).filter((item: any) => {
        const id = item?.id || item?.invoiceNo;
        return !deletedIds.has(id);
      }) as unknown as T;
    }
    return initialVal;
  });

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    // Initial check: If Firebase is empty, upload what we have in localStorage
    getDoc(docRef).then(snapshot => {
      const saved = localStorage.getItem(localKey) || localStorage.getItem(localKey + '_backup');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleaned = filterMockData(parsed);
          
          if (Array.isArray(cleaned) && cleaned.length > 0) {
            if (!snapshot.exists()) {
              setDoc(docRef, { data: sanitizeForFirestore(compressForStorage(cleaned)) }).catch(() => {});
            } else {
              const cloudData = snapshot.data()?.data;
              if (!Array.isArray(cloudData) || cloudData.length === 0) {
                setDoc(docRef, { data: sanitizeForFirestore(compressForStorage(cleaned)) }).catch(() => {});
              }
            }
          }
        } catch(e) {}
      }
    }).catch(() => {});

    // Listen for real-time updates from Firebase
    const unsubscribe = onSnapshot(docRef, {
      next: (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data().data;
          if (rawData === undefined || rawData === null) return;
          const rawCleaned = filterMockData(rawData);
          if (rawCleaned === undefined || rawCleaned === null) return;

          const currentInit = initialDataRef.current;
          const cleaned = (typeof currentInit === 'object' && currentInit !== null && !Array.isArray(currentInit))
            ? { ...currentInit, ...rawCleaned }
            : rawCleaned;

          setData((prevData) => {
            const deletedIds = getDeletedIds(localKey);

            if (Array.isArray(cleaned) && Array.isArray(prevData)) {
              // 1. Strict filter: Any cloud item that was deleted locally MUST NEVER be resurrected!
              const validCloudItems = cleaned.filter((item: any) => {
                if (!item) return false;
                const id = item.id || item.invoiceNo;
                return !deletedIds.has(id);
              });

              // 2. Identify newly added local items that are not yet synced to the cloud
              const cloudIds = new Set(validCloudItems.map((c: any) => c.id || c.invoiceNo));
              const localUnsyncedItems = prevData.filter((localItem: any) => {
                if (!localItem) return false;
                const id = localItem.id || localItem.invoiceNo;
                return !deletedIds.has(id) && !cloudIds.has(id);
              });

              // 3. For items in both cloud and local, prioritize local state modifications
              const localMap = new Map<string, any>();
              prevData.forEach((item: any) => {
                if (item) {
                  const id = item.id || item.invoiceNo;
                  if (id) localMap.set(id, item);
                }
              });

              const merged = [
                ...validCloudItems.map((c: any) => {
                  const id = c.id || c.invoiceNo;
                  return localMap.has(id) ? localMap.get(id) : c;
                }),
                ...localUnsyncedItems
              ];

              safeLocalStorageSet(localKey, merged);
              return merged as unknown as T;
            }

            safeLocalStorageSet(localKey, cleaned);
            return cleaned as T;
          });
        }
      },
      error: (err) => {
        const msg = err?.message || String(err);
        if (
          !msg.includes('transport errored') && 
          !msg.includes('WebChannel') && 
          !msg.includes('offline') &&
          !msg.includes('Quota limit exceeded') &&
          !msg.includes('resource-exhausted')
        ) {
          console.warn(`Firestore sync note for ${docName}:`, msg);
        }
      }
    });
    
    return () => unsubscribe();
  }, [docName, localKey]);

  // Robust state setter with automatic deletion tracking & immediate local persistence
  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;

      // Detect deletions and additions when handling arrays
      if (Array.isArray(prev) && Array.isArray(next)) {
        const deletedIds = getDeletedIds(localKey);
        let changed = false;

        const nextIds = new Set(next.map((item: any) => item?.id || item?.invoiceNo).filter(Boolean));

        // 1. Any ID in previous list missing in next list is a DELETION
        prev.forEach((item: any) => {
          const id = item?.id || item?.invoiceNo;
          if (id && !nextIds.has(id)) {
            deletedIds.add(id);
            changed = true;
          }
        });

        // 2. Any ID present in next list is ACTIVE (e.g. restored from Trash) -> Remove from tombstones
        next.forEach((item: any) => {
          const id = item?.id || item?.invoiceNo;
          if (id && deletedIds.has(id)) {
            deletedIds.delete(id);
            changed = true;
          }
        });

        if (changed) {
          saveDeletedIds(localKey, deletedIds);
        }
      }

      // Avoid redundant work if deeply identical
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
      } catch (e) {}

      // 1. Save locally immediately (Authoritative instant offline persistence)
      safeLocalStorageSet(localKey, next);

      // 2. Register for snappy debounced cloud sync
      registerPendingWrite(docName, next);

      return next;
    });
  };

  return [data, setSyncData] as const;
}
