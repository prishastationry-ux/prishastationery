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
  Search,
  Edit2,
  MapPin,
  Phone,
  Briefcase
} from 'lucide-react';
import { RojmelEntry, KhataAccount, KhataTransaction, StoreSettings } from '../types';
import * as XLSX from 'xlsx';

interface RojmelKhataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrash?: () => void;
  rojmelEntries: RojmelEntry[];
  onAddRojmelEntry: (entry: Omit<RojmelEntry, 'id' | 'createdAt'>) => void;
  onDeleteRojmelEntry: (id: string) => void;
  khataAccounts: KhataAccount[];
  onAddKhataAccount: (acc: Omit<KhataAccount, 'id' | 'balance' | 'totalGiven' | 'totalReceived' | 'lastTransactionDate'>) => void;
  khataTransactions: KhataTransaction[];
  onAddKhataTransaction: (tx: Omit<KhataTransaction, 'id' | 'createdAt' | 'balanceAfter'>) => void;
  onDeleteKhataAccount: (id: string) => void;
  onDeleteKhataTransaction: (id: string, accountId: string) => void;
  onEditKhataAccount: (id: string, newName: string, newPhone: string, newAddress: string) => void;
  onEditKhataTransaction: (id: string, newAmount: number, newDesc: string) => void;
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
}

