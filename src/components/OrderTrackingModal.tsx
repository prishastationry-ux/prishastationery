import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  FileText,
  Phone,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onViewInvoice: (order: OrderRecord) => void;
  storeSettings: StoreSettings;
}

const ORDER_STAGES = [
  { key: 'placed', labelGu: 'ઓર્ડર નોંધાયો', labelEn: 'Order Placed', icon: Clock, desc: 'તમારો ઓર્ડર સફળતાપૂર્વક નોંધાઈ ગયો છે.' },
  { key: 'confirmed', labelGu: 'પેમેન્ટ મંજૂર', labelEn: 'Payment Verified', icon: CheckCircle2, desc: 'પેમેન્ટ અને વિગતો વેરિફાય થઈ ગઈ છે.' },
  { key: 'packed', labelGu: 'પેકિંગ થઈ ગયું', labelEn: 'Packed & Ready', icon: Package, desc: 'તમારો ઓર્ડર પેક થઈને તૈયાર છે.' },
  { key: 'out_for_delivery', labelGu: 'રવાના થયો', labelEn: 'Out for Delivery', icon: Truck, desc: 'દુકાન પરથી ડિલિવરી / પિકઅપ માટે તૈયાર છે.' },
  { key: 'delivered', labelGu: 'ડિલિવરી પૂર્ણ', labelEn: 'Delivered', icon: Check, desc: 'ગ્રાહકને ઓર્ડર મળી ગયો છે.' }
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  onViewInvoice,
  storeSettings
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<OrderRecord[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    setHasSearched(true);
    const cleanDigits = query.replace(/\D/g, '');

    const matched = orders.filter(o => {
      const matchInv = o.invoiceNo.toLowerCase().includes(query) || o.id.toLowerCase().includes(query);
      const matchMobile = cleanDigits.length >= 4 && o.mobile.replace(/\D/g, '').includes(cleanDigits);
      const matchName = o.customerName.toLowerCase().includes(query);
      return matchInv || matchMobile || matchName;
    });

    setSearchedOrders(matched);
  };

  const getStageIndex = (status?: string) => {
    switch (status) {
      case 'confirmed': return 1;
      case 'packed': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      case 'placed':
      default: return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-black flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ઓર્ડર લાઈવ ટ્રેકિંગ (Track Order Status)
              </h2>
              <p className="text-xs text-neutral-300 font-bold">
                ઓર્ડર નંબર અથવા મોબાઇલ નંબર દાખલ કરી સ્ટેટસ જાણો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="p-4 bg-slate-50 border-b border-neutral-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="ઓર્ડર / ઇન્વોઇસ નં. (દા.ત. PRISHA-5120) અથવા ૧૦ આંકડાનો મોબાઇલ નં."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 placeholder:text-neutral-400 focus:border-blue-700 outline-none shadow-2xs"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>ટ્રેક કરો</span>
            </button>
          </form>
        </div>

        {/* RESULTS BODY */}
        <div className="p-4 max-h-[65vh] overflow-y-auto space-y-4">
          {!hasSearched ? (
            <div className="text-center py-8 space-y-2 text-neutral-500">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 mx-auto flex items-center justify-center font-black">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-neutral-800">
                તમારો ઓર્ડર / બિલ નંબર અથવા મોબાઇલ નંબર ઉપર સર્ચ કરો
              </p>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                દુકાન તરફથી ઓર્ડર મંજૂર, પેકિંગ અને ડિલિવરીનું લાઈવ સ્ટેટસ અહીં જોઈ શકાશે.
              </p>
            </div>
          ) : searchedOrders && searchedOrders.length > 0 ? (
            searchedOrders.map(order => {
              const currentStageIdx = getStageIndex(order.orderStatus);
              const isCancelled = order.orderStatus === 'cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border-2 border-neutral-300 p-4 shadow-sm space-y-4"
                >
                  {/* ORDER HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-blue-900 font-mono">
                          {order.invoiceNo}
                        </span>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {order.orderType === 'online' ? '🌐 ઓનલાઇન ઓર્ડર' : '🏪 કાઉન્ટર બિલ'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-bold mt-0.5 flex items-center gap-2">
                        <span>👤 {order.customerName}</span>
                        <span>•</span>
                        <span>📞 +91 {order.mobile}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-sm font-black text-neutral-900">₹{order.total}/-</span>
                        <span className={`block text-[10px] font-black ${order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {order.paymentMode} ({order.paymentStatus === 'Paid' ? 'પેમેન્ટ જમા' : 'પેન્ડિંગ'})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onViewInvoice(order);
                          onClose();
                        }}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-2 rounded-xl border text-xs font-bold flex items-center gap-1 shadow-2xs"
                        title="બિલ જુઓ / પ્રિન્ટ કરો"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-black">બિલ જુઓ</span>
                      </button>
                    </div>
                  </div>

                  {/* CANCELLED STATE */}
                  {isCancelled ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs font-black">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>આ ઓર્ડર રદ (Cancelled) કરવામાં આવ્યો છે. વધુ માહિતી માટે દુકાન સંપર્ક કરો.</span>
                    </div>
                  ) : (
                    /* 5-STAGE VISUAL PROGRESS TRACKER */
                    <div className="py-2">
                      <div className="relative flex items-center justify-between">
                        {/* Track Background Line */}
                        <div className="absolute left-4 right-4 top-4 h-1 bg-neutral-200 -z-0" />
                        
                        {/* Active Progress Line */}
                        <div
                          className="absolute left-4 top-4 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                          style={{
                            width: `${(Math.max(0, currentStageIdx) / (ORDER_STAGES.length - 1)) * 100}%`
                          }}
                        />

                        {ORDER_STAGES.map((stage, idx) => {
                          const isCompleted = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          const IconComp = stage.icon;

                          return (
                            <div key={stage.key} className="flex flex-col items-center text-center z-10 w-20">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                                    : 'bg-white border-2 border-neutral-300 text-neutral-400'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <IconComp className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span
                                className={`mt-1.5 text-[10px] font-black leading-tight ${
                                  isCurrent
                                    ? 'text-emerald-800 font-black scale-105'
                                    : isCompleted
                                    ? 'text-neutral-800'
                                    : 'text-neutral-400'
                                }`}
                              >
                                {stage.labelGu}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Current Status Banner */}
                      <div className="mt-4 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-black text-emerald-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                          <span>હાલનું સ્ટેટસ: {ORDER_STAGES[currentStageIdx]?.labelGu} ({ORDER_STAGES[currentStageIdx]?.labelEn})</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold">{order.date}</span>
                      </div>
                    </div>
                  )}

                  {/* ORDER ITEMS LIST */}
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1.5">
                    <p className="text-[11px] font-black text-neutral-700">🛒 ઓર્ડર કરેલી વસ્તુઓ ({order.items.length} આઇટમ્સ):</p>
                    <div className="divide-y divide-neutral-200">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-neutral-800">{it.name} <span className="text-neutral-500">× {it.qty} {it.unit || ''}</span></span>
                          <span className="font-black text-neutral-900">₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOMER ADDRESS & SHOP HELPLINE */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600 font-bold bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>ડિલિવરી સ્થળ: {order.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-900 font-black">
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      <span>દુકાન હેલ્પલાઇન: +91 {storeSettings.phone}</span>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-center py-8 space-y-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-200">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-xs font-black">
                "{searchInput}" માટે કોઈ ઓર્ડર મળ્યો નથી!
              </p>
              <p className="text-[11px] text-neutral-600">
                કૃપા કરીને સાચો ઓર્ડર નંબર (દા.ત. PRISHA-5120) અથવા ૧૦ આંકડાનો મોબાઇલ નંબર ચકાસીને ફરી પ્રયાસ કરો.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
