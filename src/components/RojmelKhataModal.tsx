import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Printer,
  Trash2,
  CheckCircle2,
  Users,
  Building,
  CreditCard,
  Search
} from 'lucide-react';
import { RojmelEntry, KhataAccount, KhataTransaction, StoreSettings } from '../types';
import * as XLSX from 'xlsx';

interface RojmelKhataModalProps {
  isOpen: boolean;
  onClose: () => void;
  rojmelEntries: RojmelEntry[];
  onAddRojmelEntry: (entry: Omit<RojmelEntry, 'id' | 'createdAt'>) => void;
  onDeleteRojmelEntry: (id: string) => void;
  khataAccounts: KhataAccount[];
  onAddKhataAccount: (acc: Omit<KhataAccount, 'id' | 'balance' | 'totalGiven' | 'totalReceived' | 'lastTransactionDate'>) => void;
  khataTransactions: KhataTransaction[];
  onAddKhataTransaction: (tx: Omit<KhataTransaction, 'id' | 'createdAt' | 'balanceAfter'>) => void;
  onDeleteKhataAccount: (id: string) => void;
  onDeleteKhataTransaction: (id: string, accountId: string) => void;
  onEditKhataAccount: (id: string, newName: string) => void;
  onEditKhataTransaction: (id: string, newAmount: number, newDesc: string) => void;
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
}

