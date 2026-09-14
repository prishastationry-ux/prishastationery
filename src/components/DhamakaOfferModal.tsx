import React, { useState } from 'react';
import { Sparkles, X, Check, Megaphone, Tag, AlignLeft } from 'lucide-react';
import { StoreSettings } from '../types';
import { DEFAULT_STORE_SETTINGS } from '../data';

interface DhamakaOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: StoreSettings;
  settings?: StoreSettings;
  onSave: (updatedSettings: StoreSettings) => void;
}

export const DhamakaOfferModal: React.FC<DhamakaOfferModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  settings,
  onSave
}) => {
  const currentSettings = storeSettings || settings || DEFAULT_STORE_SETTINGS;
  const [title, setTitle] = useState(currentSettings?.dhamakaOfferTitle || '');
  const [text, setText] = useState(currentSettings?.dhamakaOfferText || '');
  const [marquee, setMarquee] = useState(currentSettings?.marqueeText || '');
  const [enabled, setEnabled] = useState(currentSettings?.dhamakaOfferEnabled !== false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentSettings,
      dhamakaOfferTitle: title,
      dhamakaOfferText: text,
      marqueeText: marquee,
      dhamakaOfferEnabled: enabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 border-2 border-neutral-800 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                💥 ધમાકા ઓફર & જાહેરાત એડિટ કરો
              </h2>
              <p className="text-[11px] text-neutral-500 font-bold">
                ગ્રાહક સ્ક્રીન પર દેખાતી ધમાકા ઓફર અને રનિંગ પટ્ટીની માહિતી બદલો
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs font-bold">
          
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div>
              <span className="text-xs font-black text-amber-900 block">ધમાકા ઓફર બેનર ચાલુ રાખો:</span>
              <span className="text-[11px] text-amber-700 font-bold">હોમ પેજ પર મુખ્ય બેનર નીચે આ ઓફર દેખાશે</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-neutral-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-600" />
              <span>ધમાકા ઓફર મુખ્ય હેડિંગ / ટાઈટલ:</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="દા.ત. 💥 મહા ધમાકા ઓફર: સ્કૂલ સ્ટેશનરી પર 20% સુધી ડિસ્કાઉન્ટ!"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold outline-none focus:border-orange-600 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-neutral-700 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-orange-600" />
              <span>ઓફરની વિગત / માહિતી:</span>
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="દા.ત. તમામ નોટબુક્સ, બોલપેન સેટ્સ અને ઓનલાઇન ફોર્મ અરજીઓ પર સ્પેશિયલ ડિસ્કાઉન્ટ ઉપલબ્ધ છે. આજે જ ઓર્ડર કરો!"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold outline-none focus:border-orange-600 focus:bg-white"
            />
          </div>

          {/* Marquee Ticker */}
          <div>
            <label className="block text-neutral-700 mb-1 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-blue-700" />
              <span>ટોચની રનિંગ માહિતી પટ્ટી (Marquee Ticker Text):</span>
            </label>
            <textarea
              rows={2}
              value={marquee}
              onChange={e => setMarquee(e.target.value)}
              placeholder="માહિતી પટ્ટીમાં ચાલતું લખાણ દાખલ કરો..."
              className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold outline-none focus:border-blue-700 focus:bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-black cursor-pointer"
            >
              રદ કરો
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>સેવ કરો (Save Offer)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
