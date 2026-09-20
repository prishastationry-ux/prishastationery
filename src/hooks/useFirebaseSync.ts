import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { saveFileToStorage, saveFileToCloudStorage } from '../lib/fileStorage';

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

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  // Helper to filter out legacy sample/starter mock records
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

  // Load from local storage first for instant offline boot (with backup and IDB fallback)
  const [data, setData] = useState<T>(() => {
    // Purge any stale deleted_ids blacklist from previous buggy builds
    try {
      localStorage.removeItem(localKey + '_deleted_ids');
    } catch (e) {}

    let saved = localStorage.getItem(localKey);
    if (!saved) {
      saved = localStorage.getItem(localKey + '_backup');
    }
    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        if (cleaned !== undefined && cleaned !== null) {
          initialVal = cleaned as T;
        }
      } catch (e) {
        console.error(e);
      }
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
              setDoc(docRef, { data: sanitizeForFirestore(cleaned) }).catch(() => {});
            } else {
              const cloudData = snapshot.data()?.data;
              if (!Array.isArray(cloudData) || cloudData.length === 0) {
                setDoc(docRef, { data: sanitizeForFirestore(cleaned) }).catch(() => {});
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
            // For all array records (products, orders, expenses, rojmel, etc.):
            if (Array.isArray(cleaned) && Array.isArray(prevData)) {
              if (cleaned.length === 0 && prevData.length > 0) {
                return prevData;
              }

              // Local & Cloud Union Merge:
              // 1. Maintain all local items so user-entered items are NEVER deleted by older snapshots
              const itemsMap = new Map<string, any>();

              // Load cloud items first
              cleaned.forEach((cloudItem: any) => {
                if (cloudItem && (cloudItem.id || cloudItem.invoiceNo)) {
                  const key = cloudItem.id || cloudItem.invoiceNo;
                  itemsMap.set(key, cloudItem);
                }
              });

              // Overwrite with local items (authoritative for local additions and modifications)
              prevData.forEach((localItem: any) => {
                if (localItem && (localItem.id || localItem.invoiceNo)) {
                  const key = localItem.id || localItem.invoiceNo;
                  itemsMap.set(key, localItem);
                }
              });

              // Construct merged list
              const merged = Array.from(itemsMap.values());

              // Auto-sync back to cloud if local had new additions
              if (merged.length > cleaned.length) {
                try {
                  setDoc(docRef, { data: sanitizeForFirestore(merged) }).catch(() => {});
                } catch(e) {}
              }

              try {
                localStorage.setItem(localKey, JSON.stringify(merged));
                localStorage.setItem(localKey + '_backup', JSON.stringify(merged));
              } catch (e) {}
              return merged as unknown as T;
            }

            try {
              localStorage.setItem(localKey, JSON.stringify(cleaned));
              localStorage.setItem(localKey + '_backup', JSON.stringify(cleaned));
            } catch (e) {}
            return cleaned as T;
          });
        }
      },
      error: (err) => {
        const msg = err?.message || String(err);
        if (!msg.includes('transport errored') && !msg.includes('WebChannel') && !msg.includes('offline')) {
          console.warn(`Firestore sync note for ${docName} (using local persistence):`, msg);
        }
      }
    });
    
    return () => unsubscribe();
  }, [docName, localKey]);

  // Provide a wrapped setter that saves locally and pushes to Firebase immediately
  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;

      // Avoid unnecessary database writes if unchanged
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
      } catch (e) {}

      // 1. Save locally immediately (Offline authoritative storage)
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
        localStorage.setItem(localKey + '_backup', JSON.stringify(next));
      } catch (err) {
        console.warn("LocalStorage save warning:", err);
      }

      // 2. Save to Firebase asynchronously with size protection
      try {
        // Ensure image data in products does not exceed 1MB Firestore limit
        let firestorePayload = next;
        if (docName === 'products' && Array.isArray(next)) {
          firestorePayload = next.map((item: any) => {
            // If image is an excessively large base64 string (>200KB), truncate or keep compact
            if (typeof item.imageUrl === 'string' && item.imageUrl.length > 300000) {
              return { ...item, imageUrl: item.imageUrl.slice(0, 50000) };
            }
            return item;
          }) as any;
        }

        setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(firestorePayload) }).catch(err => {
          console.warn(`Firebase sync warning for ${docName}:`, err);
        });
      } catch (err) {
        console.warn("Firebase sync preparation error:", err);
      }
      return next;
    });
  };

  return [data, setSyncData] as const;
}

