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

  // Helper to filter out any legacy sample / starter mock printing requests or test invoices
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

  // Load from local storage first for instant boot, but Firebase will overwrite once it connects
  const [data, setData] = useState<T>(() => {
    let saved = localStorage.getItem(localKey);
    if (!saved) {
      saved = localStorage.getItem(localKey + '_backup');
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        if (Array.isArray(parsed) && cleaned.length !== parsed.length) {
          localStorage.setItem(localKey, JSON.stringify(cleaned));
        }
        return cleaned as T;
      } catch (e) { console.error(e); }
    }
    return initialData;
  });

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    // Migration check: If Firebase is empty, upload what we have in localStorage
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
            // If this is printJobs, preserve existing local full fileDataUrls so cloud updates never wipe them
            if (docName === 'printJobs' && Array.isArray(cleaned) && Array.isArray(prevData)) {
              const merged = cleaned.map((newJob: any) => {
                const existingJob = (prevData as any[]).find(j => j.id === newJob.id);
                if (existingJob && Array.isArray(existingJob.files)) {
                  return {
                    ...newJob,
                    files: newJob.files?.map((nf: any) => {
                      const ef = existingJob.files.find((f: any) => f.id === nf.id);
                      if (ef && ef.fileDataUrl && !ef.fileDataUrl.startsWith('blob:') && !nf.fileDataUrl) {
                        return { ...nf, fileDataUrl: ef.fileDataUrl };
                      }
                      return nf;
                    })
                  };
                }
                return newJob;
              });
              try {
                localStorage.setItem(localKey, JSON.stringify(merged));
                localStorage.setItem(localKey + '_backup', JSON.stringify(merged));
              } catch (e) {}
              return merged as unknown as T;
            }

            // For all array records (rojmel, orders, expenses, purchases, products, khata):
            if (Array.isArray(cleaned) && Array.isArray(prevData)) {
              // SAFEGUARD: Never let an empty cloud document wipe out local PC entries!
              if (cleaned.length === 0 && prevData.length > 0) {
                setDoc(docRef, { data: sanitizeForFirestore(prevData) }).catch(() => {});
                return prevData;
              }

              // Merge items by id: Keep cloud updates while preserving any local entries not yet synced
              const cloudIds = new Set(cleaned.map((item: any) => item?.id).filter(Boolean));
              const localOnly = prevData.filter((item: any) => item?.id && !cloudIds.has(item.id));
              const merged = [...cleaned, ...localOnly];

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
        // Handle Firestore quota / network issues gracefully without breaking UI
        console.warn(`Firestore sync note for ${docName} (using local persistence):`, err.message || err);
      }
    });
    
    return () => unsubscribe();
  }, [docName, localKey]);

  // Provide a wrapped setter that also saves to Firebase immediately
  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;

      // Avoid unnecessary database writes and state triggers if data has not changed
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
      } catch (e) {}

      // 1. If this contains files (printJobs), save full uncorrupted files into IndexedDB
      if (docName === 'printJobs' && Array.isArray(next)) {
        next.forEach((job: any) => {
          if (Array.isArray(job.files)) {
            job.files.forEach((file: any) => {
              if (file.id && file.fileDataUrl && !file.fileDataUrl.startsWith('blob:') && file.fileDataUrl.length > 50) {
                saveFileToStorage(file.id, file.fileDataUrl, file.fileName || 'file', file.fileType || '');
              }
            });
          }
        });
      }

      // 2. Save locally with backup copy
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
        localStorage.setItem(localKey + '_backup', JSON.stringify(next));
      } catch (err) {
        console.warn("LocalStorage save warning (preserving metadata):", err);
        try {
          if (Array.isArray(next)) {
            const lightNext = next.map((item: any) => ({
              ...item,
              files: item.files?.map((f: any) => {
                // If local storage is full, keep metadata and rely on IndexedDB
                if (f.fileDataUrl && (f.fileDataUrl.startsWith('blob:') || f.fileDataUrl.length > 300000)) {
                  return { ...f, fileDataUrl: '' };
                }
                return f;
              })
            }));
            localStorage.setItem(localKey, JSON.stringify(lightNext));
            localStorage.setItem(localKey + '_backup', JSON.stringify(lightNext));
          }
        } catch (e) {}
      }

      // 3. Save to Firebase: Upload files with chunking so files of ANY size never fail
      try {
        if (docName === 'printJobs' && Array.isArray(next)) {
          next.forEach((job: any) => {
            if (Array.isArray(job.files)) {
              job.files.forEach((f: any) => {
                if (f.fileDataUrl && !f.fileDataUrl.startsWith('blob:') && f.fileDataUrl.length > 50) {
                  saveFileToCloudStorage(
                    f.id,
                    f.fileDataUrl,
                    f.fileName || 'file',
                    f.fileType || '',
                    f.fileSize || 0
                  );
                }
              });
            }
          });

          // In the main printJobs collection list, omit huge inline base64 if it exceeds 300KB to stay safely under 1MB
          // Also NEVER save client-side blob URLs to Firestore
          const firestoreData = next.map((item: any) => ({
            ...item,
            files: item.files?.map((f: any) => ({
              ...f,
              fileDataUrl: f.fileDataUrl && !f.fileDataUrl.startsWith('blob:') && f.fileDataUrl.length < 300000 ? f.fileDataUrl : ''
            }))
          }));

          setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(firestoreData) }).catch(err => {
            console.warn("Firebase sync size/network warning (saved locally):", err);
          });
        } else {
          setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(next) }).catch(err => {
            console.warn("Firebase sync warning:", err);
          });
        }
      } catch (err) {
        console.warn("Firebase sync preparation error:", err);
      }
      return next;
    });
  };

  return [data, setSyncData] as const;
}
