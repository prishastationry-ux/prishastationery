import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { isQuotaExhausted } from '../hooks/useFirebaseSync';
import { WifiOff, Database, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const checkQuota = () => {
      setQuotaExceeded(isQuotaExhausted());
    };
    checkQuota();
    const interval = setInterval(checkQuota, 5000);
    return () => clearInterval(interval);
  }, []);

  const dbConsoleUrl = 'https://console.firebase.google.com/project/gen-lang-client-0958955246/firestore/databases/ai-studio-prishastationery-078f1f9e-2724-4c68-837f-5a6cd2f9d7c1/data?openUpgradeDialog=true';

  return (
    <AnimatePresence>
      {(!isOnline || quotaExceeded) && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl border backdrop-blur-md max-w-md ${
            quotaExceeded 
              ? 'bg-amber-900/95 border-amber-600/50 text-amber-50' 
              : 'bg-amber-600 border-amber-500/30'
          }`}
          id="offline-indicator-pwa"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 animate-pulse">
            {quotaExceeded ? (
              <Database className="h-5 w-5 text-amber-200" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-100" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-white text-xs md:text-sm font-black flex items-center gap-1.5">
              {quotaExceeded ? '⚠️ ક્લાઉડ સિંક લિમિટ (Free Tier Quota Reached)' : 'ઓફલાઇન મોડ (ઑફલાઇન ચાલુ છે)'}
            </p>
            <p className="text-amber-100/90 text-[10px] md:text-xs font-normal">
              {quotaExceeded 
                ? 'આજનો ફ્રી કલાઉડ ક્વોટા પૂર્ણ થયો છે. તમારો તમામ ડેટા લોકલ સ્ટોરેજમાં ૧૦૦% સેવ થાય છે. ક્વોટા રીસેટ થતા ઓટો-સિંક થશે.'
                : 'તમારો બધો ડેટા પીસીમાં સુરક્ષિત છે. નેટ આવતા જ ઓટોમેટીક ઓનલાઈન સિંક થઈ જશે!'}
            </p>
            {quotaExceeded && (
              <a
                href={dbConsoleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-amber-200 underline font-bold hover:text-white mt-1"
              >
                <span>ફાયરબેઝ ડેટાબેઝ ક્વોટા જુઓ / અપગ્રેડ કરો (Firebase Console)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
