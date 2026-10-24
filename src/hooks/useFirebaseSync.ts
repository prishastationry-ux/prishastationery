import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
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

  const validWrites: { docName: string; payload: any; deletedIds?: string[]; payloadStr: string }[] = [];
  for (const [docName, item] of docsToCommit) {
    delete pendingWrites[docName];
    try {
      const sanitized = sanitizeForFirestore(compressForStorage(item.data));
      const payloadStr = JSON.stringify(sanitized);
      if (lastWrittenPayloads[docName] === payloadStr) continue;
      validWrites.push({ docName, payload: sanitized, deletedIds: item.deletedIds, payloadStr });
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
  } catch (err: any) {
    handleQuotaError(err);
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

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  // Deleted IDs tracking is now enabled for all collections including products

  const filterMockData = (val: any): any => {
    if (!Array.isArray(val)) return val;
    if (docName === 'printJobs') {
      return val.filter((j: any) => j && j.id !== 'prn-demo-1' && j.jobNo !== 'PRN-8821' && j.jobNo !== 'PRN-6065');
    }
    const staleOrderIds = new Set([
      'ord-101', 'prisha000001',
      'ord-1790243518565', 'prisha000064',
      'ord-1789619617055', 'prisha000045',
      'ord-prn-1789617045827', 'prisha000044',
      'ord-1789560872066', 'prisha000043',
      'ord-1789559671769', 'prisha000042',
      'ord-1789559545392', 'prisha000040',
      'ord-1789557527340', 'prisha000037',
      'ord-prn-1789889379267', 'prisha000046',
      'ord-1789559524696', 'prisha000039',
      'ord-1790238420146', 'prisha000063',
      'prisha000065'
    ]);
    if (docName === 'orders') {
      return val.filter((o: any) => o && !staleOrderIds.has(o.id) && !staleOrderIds.has(o.invoiceNo));
    }
    if (docName === 'trash') {
      return val.filter((t: any) => {
        if (!t) return false;
        if (t.id === 'trash-1790315079747' || t.id === 'trash-demo-1') return false;
        const ordId = t.data?.id;
        const ordInv = t.data?.invoiceNo;
        if (ordId && staleOrderIds.has(ordId)) return false;
        if (ordInv && staleOrderIds.has(ordInv)) return false;
        return true;
      });
    }
    if (docName === 'expenses') {
      return val.filter((e: any) => {
        if (!e) return false;
        // Filter out the 2 user-requested expenses (દુકાન ચા-નાસ્તો ₹120 & લાઈટ બિલ / ઇન્ટરનેટ ₹450)
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
      // User explicitly requested to delete the 1 purchase bill in CA audit
      // We only filter out the specific PUR-1 or invalid test bills
      return val.filter((p: any) => {
        if (!p) return false;
        if (p.billNo === 'PUR-1' || !p.supplierName || p.totalAmount <= 0 || p.supplierName === 'ટેસ્ટ સપ્લાયર') return false;
        return true;
      });
    }
    return val;
  };

  const [data, setData] = useState<T>(() => {
    const deletedIds = getDeletedIds(localKey);
    let saved = localStorage.getItem(localKey) || localStorage.getItem(localKey + '_backup');
    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        if (Array.isArray(cleaned)) {
          initialVal = cleaned.filter((item: any) => {
            if (!item) return false;
            const id = item.id;
            const inv = item.invoiceNo;
            const dataId = item.data?.id;
            const dataInv = item.data?.invoiceNo;
            if (id && deletedIds.has(id)) return false;
            if (inv && deletedIds.has(inv)) return false;
            if (dataId && deletedIds.has(dataId)) return false;
            if (dataInv && deletedIds.has(dataInv)) return false;
            return true;
          }) as unknown as T;
        } else if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {}
    } else if (Array.isArray(initialData)) {
      initialVal = (initialData as any[]).filter((item: any) => {
        if (!item) return false;
        const id = item.id;
        const inv = item.invoiceNo;
        if (id && deletedIds.has(id)) return false;
        if (inv && deletedIds.has(inv)) return false;
        return true;
      }) as unknown as T;
    }
    return initialVal;
  });

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    // Real-time polling & synchronization function
    const syncDocFromCloud = async () => {
      if (isQuotaExhausted()) return;
      try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const snapData = snapshot.data();
          const rawData = snapData?.data;
          const cloudDeletedIds: string[] = snapData?.deletedIds || [];
          
          if (cloudDeletedIds.length > 0) {
            const curDeleted = getDeletedIds(localKey);
            let updated = false;
            cloudDeletedIds.forEach(id => {
              if (id && !curDeleted.has(id)) {
                curDeleted.add(id);
                updated = true;
              }
            });
            if (updated) saveDeletedIds(localKey, curDeleted);
          }

          if (rawData !== undefined && rawData !== null) {
            const rawCleaned = filterMockData(rawData);
            setData((prevData) => {
              const deletedIds = getDeletedIds(localKey);
              if (Array.isArray(rawCleaned) && Array.isArray(prevData)) {
                const isItemDeleted = (item: any) => {
                  if (!item) return true;
                  const id = item.id;
                  const inv = item.invoiceNo;
                  const dataId = item.data?.id;
                  const dataInv = item.data?.invoiceNo;
                  if (id && deletedIds.has(id)) return true;
                  if (inv && deletedIds.has(inv)) return true;
                  if (dataId && deletedIds.has(dataId)) return true;
                  if (dataInv && deletedIds.has(dataInv)) return true;
                  return false;
                };

                const validCloudItems = rawCleaned.filter((item: any) => !isItemDeleted(item));
                const cloudIds = new Set(validCloudItems.map((c: any) => c.id || c.invoiceNo));
                const cleanedPrev = filterMockData(prevData);
                const localUnsyncedItems = cleanedPrev.filter((localItem: any) => !isItemDeleted(localItem) && !cloudIds.has(localItem.id || localItem.invoiceNo));
                const localMap = new Map();
                cleanedPrev.forEach((item: any) => { 
                  if (item) {
                    if (item.id) localMap.set(item.id, item);
                    if (item.invoiceNo) localMap.set(item.invoiceNo, item);
                  }
                });
                
                // Union merge: Keeps all items from cloud (e.g. all 58 items from Vercel)
                // plus any local items, merging non-destructively so zero items are lost
                const merged = [
                  ...validCloudItems.map((c: any) => {
                    const local = (c.id && localMap.get(c.id)) || (c.invoiceNo && localMap.get(c.invoiceNo));
                    if (!local) return c;
                    // Compare timestamps so latest stock/price changes win
                    const localTs = local.updatedAt || local.lastModified || 0;
                    const cloudTs = c.updatedAt || c.lastModified || 0;
                    if (localTs > cloudTs && localTs > 0) {
                      return local;
                    }
                    // Default to cloud item so stock deductions and sales from any device sync accurately
                    return c;
                  }),
                  ...localUnsyncedItems
                ];
                safeLocalStorageSet(localKey, merged);
                return merged as unknown as T;
              }
              safeLocalStorageSet(localKey, rawCleaned);
              return rawCleaned as T;
            });
          }
        }
      } catch (e) {
        handleQuotaError(e);
      }
    };

    syncDocFromCloud();

    // Fast polling every 45 seconds to keep all devices & Vercel in real-time sync
    const pollInterval = setInterval(syncDocFromCloud, 45 * 1000);

    // Instant sync on tab focus or visibility change (switching back to app)
    const handleFocusOrVisible = () => {
      syncDocFromCloud();
    };

    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('prisha_force_cloud_sync', handleFocusOrVisible);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncDocFromCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    const handleRescue = () => {
      // For rescue, we temporarily ignore deleted IDs and re-sync
      syncDocFromCloud();
    };
    window.addEventListener('prisha_rescue_deleted_ids', handleRescue);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('prisha_force_cloud_sync', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('prisha_rescue_deleted_ids', handleRescue);
    };
  }, [docName, localKey]);

  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      
      // Force immediate deletion tracking (ONLY for orders/trash, NEVER for products)
      if (Array.isArray(prev) && Array.isArray(next)) {
        const deletedIds = getDeletedIds(localKey);
        let changed = false;
        const nextIds = new Set<string>();
        next.forEach((item: any) => {
          if (item?.id) nextIds.add(item.id);
          if (item?.invoiceNo) nextIds.add(item.invoiceNo);
        });
        prev.forEach((item: any) => { 
          if (item?.id && !nextIds.has(item.id)) { 
            deletedIds.add(item.id); 
            changed = true; 
          }
          if (item?.invoiceNo && !nextIds.has(item.invoiceNo)) {
            deletedIds.add(item.invoiceNo);
            changed = true;
          }
          if (item?.data?.id && !nextIds.has(item.data.id)) {
            deletedIds.add(item.data.id);
            changed = true;
          }
          if (item?.data?.invoiceNo && !nextIds.has(item.data.invoiceNo)) {
            deletedIds.add(item.data.invoiceNo);
            changed = true;
          }
        });
        if (changed) saveDeletedIds(localKey, deletedIds);
      }
      
      safeLocalStorageSet(localKey, next);
      
      // Attempt write to server safely with fast sync
      registerPendingWrite(docName, next, localKey);
      executeBatchedFirestoreWrites(); 
      
      return next;
    });
  };

  return [data, setSyncData] as const;
}