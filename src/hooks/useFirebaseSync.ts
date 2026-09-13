import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFirebaseSync<T>(docName: string, localKey: string, initialData: T) {
  // Load from local storage first for instant boot, but Firebase will overwrite once it connects
  const [data, setData] = useState<T>(() => {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialData;
  });

  useEffect(() => {
    const docRef = doc(db, "store_data", docName);
    
    // Migration check: If Firebase is empty, upload what we have in localStorage
    getDoc(docRef).then(snapshot => {
        if (!snapshot.exists()) {
            const saved = localStorage.getItem(localKey);
            // ONLY write to Firebase if this device actually has some saved data.
            // This prevents a fresh mobile device from overwriting the cloud with empty arrays
            // before the admin's laptop has a chance to upload the real data.
            if (saved) {
                try {
                    setDoc(docRef, { data: JSON.parse(saved) });
                } catch(e) {}
            }
        }
    });

    // Listen for real-time updates from Firebase
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data().data as T;
        setData(remoteData);
        // Keep localStorage in sync just in case
        localStorage.setItem(localKey, JSON.stringify(remoteData));
      }
    });
    
    return () => unsubscribe();
  }, [docName, localKey, initialData]);

  // Provide a wrapped setter that also saves to Firebase immediately
  const setSyncData = (value: T | ((val: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as any)(prev) : value;
      // Keep local storage fresh immediately
      localStorage.setItem(localKey, JSON.stringify(next));
      // Fire and forget save to Firebase with graceful error handling
      setDoc(doc(db, "store_data", docName), { data: next }).catch(err => {
        console.warn("Firebase sync size/network warning (saved locally):", err);
      });
      return next;
    });
  };

  return [data, setSyncData] as const;
}
