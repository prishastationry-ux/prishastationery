import React, { useState, useMemo } from 'react';
import {
  Building2,
  X,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Download,
  Search,
  Filter,
  DollarSign,
  Zap,
  Home,
  Users,
  Wifi,
  FileText,
  Coffee,
  CreditCard,
  Trash2,
  Edit3,
  Check,
  ShieldCheck,
  RotateCcw,
  Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ShopBillRecord, StoreSettings } from '../types';

interface ShopRentAndBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopBills: ShopBillRecord[];
  onAddShopBill: (bill: Omit<ShopBillRecord, 'id' | 'createdAt'>) => void;
  onUpdateShopBill: (id: string, updates: Partial<ShopBillRecord>) => void;
  onDeleteShopBill: (id: string) => void;
  onSyncToRojmel?: (title: string, amount: number, date: string, category: string) => void;
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
}

export const BILL_CATEGORIES = [
  { id: 'rent', label: '🏠 દુકાન ભાડું (Shop Rent)', short: 'દુકાન ભાડું', icon: Home, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'light_bill', label: '💡 લાઇટ બિલ (Electricity)', short: 'લાઇટ બિલ', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'staff_salary', label: '👥 સ્ટાફ / હેલ્પર પગાર', short: 'સ્ટાફ પગાર', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'internet', label: '📶 ઇન્ટરનેટ / Wi-Fi બિલ', short: 'ઇન્ટરનેટ', icon: Wifi, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'tax_gumasta', label: '🏛️ મ્યુનિસિપલ ટેક્સ / ગુમાસ્તા', short: 'દુકાન ટેક્સ', icon: Building2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'maintenance', label: '🛠️ દુકાન સમારકામ / મેઇન્ટેનન્સ', short: 'મેઇન્ટેનન્સ', icon: RotateCcw, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'refreshment', label: '☕ ચા-પાણી / પરચૂરણ ખર્ચ', short: 'ચા-પાણી', icon: Coffee, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'other', label: '📄 અન્ય દુકાન બિલ', short: 'અન્ય', icon: FileText, color: 'text-neutral-600 bg-neutral-50 border-neutral-200' },
] as const;

