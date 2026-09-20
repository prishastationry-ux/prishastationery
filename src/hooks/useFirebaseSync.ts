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

  // Load deleted IDs tracking from localStorage
  const getDeletedIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem(localKey + '_deleted_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {}
    return new Set<string>();
  };

  const saveDeletedIds = (deletedSet: Set<string>) => {
    try {
      localStorage.setItem(localKey + '_deleted_ids', JSON.stringify(Array.from(deletedSet)));
    } catch (e) {}
  };

  // Load from local storage first for instant offline boot
  const [data, setData] = useState<T>(() => {
    let saved = localStorage.getItem(localKey);
    if (!saved) {
      saved = localStorage.getItem(localKey + '_backup');
    }
    let initialVal = initialData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = filterMockData(parsed);
        initialVal = cleaned as T;
      } catch (e) { console.error(e); }
    }

    // Filter out any locally deleted items
    const deletedIds = getDeletedIds();
    if (Array.isArray(initialVal) && deletedIds.size > 0) {
      initialVal = (initialVal as any[]).filter(item => item?.id && !deletedIds.has(item.id)) as unknown as T;
    }
    return initialVal;
  });

  useEffect(() => {
    const isCloudSyncOn = localStorage.getItem('prisha_cloud_sync_enabled') === 'true';
    if (!isCloudSyncOn) {
      return; // Offline mode: strictly local persistence, zero cloud interaction or remote overwrites!
    }

    const docRef = doc(db, "store_data", docName);
    
    // Initial check: If Firebase is empty, upload what we have in localStorage
    getDoc(docRef).then(snapshot => {
      const saved = localStorage.getItem(localKey) || localStorage.getItem(localKey + '_backup');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleaned = filterMockData(parsed);
          const deletedIds = getDeletedIds();
          const activeCleaned = Array.isArray(cleaned) ? cleaned.filter((item: any) => !item?.id || !deletedIds.has(item.id)) : cleaned;
          
          if (Array.isArray(activeCleaned) && activeCleaned.length > 0) {
            if (!snapshot.exists()) {
              setDoc(docRef, { data: sanitizeForFirestore(activeCleaned) }).catch(() => {});
            } else {
              const cloudData = snapshot.data()?.data;
              if (!Array.isArray(cloudData) || cloudData.length === 0) {
                setDoc(docRef, { data: sanitizeForFirestore(activeCleaned) }).catch(() => {});
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
            const deletedIds = getDeletedIds();

            // If printJobs, preserve existing local files
            if (docName === 'printJobs' && Array.isArray(cleaned) && Array.isArray(prevData)) {
              const activeCleaned = cleaned.filter((item: any) => !item?.id || !deletedIds.has(item.id));
              const merged = activeCleaned.map((newJob: any) => {
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

              // Also keep any local items not yet in cloud
              const cloudIds = new Set(merged.map((item: any) => item?.id).filter(Boolean));
              const localOnly = (prevData as any[]).filter((item: any) => item?.id && !cloudIds.has(item.id) && !deletedIds.has(item.id));
              const finalMerged = [...merged, ...localOnly];

              try {
                localStorage.setItem(localKey, JSON.stringify(finalMerged));
                localStorage.setItem(localKey + '_backup', JSON.stringify(finalMerged));
              } catch (e) {}
              return finalMerged as unknown as T;
            }

            // For all array records:
            if (Array.isArray(cleaned) && Array.isArray(prevData)) {
              if (cleaned.length === 0 && prevData.length > 0) {
                return prevData;
              }

              // Absolute Local Authority Merge:
              // The local state (`prevData`) is strictly authoritative for any items it currently holds.
              // We ONLY add items from the cloud that DO NOT exist locally (e.g. added from another PC).
              // This guarantees that local edits, deletions, and additions are NEVER overwritten by an older cloud snapshot.
              const localItemsMap = new Map();
              (prevData as any[]).forEach((item: any) => {
                if (item?.id && !deletedIds.has(item.id)) {
                  localItemsMap.set(item.id, item);
                }
              });

              let newlyAddedFromCloud = false;
              cleaned.forEach((cloudItem: any) => {
                if (cloudItem?.id && !deletedIds.has(cloudItem.id)) {
                  if (!localItemsMap.has(cloudItem.id)) {
                    localItemsMap.set(cloudItem.id, cloudItem);
                    newlyAddedFromCloud = true;
                  }
                }
              });

              // Convert back to array (maintains local order for existing items, appends new cloud items)
              const merged = Array.from(localItemsMap.values());

              // Auto-push if we have offline additions that the cloud doesn't know about yet
              if (merged.length > cleaned.length || !newlyAddedFromCloud) {
                try {
                  // Only push if there's actually a difference in content
                  if (JSON.stringify(merged) !== JSON.stringify(cleaned)) {
                    setDoc(docRef, { data: sanitizeForFirestore(merged) }).catch(() => {});
                  }
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

      // Track deletions if items were removed
      if (Array.isArray(prev) && Array.isArray(next)) {
        const nextIds = new Set(next.map((item: any) => item?.id).filter(Boolean));
        const deletedIds = getDeletedIds();
        let hasNewDeletions = false;
        prev.forEach((item: any) => {
          if (item?.id && !nextIds.has(item.id)) {
            deletedIds.add(item.id);
            hasNewDeletions = true;
          }
        });
        if (hasNewDeletions) {
          saveDeletedIds(deletedIds);
        }
      }

      // Avoid unnecessary database writes if unchanged
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
      } catch (e) {}

      // 1. Save full files into IndexedDB for printJobs
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

      // 2. Save locally immediately (Offline authoritative storage)
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
        localStorage.setItem(localKey + '_backup', JSON.stringify(next));
      } catch (err) {
        console.warn("LocalStorage save warning:", err);
        try {
          if (Array.isArray(next)) {
            const lightNext = next.map((item: any) => ({
              ...item,
              files: item.files?.map((f: any) => {
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

      // 3. Save to Firebase asynchronously only if cloud sync is enabled
      const isCloudSyncOn = localStorage.getItem('prisha_cloud_sync_enabled') === 'true';
      if (isCloudSyncOn) {
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

            const firestoreData = next.map((item: any) => ({
              ...item,
              files: item.files?.map((f: any) => ({
                ...f,
                fileDataUrl: f.fileDataUrl && !f.fileDataUrl.startsWith('blob:') && f.fileDataUrl.length < 300000 ? f.fileDataUrl : ''
              }))
            }));

            setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(firestoreData) }).catch(err => {
              console.warn("Firebase sync warning:", err);
            });
          } else {
            setDoc(doc(db, "store_data", docName), { data: sanitizeForFirestore(next) }).catch(err => {
              console.warn("Firebase sync warning:", err);
            });
          }
        } catch (err) {
          console.warn("Firebase sync preparation error:", err);
        }
      }
      return next;
    });
  };

  return [data, setSyncData] as const;
}