export const RojmelKhataModal: React.FC<RojmelKhataModalProps> = ({
  isOpen,
  onClose,
  rojmelEntries,
  onAddRojmelEntry,
  onDeleteRojmelEntry,
  khataAccounts,
  onAddKhataAccount,
  khataTransactions,
  onAddKhataTransaction,
  onDeleteKhataAccount,
  onDeleteKhataTransaction,
  onEditKhataAccount,
  onEditKhataTransaction,
  storeSettings,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'rojmel' | 'khata_customers' | 'khata_suppliers'>('rojmel');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ROJMEL FORM STATE
  const [rojmelType, setRojmelType] = useState<'aavak' | 'javak'>('aavak');
  const [rojmelCategory, setRojmelCategory] = useState<string>('રોકડ વેચાણ');
  const [rojmelAmount, setRojmelAmount] = useState<string>('');
  const [rojmelMode, setRojmelMode] = useState<'Cash' | 'UPI' | 'Bank' | 'બાકી (Credit)'>('Cash');
  const [rojmelPerson, setRojmelPerson] = useState<string>('');
  const [rojmelNotes, setRojmelNotes] = useState<string>('');
  const [editingRojmelId, setEditingRojmelId] = useState<string | null>(null);

  // KHATA FORM STATE
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccPhone, setNewAccPhone] = useState<string>('');
  const [newAccAddress, setNewAccAddress] = useState<string>('');
  const [newAccNotes, setNewAccNotes] = useState<string>('');

  // KHATA TX STATE
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'jama' | 'udhar'>('jama');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txMode, setTxMode] = useState<'Cash' | 'UPI' | 'Bank' | 'Transfer'>('Cash');
  const [txDesc, setTxDesc] = useState<string>('');

  // SEARCH FILTER
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Format date helper DD/MM/YYYY
  const formattedSelectedDate = (() => {
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  })();

  // Filter Rojmel for selected date
  const filteredRojmel = useMemo(() => {
    return rojmelEntries.filter(r => r.date === formattedSelectedDate || r.date === selectedDate);
  }, [rojmelEntries, formattedSelectedDate, selectedDate]);

  // Today's Rojmel Totals
  const todayAavak = useMemo(() => {
    return filteredRojmel.filter(r => r.type === 'aavak').reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRojmel]);

  const todayJavak = useMemo(() => {
    return filteredRojmel.filter(r => r.type === 'javak').reduce((sum, r) => sum + r.amount, 0);
  }, [filteredRojmel]);

  const todayNetBalance = todayAavak - todayJavak;

  // Khata Totals
  const totalCustomerReceivable = useMemo(() => {
    return khataAccounts.filter(a => a.type === 'customer' && a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  }, [khataAccounts]);

  const totalSupplierPayable = useMemo(() => {
    return khataAccounts.filter(a => a.type === 'supplier' && a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
  }, [khataAccounts]);

  const handleCreateRojmelEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(rojmelAmount);
    if (!amt || amt <= 0) {
      showToast('⚠️ કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }

    if (editingRojmelId) {
      onDeleteRojmelEntry(editingRojmelId);
      setEditingRojmelId(null);
    }

    onAddRojmelEntry({
      date: formattedSelectedDate,
      type: rojmelType,
      category: rojmelCategory,
      amount: amt,
      paymentMode: rojmelMode,
      personName: rojmelPerson || undefined,
      notes: rojmelNotes || undefined
    });

    setRojmelAmount('');
    setRojmelPerson('');
    setRojmelNotes('');
    showToast(`✅ ${rojmelType === 'aavak' ? 'આવક' : 'જાવક'} રોજમેળમાં ${editingRojmelId ? 'એડિટ' : 'નોંધાઈ'} ગઈ!`);
  };

  const handleEditRojmel = (entry: RojmelEntry) => {
    setRojmelType(entry.type);
    setRojmelCategory(entry.category);
    setRojmelAmount(entry.amount.toString());
    setRojmelMode(entry.paymentMode as any);
    setRojmelPerson(entry.personName || '');
    setRojmelNotes(entry.notes || '');
    setEditingRojmelId(entry.id);
    
    // Parse date for input field format YYYY-MM-DD
    if (entry.date.includes('/')) {
      const [d, m, y] = entry.date.split('/');
      setSelectedDate(`${y}-${m}-${d}`);
    } else {
      setSelectedDate(entry.date);
    }
  };

  const handleCreateKhataAccount = (type: 'customer' | 'supplier') => {
    if (!newAccName.trim()) {
      showToast('⚠️ કૃપા કરીને નામ લખો.');
      return;
    }

    onAddKhataAccount({
      type,
      name: newAccName.trim(),
      phone: newAccPhone.trim(),
      address: newAccAddress.trim() || undefined,
      notes: newAccNotes.trim() || undefined
    });

    setNewAccName('');
    setNewAccPhone('');
    setNewAccAddress('');
    setNewAccNotes('');
    showToast(`✅ ${type === 'customer' ? 'ગ્રાહકનું ખાતું' : 'વેપારીનું ખાતું'} બની ગયું!`);
  };

  const handleCreateKhataTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    const amt = Number(txAmount);
    if (!amt || amt <= 0) {
      showToast('⚠️ કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }

    const acc = khataAccounts.find(a => a.id === selectedAccountId);
    if (!acc) return;

    onAddKhataTransaction({
      accountId: selectedAccountId,
      accountName: acc.name,
      date: formattedSelectedDate,
      type: txType,
      amount: amt,
      paymentMode: txMode,
      description: txDesc || undefined
    });

    setTxAmount('');
    setTxDesc('');
    showToast('✅ ખાતામાં રકમ જમા/ઉધાર થઈ ગઈ!');
  };

  const handleExportRojmelExcel = () => {
    const data = filteredRojmel.map((r, idx) => ({
      'ક્રમ': idx + 1,
      'તારીખ': r.date,
      'પ્રકાર': r.type === 'aavak' ? 'આવક (Credit)' : 'જાવક (Debit)',
      'વિગત / કેટેગરી': r.category,
      'ગ્રાહક / વેપારી': r.personName || '-',
      'ચૂકવણી પદ્ધતિ': r.paymentMode,
      'રકમ (₹)': r.amount,
      'નોંધ': r.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rojmel_${selectedDate}`);
    XLSX.writeFile(wb, `Prisha_Rojmel_${selectedDate}.xlsx`);
    showToast('📊 રોજમેળ Excel ફાઇલ ડાઉનલોડ થઈ ગઈ!');
  };

  const selectedAccount = khataAccounts.find(a => a.id === selectedAccountId);
  const accountTransactions = khataTransactions.filter(t => t.accountId === selectedAccountId);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-neutral-900 via-[#0B1E48] to-neutral-900 text-white p-4 flex items-center justify-between gap-3 border-b-2 border-amber-500">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>📖 ડિજિટલ રોજમેળ & ઉધારી ખાતાવહી (Rojmel & Khata ERP)</span>
              </h2>
              <p className="text-xs text-amber-300 font-bold">
                દૈનિક આવક-જાવક રોકડ મેળ, ગ્રાહકોની બાકી ઉધારી (લેવાના) અને વેપારી સ્ટોક પેમેન્ટ (આપવાના)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP SUMMARY STATS BANNER */}
        <div className="bg-neutral-900 text-white p-3 border-b border-neutral-700 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-500/50">
            <span className="text-[10px] font-bold text-emerald-400">આજની કુલ આવક (જમા)</span>
            <div className="text-base font-black text-emerald-300">₹{todayAavak.toFixed(2)}</div>
          </div>

          <div className="bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/50">
            <span className="text-[10px] font-bold text-rose-400">આજની કુલ જાવક (ઉધાર/ખર્ચ)</span>
            <div className="text-base font-black text-rose-300">₹{todayJavak.toFixed(2)}</div>
          </div>

          <div className="bg-amber-950/80 p-2.5 rounded-xl border border-amber-500/50">
            <span className="text-[10px] font-bold text-amber-400">ગ્રાહકો પાસેથી લેવાના (બાકી)</span>
            <div className="text-base font-black text-amber-300">₹{totalCustomerReceivable.toFixed(2)}</div>
          </div>

          <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-500/50">
            <span className="text-[10px] font-bold text-blue-400">વેપારીઓને ચૂકવવાના (સ્ટોક)</span>
            <div className="text-base font-black text-blue-300">₹{totalSupplierPayable.toFixed(2)}</div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="bg-neutral-100 p-2 border-b border-neutral-300 flex items-center justify-between gap-2 overflow-x-auto text-xs font-black">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab('rojmel'); setSelectedAccountId(null); }}
              className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'rojmel'
                  ? 'bg-[#0B1E48] text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>૧. દૈનિક રોજમેળ (Daily Cash Book)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('khata_customers'); setSelectedAccountId(null); }}
              className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'khata_customers'
                  ? 'bg-[#0B1E48] text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>૨. ગ્રાહકોનું ઉધારી ખાતું (Customer Khata)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('khata_suppliers'); setSelectedAccountId(null); }}
              className={`px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'khata_suppliers'
                  ? 'bg-[#0B1E48] text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <Building className="w-4 h-4 text-blue-400" />
              <span>૩. વેપારી સ્ટોક ખાતાવહી (Supplier Ledger)</span>
            </button>
          </div>

          {activeTab === 'rojmel' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="p-1.5 border border-neutral-300 rounded-lg bg-white font-mono font-bold text-xs"
              />
              <button
                type="button"
                onClick={handleExportRojmelExcel}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          )}
        </div>

        {/* MODAL MAIN BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* ========================================================================= */}
          {/* TAB 1: DAILY ROJMEL (આવક & જાવક મેળ) */}
          {/* ========================================================================= */}
          {activeTab === 'rojmel' && (
            <div className="space-y-4">
              {/* ENTRY FORM */}
              <form onSubmit={handleCreateRojmelEntry} className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-neutral-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-orange-600" />
                    <span>{editingRojmelId ? 'રોજમેળ એન્ટ્રી એડિટ કરો:' : `નવી રોજમેળ એન્ટ્રી ઉમેરો (${formattedSelectedDate}):`}</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRojmelType('aavak')}
                      className={`px-3 py-1 rounded-lg font-black text-xs cursor-pointer flex items-center gap-1 ${
                        rojmelType === 'aavak'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>+ આવક (જમા)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRojmelType('javak')}
                      className={`px-3 py-1 rounded-lg font-black text-xs cursor-pointer flex items-center gap-1 ${
                        rojmelType === 'javak'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-800 border border-rose-300'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>- જાવક (ખર્ચ/ઉધાર)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-bold">
                  <div>
                    <label className="block text-neutral-600 text-[11px] mb-1">વિગત / કેટેગરી:</label>
                    <select
                      value={rojmelCategory}
                      onChange={e => setRojmelCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg outline-none font-bold"
                    >
                      {rojmelType === 'aavak' ? (
                        <>
                          <option value="રોકડ વેચાણ">રોકડ વેચાણ (Cash Sales)</option>
                          <option value="ઓનલાઇન પેમેન્ટ">ઓનલાઇન પેમેન્ટ (Online Payment)</option>
                          <option value="ગ્રાહક ઉધારી જમા">ગ્રાહક ઉધારી જમા (Khata Recovery)</option>
                          <option value="ઉછીના લીધા">ઉછીના લીધા (Borrowing)</option>
                          <option value="ડિપોઝિટ મળી">ડિપોઝિટ મળી (Deposit Received)</option>
                          <option value="કંપની પેમેન્ટ મળ્યું">કંપની પેમેન્ટ મળ્યું (Company Payment)</option>
                          <option value="અન્ય આવક">અન્ય આવક (Other Income)</option>
                        </>
                      ) : (
                        <>
                          <option value="ચા-પાણી / નાસ્તો">ચા-પાણી / નાસ્તો (Tea/Snacks)</option>
                          <option value="ગાડી ખર્ચ / પેટ્રોલ">ગાડી ખર્ચ / પેટ્રોલ (Vehicle Expense)</option>
                          <option value="ઘર ખર્ચ">ઘર ખર્ચ (Home Expense)</option>
                          <option value="દુકાન ભાડું">દુકાન ભાડું (Shop Rent)</option>
                          <option value="લાઇટ બિલ">લાઇટ બિલ (Light Bill)</option>
                          <option value="ડિપોઝિટ આપી">ડિપોઝિટ આપી (Deposit Given)</option>
                          <option value="કર્મચારી પગાર">કર્મચારી પગાર (Staff Salary)</option>
                          <option value="દુકાન માલ ખરીદી">દુકાન માલ ખરીદી (Stock Purchase)</option>
                          <option value="અંગત ઉપાડ">અંગત ઉપાડ (Personal Withdrawal)</option>
                          <option value="ઉછીના આપ્યા">ઉછીના આપ્યા (Lent Money)</option>
                          <option value="કંપની પેમેન્ટ ચૂકવ્યું">કંપની પેમેન્ટ ચૂકવ્યું (Company Payment)</option>
                          <option value="અન્ય જાવક">અન્ય જાવક (Other Expense)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-[11px] mb-1">રકમ (₹):</label>
                    <input
                      type="number"
                      value={rojmelAmount}
                      onChange={e => setRojmelAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-black text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-[11px] mb-1">ચૂકવણી રીત:</label>
                    <select
                      value={rojmelMode}
                      onChange={e => setRojmelMode(e.target.value as any)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg outline-none font-bold"
                    >
                      <option value="Cash">રોકડ (Cash)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Bank">બેંક ટ્રાન્સફર (Bank)</option>
                      <option value="બાકી (Credit)">બાકી (Credit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-[11px] mb-1">ગ્રાહક/વેપારીનું નામ:</label>
                    <input
                      type="text"
                      value={rojmelPerson}
                      onChange={e => setRojmelPerson(e.target.value)}
                      placeholder="દા.ત. રમેશભાઈ થરાદ"
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <input
                    type="text"
                    value={rojmelNotes}
                    onChange={e => setRojmelNotes(e.target.value)}
                    placeholder="વધારાની નોંધ (ઓપ્શનલ)..."
                    className="flex-1 p-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium outline-none"
                  />
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-white font-black text-xs shadow cursor-pointer ${
                      rojmelType === 'aavak' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {editingRojmelId ? 'એડિટ સેવ કરો' : '+ એન્ટ્રી સેવ કરો'}
                  </button>
                  {editingRojmelId && (
                    <button
                      type="button"
                      onClick={() => setEditingRojmelId(null)}
                      className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs"
                    >
                      રદ કરો
                    </button>
                  )}
                </div>
              </form>

              {/* ROJMEL TRANSACTIONS TABLE */}
              <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-neutral-800 text-white p-2.5 font-black text-xs flex items-center justify-between">
                  <span>📅 તારીખ {formattedSelectedDate} ની તમામ આવક-જાવક એન્ટ્રીઓ ({filteredRojmel.length}):</span>
                  <span className="font-mono text-amber-400">
                    આજની પુરાંત (બેલેન્સ): ₹{todayNetBalance.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-300 font-black">
                        <th className="p-2 text-center w-12">#</th>
                        <th className="p-2">પ્રકાર</th>
                        <th className="p-2">વિગત / કેટેગરી</th>
                        <th className="p-2">વ્યક્તિનું નામ</th>
                        <th className="p-2">પદ્ધતિ</th>
                        <th className="p-2 text-right">આવક (જમા)</th>
                        <th className="p-2 text-right">જાવક (ઉધાર)</th>
                        <th className="p-2 text-center w-12">ક્રિયા</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-bold">
                      {filteredRojmel.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-neutral-400">
                            આ તારીખે કોઈ રોજમેળ એન્ટ્રી નોંધાયેલ નથી. ઉપરના ફોર્મમાંથી નવી એન્ટ્રી ઉમેરો.
                          </td>
                        </tr>
                      ) : (
                        filteredRojmel.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-neutral-50">
                            <td className="p-2 text-center text-neutral-500">{idx + 1}</td>
                            <td className="p-2">
                              {entry.type === 'aavak' ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[10.5px]">
                                  + આવક
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black text-[10.5px]">
                                  - જાવક
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-neutral-900">{entry.category}</td>
                            <td className="p-2 text-neutral-700">{entry.personName || '-'}</td>
                            <td className="p-2">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 text-[10px]">
                                {entry.paymentMode}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-black text-emerald-700">
                              {entry.type === 'aavak' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono font-black text-rose-700">
                              {entry.type === 'javak' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2 text-center flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditRojmel(entry)}
                                className="text-blue-500 hover:text-blue-700 p-1 cursor-pointer"
                                title="એન્ટ્રી એડિટ કરો"
                              >
                                <Plus className="w-3.5 h-3.5 rotate-45" /> {/* Just a quick edit icon fallback */}
                                <span className="sr-only">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRojmelEntry(entry.id)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                title="એન્ટ્રી દૂર કરો"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2 & 3: KHATA ACCOUNTS (CUSTOMERS & SUPPLIERS) */}
          {/* ========================================================================= */}
          {(activeTab === 'khata_customers' || activeTab === 'khata_suppliers') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* LEFT COL: ACCOUNTS LIST */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-neutral-900 text-xs">
                    {activeTab === 'khata_customers' ? '👥 ગ્રાહકોનું લિસ્ટ' : '🏢 વેપારીઓનું લિસ્ટ'}
                  </h3>
                  <span className="text-[10.5px] font-bold text-neutral-500">
                    {khataAccounts.filter(a => a.type === (activeTab === 'khata_customers' ? 'customer' : 'supplier')).length} ખાતા
                  </span>
                </div>

                {/* ADD ACCOUNT MINI FORM */}
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-300 space-y-2">
                  <div className="font-black text-[11px] text-neutral-800">+ નવું ખાતું ખોલો:</div>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    placeholder="નામ (દા.ત. રમેશભાઈ ચૌધરી)"
                    className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs font-bold outline-none"
                  />
                  <input
                    type="tel"
                    value={newAccPhone}
                    onChange={e => setNewAccPhone(e.target.value)}
                    placeholder="મોબાઇલ નંબર (8140430395)"
                    className="w-full p-1.5 bg-white border border-neutral-300 rounded text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateKhataAccount(activeTab === 'khata_customers' ? 'customer' : 'supplier')}
                    className="w-full bg-[#0B1E48] hover:bg-blue-900 text-white p-1.5 rounded text-xs font-black cursor-pointer shadow-xs"
                  >
                    + ખાતું બનાવો
                  </button>
                </div>

                {/* ACCOUNTS LIST */}
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {khataAccounts
                    .filter(a => a.type === (activeTab === 'khata_customers' ? 'customer' : 'supplier'))
                    .map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedAccountId === acc.id
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-xs">
                          <span>{acc.name}</span>
                          <span
                            className={`font-mono text-xs ${
                              acc.balance > 0
                                ? selectedAccountId === acc.id ? 'text-amber-300' : 'text-amber-700'
                                : acc.balance < 0
                                ? selectedAccountId === acc.id ? 'text-rose-300' : 'text-rose-700'
                                : 'text-emerald-500'
                            }`}
                          >
                            ₹{Math.abs(acc.balance).toFixed(2)}
                            {acc.balance > 0 ? ' (લેવાના)' : acc.balance < 0 ? ' (આપવાના)' : ' (0)'}
                          </span>
                        </div>
                        {acc.phone && (
                          <div className={`text-[10px] font-bold ${selectedAccountId === acc.id ? 'text-blue-200' : 'text-neutral-500'}`}>
                            📞 {acc.phone}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* RIGHT 2 COLS: SELECTED ACCOUNT LEDGER STATEMENT */}
              <div className="md:col-span-2 space-y-3">
                {selectedAccount ? (
                  <div className="space-y-3">
                    {/* ACCOUNT DETAIL CARD */}
                    <div className="bg-gradient-to-r from-blue-900 to-[#0B1E48] text-white p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black">{selectedAccount.name}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newName = window.prompt('નવું નામ દાખલ કરો:', selectedAccount.name);
                                if (newName && newName.trim() !== '') {
                                  onEditKhataAccount(selectedAccount.id, newName.trim());
                                }
                              }}
                              className="text-blue-300 hover:text-white px-1 py-1 rounded cursor-pointer"
                              title="નામ બદલો"
                            >
                              ✏️
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('આ ખાતું અને તેના તમામ વ્યવહારો કાઢી નાખવા છે?')) {
                                onDeleteKhataAccount(selectedAccount.id);
                                setSelectedAccountId(null);
                              }
                            }}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer"
                          >
                            ડીલીટ ખાતું
                          </button>
                        </div>
                        <p className="text-xs text-blue-200 font-bold">
                          {selectedAccount.phone ? `📞 ${selectedAccount.phone}` : 'સંપર્ક નંબર નથી'}
                          {selectedAccount.address ? ` • 📍 ${selectedAccount.address}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10.5px] text-blue-200 font-bold">ચોખ્ખી બાકી રકમ (Balance)</span>
                        <div className="text-lg font-black text-amber-300 font-mono">
                          ₹{Math.abs(selectedAccount.balance).toFixed(2)}
                          <span className="text-xs ml-1 font-sans">
                            {selectedAccount.balance > 0 ? '(લેવાના બાકી)' : selectedAccount.balance < 0 ? '(આપવાના બાકી)' : '(હિસાબ ક્લિયર)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* NEW TRANSACTION FORM */}
                    <form onSubmit={handleCreateKhataTransaction} className="bg-neutral-50 p-3 rounded-xl border border-neutral-300 space-y-2">
                      <div className="font-black text-xs text-neutral-800 flex items-center gap-2">
                        <span>+ નવી રકમ જમા / ઉધાર કરો:</span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => setTxType('jama')}
                            className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${
                              txType === 'jama' ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-800'
                            }`}
                          >
                            + જમા (મળ્યા)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxType('udhar')}
                            className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${
                              txType === 'udhar' ? 'bg-rose-600 text-white' : 'bg-white border border-rose-300 text-rose-800'
                            }`}
                          >
                            - ઉધાર (આપ્યા/સામાન)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-bold">
                        <div>
                          <input
                            type="number"
                            value={txAmount}
                            onChange={e => setTxAmount(e.target.value)}
                            placeholder="રકમ ₹"
                            className="w-full p-2 bg-white border border-neutral-300 rounded font-mono font-black text-xs outline-none"
                          />
                        </div>
                        <div>
                          <select
                            value={txMode}
                            onChange={e => setTxMode(e.target.value as any)}
                            className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold outline-none"
                          >
                            <option value="Cash">રોકડ (Cash)</option>
                            <option value="UPI">UPI / GPay</option>
                            <option value="Bank">બેંક ટ્રાન્સફર</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={txDesc}
                            onChange={e => setTxDesc(e.target.value)}
                            placeholder="વિગત (નોટબુક, ઝેરોક્ષ...)"
                            className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-neutral-900 hover:bg-black text-white px-5 py-1.5 rounded-lg text-xs font-black cursor-pointer"
                        >
                          ખાતામાં સેવ કરો
                        </button>
                      </div>
                    </form>

                    {/* TRANSACTIONS HISTORY TABLE */}
                    <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white">
                      <div className="bg-neutral-100 p-2 font-black text-xs text-neutral-800">
                        📜 હિસાબ હિસ્ટ્રી ({accountTransactions.length}):
                      </div>
                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-black">
                              <th className="p-2">તારીખ</th>
                              <th className="p-2">વિગત</th>
                              <th className="p-2">પદ્ધતિ</th>
                              <th className="p-2 text-right">જમા (+)</th>
                              <th className="p-2 text-right">ઉધાર (-)</th>
                              <th className="p-2 text-right">બાકી</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 font-bold">
                            {accountTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-neutral-400">
                                  આ ખાતામાં હજુ કોઈ હિસાબ નોંધાયો નથી.
                                </td>
                              </tr>
                            ) : (
                              accountTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-neutral-50">
                                  <td className="p-2 text-neutral-600">{t.date}</td>
                                  <td className="p-2 text-neutral-900">{t.description || '-'}</td>
                                  <td className="p-2">{t.paymentMode}</td>
                                  <td className="p-2 text-right font-mono text-emerald-700">
                                    {t.type === 'jama' ? `₹${t.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="p-2 text-right font-mono text-rose-700">
                                    {t.type === 'udhar' ? `₹${t.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="p-2 text-right font-mono font-black text-neutral-900">
                                    ₹{Math.abs(t.balanceAfter).toFixed(2)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 p-8 rounded-xl border border-dashed border-neutral-300 text-center text-neutral-400 font-bold space-y-2">
                    <Users className="w-8 h-8 mx-auto text-neutral-300" />
                    <div>ડાબી બાજુની યાદીમાંથી કોઈપણ ગ્રાહક કે વેપારીનું ખાતું પસંદ કરો.</div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
