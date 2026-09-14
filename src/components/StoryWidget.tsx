import React, { useState } from 'react';
import { Sparkles, X, ChevronLeft, ChevronRight, Plus, Camera } from 'lucide-react';
import { StoreStory } from '../types';

interface StoryWidgetProps {
  stories?: StoreStory[];
  isAdminUnlocked?: boolean;
  onOpenStoreSettings?: () => void;
}

export const StoryWidget: React.FC<StoryWidgetProps> = ({
  stories = [],
  isAdminUnlocked,
  onOpenStoreSettings
}) => {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  const activeStories = stories.filter(s => s.active !== false);

  if (activeStories.length === 0 && !isAdminUnlocked) {
    return null;
  }

  const currentViewingStory = selectedStoryIndex !== null ? activeStories[selectedStoryIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    } else if (selectedStoryIndex !== null) {
      setSelectedStoryIndex(activeStories.length - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedStoryIndex !== null && selectedStoryIndex < activeStories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null); // Close at end
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-300 p-3 sm:p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-black text-xs text-neutral-900 flex items-center gap-1">
            <span>✨ દૈનિક અપડેટ્સ & સ્ટોરી (Daily Stories)</span>
          </span>
        </div>
        {isAdminUnlocked && onOpenStoreSettings && (
          <button
            type="button"
            onClick={onOpenStoreSettings}
            className="text-[10px] font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md"
          >
            <Camera className="w-3 h-3 text-blue-600" />
            <span>+ સ્ટોરી ઉમેરો / એડિટ કરો</span>
          </button>
        )}
      </div>

      {/* HORIZONTAL STORIES AVATAR STRIP */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {activeStories.map((story, idx) => (
          <button
            key={story.id || idx}
            type="button"
            onClick={() => setSelectedStoryIndex(idx)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group focus:outline-none"
          >
            {/* Gradient Ring Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                {story.mediaUrl ? (
                  <img
                    src={story.mediaUrl}
                    alt={story.title}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
              </div>
            </div>
            <span className="text-[10.5px] font-black text-neutral-800 max-w-[65px] truncate text-center leading-tight">
              {story.title}
            </span>
          </button>
        ))}

        {isAdminUnlocked && onOpenStoreSettings && (
          <button
            type="button"
            onClick={onOpenStoreSettings}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer focus:outline-none"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-neutral-400 hover:border-orange-500 flex items-center justify-center bg-neutral-50 hover:bg-orange-50 text-neutral-500 hover:text-orange-600 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500">નવી સ્ટોરી</span>
          </button>
        )}
      </div>

      {/* FULLSCREEN STORY VIEWER MODAL */}
      {currentViewingStory && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 animate-fade-in no-print"
          onClick={() => setSelectedStoryIndex(null)}
        >
          <div
            className="relative bg-neutral-900 rounded-2xl max-w-sm w-full border border-neutral-700 shadow-2xl overflow-hidden flex flex-col aspect-9/16 max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Progress Bar */}
            <div className="absolute top-2 left-2 right-2 z-30 flex items-center gap-1">
              {activeStories.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    idx === selectedStoryIndex ? 'bg-white' : idx < (selectedStoryIndex || 0) ? 'bg-white/60' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Header info */}
            <div className="absolute top-5 left-3 right-3 z-30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-black flex items-center justify-center font-black text-xs">
                  🛍️
                </div>
                <div>
                  <div className="font-black text-xs leading-tight">{currentViewingStory.title}</div>
                  <div className="text-[9.5px] text-neutral-300 font-bold">{currentViewingStory.date || 'આજે'} • પ્રિષા સ્ટેશનરી</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStoryIndex(null)}
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 w-full bg-black flex items-center justify-center overflow-hidden relative">
              {currentViewingStory.mediaUrl ? (
                <img
                  src={currentViewingStory.mediaUrl}
                  alt={currentViewingStory.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-2">
                  <span className="text-5xl">🛍️</span>
                  <div className="text-base font-black">{currentViewingStory.title}</div>
                </div>
              )}

              {/* Prev / Next Click Zones */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Caption Footer */}
            {currentViewingStory.caption && (
              <div className="p-3 bg-neutral-900/90 backdrop-blur-xs border-t border-neutral-800 text-white text-xs font-bold text-center">
                {currentViewingStory.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
