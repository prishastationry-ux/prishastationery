import React, { useState, useMemo } from 'react';
import {
  Landmark,
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
  Edit3,
  CheckCircle2,
  Search,
  CreditCard,
  Building,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BankAccountEntry, OrderRecord, StoreSettings } from '../types';
import { ConfirmDeleteModal, DeleteTargetInfo } from './ConfirmDeleteModal';

interface BankCurrentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankEntries: BankAccountEntry[];
  onAddBankEntry: (entry: Omit<BankAccountEntry, 'id' | 'createdAt' | 'balanceAfter'>) => void;
  onUpdateBankEntry: (id: string, updates: Partial<BankAccountEntry>) => void;
  onDeleteBankEntry: (id: string) => void;
  orders: OrderRecord[];
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
}

export const BankCurrentAccountModal: React.FC<BankCurrentAccountModalProps> = ({
  isOpen,
  onClose,
  bankEntries,
  onAddBankEntry,
  onUpdateBankEntry,
  onDeleteBankEntry,
  orders,
  storeSettings,
  showToast
}) => {
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'this_month' | 'fy' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit/Delete State
  const [editingEntry, setEditingEntry] = useState<BankAccountEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetInfo | null>(null);

  // Form State
  const [entryDate, setEntryDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryCategory, setEntryCategory] = useState<BankAccountEntry['category']>('upi_receipt');
  const [entryParticulars, setEntryParticulars] = useState<string>('');
  const [entryRefNo, setEntryRefNo] = useState<string>('');
  const [entryNotes, setEntryNotes] = useState<string>('');

  if (!isOpen) return null;

  // Opening Balance from settings or default (Starts at 0 as requested)
  const openingBalance = storeSettings.currentAccountOpeningBalance !== undefined ? storeSettings.currentAccountOpeningBalance : 0;
  const bankName = storeSettings.currentAccountBank || storeSettings.bankName || 'State Bank of India (SBI)';
  const accountNo = storeSettings.currentAccountNumber || storeSettings.accountNumber || '38947291039';
  const ifscCode = storeSettings.currentAccountIfsc || storeSettings.ifscCode || 'SBIN0000488';
  const branchName = storeSettings.currentAccountBranch || 'થરાદ શાખા (Tharad)';

  // Calculate Running Balance and Sort Chronologically
  const sortedEntries = [...bankEntries].sort((a, b) => {
    const timeA = a.createdAt || (new Date(a.date.split('/').reverse().join('-')).getTime()) || 0;
    const timeB = b.createdAt || (new Date(b.date.split('/').reverse().join('-')).getTime()) || 0;
    return timeA - timeB;
  });

  // Calculate Running Balance for each entry
  let runningBal = openingBalance;
  const enrichedEntries = sortedEntries.map(entry => {
    const amt = typeof entry.amount === 'number' ? entry.amount : 0;
    if (entry.type === 'deposit') {
      runningBal += amt;
    } else {
      runningBal -= amt;
    }
    return {
      ...entry,
      calculatedBalance: runningBal
    };
  });

  // Now reverse for display (latest first)
  const displayList = [...enrichedEntries].reverse();

  // Filtered entries
  const filteredList = displayList.filter(entry => {
    if (filterType !== 'all' && entry.type !== filterType) return false;

    // Period filter
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;
    const thisMonthStr = `/${mm}/${yyyy}`;

    if (filterPeriod === 'today' && entry.date && !entry.date.startsWith(todayStr)) return false;
    if (filterPeriod === 'this_month' && entry.date && !entry.date.includes(thisMonthStr)) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchPart = entry.particulars?.toLowerCase().includes(term);
      const matchRef = entry.referenceNo?.toLowerCase().includes(term);
      const matchNotes = entry.notes?.toLowerCase().includes(term);
      const matchDate = entry.date?.includes(term);
      return matchPart || matchRef || matchNotes || matchDate;
    }

    return true;
  });

  // Totals
  const totalDeposits = bankEntries.filter(e => e.type === 'deposit').reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0);
  const totalWithdrawals = bankEntries.filter(e => e.type === 'withdrawal').reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0);
  const currentBalance = openingBalance + totalDeposits - totalWithdrawals;

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }
    if (!entryParticulars.trim()) {
      alert('કૃપા કરીને વિગત (Particulars) લખો.');
      return;
    }

    onAddBankEntry({
      date: entryDate,
      type: entryType,
      amount: amt,
      category: entryCategory,
      particulars: entryParticulars.trim(),
      referenceNo: entryRefNo.trim() || undefined,
      accountType: 'current',
      bankName,
      accountNumber: accountNo,
      notes: entryNotes.trim() || undefined
    });

    setEntryAmount('');
    setEntryParticulars('');
    setEntryRefNo('');
    setEntryNotes('');
    setShowAddForm(false);
    showToast(`✅ કરન્ટ એકાઉન્ટમાં ₹${amt} ની એન્ટ્રી સફળતાપૂર્વક ઉમેરાઈ!`);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (isNaN(editingEntry.amount) || editingEntry.amount <= 0) {
      alert('કૃપા કરીને માન્ય રકમ દાખલ કરો.');
      return;
    }
    if (!editingEntry.particulars.trim()) {
      alert('કૃપા કરીને વિગત (Particulars) લખો.');
      return;
    }

    onUpdateBankEntry(editingEntry.id, {
      ...editingEntry,
      particulars: editingEntry.particulars.trim(),
      notes: editingEntry.notes?.trim() || undefined,
      referenceNo: editingEntry.referenceNo?.trim() || undefined
    });

    setEditingEntry(null);
    showToast('✏️ બેંક એન્ટ્રી સફળતાપૂર્વક અપડેટ થઈ ગઈ!');
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteBankEntry(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // 1-Click Auto Sync UPI Orders into Current Account
  const handleAutoSyncUpiOrders = () => {
    const existingRefs = new Set(bankEntries.map(e => e.referenceNo || e.particulars));
    let syncCount = 0;

    orders.forEach(order => {
      const isUpiPaid = (order.paymentMode === 'UPI' || order.paymentMode === 'Online') && (order.paymentStatus === 'Paid' || order.paymentStatus === 'Verified');
      const refId = order.paymentDetails?.transactionId || `INV-${order.invoiceNo}`;

      if (isUpiPaid && !existingRefs.has(refId) && order.total > 0) {
        onAddBankEntry({
          date: order.date?.split(' ')[0] || entryDate,
          type: 'deposit',
          amount: order.total,
          category: 'upi_receipt',
          particulars: `UPI જમા: ${order.customerName} (ઓર્ડર #${order.invoiceNo})`,
          referenceNo: refId,
          accountType: 'current',
          bankName,
          accountNumber: accountNo,
          notes: order.orderType === 'online' ? 'ઓનલાઇન સ્ટોર ઓર્ડર' : 'કાઉન્ટર UPI QR બિલ'
        });
        existingRefs.add(refId);
        syncCount++;
      }
    });

    if (syncCount > 0) {
      showToast(`🎉 ${syncCount} નવા UPI પેમેન્ટ કરન્ટ એકાઉન્ટમાં જમા થઈ ગયા!`);
    } else {
      showToast('ℹ️ બધા જ UPI ઓર્ડર્સ પહેલેથી જ કરન્ટ એકાઉન્ટમાં નોંધાયેલા છે.');
    }
  };

  // Export Bank Statement to Excel
  const handleExportExcel = () => {
    const sheetData = filteredList.map((entry, idx) => ({
      'ક્રમ': idx + 1,
      'તારીખ': entry.date,
      'વિગત (Particulars)': entry.particulars,
      'સંદર્ભ / UTR / ચેક નં': entry.referenceNo || '-',
      'પ્રકાર': entry.type === 'deposit' ? 'જમા (Deposit)' : 'ઉપાડ (Withdrawal)',
      'જમા રકમ (₹)': entry.type === 'deposit' ? entry.amount : 0,
      'ઉધાર રકમ (₹)': entry.type === 'withdrawal' ? entry.amount : 0,
      'બેંક સિલક (₹)': entry.calculatedBalance,
      'નોંધ': entry.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Current_Account_Passbook');
    XLSX.writeFile(wb, `Prisha_Stationery_Current_Account_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📊 કરન્ટ એકાઉન્ટ સ્ટેટમેન્ટ Excel ફાઇલમાં ડાઉનલોડ થઈ ગયું!');
  };

  const getCategoryLabel = (cat: BankAccountEntry['category']) => {
    switch (cat) {
      case 'upi_receipt': return '📱 UPI / QR સ્કેન જમા';
      case 'cash_deposit': return '💵 રોકડ બેંકમાં ભરી';
      case 'cheque_deposit': return '🧾 ચેક જમા';
      case 'neft_rtgs_in': return '🏛️ RTGS / NEFT જમા';
      case 'supplier_payment': return '🏢 વેપારી પેમેન્ટ (માલ ખરીદી)';
      case 'cash_withdrawal': return '🏧 રોકડ ઉપાડ';
      case 'bank_charges': return '🏦 બેંક ચાર્જિસ / SMS';
      default: return '🔄 અન્ય ટ્રાન્ઝેક્શન';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-hidden">
      <div className="bg-neutral-100 rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col border-2 border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#0B1E48] text-white p-3.5 sm:p-4 flex items-center justify-between border-b-2 border-amber-500 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  🏦 કરન્ટ એકાઉન્ટ & બેંક હિસાબ (Bank Current Account Ledger)
                </h2>
                <span className="bg-amber-400 text-blue-950 text-xs font-black px-2 py-0.5 rounded-full">
                  {bankName}
                </span>
              </div>
              <p className="text-[11px] text-blue-200 font-medium">
                A/c: <strong>{accountNo}</strong> • IFSC: <strong>{ifscCode}</strong> • {branchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoSyncUpiOrders}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="ઓર્ડર્સના તમામ UPI પેમેન્ટ્સ કરન્ટ એકાઉન્ટમાં ઓટો-સિંક કરો"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">UPI ઓટો-સિંક</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              title="કરન્ટ એકાઉન્ટ પાસબુક Excel માં ડાઉનલોડ કરો"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Excel સ્ટેટમેન્ટ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="બંધ કરો"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUMMARY BALANCE TILES */}
        <div className="bg-white p-3 border-b border-neutral-300 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-3 rounded-xl border border-blue-400 shadow-xs">
            <span className="text-[10px] text-blue-200 font-bold block">હાજર બેંક સિલક (Current Balance)</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              ₹{currentBalance.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-blue-300 font-mono">ઓપનિંગ: ₹{openingBalance}</span>
          </div>

          <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-300 shadow-xs">
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
              <span>કુલ જમા (Total Credits)</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-800">
              +₹{totalDeposits.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-emerald-600 font-bold">{bankEntries.filter(e => e.type === 'deposit').length} એન્ટ્રીઓ</span>
          </div>

          <div className="bg-red-50 text-red-900 p-3 rounded-xl border border-red-300 shadow-xs">
            <span className="text-[10px] text-red-700 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-red-600" />
              <span>કુલ ઉપાડ / ખર્ચ (Debits)</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-red-800">
              -₹{totalWithdrawals.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-red-600 font-bold">{bankEntries.filter(e => e.type === 'withdrawal').length} એન્ટ્રીઓ</span>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowAddForm(prev => !prev)}
              className="w-full h-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black p-3 rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer border border-amber-400"
            >
              <Plus className="w-5 h-5 text-amber-200" />
              <span>{showAddForm ? 'ફોર્મ છુપાવો' : '+ નવી બેંક એન્ટ્રી કરો'}</span>
            </button>
          </div>
        </div>

        {/* NEW ENTRY COLLAPSIBLE FORM */}
        {showAddForm && (
          <form onSubmit={handleCreateEntry} className="bg-amber-50/70 p-3.5 border-b border-amber-300 shrink-0 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-700" />
                <span>નવી કરન્ટ એકાઉન્ટ એન્ટ્રી (New Deposit / Withdrawal Entry):</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-neutral-500 hover:text-black font-bold"
              >
                ✕ રદ કરો
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">તારીખ (Date):</label>
                <input
                  type="text"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-bold outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">પ્રકાર (Entry Type):</label>
                <select
                  value={entryType}
                  onChange={e => setEntryType(e.target.value as 'deposit' | 'withdrawal')}
                  className={`w-full px-2.5 py-1.5 rounded-lg font-black border outline-none cursor-pointer ${
                    entryType === 'deposit' ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-red-100 text-red-900 border-red-400'
                  }`}
                >
                  <option value="deposit">📥 જમા (Credit / Deposit)</option>
                  <option value="withdrawal">📤 ઉપાડ / ચુકવણી (Debit / Withdrawal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">રકમ (₹ Amount):</label>
                <input
                  type="number"
                  step="any"
                  value={entryAmount}
                  onChange={e => setEntryAmount(e.target.value)}
                  placeholder="₹ દાખલ કરો"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-black text-orange-700 outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">હેડ / કેટેગરી (Category):</label>
                <select
                  value={entryCategory}
                  onChange={e => setEntryCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-bold outline-none cursor-pointer"
                >
                  <option value="upi_receipt">📱 UPI / QR સ્કેન જમા</option>
                  <option value="cash_deposit">💵 રોકડ બેંકમાં ભરી (Cash Deposit)</option>
                  <option value="cheque_deposit">🧾 ચેક જમા (Cheque Deposit)</option>
                  <option value="neft_rtgs_in">🏛️ RTGS / NEFT જમા</option>
                  <option value="supplier_payment">🏢 વેપારી માલ ચુકવણી (Supplier RTGS)</option>
                  <option value="cash_withdrawal">🏧 રોકડ ઉપાડ (Cash Withdrawal)</option>
                  <option value="bank_charges">🏦 બેંક ચાર્જિસ / SMS ચાર્જ</option>
                  <option value="other">🔄 અન્ય ટ્રાન્ઝેક્શન</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">વિગત (Particulars / કોણે આપ્યા / કોને ચૂકવ્યા):</label>
                <input
                  type="text"
                  value={entryParticulars}
                  onChange={e => setEntryParticulars(e.target.value)}
                  placeholder="દા.ત. રમેશભાઈ ચોપડા પેમેન્ટ, કાગળ વેપારી આર.ટી.જી.એસ., કેશ ડિપોઝિટ"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-medium outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">સંદર્ભ / UTR / ચેક નં (Ref No):</label>
                <input
                  type="text"
                  value={entryRefNo}
                  onChange={e => setEntryRefNo(e.target.value)}
                  placeholder="UTR / Cheque No"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-mono outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">વધારાની નોંધ (Notes):</label>
                <input
                  type="text"
                  value={entryNotes}
                  onChange={e => setEntryNotes(e.target.value)}
                  placeholder="વૈકલ્પિક નોંધ"
                  className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg font-medium outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-neutral-200 text-neutral-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>કરન્ટ એકાઉન્ટમાં સેવ કરો</span>
              </button>
            </div>
          </form>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-2.5 border-b border-neutral-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="વિગત, UTR નં, તારીખ કે નોંધ શોધો..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs outline-none focus:border-blue-600 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded-md font-bold text-[11px] cursor-pointer ${
                  filterType === 'all' ? 'bg-[#0B1E48] text-white' : 'text-neutral-600 hover:text-black'
                }`}
              >
                બધા
              </button>
              <button
                type="button"
                onClick={() => setFilterType('deposit')}
                className={`px-2 py-1 rounded-md font-bold text-[11px] cursor-pointer ${
                  filterType === 'deposit' ? 'bg-emerald-700 text-white' : 'text-neutral-600 hover:text-black'
                }`}
              >
                📥 માત્ર જમા
              </button>
              <button
                type="button"
                onClick={() => setFilterType('withdrawal')}
                className={`px-2 py-1 rounded-md font-bold text-[11px] cursor-pointer ${
                  filterType === 'withdrawal' ? 'bg-red-700 text-white' : 'text-neutral-600 hover:text-black'
                }`}
              >
                📤 માત્ર ઉપાડ
              </button>
            </div>

            <select
              value={filterPeriod}
              onChange={e => setFilterPeriod(e.target.value as any)}
              className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded-lg text-[11px] font-bold outline-none cursor-pointer"
            >
              <option value="all">બધા સમયગાળા</option>
              <option value="today">આજની એન્ટ્રીઓ</option>
              <option value="this_month">આ મહિનો</option>
            </select>
          </div>
        </div>

        {/* PASSBOOK / LEDGER TABLE */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-neutral-300 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B1E48] text-white font-black text-[11px]">
                  <th className="p-2 sm:px-3">તારીખ</th>
                  <th className="p-2 sm:px-3">વિગત (Particulars)</th>
                  <th className="p-2 sm:px-3">કેટેગરી</th>
                  <th className="p-2 sm:px-3">સંદર્ભ / UTR</th>
                  <th className="p-2 sm:px-3 text-right">જમા (+)</th>
                  <th className="p-2 sm:px-3 text-right">ઉપાડ (-)</th>
                  <th className="p-2 sm:px-3 text-right">બેંક સિલક</th>
                  <th className="p-2 sm:px-3 text-center">એક્શન</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-500 font-bold">
                      કોઈ બેંક એન્ટ્રી મળી નથી. નવી એન્ટ્રી ઉમેરવા માટે '+ નવી બેંક એન્ટ્રી કરો' અથવા 'UPI ઓટો-સિંક' ક્લિક કરો.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((entry) => {
                    const isCredit = entry.type === 'deposit';
                    return (
                      <tr key={entry.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-2 sm:px-3 font-bold text-neutral-600 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="p-2 sm:px-3 font-black text-neutral-900">
                          <div>{entry.particulars}</div>
                          {entry.notes && (
                            <div className="text-[10px] text-neutral-400 font-normal">{entry.notes}</div>
                          )}
                        </td>
                        <td className="p-2 sm:px-3 text-[11px] text-neutral-600">
                          {getCategoryLabel(entry.category)}
                        </td>
                        <td className="p-2 sm:px-3 font-mono text-[11px] text-blue-900">
                          {entry.referenceNo || '-'}
                        </td>
                        <td className="p-2 sm:px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                          {isCredit ? `+₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2 sm:px-3 text-right font-black text-red-700 whitespace-nowrap">
                          {!isCredit ? `-₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-2 sm:px-3 text-right font-black text-blue-950 whitespace-nowrap">
                          ₹{entry.calculatedBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 sm:px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingEntry(entry)}
                              className="p-1 hover:bg-blue-50 text-neutral-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                              title="એડિટ કરો"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({
                                id: entry.id,
                                type: 'bank_entry' as any,
                                title: entry.particulars,
                                subtitle: `રકમ: ₹${entry.amount} | તારીખ: ${entry.date}`
                              })}
                              className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="એન્ટ્રી ડિલીટ કરો"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-100 border-t-2 border-neutral-300 font-black text-xs text-neutral-900">
                  <td colSpan={4} className="p-2 sm:px-3">
                    કુલ સરવાળો (Total Credits vs Debits):
                  </td>
                  <td className="p-2 sm:px-3 text-right text-emerald-800">
                    +₹{totalDeposits.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 sm:px-3 text-right text-red-800">
                    -₹{totalWithdrawals.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 sm:px-3 text-right text-base text-blue-950 font-black">
                    ₹{currentBalance.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white p-3 border-t border-neutral-300 flex items-center justify-between text-xs shrink-0">
          <div className="font-bold text-neutral-600">
            કુલ <strong className="text-neutral-900">{filteredList.length}</strong> એન્ટ્રીઓ દર્શાવેલ છે
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-black text-white font-black px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
          >
            બંધ કરો (Close)
          </button>
        </div>

      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-blue-500 shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-black">એન્ટ્રી સુધારો (Edit Bank Entry)</h3>
              </div>
              <button onClick={() => setEditingEntry(null)} className="text-white hover:text-blue-100">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateEntry} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1">તારીખ</label>
                  <input
                    type="text"
                    value={editingEntry.date}
                    onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1">રકમ (₹)</label>
                  <input
                    type="number"
                    value={editingEntry.amount}
                    onChange={e => setEditingEntry({...editingEntry, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-xl font-black text-blue-700 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-500 mb-1">વિગત (Particulars)</label>
                <input
                  type="text"
                  value={editingEntry.particulars}
                  onChange={e => setEditingEntry({...editingEntry, particulars: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1">પ્રકાર</label>
                  <select
                    value={editingEntry.type}
                    onChange={e => setEditingEntry({...editingEntry, type: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none"
                  >
                    <option value="deposit">જમા (Deposit)</option>
                    <option value="withdrawal">ઉપાડ (Withdrawal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1">કેટેગરી</label>
                  <select
                    value={editingEntry.category}
                    onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-xl font-bold outline-none"
                  >
                    <option value="upi_receipt">📱 UPI / QR જમા</option>
                    <option value="cash_deposit">💵 રોકડ જમા</option>
                    <option value="cheque_deposit">🧾 ચેક જમા</option>
                    <option value="neft_rtgs_in">🏛️ RTGS / NEFT જમા</option>
                    <option value="supplier_payment">🏢 વેપારી ચુકવણી</option>
                    <option value="cash_withdrawal">🏧 રોકડ ઉપાડ</option>
                    <option value="bank_charges">🏦 બેંક ચાર્જિસ</option>
                    <option value="other">🔄 અન્ય</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-500 mb-1">UTR / Ref No / નોંધ</label>
                <input
                  type="text"
                  value={editingEntry.referenceNo || ''}
                  onChange={e => setEditingEntry({...editingEntry, referenceNo: e.target.value})}
                  placeholder="સંદર્ભ નંબર"
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl transition-colors"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-colors"
                >
                  સુધારો સાચવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        target={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
