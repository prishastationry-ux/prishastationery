import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Global Quota & Resource Exhaustion Backoff Tracker
const QUOTA_EXHAUSTED_KEY = 'prisha_firestore_quota_exhausted_until';
let quotaExhaustedUntil = 0;

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
    // Back off cloud writes/reads for 6 hours to prevent hammering quota limits
    quotaExhaustedUntil = Date.now() + 6 * 60 * 60 * 1000;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(QUOTA_EXHAUSTED_KEY, quotaExhaustedUntil.toString());
      } catch (e) {}
    }
    console.warn('⚠️ Firestore quota limit reached. Operations running in 100% offline LocalStorage mode.');
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

const pendingWrites: Record<string, any> = {};
const writeDebounceTimers: Record<string, any> = {};
const lastWrittenPayloads: Record<string, string> = {};

async function executeBatchedFirestoreWrites() {
  if (isQuotaExhausted()) return;

  const docsToCommit = Object.entries(pendingWrites);
  if (docsToCommit.length === 0) return;

  for (const [docName] of docsToCommit) {
    if (writeDebounceTimers[docName]) {
      clearTimeout(writeDebounceTimers[docName]);
      delete writeDebounceTimers[docName];
    }
  }

  const validWrites: { docName: string; payload: any; payloadStr: string }[] = [];
  for (const [docName, rawData] of docsToCommit) {
    delete pendingWrites[docName];
    try {
      const sanitized = sanitizeForFirestore(compressForStorage(rawData));
      const payloadStr = JSON.stringify(sanitized);
      if (lastWrittenPayloads[docName] === payloadStr) continue;
      validWrites.push({ docName, payload: sanitized, payloadStr });
    } catch (e) {}
  }

  if (validWrites.length === 0) return;

  try {
    if (validWrites.length === 1) {
      const { docName, payload, payloadStr } = validWrites[0];
      await setDoc(doc(db, "store_data", docName), { data: payload });
      lastWrittenPayloads[docName] = payloadStr;
    } else {
      const batch = writeBatch(db);
      for (const { docName, payload } of validWrites) {
        batch.set(doc(db, "store_data", docName), { data: payload });
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

function registerPendingWrite(docName: string, data: any) {
  pendingWrites[docName] = data;
  if (writeDebounceTimers[docName]) {
    clearTimeout(writeDebounceTimers[docName]);
  }
  
  // Very aggressive debouncing to save writes (5 minutes)
  const delay = 5 * 60 * 1000; 
  
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

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const filterMockData = (val: any): any => {
    if (!Array.isArray(val)) return val;
    if (docName === 'printJobs') {
      return val.filter((j: any) => j && j.id !== 'prn-demo-1' && j.jobNo !== 'PRN-8821' && j.jobNo !== 'PRN-6065');
    }
    if (docName === 'orders') {
      return val.filter((o: any) => o && o.id !== 'ord-101' && o.invoiceNo !== 'prisha000001');
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
          initialVal = cleaned.filter((item: any) => !deletedIds.has(item?.id || item?.invoiceNo)) as unknown as T;
        } else if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {}
    } else if (Array.isArray(initialData)) {
      initialVal = (initialData as any[]).filter((item: any) => !deletedIds.has(item?.id || item?.invoiceNo)) as unknown as T;
    }
    return initialVal;
  });

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    // Polling function instead of real-time listener
    const syncDocFromCloud = async () => {
      if (isQuotaExhausted()) return;
      try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const rawData = snapshot.data()?.data;
          if (rawData !== undefined && rawData !== null) {
            const rawCleaned = filterMockData(rawData);
            setData((prevData) => {
              const deletedIds = getDeletedIds(localKey);
              if (Array.isArray(rawCleaned) && Array.isArray(prevData)) {
                const validCloudItems = rawCleaned.filter((item: any) => !deletedIds.has(item.id || item.invoiceNo));
                const cloudIds = new Set(validCloudItems.map((c: any) => c.id || c.invoiceNo));
                const localUnsyncedItems = prevData.filter((localItem: any) => !deletedIds.has(localItem.id || localItem.invoiceNo) && !cloudIds.has(localItem.id || localItem.invoiceNo));
                const localMap = new Map();
                prevData.forEach((item: any) => { if (item) localMap.set(item.id || item.invoiceNo, item); });
                const merged = [ ...validCloudItems.map((c: any) => localMap.has(c.id || c.invoiceNo) ? localMap.get(c.id || c.invoiceNo) : c), ...localUnsyncedItems];
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

    // Poll every 30 minutes to stay within free quota
    const pollInterval = setInterval(syncDocFromCloud, 30 * 60 * 1000);
    
    return () => clearInterval(pollInterval);
  }, [docName, localKey]);

  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      
      // Force immediate deletion tracking
      if (Array.isArray(prev) && Array.isArray(next)) {
        const deletedIds = getDeletedIds(localKey);
        let changed = false;
        const nextIds = new Set(next.map((item: any) => item?.id || item?.invoiceNo).filter(Boolean));
        prev.forEach((item: any) => { 
          const id = item?.id || item?.invoiceNo;
          if (id && !nextIds.has(id)) { 
            deletedIds.add(id); 
            changed = true; 
          } 
        });
        next.forEach((item: any) => { 
          const id = item?.id || item?.invoiceNo;
          if (id && deletedIds.has(id)) { 
            deletedIds.delete(id); 
            changed = true; 
          } 
        });
        if (changed) saveDeletedIds(localKey, deletedIds);
      }
      
      safeLocalStorageSet(localKey, next);
      
      // Force immediate write to server instead of debouncing
      registerPendingWrite(docName, next);
      executeBatchedFirestoreWrites(); 
      
      return next;
    });
  };

  return [data, setSyncData] as const;
}