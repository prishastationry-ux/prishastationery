import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, QrCode, Printer, Smartphone, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { generateSyncQrSvg } from '../lib/invoiceUtils';

interface CustomerUploadQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const CustomerUploadQrModal: React.FC<CustomerUploadQrModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?action=xerox`
    : 'https://prishastationery.com/?action=xerox';

  const qrSvgUri = generateSyncQrSvg(currentUrl);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        showToast('📋 ગ્રાહક ફાઇલ અપલોડ લિંક કોપી થઈ ગઈ!');
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = `નમસ્તે! પ્રિશા સ્ટેશનરી (Prisha Stationery, Tharad) માં ઝેરોક્ષ, પ્રિન્ટિંગ અથવા PVC સ્માર્ટ કાર્ડ કઢાવવા માટે તમારી PDF, ફોટો કે Excel ફાઇલ નીચેની લિંક પરથી ઓરિજિનલ HD ક્વોલિટીમાં અપલોડ કરો:\n\n🔗 ${currentUrl}\n\n(અહીં મોકલેલી ફાઇલ ઓરિજિનલ સાઇઝમાં સીધી પ્રિન્ટિંગ મશીન પર મળશે!)`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-1.5">
                <span>મોબાઇલ ફાઇલ અપલોડ QR & લિંક</span>
              </h3>
              <p className="text-xs text-blue-200">
                ગ્રાહક પોતાના મોબાઇલથી PDF, ફોટો કે Excel સીધું મોકલી શકશે
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Main QR Box */}
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-neutral-50 to-neutral-100 rounded-2xl border-2 border-dashed border-neutral-300 text-center">
            <p className="text-xs font-black text-neutral-800 mb-2 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-orange-600" />
              <span>કાઉન્ટર પર ગ્રાહકને સ્કેન કરવા કહો</span>
            </p>

            {qrSvgUri ? (
              <div className="p-3 bg-white rounded-xl shadow-md border border-neutral-200">
                <img
                  src={qrSvgUri}
                  alt="Customer Upload QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-neutral-200 rounded-xl flex items-center justify-center text-neutral-500">
                QR Code Loading...
              </div>
            )}

            <p className="text-[11px] font-bold text-neutral-500 mt-2">
              ગ્રાહક ફોનના કેમેરા અથવા Google Lens થી સ્કેન કરશે તો સીધું અપલોડ પેજ ખુલશે
            </p>
          </div>

          {/* Guarantee of 100% Original Size & Quality */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
              <span className="text-base">✅</span>
              <span>૧૦૦% ઓરિજિનલ સાઇઝ અને ક્વોલિટી ગેરંટી (Zero Quality Loss):</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                <FileText className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-800">PDF ફાઇલ</p>
                <p className="text-[10px] text-neutral-500 font-medium">ઓરિજિનલ પેજ & અક્ષરો</p>
              </div>

              <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                <ImageIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-800">ફોટો / Image</p>
                <p className="text-[10px] text-neutral-500 font-medium">ફૂલ HD 300 DPI સાઈઝ</p>
              </div>

              <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-[11px] font-black text-neutral-800">Excel / Word</p>
                <p className="text-[10px] text-neutral-500 font-medium">સંપૂર્ણ ડેટા & શીટ્સ</p>
              </div>
            </div>
            
            <p className="text-[11px] text-emerald-800 font-bold leading-relaxed pt-0.5">
              💡 WhatsApp પર ફોટો મોકલવાથી ઘણીવાર ફોટો દબાઈને ઝાંખો થઈ જાય છે, પરંતુ <strong>આ લિંક પરથી મોકલવાથી ૧ પણ ટકા ક્વોલિટી ઘટતી નથી</strong> અને સીધી તમારા કોમ્પ્યુટરમાં ઓરિજિનલ ફાઇલ ડાઉનલોડ થાય છે!
            </p>
          </div>

          {/* Action Buttons: Copy Link & WhatsApp Share */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-700 truncate select-all">
                {currentUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'કોપી થયું!' : 'લિંક કોપી'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
              <span>ગ્રાહકના WhatsApp પર લિંક મોકલો (1-Click Share)</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-600">
          <span>પ્રિશા સ્ટેશનરી - થરાદ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-200 rounded-lg text-neutral-800 cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
