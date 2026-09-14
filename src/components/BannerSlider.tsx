import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { BannerSlide } from '../types';

interface BannerSliderProps {
  slides?: BannerSlide[];
  defaultImageUrl?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  storeNameGu?: string;
  intervalSeconds?: number;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  slides = [],
  defaultImageUrl,
  defaultTitle = 'ઓનલાઇન સરકારી સેવાઓ અને સ્ટેશનરી સામાન',
  defaultSubtitle = 'નોટબુક, પેન, ફાઇલ્સ, આધાર-પાન કાર્ડ, ઝેરોક્ષ પ્રિન્ટિંગ',
  storeNameGu = 'શ્રી પ્રિષા સ્ટેશનરી & ઝેરોક્ષ સેન્ટર',
  intervalSeconds = 5
}) => {
  // Normalize slides
  const activeSlides: BannerSlide[] = (slides && slides.length > 0)
    ? slides
    : [
        {
          id: 'slide-default',
          imageUrl: defaultImageUrl || '',
          title: defaultTitle,
          subtitle: defaultSubtitle
        }
      ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Auto-rotating slider
  useEffect(() => {
    if (activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length);
    }, (intervalSeconds || 5) * 1000);

    return () => clearInterval(timer);
  }, [activeSlides.length, intervalSeconds]);

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : activeSlides.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < activeSlides.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-[#0B1E48] via-[#1E3A8A] to-[#0B1E48] text-white p-5 sm:p-7 shadow-md overflow-hidden border border-blue-900 min-h-[170px] sm:min-h-[200px] flex flex-col justify-center">
      {/* Background Image with smooth transition */}
      {currentSlide.imageUrl ? (
        <div className="absolute inset-0 z-0 transition-opacity duration-700">
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.title || 'Banner'}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E48]/90 via-[#0B1E48]/60 to-transparent" />
        </div>
      ) : null}

      {/* Content */}
      <div className="relative z-10 max-w-2xl space-y-2">
        <span className="inline-flex items-center gap-1.5 bg-orange-500 text-black text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> {storeNameGu}
        </span>
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight transition-all duration-300">
          {currentSlide.title || defaultTitle}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed">
          {currentSlide.subtitle || defaultSubtitle}
        </p>

        {/* Quick perks */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1">
            ⚡ ઈન્સ્ટન્ટ ઓનલાઇન રસીદ & બિલ
          </span>
          <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1">
            📱 ડાયરેક્ટ UPI QR પેમેન્ટ
          </span>
          <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1">
            🏢 CSC ઓથોરાઇઝ્ડ સેન્ટર
          </span>
        </div>
      </div>

      {/* Navigation Arrows for multi-slides */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer z-20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center cursor-pointer z-20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'bg-orange-400 w-5' : 'bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
