import React, { useState } from 'react';
import { ProductItem, StoreSettings } from '../types';
import { Package, Search, X, Plus, Minus, AlertCircle, Printer, Download } from 'lucide-react';

interface StockPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onUpdateStock: (productId: string, newStock: number) => void;
  showToast: (msg: string) => void;
  storeSettings: StoreSettings;
  isAdminUnlocked: boolean;
}

export const StockPopupModal: React.FC<StockPopupModalProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateStock,
  showToast,
  storeSettings,
  isAdminUnlocked
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const displayName = `${p.nameGu || ''} ${p.nameEn || ''}`.toLowerCase();
    const matchesSearch = 
      displayName.includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.costPrice) || 0)), 0);
  const totalSellingValue = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.price || p.mrp) || 0)), 0);

  const handlePrintStock = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border-4 border-orange-500 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-[#0B1E48] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-black flex items-center justify-center font-black shadow-md text-xl">
              📦
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>દુકાન લાઈવ સ્ટોક યાદી (Stock Ledger)</span>
                <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  ઓટો અપડેટ
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {storeSettings.storeNameGu} • કુલ આઇટમ્સ: {products.length} | કુલ સ્ટોક: {totalUnits} નંગ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintStock}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="પ્રિન્ટ કરો"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">પ્રિન્ટ</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-100 border-b border-neutral-200 text-center text-xs">
          <div className="bg-white p-2 rounded-xl shadow-2xs border">
            <span className="text-[10px] text-neutral-500 font-bold block">કુલ હાજર સ્ટોક</span>
            <span className="text-sm sm:text-base font-black text-blue-900">{totalUnits} નંગ</span>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-2xs border">
            <span className="text-[10px] text-neutral-500 font-bold block">કુલ ખરીદ મૂલ્ય</span>
            <span className="text-sm sm:text-base font-black text-rose-600">₹{totalCostValue.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-2xs border">
            <span className="text-[10px] text-neutral-500 font-bold block">કુલ વેચાણ મૂલ્ય (MRP)</span>
            <span className="text-sm sm:text-base font-black text-emerald-700">₹{totalSellingValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-white border-b border-neutral-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="પ્રોડક્ટનું નામ અથવા કોડ શોધો..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-900 text-white shadow-xs' 
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat === 'all' ? 'બધી કેટેગરી' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="flex-1 overflow-y-auto p-3 bg-neutral-50">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="p-3">પ્રોડક્ટ / આઇટમ</th>
                  <th className="p-3">કેટેગરી</th>
                  <th className="p-3 text-center">ખરીદ ભાવ</th>
                  <th className="p-3 text-center">વેચાણ ભાવ (MRP)</th>
                  <th className="p-3 text-center">હાજર સ્ટોક</th>
                  <th className="p-3 text-right">કુલ મૂલ્ય</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-medium">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-400">
                      <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                      <p className="font-bold text-sm">કોઈ પ્રોડક્ટ મળી નથી</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const stock = Number(p.stock) || 0;
                    const price = Number(p.price || p.mrp) || 0;
                    const cost = Number(p.costPrice) || 0;
                    const itemValue = stock * price;
                    const displayName = p.nameGu || p.nameEn || 'Item';

                    return (
                      <tr key={p.id} className="hover:bg-orange-50/50 transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-neutral-900 line-clamp-1">{displayName}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">કોડ: {p.id || 'N/A'}</p>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {p.category || 'જનરલ'}
                          </span>
                        </td>

                        <td className="p-3 text-center font-mono text-rose-600 font-bold">
                          ₹{cost.toFixed(2)}
                        </td>

                        <td className="p-3 text-center font-mono text-emerald-700 font-bold">
                          ₹{price.toFixed(2)}
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-neutral-100 px-2.5 py-1 rounded-xl border border-neutral-300">
                            <button
                              onClick={() => onUpdateStock(p.id, Math.max(0, stock - 1))}
                              className="w-5 h-5 rounded-lg bg-white hover:bg-red-100 text-red-600 flex items-center justify-center font-black shadow-2xs cursor-pointer"
                              title="૧ નંગ ઘટાડો"
                            >
                              -
                            </button>
                            <span className="font-black text-neutral-900 min-w-[28px] text-center">
                              {stock} {p.unit || 'નંગ'}
                            </span>
                            <button
                              onClick={() => onUpdateStock(p.id, stock + 1)}
                              className="w-5 h-5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shadow-2xs cursor-pointer"
                              title="૧ નંગ વધારો"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="p-3 text-right font-mono font-black text-neutral-900">
                          ₹{itemValue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-neutral-200 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500 font-bold">
            💡 સ્ટોક વધારવા કે ઘટાડવા માટે (+) કે (-) બટન દબાવો. ફેરફાર ઓટો સેવ થશે.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
          >
            બંધ કરો (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
