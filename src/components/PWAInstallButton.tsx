import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Monitor, X, Share, Download, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as standalone app, don't show the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-orange-600 hover:to-amber-700 transition-all duration-300 transform active:scale-95"
        id="pwa-install-btn-chromium"
        title="કોમ્પ્યુટર અથવા મોબાઈલમાં એપ તરીકે ઈન્સ્ટોલ કરો"
      >
        <Monitor className="h-4 w-4" />
        <span>🖥️ સોફ્ટવેર ઇન્સ્ટોલ કરો</span>
      </button>
    );
  }

  // iOS Safari flow (iOS doesn't fire beforeinstallprompt, needs guided manual installation instructions)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-100 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-200 transition-colors"
          id="pwa-install-btn-ios"
        >
          <Share className="h-3.5 w-3.5" />
          <span>📱 iPhone માં ડાઉનલોડ કરો</span>
        </button>

        <AnimatePresence>
          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-gray-900">iPhone કે iPad માં ડાઉનલોડ કરો</h3>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-3.5 text-xs text-gray-600 leading-relaxed">
                  <div className="flex gap-2 items-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-[10px]">1</span>
                    <p>તમારા Safari બ્રાઉઝરના તળિયે આપેલા <span className="font-bold text-orange-600">Share (શેર)</span> બટન પર ક્લિક કરો.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-[10px]">2</span>
                    <p>મેનુમાં નીચે સ્ક્રોલ કરો અને <span className="font-bold text-orange-600">"Add to Home Screen"</span> પર દબાવો.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-[10px]">3</span>
                    <p>પછી ઉપર જમણી બાજુએ <span className="font-bold text-orange-600">"Add"</span> પર ક્લિક કરો.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-6 w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
                >
                  સમજાઈ ગયું
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};
