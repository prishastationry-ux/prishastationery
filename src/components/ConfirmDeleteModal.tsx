import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, ArrowLeft } from 'lucide-react';

export interface DeleteTargetInfo {
  type: 'product' | 'order' | 'expense' | 'all_trash' | 'trash_item';
  id: string;
  title: string;
  subtitle?: string;
  data?: any;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  target: DeleteTargetInfo | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  target,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-white rounded-2xl max-w-md w-full border-2 border-red-500 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                {target.type === 'all_trash' ? 'ટ્રેશ બિન ખાલી કરવું છે?' : 'ડિલીટ કરવાની ખાતરી કરો'}
              </h3>
              <p className="text-[11px] text-red-100 font-bold">
                {target.type === 'product' && 'પ્રોડક્ટ સ્ટોકમાંથી દૂર થશે'}
                {target.type === 'order' && 'બિલ ડિલીટ થશે (માલ સ્ટોકમાં જમા થશે)'}
                {target.type === 'expense' && 'ખર્ચ એન્ટ્રી દૂર થશે'}
                {target.type === 'trash_item' && 'કાયમી ધોરણે ડિલીટ થશે'}
                {target.type === 'all_trash' && 'તમામ ડેટા કાયમી ધોરણે સાફ થઈ જશે'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-neutral-50/50">
          <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
            <p className="text-xs font-bold text-neutral-500">આઇટમ વિગત:</p>
            <p className="text-sm font-black text-neutral-900">{target.title}</p>
            {target.subtitle && (
              <p className="text-xs text-neutral-600 font-bold">{target.subtitle}</p>
            )}
          </div>

          {target.type !== 'trash_item' && target.type !== 'all_trash' ? (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-black flex items-center gap-1.5 text-emerald-800">
                <span>🛡️ સુરક્ષિત ટ્રેશ બિનમાં જશે</span>
              </p>
              <p className="text-[11px] text-emerald-700 font-bold">
                ચિંતા કરશો નહિ! આ આઇટમ ટ્રેશ બિન (Recycle Bin) માં સચવાઈ રહેશે, જેથી તમે ગમે ત્યારે ફરીથી રીસ્ટોર (Restore) કરી શકશો.
              </p>
              {target.type === 'order' && (
                <p className="text-[11px] text-blue-800 font-black mt-1">
                  📦 આ બિલમાં વેચાયેલો માલ આપમેળે ફરીથી સ્ટોકમાં જમા થઈ જશે.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
              <p className="font-black flex items-center gap-1.5 text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>કાયમી ડિલીટ (Permanent Delete)</span>
              </p>
              <p className="text-[11px] text-red-700 font-bold">
                આ ડેટા કાયમ માટે કાઢી નાખવામાં આવશે અને પાછો લાવી શકાશે નહિ.
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 bg-neutral-100 border-t border-neutral-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-800 text-xs font-black rounded-xl border border-neutral-300 cursor-pointer"
          >
            રદ કરો (Cancel)
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>હા, ડિલીટ કરો</span>
          </button>
        </div>

      </div>
    </div>
  );
};
