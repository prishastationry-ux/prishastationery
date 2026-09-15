import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl border border-amber-500/30 backdrop-blur-md"
          id="offline-indicator-pwa"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 animate-pulse">
            <WifiOff className="h-4 w-4 text-amber-100" />
          </div>
          <div>
            <p className="text-white text-xs md:text-sm">ઓફલાઇન મોડ (ઑફલાઇન ચાલુ છે)</p>
            <p className="text-amber-100/80 text-[10px] md:text-xs font-normal">
              તમારો બધો ડેટા પીસીમાં સુરક્ષિત છે. નેટ આવતા જ ઓટોમેટીક ઓનલાઈન સિંક થઈ જશે!
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
