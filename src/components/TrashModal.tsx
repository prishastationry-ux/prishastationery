import React, { useState } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, Package, Receipt, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TrashRecord } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashList: TrashRecord[];
  onRestore: (record: TrashRecord) => void;
  onPermanentDelete: (record: TrashRecord) => void;
  onEmptyTrash: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashList,
  onRestore,
  onPermanentDelete,
  onEmptyTrash
}) => {
  const [filterType, setFilterType] = useState<'all' | 'product' | 'order' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = trashList.filter(item => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border-2 border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-400 flex items-center justify-center text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>🗑️ ટ્રેશ બિન / રીસાઇકલ બિન (Recycle Bin)</span>
                <span className="bg-red-500/30 text-red-200 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                  {trashList.length} આઇટમ
                </span>
              </h2>
              <p className="text-[11px] text-blue-200 font-bold">
                ડિલીટ કરેલ માલ, સ્ટોક અને બિલ અહીં સુરક્ષિત રહે છે. તમે ગમે ત્યારે પાછા લાવી શકો છો!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-3.5 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'બધા (All)', count: trashList.length },
              { id: 'product', label: 'પ્રોડક્ટ / સ્ટોક', count: trashList.filter(t => t.type === 'product').length },
              { id: 'order', label: 'બિલ / ઓર્ડર્સ', count: trashList.filter(t => t.type === 'order').length },
              { id: 'expense', label: 'ખર્ચ રજિસ્ટર', count: trashList.filter(t => t.type === 'expense').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer border ${
                  filterType === tab.id
                    ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search & Empty Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="text"
              placeholder="ટ્રેશમાં સર્ચ કરો..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold outline-none focus:border-blue-700 w-full sm:w-44"
            />

            {trashList.length > 0 && (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all"
                title="આખું ટ્રેશ ખાલી કરો (કાયમી ડિલીટ)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ખાલી કરો</span>
              </button>
            )}
          </div>
        </div>

        {/* Trash Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[58vh]">
          {filtered.length > 0 ? (
            filtered.map(item => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-neutral-300 hover:border-neutral-400 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.type === 'product'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : item.type === 'order'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.type === 'product' && <Package className="w-5 h-5" />}
                    {item.type === 'order' && <Receipt className="w-5 h-5" />}
                    {item.type === 'expense' && <DollarSign className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-neutral-900">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {item.type === 'product' ? 'પ્રોડક્ટ આઇટમ' : item.type === 'order' ? 'વેચાણ બિલ' : 'ખર્ચ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 font-bold mt-0.5">
                      {item.summary}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-bold block mt-0.5">
                      🕒 ડિલીટ સમય: {item.deletedAt}
                    </span>
                  </div>
                </div>

                {/* Actions: Restore & Permanent Delete */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <button
                    type="button"
                    onClick={() => onRestore(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="આ આઇટમને ફરીથી પાછી લાવો"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                    <span>રીસ્ટોર (Restore)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPermanentDelete(item)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                    title="કાયમી ધોરણે ડીલીટ કરો"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>ફાઈનલ ડિલીટ</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-neutral-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center font-black">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-neutral-600">ટ્રેશ બિન એકદમ ખાલી છે!</p>
              <p className="text-[11px] text-neutral-400 font-bold">
                કોઈપણ ભૂલથી ડિલીટ થયેલી વસ્તુઓ અહીં જોવા મળશે.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-600">
          <span>💡 રીસ્ટોર કરવાથી પ્રોડક્ટ ફરીથી ઇન્વેન્ટરી અને બિલ ફરીથી ઓર્ડરમાં ઉમેરાઈ જશે.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-black cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
