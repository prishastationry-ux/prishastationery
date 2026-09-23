import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  X,
  Printer,
  Share2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Calculator,
  Save,
  RotateCcw
} from 'lucide-react';
import { OrderRecord, ExpenseRecord, RojmelEntry, StoreSettings } from '../types';

interface DailyCashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  expenses: ExpenseRecord[];
  rojmelEntries: RojmelEntry[];
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
}

interface DenominationCounts {
  c500: number;
  c200: number;
  c100: number;
  c50: number;
  c20: number;
  c10: number;
  c5: number;
  coins: number;
}

export const DailyCashClosingModal: React.FC<DailyCashClosingModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  expenses = [],
  rojmelEntries = [],
  storeSettings,
  showToast
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  const [openingCash, setOpeningCash] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('prisha_drawer_opening_cash');
      return saved ? Number(saved) : 1000;
    } catch {
      return 1000;
    }
  });

  const [denominations, setDenominations] = useState<DenominationCounts>(() => {
    try {
      const saved = localStorage.getItem('prisha_drawer_denominations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { c500: 0, c200: 0, c100: 0, c50: 0, c20: 0, c10: 0, c5: 0, coins: 0 };
  });

  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Filter orders, expenses, and rojmel for selected date
  const isSelectedDate = (dateStr?: string) => {
    if (!dateStr) return false;
    return dateStr.startsWith(selectedDate);
  };

  const dayOrders = orders.filter(o => isSelectedDate(o.date));
  const dayExpenses = expenses.filter(e => isSelectedDate(e.date));
  const dayRojmel = rojmelEntries.filter(r => isSelectedDate(r.date));

  // Calculations for Sales
  const cashSales = dayOrders
    .filter(o => o.paymentMode === 'Cash' || (typeof o.paymentMode === 'string' && o.paymentMode.toLowerCase().includes('cash')))
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  const upiSales = dayOrders
    .filter(o => o.paymentMode === 'UPI' || o.paymentMode === 'Online' || (typeof o.paymentMode === 'string' && o.paymentMode.toLowerCase().includes('upi')))
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  const creditSales = dayOrders
    .filter(o => o.paymentMode === 'બાકી (Credit)' || (typeof o.paymentMode === 'string' && (o.paymentMode.includes('બાકી') || o.paymentMode.toLowerCase().includes('credit'))))
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  const totalSales = cashSales + upiSales + creditSales;

  // Calculations for Rojmel & Khata Cash Receipts
  const rojmelCashIn = dayRojmel
    .filter(r => r.type === 'aavak' && (r.paymentMode === 'Cash' || !r.paymentMode))
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const rojmelCashOut = dayRojmel
    .filter(r => r.type === 'javak' && (r.paymentMode === 'Cash' || !r.paymentMode))
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  // Cash Expenses
  const totalCashExpenses = dayExpenses
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Expected Physical Cash in Hand
  const expectedCashInHand = openingCash + cashSales + rojmelCashIn - rojmelCashOut - totalCashExpenses;

  // Actual Counted Physical Cash from Denominations
  const countedPhysicalCash =
    denominations.c500 * 500 +
    denominations.c200 * 200 +
    denominations.c100 * 100 +
    denominations.c50 * 50 +
    denominations.c20 * 20 +
    denominations.c10 * 10 +
    denominations.c5 * 5 +
    (Number(denominations.coins) || 0);

  const cashDifference = countedPhysicalCash - expectedCashInHand;

  const handleDenomChange = (key: keyof DenominationCounts, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = { ...denominations, [key]: num };
    setDenominations(updated);
    try {
      localStorage.setItem('prisha_drawer_denominations', JSON.stringify(updated));
    } catch {}
  };

  const handleOpeningCashChange = (val: number) => {
    setOpeningCash(val);
    try {
      localStorage.setItem('prisha_drawer_opening_cash', String(val));
    } catch {}
  };

  const handleResetCounts = () => {
    const empty: DenominationCounts = { c500: 0, c200: 0, c100: 0, c50: 0, c20: 0, c10: 0, c5: 0, coins: 0 };
    setDenominations(empty);
    try {
      localStorage.setItem('prisha_drawer_denominations', JSON.stringify(empty));
    } catch {}
    showToast('ગલ્લા નોટોની ગણતરી રીસેટ થઈ!');
  };

  // WhatsApp Share Summary
  const handleWhatsAppClosing = () => {
    const diffText =
      cashDifference === 0
        ? '✅ તાળો એકદમ પરફેક્ટ (₹0 તફાવત)'
        : cashDifference > 0
        ? `⚠️ ગલ્લામાં વધુ રોકડ: +₹${cashDifference.toFixed(2)}`
        : `❌ ગલ્લામાં ખૂટતી રોકડ (Short): -₹${Math.abs(cashDifference).toFixed(2)}`;

    const text =
      `🏪 *${storeSettings.storeNameGu || 'પ્રિશા સ્ટેશનરી'} - દૈનિક ગલ્લા બંધ હિસાબ*\n` +
      `📅 *તારીખ:* ${selectedDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *સવારની ઓપનિંગ સિલક:* ₹${openingCash.toFixed(2)}\n` +
      `🛒 *આજનું કુલ વેચાણ:* ₹${totalSales.toFixed(2)} (${dayOrders.length} બિલ્સ)\n` +
      `  • રોકડા વેચાણ (Cash): ₹${cashSales.toFixed(2)}\n` +
      `  • ઓનલાઇન / UPI: ₹${upiSales.toFixed(2)}\n` +
      `  • ઉધાર વેચાણ (Credit): ₹${creditSales.toFixed(2)}\n` +
      `📥 *અન્ય આવક (Rojmel):* ₹${rojmelCashIn.toFixed(2)}\n` +
      `💸 *દુકાન ખર્ચ / જાવક:* ₹${(totalCashExpenses + rojmelCashOut).toFixed(2)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *ગલ્લામાં હોવી જોઈતી રોકડ:* ₹${expectedCashInHand.toFixed(2)}\n` +
      `🖐️ *હાજર ગણેલી ભૌતિક રોકડ:* ₹${countedPhysicalCash.toFixed(2)}\n` +
      `📊 *સ્થિતિ:* ${diffText}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📝 *નોટોની ગણતરી (Denominations):*\n` +
      (denominations.c500 ? `• ₹500 x ${denominations.c500} = ₹${denominations.c500 * 500}\n` : '') +
      (denominations.c200 ? `• ₹200 x ${denominations.c200} = ₹${denominations.c200 * 200}\n` : '') +
      (denominations.c100 ? `• ₹100 x ${denominations.c100} = ₹${denominations.c100 * 100}\n` : '') +
      (denominations.c50 ? `• ₹50 x ${denominations.c50} = ₹${denominations.c50 * 50}\n` : '') +
      (denominations.c20 ? `• ₹20 x ${denominations.c20} = ₹${denominations.c20 * 20}\n` : '') +
      (denominations.c10 ? `• ₹10 x ${denominations.c10} = ₹${denominations.c10 * 10}\n` : '') +
      (denominations.c5 ? `• ₹5 x ${denominations.c5} = ₹${denominations.c5 * 5}\n` : '') +
      (denominations.coins ? `• સિક્કા: ₹${denominations.coins}\n` : '') +
      (notes ? `\n💬 *વિશેષ નોંધ:* ${notes}\n` : '') +
      `\n📍 ${storeSettings.address || 'થરાદ'} | 📞 +91 ${storeSettings.phone}`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintClosingSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 flex items-center justify-between border-b border-emerald-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <span>દૈનિક ગલ્લા બંધ હિસાબ (Daily Cash Drawer Closing)</span>
              </h2>
              <p className="text-xs text-emerald-200">
                રોકડા, UPI, ઉધાર અને ગલ્લા નોટોનો એક-ક્લિક તાળો મેળવો
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintClosingSlip}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="પ્રિન્ટ સ્લિપ"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">પ્રિન્ટ</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppClosing}
              className="bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              title="WhatsApp પર મોકલો"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp શેર</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Date Selector & Opening Cash Bar */}
          <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-black text-emerald-950">તારીખ પસંદ કરો:</span>
              <input
                type="text"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="bg-white border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-black text-emerald-950 outline-none w-32 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-black text-emerald-950">સવારની ઓપનિંગ સિલક:</span>
              <div className="flex items-center">
                <span className="bg-emerald-200 text-emerald-950 px-2 py-1 rounded-l-lg text-xs font-black">₹</span>
                <input
                  type="number"
                  value={openingCash}
                  onChange={e => handleOpeningCashChange(Number(e.target.value) || 0)}
                  className="bg-white border border-emerald-300 px-2.5 py-1 rounded-r-lg text-xs font-black text-emerald-950 outline-none w-24 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 3 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-300 font-bold">🛒 આજનું કુલ વેચાણ</div>
              <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">₹{totalSales.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{dayOrders.length} બિલ્સ નોંધાયા</div>
            </div>

            <div className="bg-emerald-900 text-white p-3 rounded-xl border border-emerald-800">
              <div className="text-[11px] text-emerald-200 font-bold">💵 રોકડ આવક (Cash)</div>
              <div className="text-lg sm:text-xl font-black text-emerald-300 mt-1">₹{cashSales.toFixed(2)}</div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">+₹{rojmelCashIn} અન્ય રોજમેળ</div>
            </div>

            <div className="bg-blue-900 text-white p-3 rounded-xl border border-blue-800">
              <div className="text-[11px] text-blue-200 font-bold">📱 ઓનલાઇન / UPI</div>
              <div className="text-lg sm:text-xl font-black text-cyan-300 mt-1">₹{upiSales.toFixed(2)}</div>
              <div className="text-[10px] text-blue-300/80 mt-0.5">સીધા બેંક એકાઉન્ટમાં</div>
            </div>

            <div className="bg-red-900 text-white p-3 rounded-xl border border-red-800">
              <div className="text-[11px] text-red-200 font-bold">💸 રોકડ ખર્ચ / જાવક</div>
              <div className="text-lg sm:text-xl font-black text-red-300 mt-1">₹{(totalCashExpenses + rojmelCashOut).toFixed(2)}</div>
              <div className="text-[10px] text-red-300/80 mt-0.5">{dayExpenses.length} ખર્ચ નોંધાયા</div>
            </div>
          </div>

          {/* Main 2 Column Section: Cash Calculation vs Currency Note Counter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: Cash Drawer Ledger Tally */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
              <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>ગલ્લા ગણતરી (System Expected Cash)</span>
              </h3>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-600 font-bold">સવારની ઓપનિંગ સિલક:</span>
                  <span className="font-black text-neutral-900">+₹{openingCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-600 font-bold">આજનું કાઉન્ટર રોકડ વેચાણ (Cash):</span>
                  <span className="font-black text-emerald-700">+₹{cashSales.toFixed(2)}</span>
                </div>
                {rojmelCashIn > 0 && (
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-600 font-bold">રોજમેળ / ખાતા જમા આવક:</span>
                    <span className="font-black text-emerald-700">+₹{rojmelCashIn.toFixed(2)}</span>
                  </div>
                )}
                {totalCashExpenses > 0 && (
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-600 font-bold">આજના રોકડા દુકાન ખર્ચ:</span>
                    <span className="font-black text-red-600">-₹{totalCashExpenses.toFixed(2)}</span>
                  </div>
                )}
                {rojmelCashOut > 0 && (
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-600 font-bold">રોજમેળ / ખાતા ઉધાર જાવક:</span>
                    <span className="font-black text-red-600">-₹{rojmelCashOut.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 bg-amber-100/80 px-2 rounded-lg font-black text-amber-950 border border-amber-300">
                  <span>ગલ્લામાં હોવી જોઈતી રોકડ (Expected):</span>
                  <span className="text-sm">₹{expectedCashInHand.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Box */}
              <div className={`p-3 rounded-xl border ${
                cashDifference === 0
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  : cashDifference > 0
                  ? 'bg-blue-100 border-blue-300 text-blue-950'
                  : 'bg-red-100 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center gap-2 font-black text-xs">
                  {cashDifference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                  )}
                  <span>
                    {cashDifference === 0
                      ? '✅ તાળો એકદમ પરફેક્ટ મળ્યો (₹0 તફાવત)'
                      : cashDifference > 0
                      ? `⚠️ ગલ્લામાં વધુ રોકડ છે: +₹${cashDifference.toFixed(2)}`
                      : `❌ ગલ્લામાં રોકડ ખૂટે છે (Short): -₹${Math.abs(cashDifference).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Special Note Box */}
              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">આજના દિવસની વિશેષ નોંધ (Note):</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="દા.ત. માલિકે અંગત વપરાશ માટે રૂ. ૫૦૦ લીધા અથવા ગલ્લામાં વધારાના પૈસા મૂક્યા..."
                  rows={2}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-xl outline-none focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Right Column: Physical Currency Denomination Counter */}
            <div className="bg-emerald-950 text-white rounded-2xl p-4 border border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>હાજર રોકડ નોટો ગણો (Physical Cash)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleResetCounts}
                  className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700"
                  title="રીસેટ"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>રીસેટ</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'c500' as const, note: '₹500', val: 500 },
                  { key: 'c200' as const, note: '₹200', val: 200 },
                  { key: 'c100' as const, note: '₹100', val: 100 },
                  { key: 'c50' as const, note: '₹50', val: 50 },
                  { key: 'c20' as const, note: '₹20', val: 20 },
                  { key: 'c10' as const, note: '₹10', val: 10 },
                  { key: 'c5' as const, note: '₹5', val: 5 }
                ].map(({ key, note, val }) => (
                  <div key={key} className="flex items-center justify-between bg-emerald-900/50 p-1.5 rounded-xl border border-emerald-800/80">
                    <span className="font-mono font-bold text-amber-300 w-12">{note} x</span>
                    <input
                      type="number"
                      min={0}
                      value={denominations[key] || ''}
                      onChange={e => handleDenomChange(key, e.target.value)}
                      placeholder="0"
                      className="w-14 bg-white text-black font-black text-center py-1 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="font-mono font-bold text-neutral-300 text-[11px] w-14 text-right">
                      =₹{(denominations[key] * val).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                {/* Coins */}
                <div className="flex items-center justify-between bg-emerald-900/50 p-1.5 rounded-xl border border-emerald-800/80 col-span-2">
                  <span className="font-bold text-amber-300 text-xs">🪙 સિક્કા (Coins Total ₹):</span>
                  <input
                    type="number"
                    min={0}
                    value={denominations.coins || ''}
                    onChange={e => handleDenomChange('coins', e.target.value)}
                    placeholder="0"
                    className="w-24 bg-white text-black font-black text-center py-1 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Total Physical Counted Cash */}
              <div className="bg-amber-400 text-black p-2.5 rounded-xl flex items-center justify-between font-black shadow-md">
                <span className="text-xs">હાજર ગણેલી કુલ રોકડ:</span>
                <span className="text-base font-mono">₹{countedPhysicalCash.toLocaleString('en-IN')}/-</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-100 p-3 sm:p-4 border-t border-neutral-300 flex items-center justify-between shrink-0 no-print">
          <div className="text-[11px] text-neutral-600 font-bold hidden sm:block">
            📌 ગલ્લા બંધ હિસાબ WhatsApp પર સેવ કરવા ઉપર &quot;WhatsApp શેર&quot; બટન દબાવો.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              બંધ કરો
            </button>
            <button
              type="button"
              onClick={handleWhatsAppClosing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp પર હિસાબ મોકલો</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
