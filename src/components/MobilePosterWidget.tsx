import React, { useState, useEffect } from 'react';
import { Smartphone, ChevronLeft, ChevronRight, Sparkles, Plus, Image as ImageIcon, ExternalLink, X } from 'lucide-react';
import { BannerSlide } from '../types';

interface MobilePosterWidgetProps {
  posters: BannerSlide[];
  isAdminUnlocked: boolean;
  onOpenStoreSettings: () => void;
}

export const MobilePosterWidget: React.FC<MobilePosterWidgetProps> = ({
  posters,
  isAdminUnlocked,
  onOpenStoreSettings
}) => {
  const defaultPosters: BannerSlide[] = [
    {
      id: 'p-1',
      imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80',
      title: 'ઓનલાઇન પ્રિન્ટિંગ & ઝેરોક્ષ સેવા',
      subtitle: 'WhatsApp & Web પરથી ફાઇલ મોકલો • સુપર ફાસ્ટ પ્રિન્ટ મેળવો',
    },
    {
      id: 'p-2',
      imageUrl: 'https://images.unsplash.com/photo-1456735190829-80ab072ac1a0?w=600&auto=format&fit=crop&q=80',
      title: 'સ્કૂલ-કોલેજ સ્ટેશનરી & ચોપડા',
      subtitle: 'હોલસેલ ભાવે તમામ બ્રાન્ડેડ સાહિત્ય ઉપલબ્ધ છે',
    },
    {
      id: 'p-3',
      imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
      title: 'CSC ડિજિટલ સેવા કેન્દ્ર (Tharad)',
      subtitle: 'આધાર, પાન કાર્ડ, ચૂંટણી કાર્ડ, આવકના દાખલા',
    }
  ];

  const activeList = posters && posters.length > 0 ? posters : defaultPosters;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (activeList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeList.length]);

  const currentPoster = activeList[currentIndex] || activeList[0];

  return (
    <>
      <div className="bg-white rounded-3xl border-2 border-neutral-300 shadow-md p-3 sm:p-4 flex flex-col items-center relative overflow-hidden group">
        {/* Header Ribbon */}
        <div className="w-full flex items-center justify-between mb-2.5 pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-orange-100 rounded-lg text-orange-600">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black text-neutral-900 leading-tight">
                દુકાન પોસ્ટર & ઓફર
              </h4>
              <p className="text-[10px] font-bold text-neutral-500">
                રોજિંદા નવા અપડેટ્સ & જાહેરાત
              </p>
            </div>
          </div>
          {isAdminUnlocked && (
            <button
              onClick={onOpenStoreSettings}
              className="text-[10px] font-black bg-orange-500 hover:bg-orange-600 text-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
              title="નવા પોસ્ટર અપલોડ કરો"
            >
              <Plus className="w-3 h-3" />
              <span>પોસ્ટર એડિટ</span>
            </button>
          )}
        </div>

        {/* Smartphone Mockup Outer Body */}
        <div className="w-full max-w-[260px] aspect-[9/16] bg-neutral-900 rounded-[2.5rem] p-2.5 shadow-xl border-4 border-neutral-800 relative flex flex-col justify-between overflow-hidden">
          {/* Top Speaker Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-700"></div>
            <div className="w-6 h-1 rounded-full bg-neutral-800"></div>
          </div>

          {/* Screen Display */}
          <div 
            className="w-full h-full rounded-[1.8rem] overflow-hidden relative bg-neutral-800 flex flex-col justify-end cursor-pointer select-none"
            onClick={() => setIsZoomed(true)}
          >
            {/* Background Image */}
            <img
              src={currentPoster.imageUrl}
              alt={currentPoster.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"></div>

            {/* Content Overlay */}
            <div className="relative z-20 p-3 text-white space-y-1">
              <span className="bg-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                <Sparkles className="w-2.5 h-2.5" />
                <span>સ્પેશિયલ ઓફર</span>
              </span>
              <h5 className="text-xs sm:text-sm font-black text-white leading-snug drop-shadow-md">
                {currentPoster.title}
              </h5>
              {currentPoster.subtitle && (
                <p className="text-[10px] text-neutral-200 font-medium line-clamp-2 leading-relaxed drop-shadow-xs">
                  {currentPoster.subtitle}
                </p>
              )}
            </div>

            {/* Carousel Dots */}
            <div className="relative z-20 flex items-center justify-center gap-1 pb-2">
              {activeList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-5 bg-orange-400' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* Prev / Next Arrows */}
            {activeList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((currentIndex - 1 + activeList.length) % activeList.length);
                  }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((currentIndex + 1) % activeList.length);
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Bar indicator */}
          <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-1"></div>
        </div>

        {/* Footer info & Click to Zoom */}
        <div className="w-full flex items-center justify-between pt-2.5 mt-1 text-[11px] font-bold text-neutral-500">
          <span>{currentIndex + 1} / {activeList.length} પોસ્ટર્સ</span>
          <button 
            onClick={() => setIsZoomed(true)}
            className="text-orange-600 hover:text-orange-700 font-black flex items-center gap-1 cursor-pointer"
          >
            <span>મોટું જુઓ</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Full Screen Poster Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-md w-full bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-700 shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/70 hover:bg-black text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black">
              <img
                src={currentPoster.imageUrl}
                alt={currentPoster.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 text-white">
                <h3 className="text-base font-black text-white">{currentPoster.title}</h3>
                {currentPoster.subtitle && (
                  <p className="text-xs text-neutral-300 mt-1">{currentPoster.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