export const RojmelKhataModal: React.FC<RojmelKhataModalProps> = ({
  isOpen,
  onClose,
  onOpenTrash,
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
  const [activeTab, setActiveTab] = useState<'rojmel' | 'khata_customers' | 'khata_suppliers' | 'khata_others'>('rojmel');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ROJMEL FORM STATE
  const [rojmelType, setRojmelType] = useState<'aavak' | 'javak'>('aavak');
  const [rojmelCategory, setRojmelCategory] = useState<string>('રોકડ વેચાણ');
  const [rojmelAmount, setRojmelAmount] = useState<string>('');
  const [rojmelMode, setRojmelMode] = useState<'Cash' | 'UPI' | 'Bank' | 'બાકી (Credit)'>('Cash');
  const [rojmelPerson, setRojmelPerson] = useState<string>('');
  const [rojmelNotes, setRojmelNotes] = useState<string>('');
  const [editingRojmelId, setEditingRojmelId] = useState<string | null>(null);

  // KHATA FORM STATE (Account Creation)
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccPhone, setNewAccPhone] = useState<string>('');
  const [newAccAddress, setNewAccAddress] = useState<string>('');

  // EDIT ACCOUNT MODAL STATE
  const [editingAcc, setEditingAcc] = useState<{ id: string; name: string; phone: string; address: string } | null>(null);

  // EDIT TRANSACTION MODAL STATE
  const [editingTx, setEditingTx] = useState<{ id: string; amount: string; description: string; accountId: string } | null>(null);

  // CONFIRMATION DIALOG STATE
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    type: 'khata_account' | 'khata_transaction';
    id: string;
    title: string;
    subtitle?: string;
    extraId?: string;
  } | null>(null);

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
  const filteredRojmel = rojmelEntries.filter(r => r.date === formattedSelectedDate || r.date === selectedDate);

  // Today's Rojmel Totals
  const todayAavak = filteredRojmel.filter(r => r.type === 'aavak').reduce((sum, r) => sum + r.amount, 0);
  const todayJavak = filteredRojmel.filter(r => r.type === 'javak').reduce((sum, r) => sum + r.amount, 0);
  const todayNetBalance = todayAavak - todayJavak;

  // Khata Totals
  const totalCustomerReceivable = khataAccounts.filter(a => a.type === 'customer' && a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  const totalSupplierPayable = khataAccounts.filter(a => a.type === 'supplier' && a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);

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
    showToast(`✅ ${rojmelType === 'aavak' ? 'આવક' : 'જાવક'} રોજમેળમાં નોંધાઈ ગઈ!`);
  };

  const handleEditRojmel = (entry: RojmelEntry) => {
    setRojmelType(entry.type);
    setRojmelCategory(entry.category);
    setRojmelAmount(entry.amount.toString());
    setRojmelMode(entry.paymentMode as any);
    setRojmelPerson(entry.personName || '');
    setRojmelNotes(entry.notes || '');
    setEditingRojmelId(entry.id);
    
    if (entry.date.includes('/')) {
      const [d, m, y] = entry.date.split('/');
      setSelectedDate(`${y}-${m}-${d}`);
    } else {
      setSelectedDate(entry.date);
    }
  };

  const handleCreateKhataAccount = (type: 'customer' | 'supplier' | 'other') => {
    if (!newAccName.trim()) {
      showToast('⚠️ કૃપા કરીને નામ અથવા પેઢી/કંપનીનું નામ લખો.');
      return;
    }

    onAddKhataAccount({
      type,
      name: newAccName.trim(),
      phone: newAccPhone.trim(),
      address: newAccAddress.trim() || undefined
    });

    setNewAccName('');
    setNewAccPhone('');
    setNewAccAddress('');
    const label = type === 'customer' ? 'ગ્રાહકનું ખાતું' : type === 'supplier' ? 'વેપારીનું ખાતું' : 'અન્ય ખાતું';
    showToast(`✅ ${label} સફળતાપૂર્વક બની ગયું!`);
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

  const handleSaveEditAccount = () => {
    if (!editingAcc) return;
    if (!editingAcc.name.trim()) {
      showToast('⚠️ નામ ખાલી ન હોઈ શકે.');
      return;
    }
    onEditKhataAccount(editingAcc.id, editingAcc.name.trim(), editingAcc.phone.trim(), editingAcc.address.trim());
    setEditingAcc(null);
  };

  const handleSaveEditTransaction = () => {
    if (!editingTx) return;
    const amt = Number(editingTx.amount);
    if (!amt || amt <= 0) {
      showToast('⚠️ માન્ય રકમ દાખલ કરો.');
      return;
    }
    onEditKhataTransaction(editingTx.id, amt, editingTx.description.trim());
    setEditingTx(null);
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

  const currentType = activeTab === 'khata_customers' ? 'customer' : activeTab === 'khata_suppliers' ? 'supplier' : 'other';
  const activeAccounts = khataAccounts.filter(a => {
    const matchType = a.type === currentType || (currentType === 'customer' && !a.type);
    const matchSearch = (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone || '').includes(searchQuery) ||
      (a.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const selectedAccount = khataAccounts.find(a => a.id === selectedAccountId);
  const accountTransactions = khataTransactions.filter(t => t.accountId === selectedAccountId);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0B1E48] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>પ્રિશા એકાઉન્ટિંગ & રોજમેળ ખાતાવહી (Ledger)</span>
              </h2>
              <p className="text-xs text-blue-200 font-bold">
                દૈનિક રોકડ મેળ, ગ્રાહકોનું ઉધારી ખાતું, વેપારી સ્ટોક લેજર અને અન્ય વ્યવહાર
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenTrash && (
              <button
                type="button"
                onClick={onOpenTrash}
                className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-400/30 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                title="ટ્રેશ / રીસાઇકલ બિન ખોલો"
              >
                <Trash2 className="w-4 h-4 text-red-300" />
                <span className="hidden sm:inline">ટ્રેશ બિન (Recycle Bin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SUMMARY STRIP WITH BIG READABLE AMOUNTS */}
        <div className="bg-neutral-900 text-white p-3 px-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs border-b border-neutral-800">
          <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-500/50">
            <span className="text-[11px] font-bold text-emerald-400">આજની કુલ આવક (જમા)</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">
              ₹{todayAavak.toFixed(2)}
            </div>
          </div>

          <div className="bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/50">
            <span className="text-[11px] font-bold text-rose-400">આજની કુલ જાવક (ઉધાર/ખર્ચ)</span>
            <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-0.5">
              ₹{todayJavak.toFixed(2)}
            </div>
          </div>

          <div className="bg-amber-950/80 p-2.5 rounded-xl border border-amber-500/50">
            <span className="text-[11px] font-bold text-amber-400">ગ્રાહકો પાસેથી લેવાના (બાકી)</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
              ₹{totalCustomerReceivable.toFixed(2)}
            </div>
          </div>

          <div className="bg-blue-950/80 p-2.5 rounded-xl border border-blue-500/50">
            <span className="text-[11px] font-bold text-blue-400">વેપારીઓને ચૂકવવાના (સ્ટોક)</span>
            <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono mt-0.5">
              ₹{totalSupplierPayable.toFixed(2)}
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="bg-neutral-100 p-2.5 border-b border-neutral-300 flex items-center justify-between gap-2 overflow-x-auto text-xs font-black">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => { setActiveTab('rojmel'); setSelectedAccountId(null); }}
              className={`px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                activeTab === 'rojmel'
                  ? 'bg-[#0B1E48] text-white shadow-xs font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>૧. દૈનિક રોજમેળ (Daily Cash Book)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('khata_customers'); setSelectedAccountId(null); }}
              className={`px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                activeTab === 'khata_customers'
                  ? 'bg-[#0B1E48] text-white shadow-xs font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>૨. ગ્રાહકોનું ઉધારી ખાતું ({khataAccounts.filter(a => a.type === 'customer' || !a.type).length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('khata_suppliers'); setSelectedAccountId(null); }}
              className={`px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                activeTab === 'khata_suppliers'
                  ? 'bg-[#0B1E48] text-white shadow-xs font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <Building className="w-4 h-4 text-blue-400" />
              <span>૩. વેપારી સ્ટોક ખાતાવહી ({khataAccounts.filter(a => a.type === 'supplier').length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('khata_others'); setSelectedAccountId(null); }}
              className={`px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                activeTab === 'khata_others'
                  ? 'bg-[#0B1E48] text-white shadow-xs font-black'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>૪. અન્ય ખાતાઓ / બોરડ ({khataAccounts.filter(a => a.type === 'other').length})</span>
            </button>
          </div>

          {activeTab === 'rojmel' && (
            <div className="flex items-center gap-2 shrink-0">
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
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* ========================================================================= */}
          {/* TAB 1: DAILY ROJMEL (આવક & જાવક મેળ) */}
          {/* ========================================================================= */}
          {activeTab === 'rojmel' && (
            <div className="space-y-4">
              {/* ENTRY FORM */}
              <form onSubmit={handleCreateRojmelEntry} className="bg-neutral-50 p-3 sm:p-4 rounded-xl border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-neutral-800 flex items-center gap-2">
                    <span>{editingRojmelId ? '✏️ રોજમેળ એન્ટ્રી એડિટ કરો' : '➕ નવી રોજમેળ એન્ટ્રી ઉમેરો'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRojmelType('aavak')}
                      className={`px-3.5 py-1.5 rounded-lg font-black text-xs cursor-pointer ${
                        rojmelType === 'aavak' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-emerald-300 text-emerald-800'
                      }`}
                    >
                      + આવક (જમા)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRojmelType('javak')}
                      className={`px-3.5 py-1.5 rounded-lg font-black text-xs cursor-pointer ${
                        rojmelType === 'javak' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-rose-300 text-rose-800'
                      }`}
                    >
                      - જાવક (ઉધાર)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-neutral-600 text-[11px] font-bold mb-1">વિગત / કેટેગરી:</label>
                    <select
                      value={rojmelCategory}
                      onChange={e => setRojmelCategory(e.target.value)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg outline-none font-bold text-xs"
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
                    <label className="block text-neutral-600 text-[11px] font-bold mb-1">રકમ (₹) - મોટી સાઈઝ:</label>
                    <input
                      type="number"
                      value={rojmelAmount}
                      onChange={e => setRojmelAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-black text-base outline-none text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-[11px] font-bold mb-1">ચૂકવણી રીત:</label>
                    <select
                      value={rojmelMode}
                      onChange={e => setRojmelMode(e.target.value as any)}
                      className="w-full p-2 bg-white border border-neutral-300 rounded-lg outline-none font-bold text-xs"
                    >
                      <option value="Cash">રોકડ (Cash)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Bank">બેંક ટ્રાન્સફર (Bank)</option>
                      <option value="બાકી (Credit)">બાકી (Credit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 text-[11px] font-bold mb-1">ગ્રાહક/વેપારી/કંપનીનું નામ:</label>
                    <input
                      type="text"
                      value={rojmelPerson}
                      onChange={e => setRojmelPerson(e.target.value)}
                      placeholder="દા.ત. ભરતભાઈ થરાદ"
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
                      className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs cursor-pointer"
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
                  <span className="font-mono text-amber-400 text-sm">
                    આજની પુરાંત (બેલેન્સ): ₹{todayNetBalance.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-300 font-black">
                        <th className="p-2.5 text-center w-12">#</th>
                        <th className="p-2.5">પ્રકાર</th>
                        <th className="p-2.5">વિગત / કેટેગરી</th>
                        <th className="p-2.5">વ્યક્તિ / પેઢીનું નામ</th>
                        <th className="p-2.5">પદ્ધતિ</th>
                        <th className="p-2.5 text-right">આવક (જમા)</th>
                        <th className="p-2.5 text-right">જાવક (ઉધાર)</th>
                        <th className="p-2.5 text-center w-24">ક્રિયા</th>
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
                            <td className="p-2.5 text-center text-neutral-500">{idx + 1}</td>
                            <td className="p-2.5">
                              {entry.type === 'aavak' ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[11px]">
                                  + આવક
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black text-[11px]">
                                  - જાવક
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-neutral-900">{entry.category}</td>
                            <td className="p-2.5 text-neutral-700">{entry.personName || '-'}</td>
                            <td className="p-2.5">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 text-[10.5px]">
                                {entry.paymentMode}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-emerald-700 text-sm">
                              {entry.type === 'aavak' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-rose-700 text-sm">
                              {entry.type === 'javak' ? `₹${entry.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditRojmel(entry)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg cursor-pointer transition"
                                  title="એન્ટ્રી એડિટ કરો"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteRojmelEntry(entry.id)}
                                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                  title="એન્ટ્રી ડિલીટ કરો (ટ્રેશમાં જશે)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
          {/* TAB 2, 3, 4: KHATA (CUSTOMERS, SUPPLIERS, OTHERS) */}
          {/* ========================================================================= */}
          {activeTab !== 'rojmel' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* LEFT 1 COL: ACCOUNTS LIST */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-neutral-900 text-xs flex items-center gap-1.5">
                      {activeTab === 'khata_customers' ? '👥 ગ્રાહકોનું લિસ્ટ' : activeTab === 'khata_suppliers' ? '🏢 વેપારીઓનું લિસ્ટ' : '💼 અન્ય ખાતાઓ'}
                    </h3>
                    {onOpenTrash && (
                      <button
                        type="button"
                        onClick={onOpenTrash}
                        className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition shadow-xs"
                        title="ટ્રેશ / ડિલીટ ફાઈલ બોક્સ (ડીલીટ કરેલ ડેટા જોવા અને રીકવર કરવા)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>ટ્રેશ (ડીલીટ બોક્સ)</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-neutral-500">
                    {activeAccounts.length} ખાતા
                  </span>
                </div>

                {/* SEARCH BOX FOR ACCOUNTS */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="નામ, ફોન કે સરનામાં થી શોધો..."
                    className="w-full pl-8 pr-2 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold outline-none focus:border-blue-700"
                  />
                </div>

                {/* ADD ACCOUNT MINI FORM WITH ADDRESS/SHOP NAME */}
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-300 space-y-2 shadow-2xs">
                  <div className="font-black text-xs text-neutral-800">
                    + નવું ખાતું ખોલો ({activeTab === 'khata_customers' ? 'ગ્રાહક' : activeTab === 'khata_suppliers' ? 'વેપારી' : 'અન્ય'}):
                  </div>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    placeholder="નામ (દા.ત. ભરતભાઈ ચૌધરી / શ્રીજી એન્ટરપ્રાઇઝ)"
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold outline-none"
                  />
                  <input
                    type="tel"
                    value={newAccPhone}
                    onChange={e => setNewAccPhone(e.target.value)}
                    placeholder="મોબાઇલ નંબર (દા.ત. 9876543210)"
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold outline-none font-mono"
                  />
                  <input
                    type="text"
                    value={newAccAddress}
                    onChange={e => setNewAccAddress(e.target.value)}
                    placeholder="સરનામું / દુકાન / ઓફિસ / કંપનીનું નામ"
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateKhataAccount(currentType)}
                    className="w-full bg-[#0B1E48] hover:bg-blue-900 text-white p-2 rounded-lg text-xs font-black cursor-pointer shadow-xs transition"
                  >
                    + ખાતું બનાવો
                  </button>
                </div>

                {/* ACCOUNTS LIST */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {activeAccounts.length === 0 ? (
                    <div className="p-4 text-center text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      કોઈ ખાતું મળ્યું નથી. ઉપરથી નવું બનાવો.
                    </div>
                  ) : (
                    activeAccounts.map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAccountId === acc.id
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-md'
                            : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-black text-sm">{acc.name}</div>
                            {acc.address && (
                              <div className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${selectedAccountId === acc.id ? 'text-blue-200' : 'text-neutral-600'}`}>
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{acc.address}</span>
                              </div>
                            )}
                            {acc.phone && (
                              <div className={`text-[11px] font-mono font-bold flex items-center gap-1 mt-0.5 ${selectedAccountId === acc.id ? 'text-blue-200' : 'text-neutral-500'}`}>
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{acc.phone}</span>
                              </div>
                            )}
                          </div>

                           <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                            <div>
                              <div
                                className={`font-mono font-black text-sm ${
                                  acc.balance > 0
                                    ? selectedAccountId === acc.id ? 'text-amber-300' : 'text-amber-700'
                                    : acc.balance < 0
                                    ? selectedAccountId === acc.id ? 'text-rose-300' : 'text-rose-700'
                                    : 'text-emerald-500'
                                }`}
                              >
                                ₹{Math.abs(acc.balance).toFixed(2)}
                              </div>
                              <div className={`text-[10px] font-bold ${selectedAccountId === acc.id ? 'text-blue-100' : 'text-neutral-500'}`}>
                                {acc.balance > 0 ? '(લેવાના)' : acc.balance < 0 ? '(આપવાના)' : '(ક્લિયર)'}
                              </div>
                            </div>

                            {/* QUICK ACTIONS: EDIT & DELETE */}
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAcc({
                                    id: acc.id,
                                    name: acc.name,
                                    phone: acc.phone || '',
                                    address: acc.address || ''
                                  });
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs cursor-pointer transition shadow-2xs ${
                                  selectedAccountId === acc.id
                                    ? 'bg-blue-800 hover:bg-blue-700 text-white'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-blue-600'
                                }`}
                                title="એડિટ કરો"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteTarget({
                                    type: 'khata_account',
                                    id: acc.id,
                                    title: acc.name,
                                    subtitle: `પ્રકાર: ${acc.type === 'customer' ? 'ગ્રાહક' : 'વેપારી'}, બાકી રકમ: ₹${Math.abs(acc.balance).toFixed(2)}`
                                  });
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs cursor-pointer transition shadow-2xs ${
                                  selectedAccountId === acc.id
                                    ? 'bg-red-500/30 hover:bg-red-600 hover:text-white text-rose-300 border border-red-500/20'
                                    : 'bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-100'
                                }`}
                                title="ખાતું ડિલીટ કરો"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT 2 COLS: SELECTED ACCOUNT LEDGER STATEMENT */}
              <div className="md:col-span-2 space-y-3">
                {selectedAccount ? (
                  <div className="space-y-3">
                    {/* ACCOUNT DETAIL CARD */}
                    <div className="bg-gradient-to-r from-blue-950 via-[#0B1E48] to-neutral-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-blue-900">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black">{selectedAccount.name}</h4>
                          <button
                            type="button"
                            onClick={() => setEditingAcc({
                              id: selectedAccount.id,
                              name: selectedAccount.name,
                              phone: selectedAccount.phone || '',
                              address: selectedAccount.address || ''
                            })}
                            className="bg-blue-800/80 hover:bg-blue-700 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition border border-blue-600/40"
                            title="નામ, મોબાઇલ અને સરનામું / દુકાન એડિટ કરો"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>✏️ એડિટ વિગત</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteTarget({
                                type: 'khata_account',
                                id: selectedAccount.id,
                                title: selectedAccount.name,
                                subtitle: `પ્રકાર: ${selectedAccount.type === 'customer' ? 'ગ્રાહક' : 'વેપારી'}, બાકી રકમ: ₹${Math.abs(selectedAccount.balance).toFixed(2)}`
                              });
                            }}
                            className="bg-red-500/20 text-red-300 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition border border-red-500/40"
                          >
                            🗑️ ડીલીટ ખાતું
                          </button>
                        </div>
                        <div className="text-xs text-blue-200 font-bold mt-1 space-y-0.5">
                          {selectedAccount.phone && <div>📞 ફોન: <span className="font-mono text-white">{selectedAccount.phone}</span></div>}
                          {selectedAccount.address && <div>📍 સરનામું / દુકાન / ઓફિસ: <span className="text-white">{selectedAccount.address}</span></div>}
                        </div>
                      </div>

                      <div className="sm:text-right bg-black/30 p-2.5 px-3.5 rounded-xl border border-white/10 shrink-0">
                        <span className="text-[11px] text-blue-200 font-bold block">ચોખ્ખી બાકી રકમ (Balance)</span>
                        <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                          ₹{Math.abs(selectedAccount.balance).toFixed(2)}
                        </div>
                        <span className="text-[11px] text-neutral-300 font-bold block mt-0.5">
                          {selectedAccount.balance > 0 ? '⚠️ લેવાના બાકી' : selectedAccount.balance < 0 ? '📌 આપવાના બાકી' : '✅ હિસાબ ક્લિયર'}
                        </span>
                      </div>
                    </div>

                    {/* NEW TRANSACTION FORM */}
                    <form onSubmit={handleCreateKhataTransaction} className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-300 space-y-2.5 shadow-2xs">
                      <div className="font-black text-xs text-neutral-800 flex items-center justify-between gap-2 flex-wrap">
                        <span>+ નવી રકમ જમા / ઉધાર કરો:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTxType('jama')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition ${
                              txType === 'jama' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-emerald-300 text-emerald-800'
                            }`}
                          >
                            + જમા (મળ્યા / ચૂકવ્યા)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxType('udhar')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer transition ${
                              txType === 'udhar' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-rose-300 text-rose-800'
                            }`}
                          >
                            - ઉધાર (આપ્યા / માલસામાન)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-neutral-600 text-[11px] font-bold mb-1">રકમ (₹) - મોટી સાઈઝ:</label>
                          <input
                            type="number"
                            value={txAmount}
                            onChange={e => setTxAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-black text-base outline-none text-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-600 text-[11px] font-bold mb-1">ચૂકવણી રીત:</label>
                          <select
                            value={txMode}
                            onChange={e => setTxMode(e.target.value as any)}
                            className="w-full p-2 bg-white border border-neutral-300 rounded-lg outline-none font-bold text-xs"
                          >
                            <option value="Cash">રોકડ (Cash)</option>
                            <option value="UPI">UPI / QR</option>
                            <option value="Bank">બેંક ટ્રાન્સફર (Bank)</option>
                            <option value="Transfer">ટ્રાન્સફર (Transfer)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-600 text-[11px] font-bold mb-1">વિગત (સામાન, બિલ, ઝેરોક્ષ...):</label>
                          <input
                            type="text"
                            value={txDesc}
                            onChange={e => setTxDesc(e.target.value)}
                            placeholder="વિગત (નોટબુક, ઝેરોક્ષ, માલ...)"
                            className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-neutral-900 hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-black cursor-pointer shadow transition"
                        >
                          ખાતામાં સેવ કરો
                        </button>
                      </div>
                    </form>

                    {/* TRANSACTIONS HISTORY TABLE WITH EDIT AND DELETE FOR EVERY TRANSACTION */}
                    <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-neutral-100 p-2.5 font-black text-xs text-neutral-800 flex items-center justify-between">
                        <span>📜 હિસાબ હિસ્ટ્રી ({accountTransactions.length} વ્યવહારો):</span>
                        <span className="text-neutral-500 font-bold text-[11px]">દરેક એન્ટ્રીને એડિટ કે ડિલીટ કરી શકાય છે</span>
                      </div>

                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-black">
                              <th className="p-2.5">તારીખ</th>
                              <th className="p-2.5">વિગત</th>
                              <th className="p-2.5">પદ્ધતિ</th>
                              <th className="p-2.5 text-right">જમા (+)</th>
                              <th className="p-2.5 text-right">ઉધાર (-)</th>
                              <th className="p-2.5 text-right">બાકી</th>
                              <th className="p-2.5 text-center w-20">ક્રિયા</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 font-bold">
                            {accountTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-neutral-400">
                                  આ ખાતામાં હજુ કોઈ હિસાબ નોંધાયો નથી.
                                </td>
                              </tr>
                            ) : (
                              accountTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-neutral-50">
                                  <td className="p-2.5 text-neutral-600 font-mono">{t.date}</td>
                                  <td className="p-2.5 text-neutral-900">{t.description || '-'}</td>
                                  <td className="p-2.5">
                                    <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10.5px] border border-neutral-200">
                                      {t.paymentMode}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-emerald-700 font-black text-sm">
                                    {t.type === 'jama' ? `₹${t.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-rose-700 font-black text-sm">
                                    {t.type === 'udhar' ? `₹${t.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-black text-neutral-900 text-sm">
                                    ₹{Math.abs(t.balanceAfter).toFixed(2)}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingTx({
                                          id: t.id,
                                          amount: t.amount.toString(),
                                          description: t.description || '',
                                          accountId: t.accountId
                                        })}
                                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded cursor-pointer transition"
                                        title="વ્યવહાર એડિટ કરો"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDeleteTarget({
                                            type: 'khata_transaction',
                                            id: t.id,
                                            title: `વ્યવહાર: ${t.type === 'jama' ? 'જમા' : 'ઉધાર'} ₹${t.amount.toFixed(2)}`,
                                            subtitle: `તારીખ: ${t.date}, વિગત: ${t.description || '-'}, ખાતું: ${t.accountName}`,
                                            extraId: t.accountId
                                          });
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer transition"
                                        title="વ્યવહાર ડિલીટ કરો (ટ્રેશમાં જશે)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
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
                  <div className="bg-neutral-50 p-10 rounded-xl border border-dashed border-neutral-300 text-center text-neutral-400 font-bold space-y-2">
                    <Users className="w-10 h-10 mx-auto text-neutral-300" />
                    <div className="text-sm font-black text-neutral-600">ડાબી બાજુની યાદીમાંથી કોઈપણ ખાતું પસંદ કરો.</div>
                    <p className="text-xs text-neutral-400">ખાતું પસંદ કરવાથી તેનો લેજર, સરનામું, બાકી રકમ અને વ્યવહારો જોઈ શકાશે.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* EDIT ACCOUNT MODAL POPUP */}
        {/* ========================================================================= */}
        {editingAcc && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-3 animate-fade-in no-print">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 border-2 border-neutral-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>ખાતાની વિગત એડિટ કરો</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">નામ (ગ્રાહક / વેપારી / કંપની):</label>
                  <input
                    type="text"
                    value={editingAcc.name}
                    onChange={e => setEditingAcc({ ...editingAcc, name: e.target.value })}
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1">મોબાઇલ નંબર:</label>
                  <input
                    type="tel"
                    value={editingAcc.phone}
                    onChange={e => setEditingAcc({ ...editingAcc, phone: e.target.value })}
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1">સરનામું / દુકાન / ઓફિસ / કંપનીનું નામ:</label>
                  <input
                    type="text"
                    value={editingAcc.address}
                    onChange={e => setEditingAcc({ ...editingAcc, address: e.target.value })}
                    placeholder="સરનામું દા.ત. થરાદ, દુકાન નં. ૪, મેઇન બજાર"
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAcc(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditAccount}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-xs cursor-pointer shadow transition"
                >
                  સુધારો સેવ કરો
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT TRANSACTION MODAL POPUP */}
        {/* ========================================================================= */}
        {editingTx && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-3 animate-fade-in no-print">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 border-2 border-neutral-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  <span>ખાતાનો વ્યવહાર એડિટ કરો</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">રકમ (₹):</label>
                  <input
                    type="number"
                    value={editingTx.amount}
                    onChange={e => setEditingTx({ ...editingTx, amount: e.target.value })}
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-black text-lg outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1">વિગત (સામાન, વિગત વગેરે):</label>
                  <input
                    type="text"
                    value={editingTx.description}
                    onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditTransaction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs cursor-pointer shadow transition"
                >
                  વ્યવહાર સેવ કરો
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* IN-APP CONFIRMATION MODAL FOR ROJMEL/KHATA MODAL */}
        {/* ========================================================================= */}
        {confirmDeleteTarget && (
          <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-3 animate-fade-in no-print">
            <div className="bg-white rounded-2xl max-w-md w-full border-2 border-red-500 shadow-2xl overflow-hidden animate-scale-up">
              
              {/* Modal Header */}
              <div className="bg-red-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black">
                      ડીલીટ કરવાની ખાતરી કરો
                    </h3>
                    <p className="text-[11px] text-red-100 font-bold">
                      {confirmDeleteTarget.type === 'khata_account' ? 'ખાતું અને તેના તમામ વ્યવહારો દૂર થશે' : 'આ ખાતાનો વ્યવહાર દૂર થશે'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-3.5 bg-neutral-50/50 text-xs">
                <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                  <p className="font-bold text-neutral-500">આઇટમ વિગત:</p>
                  <p className="text-sm font-black text-neutral-900">{confirmDeleteTarget.title}</p>
                  {confirmDeleteTarget.subtitle && (
                    <p className="text-neutral-600 font-bold mt-1">{confirmDeleteTarget.subtitle}</p>
                  )}
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-black flex items-center gap-1.5 text-emerald-800">
                    <span>🛡️ સુરક્ષિત ટ્રેશ બિનમાં જશે</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold">
                    ચિંતા કરશો નહિ! આ ડેટા સુરક્ષિત રીતે ટ્રેશ બિન (Recycle Bin) માં રહેશે, જેથી તમે ગમે ત્યારે તેને રીકવર (Restore) કરી શકશો.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-3.5 bg-neutral-100 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-800 font-black rounded-xl border border-neutral-300 cursor-pointer"
                >
                  રદ કરો
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const { type, id, extraId } = confirmDeleteTarget;
                    if (type === 'khata_account') {
                      onDeleteKhataAccount(id);
                      if (selectedAccountId === id) {
                        setSelectedAccountId(null);
                      }
                    } else if (type === 'khata_transaction') {
                      if (extraId) {
                        onDeleteKhataTransaction(id, extraId);
                      }
                    }
                    setConfirmDeleteTarget(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>હા, ડિલીટ કરો</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