export const ShopRentAndBillsModal: React.FC<ShopRentAndBillsModalProps> = ({
  isOpen,
  onClose,
  shopBills = [],
  onAddShopBill,
  onUpdateShopBill,
  onDeleteShopBill,
  onSyncToRojmel,
  storeSettings,
  showToast
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [cat, setCat] = useState<ShopBillRecord['category']>('rent');
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMode, setPaymentMode] = useState<ShopBillRecord['paymentMode']>('Cash');
  const [receiptNo, setReceiptNo] = useState('');
  const [consumerNo, setConsumerNo] = useState('');
  const [notes, setNotes] = useState('');
  const [syncWithRojmel, setSyncWithRojmel] = useState(true);

  if (!isOpen) return null;

  // Set default title based on selected category & period
  const handleCatChange = (newCat: ShopBillRecord['category']) => {
    setCat(newCat);
    const catObj = BILL_CATEGORIES.find(c => c.id === newCat);
    if (newCat === 'rent') {
      setTitle(`દુકાન ભાડું - માહે ${period}`);
      if (!recipient) setRecipient('મકાનમાલિક');
    } else if (newCat === 'light_bill') {
      setTitle(`વીજળી બિલ (UGVCL) - માહે ${period}`);
      if (!recipient) setRecipient('UGVCL / વીજ કંપની');
    } else if (newCat === 'staff_salary') {
      setTitle(`સ્ટાફ પગાર - માહે ${period}`);
    } else if (newCat === 'internet') {
      setTitle(`ઇન્ટરનેટ / Wi-Fi બિલ - માહે ${period}`);
    } else {
      setTitle(`${catObj?.short || 'બિલ'} - માહે ${period}`);
    }
  };

  // KPI Calculations
  const currentMonthStr = (() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  })();

  const currentMonthBills = shopBills.filter(b => b.periodMonthYear === currentMonthStr);
  const currentMonthRent = currentMonthBills.find(b => b.category === 'rent');
  const currentMonthLight = currentMonthBills.find(b => b.category === 'light_bill');

  const totalPendingAmount = shopBills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const totalPaidThisYear = shopBills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Filtered List
  const filteredBills = useMemo(() => {
    return shopBills
      .filter(b => {
        if (filterCategory !== 'all' && b.category !== filterCategory) return false;
        if (filterStatus !== 'all' && b.status !== filterStatus) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = (b.title || '').toLowerCase().includes(q);
          const matchRecip = (b.recipientName || '').toLowerCase().includes(q);
          const matchReceipt = (b.receiptNo || '').toLowerCase().includes(q);
          const matchConsumer = (b.consumerNo || '').toLowerCase().includes(q);
          const matchNotes = (b.notes || '').toLowerCase().includes(q);
          return matchTitle || matchRecip || matchReceipt || matchConsumer || matchNotes;
        }
        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [shopBills, filterCategory, filterStatus, searchTerm]);

  // Handle Create Bill
  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      alert('કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }
    const catObj = BILL_CATEGORIES.find(c => c.id === cat);
    const finalTitle = title.trim() || `${catObj?.short || 'દુકાન ખર્ચ'} - ${period}`;

    onAddShopBill({
      category: cat,
      categoryLabel: catObj?.label || 'દુકાન ખર્ચ',
      title: finalTitle,
      periodMonthYear: period.trim() || currentMonthStr,
      amount: amt,
      dueDate: dueDate.trim() || undefined,
      paymentDate: status === 'paid' ? (paymentDate.trim() || undefined) : undefined,
      status,
      recipientName: recipient.trim() || (cat === 'rent' ? 'મકાનમાલિક' : 'સંબંધિત પક્ષ'),
      paymentMode,
      receiptNo: receiptNo.trim() || undefined,
      consumerNo: consumerNo.trim() || undefined,
      notes: notes.trim() || undefined,
      syncToRojmel: syncWithRojmel
    });

    if (syncWithRojmel && status === 'paid' && onSyncToRojmel) {
      onSyncToRojmel(
        finalTitle,
        amt,
        paymentDate || new Date().toLocaleDateString('en-IN'),
        `દુકાન બિલ: ${catObj?.short || 'ખર્ચ'}`
      );
    }

    // Reset Form
    setTitle('');
    setAmount('');
    setRecipient('');
    setReceiptNo('');
    setConsumerNo('');
    setNotes('');
    setShowAddForm(false);
    showToast(`✅ ${finalTitle} (₹${amt}) સફળતાપૂર્વક નોંધાયું!`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (shopBills.length === 0) {
      alert('એક્સપોર્ટ કરવા માટે કોઈ એન્ટ્રી નથી.');
      return;
    }

    const rows = shopBills.map((b, idx) => ({
      'ક્રમ': idx + 1,
      'કેટેગરી': b.categoryLabel || b.category,
      'વિગત / શીર્ષક': b.title,
      'મહિનો/વર્ષ': b.periodMonthYear,
      'રકમ (₹)': b.amount,
      'સ્થિતિ': b.status === 'paid' ? 'ચૂકવાઈ ગયું' : 'બાકી',
      'ચુકવણી તારીખ': b.paymentDate || '-',
      'છેલ્લી તારીખ': b.dueDate || '-',
      'પ્રાપ્તકર્તા/નામ': b.recipientName,
      'ચુકવણી પદ્ધતિ': b.paymentMode,
      'રસીદ/બિલ નં': b.receiptNo || '-',
      'મીટર/કન્ઝ્યુમર નં': b.consumerNo || '-',
      'નોંધ': b.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'દુકાન ભાડું અને બિલ');
    XLSX.writeFile(wb, `Prisha_Shop_Rent_Bills_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📥 દુકાન ભાડું & બિલ Excel ફાઇલ ડાઉનલોડ થઈ ગઈ!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto max-h-[92vh] flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-300">
                  🏢 દુકાન ભાડું & બિલ મેનેજમેન્ટ (Shop Rent & Overhead)
                </h2>
                <span className="bg-amber-400 text-black text-xs font-black px-2 py-0.5 rounded-full">
                  {shopBills.length} એન્ટ્રીઓ
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                દુકાનનું માસિક ભાડું, વીજળી બિલ, સ્ટાફ પગાર, ઇન્ટરનેટ અને મ્યુનિસિપલ ટેક્સ હિસાબ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              title="Excel ડાઉનલોડ"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">પ્રિન્ટ</span>
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

        {/* BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Rent Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-amber-900">
                <span>🏠 ચાલુ મહિનાનું ભાડું</span>
                <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-mono">{currentMonthStr}</span>
              </div>
              <div className="text-xl font-black text-amber-950 mt-1">
                ₹{currentMonthRent ? currentMonthRent.amount.toLocaleString('en-IN') : '0'}
              </div>
              <div className="text-[11px] font-bold mt-1">
                {currentMonthRent ? (
                  currentMonthRent.status === 'paid' ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ચૂકવાઈ ગયું ({currentMonthRent.paymentDate || 'હાજર'})
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> બાકી છે
                    </span>
                  )
                ) : (
                  <span className="text-neutral-500">આ મહિનાનું ભાડું નોંધાયું નથી</span>
                )}
              </div>
            </div>

            {/* Light Bill Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-yellow-900">
                <span>💡 ચાલુ મહિનાનું લાઇટ બિલ</span>
                <span className="text-[10px] bg-yellow-200 px-1.5 py-0.5 rounded font-mono">UGVCL</span>
              </div>
              <div className="text-xl font-black text-yellow-950 mt-1">
                ₹{currentMonthLight ? currentMonthLight.amount.toLocaleString('en-IN') : '0'}
              </div>
              <div className="text-[11px] font-bold mt-1">
                {currentMonthLight ? (
                  currentMonthLight.status === 'paid' ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> બિલ ભરાઈ ગયું
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> ભરવાનું બાકી છે
                    </span>
                  )
                ) : (
                  <span className="text-neutral-500">આ મહિનાનું લાઇટ બિલ નોંધાયું નથી</span>
                )}
              </div>
            </div>

            {/* Pending Overhead */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-red-900">
                <span>⚠️ ચૂકવવાની બાકી રકમ</span>
                <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-mono">Pending</span>
              </div>
              <div className="text-xl font-black text-red-700 mt-1">
                ₹{totalPendingAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-red-600 font-bold mt-1">
                {shopBills.filter(b => b.status === 'pending').length} બિલ્સ ચૂકવવાના બાકી
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                <span>📊 કુલ ચૂકવેલ દુકાન ખર્ચ</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">Paid</span>
              </div>
              <div className="text-xl font-black text-emerald-900 mt-1">
                ₹{totalPaidThisYear.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                {shopBills.filter(b => b.status === 'paid').length} બિલ્સ ચૂકવાયા
              </div>
            </div>
          </div>

          {/* ACTION TOOLBAR & FILTER */}
          <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-transparent text-xs font-black text-neutral-800 outline-none cursor-pointer"
                >
                  <option value="all">બધી કેટેગરી</option>
                  {BILL_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="bg-transparent text-xs font-black text-neutral-800 outline-none cursor-pointer"
                >
                  <option value="all">બધી સ્થિતિ (All Status)</option>
                  <option value="paid">✅ ચૂકવાઈ ગયું (Paid)</option>
                  <option value="pending">⏳ ચૂકવવાનું બાકી (Pending)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 min-w-[150px]">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="નામ, બિલ નં, નોંધ શોધો..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Add New Bill Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) handleCatChange(cat);
              }}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ નવું ભાડું / બિલ ઉમેરો</span>
            </button>
          </div>

          {/* ADD BILL FORM MODAL / COLLAPSIBLE */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/40 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 shadow-lg animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
                <h3 className="font-black text-sm text-indigo-950 flex items-center gap-2">
                  <span>➕ નવું દુકાન ભાડું / ખર્ચ બિલ નોંધો</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitBill} className="space-y-3">
                {/* Category Selection Icons */}
                <div>
                  <label className="block text-xs font-black text-neutral-700 mb-1.5">
                    ખર્ચનો પ્રકાર પસંદ કરો:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BILL_CATEGORIES.map(c => {
                      const Icon = c.icon;
                      const isSel = cat === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCatChange(c.id as any)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-black ring-2 ring-indigo-400/30'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 font-bold'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-amber-300' : 'text-neutral-500'}`} />
                          <span className="text-xs truncate">{c.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      બિલ શીર્ષક / વિગત *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="દા.ત. ઓક્ટોબર ૨૦૨૬ ભાડું"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      મહિનો / વર્ષ (MM/YYYY) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="10/2026"
                      value={period}
                      onChange={e => setPeriod(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      રકમ (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="દા.ત. 12000"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-950 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      પ્રાપ્તકર્તા / મકાનમાલિક / કંપની નામ
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. રમેશભાઈ પટેલ / UGVCL"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      સ્થિતિ (Payment Status)
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="paid">✅ ચૂકવાઈ ગયું (Paid)</option>
                      <option value="pending">⏳ ચૂકવવાનું બાકી (Pending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      ચુકવણી પદ્ધતિ (Mode)
                    </label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as any)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Cash">💵 રોકડ (Cash)</option>
                      <option value="Current_Bank">🏦 કરન્ટ બેંક એકાઉન્ટ (SBI)</option>
                      <option value="UPI">📱 UPI / QR</option>
                      <option value="Cheque">📜 ચેક (Cheque)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      ચુકવણી તારીખ (DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      રસીદ / બિલ નંબર
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. REC-4928"
                      value={receiptNo}
                      onChange={e => setReceiptNo(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      મીટર નં / કન્ઝ્યુમર નં (લાઇટ બિલ)
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. 192847291"
                      value={consumerNo}
                      onChange={e => setConsumerNo(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    વિશેષ નોંધ (Remarks / Notes)
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. મકાનમાલિકને ઓનલાઇન RTGS કર્યા / સપ્ટેમ્બરનું એડજસ્ટમેન્ટ"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Sync to Rojmel Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="syncRojmel"
                    checked={syncWithRojmel}
                    onChange={e => setSyncWithRojmel(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="syncRojmel" className="text-xs font-bold text-neutral-700 cursor-pointer">
                    આ ખર્ચ આપોઆપ દૈનિક રોજમેળ (Daily Rojmel) માં જાવક તરીકે નોંધો
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-200 cursor-pointer"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>સેવ કરો (Save Bill)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* BILLS TABLE & LIST */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                    <th className="p-3">કેટેગરી</th>
                    <th className="p-3">બિલ / વિગત</th>
                    <th className="p-3">મહિનો</th>
                    <th className="p-3 text-right">રકમ</th>
                    <th className="p-3">પ્રાપ્તકર્તા</th>
                    <th className="p-3">સ્થિતિ</th>
                    <th className="p-3">પદ્ધતિ</th>
                    <th className="p-3">તારીખ / રસીદ</th>
                    <th className="p-3 text-center">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white font-medium text-neutral-800">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-neutral-400">
                        <Building2 className="w-10 h-10 mx-auto text-neutral-300 mb-2 opacity-50" />
                        <p className="font-bold text-sm">કોઈ દુકાન ભાડું કે બિલ નોંધાયેલું નથી</p>
                        <p className="text-xs text-neutral-400 mt-1">ઉપરના "+ નવું ભાડું / બિલ ઉમેરો" બટનથી એન્ટ્રી કરો</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((b) => {
                      const catObj = BILL_CATEGORIES.find(c => c.id === b.category);
                      const Icon = catObj?.icon || FileText;

                      return (
                        <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${catObj?.color || 'bg-neutral-100 text-neutral-800'}`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span>{catObj?.short || b.category}</span>
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-black text-neutral-900">{b.title}</div>
                            {b.notes && <div className="text-[10px] text-neutral-400 truncate max-w-[200px]">{b.notes}</div>}
                          </td>

                          <td className="p-3 whitespace-nowrap font-mono font-bold text-neutral-700">
                            {b.periodMonthYear}
                          </td>

                          <td className="p-3 whitespace-nowrap text-right font-black text-neutral-900 text-sm">
                            ₹{b.amount.toLocaleString('en-IN')}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-neutral-800">{b.recipientName}</span>
                            {b.consumerNo && (
                              <div className="text-[10px] text-neutral-400 font-mono">મીટર: {b.consumerNo}</div>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            {b.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ચૂકવાઈ ગયું</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateShopBill(b.id, {
                                    status: 'paid',
                                    paymentDate: new Date().toLocaleDateString('en-IN')
                                  });
                                  showToast(`✅ ${b.title} ચૂકવાઈ ગયું તરીકે માર્ક કર્યું!`);
                                }}
                                className="inline-flex items-center gap-1 bg-red-100 hover:bg-emerald-100 text-red-800 hover:text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black border border-red-300 hover:border-emerald-300 transition-colors cursor-pointer"
                                title="ક્લિક કરીને 'ચૂકવાઈ ગયું' કરો"
                              >
                                <Clock className="w-3 h-3" />
                                <span>બાકી (ચૂકવો)</span>
                              </button>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap text-[11px] font-bold text-neutral-600">
                            {b.paymentMode === 'Current_Bank' ? '🏦 કરન્ટ બેંક' : b.paymentMode === 'UPI' ? '📱 UPI' : b.paymentMode === 'Cheque' ? '📜 ચેક' : '💵 રોકડ'}
                          </td>

                          <td className="p-3 whitespace-nowrap text-[11px] text-neutral-600">
                            <div>{b.paymentDate || b.dueDate || '-'}</div>
                            {b.receiptNo && (
                              <div className="text-[10px] text-neutral-400 font-mono">રસીદ: {b.receiptNo}</div>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const newTitle = prompt('બિલ શીર્ષક બદલો:', b.title);
                                  if (newTitle !== null) {
                                    const newAmt = prompt('રકમ બદલો (₹):', String(b.amount));
                                    if (newAmt !== null) {
                                      onUpdateShopBill(b.id, {
                                        title: newTitle.trim() || b.title,
                                        amount: parseFloat(newAmt) || b.amount
                                      });
                                      showToast('✏️ બિલ એન્ટ્રી અપડેટ થઈ ગઈ!');
                                    }
                                  }
                                }}
                                className="text-neutral-400 hover:text-blue-600 p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                                title="એડિટ કરો"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`શું તમે "${b.title}" ડિલીટ કરવા માંગો છો?`)) {
                                    onDeleteShopBill(b.id);
                                  }
                                }}
                                className="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                                title="ડિલીટ કરો"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-neutral-100 px-4 py-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">પ્રિશા સ્ટેશનરી દુકાન બિલ & ભાડું રજિસ્ટર • સુરક્ષિત ક્લાઉડ સંગ્રહ</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-black text-neutral-700">
              કુલ બિલ્સ: {shopBills.length} | ચૂકવેલ: ₹{totalPaidThisYear.toLocaleString('en-IN')} | બાકી: ₹{totalPendingAmount.toLocaleString('en-IN')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs px-4 py-1.5 rounded-xl cursor-pointer"
            >
              બંધ કરો
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
