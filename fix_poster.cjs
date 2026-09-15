const fs = require('fs');
let code = fs.readFileSync('src/components/MobilePosterWidget.tsx', 'utf8');

code = `import React, { useState, useEffect } from 'react';
import { Smartphone, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { BannerSlide } from '../types';

interface MobilePosterWidgetProps {
  posters: BannerSlide[];
  headerTitle?: string;
  headerSubtitle?: string;
  Icon?: LucideIcon;
}

export const MobilePosterWidget: React.FC<MobilePosterWidgetProps> = ({
  posters,
  headerTitle,
  headerSubtitle,
  Icon
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
    <div className="bg-white rounded-3xl border-2 border-neutral-300 shadow-md p-3 flex flex-col relative overflow-hidden group">
      {headerTitle && Icon && (
        <div className="w-full flex items-center justify-between mb-2.5 pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-orange-100 rounded-lg text-orange-600">
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black text-neutral-900 leading-tight">
                {headerTitle}
              </h4>
              {headerSubtitle && (
                <p className="text-[10px] font-bold text-neutral-500">
                  {headerSubtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Box Display */}
      <div className="w-full aspect-[4/5] bg-neutral-100 rounded-2xl relative overflow-hidden flex flex-col justify-end">
        {/* Background Image */}
        <img
          src={currentPoster.imageUrl}
          alt={currentPoster.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Carousel Dots */}
        <div className="relative z-20 flex items-center justify-center gap-1 pb-3">
          {activeList.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={\`h-1.5 rounded-full transition-all cursor-pointer \${
                currentIndex === idx ? 'w-5 bg-orange-500 shadow-sm' : 'w-1.5 bg-white/70 shadow-sm'
              }\`}
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
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((currentIndex + 1) % activeList.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/MobilePosterWidget.tsx', code);
console.log('MobilePosterWidget updated');
