import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Smartphone,
  Calendar,
  Filter,
  CreditCard,
  Building,
  RefreshCw,
  Share2,
  Check,
  Edit2,
  ArrowUpDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OnlineServiceJob, OnlineServiceExpense, StoreSettings } from '../types';

interface OnlineServicesPortalProps {
  onNavigateBack: () => void;
  jobs: OnlineServiceJob[];
  onUpdateJobs: (updater: (prev: OnlineServiceJob[]) => OnlineServiceJob[]) => void;
  expenses: OnlineServiceExpense[];
  onUpdateExpenses: (updater: (prev: OnlineServiceExpense[]) => OnlineServiceExpense[]) => void;
  storeSettings: StoreSettings;
  showToast: (msg: string) => void;
  isAdminUnlocked: boolean;
}

// Pre-configured government & cyber cafe service catalog
const DEFAULT_SERVICES = [
  { id: 'srv_1', name: 'i-ખેડૂત પોર્ટલ અરજી', defaultRate: 100, category: 'કિસાન સેવા' },
  { id: 'srv_2', name: 'નવું પાન કાર્ડ (PAN Card)', defaultRate: 150, category: 'ઓળખ કાર્ડ' },
  { id: 'srv_3', name: 'પાન કાર્ડ સુધારો (Correction)', defaultRate: 150, category: 'ઓળખ કાર્ડ' },
  { id: 'srv_4', name: 'આધાર સ્માર્ટ PVC કાર્ડ પ્રિન્ટ', defaultRate: 50, category: 'આધાર સેવા' },
  { id: 'srv_5', name: 'આયુષ્માન ભારત કાર્ડ (PMJAY)', defaultRate: 50, category: 'આરોગ્ય' },
  { id: 'srv_6', name: 'PM કિસાન સન્માન નિધિ e-KYC', defaultRate: 50, category: 'કિસાન સેવા' },
  { id: 'srv_7', name: 'આવકનો દાખલો (Income Cert)', defaultRate: 100, category: 'દાખલા' },
  { id: 'srv_8', name: 'જાતિનો દાખલો (Caste Cert)', defaultRate: 100, category: 'દાખલા' },
  { id: 'srv_9', name: 'ચૂંટણી કાર્ડ ડાઉનલોડ / સુધારો', defaultRate: 50, category: 'ઓળખ કાર્ડ' },
  { id: 'srv_10', name: 'ડ્રાઇવિંગ લાયસન્સ અરજી / RTO', defaultRate: 150, category: 'વાહન સેવા' },
  { id: 'srv_11', name: 'લાઇટ બિલ ઓનલાઇન ભરવું', defaultRate: 20, category: 'યુટિલિટી' },
  { id: 'srv_12', name: 'પાસપોર્ટ સાઇઝ ફોટો (૮ નંગ)', defaultRate: 50, category: 'ફોટો' },
  { id: 'srv_13', name: 'પોલીસ વેરિફિકેશન / ચારિત્ર્ય', defaultRate: 100, category: 'સર્ટિફિકેટ' },
  { id: 'srv_14', name: 'વિધવા / વૃદ્ધ પેન્શન સહાય', defaultRate: 100, category: 'સમાજ કલ્યાણ' },
  { id: 'srv_15', name: 'રેશન કાર્ડ કૂપન / નામ ઉમેરો', defaultRate: 100, category: 'પુરવઠો' },
  { id: 'srv_16', name: 'સરકારી ભરતી ઓનલાઇન ફોર્મ', defaultRate: 100, category: 'ભરતી ફોર્મ' },
];

export const OnlineServicesPortal: React.FC<OnlineServicesPortalProps> = ({
  onNavigateBack,
  jobs = [],
  onUpdateJobs,
  expenses = [],
  onUpdateExpenses,
  storeSettings,
  showToast,
  isAdminUnlocked
}) => {
  // if (!isOpen) return null; // Removed

  const todayStr = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  const [activeTab, setActiveTab] = useState<'jobs' | 'expenses' | 'daily_closing' | 'services_master'>('jobs');
  
  // Job Filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'unpaid'>('all');
  const [jobDateFilter, setJobDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [jobCustomDate, setJobCustomDate] = useState(todayStr);

  // New Job Form State
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [newAmount, setNewAmount] = useState<number | ''>(100);
  const [newPaymentMode, setNewPaymentMode] = useState<'Cash' | 'UPI' | 'બાકી'>('Cash');
  const [newPaymentStatus, setNewPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [newStatus, setNewStatus] = useState<'completed' | 'pending' | 'in_progress'>('completed');
  const [newAppNo, setNewAppNo] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newJobDate, setNewJobDate] = useState(todayStr);

  // Editing Job State
  const [editingJob, setEditingJob] = useState<OnlineServiceJob | null>(null);

  // New Expense Form State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('CSC / પોર્ટલ વોલેટ રિચાર્જ');
  const [newExpenseDate, setNewExpenseDate] = useState(todayStr);
  const [newExpenseMode, setNewExpenseMode] = useState<'Cash' | 'UPI' | 'Bank'>('UPI');
  const [newExpenseNotes, setNewExpenseNotes] = useState('');

  // Daily Closing Tab State
  const [closingDate, setClosingDate] = useState(todayStr);

  // Generate unique sequential token number
  const generateNextToken = () => {
    const count = jobs.length + 1;
    return `OS-${String(count).padStart(3, '0')}`;
  };

  // Quick fill from standard service catalog
  const handleSelectServicePreset = (service: typeof DEFAULT_SERVICES[0]) => {
    setNewServiceName(service.name);
    setNewAmount(service.defaultRate);
  };

  // Add new online job
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('⚠️ કૃપા કરીને કામ/સેવાનું નામ લખો!');
      return;
    }
    const amt = typeof newAmount === 'number' ? newAmount : parseFloat(newAmount) || 0;

    const newJob: OnlineServiceJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tokenNo: generateNextToken(),
      serviceName: newServiceName.trim(),
      customerName: newCustomerName.trim() || 'ગ્રાહક',
      mobile: newCustomerMobile.trim(),
      amount: amt,
      paymentMode: newPaymentMode,
      paymentStatus: newPaymentMode === 'બાકી' ? 'Pending' : newPaymentStatus,
      status: newStatus,
      date: newJobDate || todayStr,
      applicationNo: newAppNo.trim() || undefined,
      notes: newNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onUpdateJobs(prev => [newJob, ...prev]);
    showToast(`✅ ઓનલાઇન સેવા કામ ઉમેરાઈ ગયું: ${newJob.serviceName} (ટોકન #${newJob.tokenNo})`);

    // Reset Form
    setNewServiceName('');
    setNewCustomerName('');
    setNewCustomerMobile('');
    setNewAmount(100);
    setNewPaymentMode('Cash');
    setNewPaymentStatus('Paid');
    setNewStatus('completed');
    setNewAppNo('');
    setNewNotes('');
    setShowAddJobModal(false);
  };

  // Update existing job
  const handleSaveEditJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    onUpdateJobs(prev =>
      prev.map(j => (j.id === editingJob.id ? editingJob : j))
    );
    showToast(`✅ કામ અપડેટ થયું: ${editingJob.serviceName}`);
    setEditingJob(null);
  };

  // Delete Job
  const handleDeleteJob = (id: string, name: string) => {
    if (window.confirm(`શું તમે આ કામ '${name}' રેકોર્ડમાંથી ડિલીટ કરવા માંગો છો?`)) {
      onUpdateJobs(prev => prev.filter(j => j.id !== id));
      showToast('🗑️ કામ ડિલીટ થઈ ગયું.');
    }
  };

  // Quick mark paid
  const handleQuickMarkPaid = (jobId: string, mode: 'Cash' | 'UPI') => {
    onUpdateJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            paymentMode: mode,
            paymentStatus: 'Paid'
          };
        }
        return j;
      })
    );
    showToast(`💰 પેમેન્ટ ચૂકવાઈ ગયું તરીકે નોંધાયું (${mode})!`);
  };

  // Quick toggle work status
  const handleToggleStatus = (jobId: string) => {
    onUpdateJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          const nextStatus =
            j.status === 'pending'
              ? 'in_progress'
              : j.status === 'in_progress'
              ? 'completed'
              : 'pending';
          return { ...j, status: nextStatus };
        }
        return j;
      })
    );
  };

  // Create Portal Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = typeof newExpenseAmount === 'number' ? newExpenseAmount : parseFloat(newExpenseAmount as string) || 0;
    if (!newExpenseTitle.trim() || amt <= 0) {
      showToast('⚠️ કૃપા કરીને ખર્ચનું નામ અને રકમ લખો!');
      return;
    }

    const exp: OnlineServiceExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: newExpenseTitle.trim(),
      amount: amt,
      category: newExpenseCategory,
      date: newExpenseDate || todayStr,
      paymentMode: newExpenseMode,
      notes: newExpenseNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onUpdateExpenses(prev => [exp, ...prev]);
    showToast(`💸 પોર્ટલ ખર્ચ નોંધાયો: ₹${exp.amount} (${exp.title})`);

    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setNewExpenseNotes('');
    setShowAddExpenseModal(false);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (window.confirm('શું તમે આ ખર્ચ ડિલીટ કરવા માંગો છો?')) {
      onUpdateExpenses(prev => prev.filter(e => e.id !== id));
      showToast('🗑️ ખર્ચ ડિલીટ થયો.');
    }
  };

  // Send WhatsApp Receipt to Customer
  const handleSendWhatsAppReceipt = (job: OnlineServiceJob) => {
    const statusGuj =
      job.status === 'completed'
        ? '✅ કામ થઈ ગયું છે'
        : job.status === 'in_progress'
        ? '⏳ પ્રોસેસમાં ચાલુ છે'
        : '📝 કામ બાકી છે';

    const paymentGuj =
      job.paymentStatus === 'Paid'
        ? `✅ ચૂકવાઈ ગયું (${job.paymentMode})`
        : `⚠️ બાકી (Due)`;

    const text =
      `🌐 *${storeSettings.storeNameGu || 'પ્રિષા ઓનલાઇન સેવા કેન્દ્ર'}*\n` +
      `🎫 *ટોકન પાવતી / ઓનલાઇન કામ પહોંચ*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔢 *ટોકન નં:* #${job.tokenNo}\n` +
      `👤 *ગ્રાહક નામ:* ${job.customerName}\n` +
      `📅 *તારીખ:* ${job.date}\n` +
      `📄 *કામ / સેવા:* ${job.serviceName}\n` +
      (job.applicationNo ? `📌 *અરજી / એકનોલેજમેન્ટ નં:* ${job.applicationNo}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *કુલ સર્વિસ ફી:* ₹${job.amount.toFixed(2)}\n` +
      `💳 *પેમેન્ટ સ્થિતિ:* ${paymentGuj}\n` +
      `📊 *કામ સ્ટેટસ:* ${statusGuj}\n` +
      (job.notes ? `💬 *નોંધ:* ${job.notes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *સરનામું:* ${storeSettings.address || 'થરાદ'}\n` +
      `📞 *સંપર્ક:* +91 ${storeSettings.phone}\n` +
      `આભાર! ફરી મુલાકાત લો.`;

    const cleanMobile = (job.mobile || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Send Daily Summary WhatsApp to Owner
  const handleSendDailySummaryWhatsApp = () => {
    const text =
      `🌐 *${storeSettings.storeNameGu || 'પ્રિષા ઓનલાઇન સેવા કેન્દ્ર'}*\n` +
      `📊 *દૈનિક ઓનલાઇન સેવા પોર્ટલ હિસાબ (Daily Ledger)*\n` +
      `📅 *તારીખ:* ${closingDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *કુલ કરેલા કામ:* ${closingJobs.length} કામ\n` +
      `💰 *કુલ ઓનલાઇન આવક:* ₹${closingStats.totalRevenue.toFixed(2)}\n` +
      `  • 💵 કાઉન્ટર કેશ રોકડા: ₹${closingStats.cashRevenue.toFixed(2)}\n` +
      `  • 📱 UPI / ઓનલાઇન જમા: ₹${closingStats.upiRevenue.toFixed(2)}\n` +
      `  • ⚠️ ગ્રાહક બાકી રકમ (Dues): ₹${closingStats.unpaidDue.toFixed(2)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💸 *પોર્ટલ ખર્ચા / જાવક:* ₹${closingStats.totalExpenses.toFixed(2)}\n` +
      `📈 *ચોખ્ખો દૈનિક નફો (Net Profit):* ₹${closingStats.netProfit.toFixed(2)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `સંચાલક: ${storeSettings.ownerName || 'ભરત ચૌધરી'} | થરાદ`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Jobs
      const jobsData = jobs.map((j, idx) => ({
        'ક્રમ': idx + 1,
        'ટોકન નં': j.tokenNo,
        'તારીખ': j.date,
        'સેવા / કામ': j.serviceName,
        'ગ્રાહક નામ': j.customerName,
        'મોબાઇલ': j.mobile,
        'ફી રકમ (₹)': j.amount,
        'પેમેન્ટ મોડ': j.paymentMode,
        'પેમેન્ટ સ્ટેટસ': j.paymentStatus,
        'કામ સ્ટેટસ': j.status,
        'અરજી / રેફરન્સ નં': j.applicationNo || '-',
        'વિશેષ નોંધ': j.notes || '-'
      }));
      const wsJobs = XLSX.utils.json_to_sheet(jobsData);
      XLSX.utils.book_append_sheet(wb, wsJobs, 'ઓનલાઇન કામ રજિસ્ટર');

      // Sheet 2: Expenses
      const expData = expenses.map((e, idx) => ({
        'ક્રમ': idx + 1,
        'તારીખ': e.date,
        'ખર્ચનું નામ': e.title,
        'કેટેગરી': e.category,
        'રકમ (₹)': e.amount,
        'પેમેન્ટ મોડ': e.paymentMode,
        'નોંધ': e.notes || '-'
      }));
      const wsExp = XLSX.utils.json_to_sheet(expData);
      XLSX.utils.book_append_sheet(wb, wsExp, 'પોર્ટલ ખર્ચા');

      XLSX.writeFile(wb, `Prisha_Online_Services_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('📊 Excel રિપોર્ટ ડાઉનલોડ થઈ ગયો!');
    } catch (err) {
      console.error(err);
      showToast('❌ Excel ડાઉનલોડમાં ભૂલ આવી.');
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // Search
      const q = jobSearch.toLowerCase();
      const matchesSearch =
        !q ||
        j.serviceName.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        (j.mobile || '').includes(q) ||
        (j.tokenNo || '').toLowerCase().includes(q) ||
        (j.applicationNo || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status
      if (jobStatusFilter === 'pending' && j.status !== 'pending') return false;
      if (jobStatusFilter === 'in_progress' && j.status !== 'in_progress') return false;
      if (jobStatusFilter === 'completed' && j.status !== 'completed') return false;
      if (jobStatusFilter === 'unpaid' && j.paymentStatus !== 'Pending') return false;

      // Date
      if (jobDateFilter === 'today' && j.date !== todayStr) return false;
      if (jobDateFilter === 'custom' && j.date !== jobCustomDate) return false;

      return true;
    });
  }, [jobs, jobSearch, jobStatusFilter, jobDateFilter, jobCustomDate, todayStr]);

  // Daily Closing calculations for selected date
  const closingJobs = useMemo(() => {
    return jobs.filter(j => j.date === closingDate);
  }, [jobs, closingDate]);

  const closingExpenses = useMemo(() => {
    return expenses.filter(e => e.date === closingDate);
  }, [expenses, closingDate]);

  const closingStats = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let unpaidDue = 0;

    closingJobs.forEach(j => {
      const amt = Number(j.amount) || 0;
      totalRevenue += amt;
      if (j.paymentStatus === 'Paid') {
        if (j.paymentMode === 'Cash') cashRevenue += amt;
        else if (j.paymentMode === 'UPI') upiRevenue += amt;
        else cashRevenue += amt;
      } else {
        unpaidDue += amt;
      }
    });

    const totalExpenses = closingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      cashRevenue,
      upiRevenue,
      unpaidDue,
      totalExpenses,
      netProfit,
      jobsCount: closingJobs.length,
      expensesCount: closingExpenses.length
    };
  }, [closingJobs, closingExpenses]);

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto bg-white">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md text-xl">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white">
                  ઓનલાઇન સેવા કેન્દ્ર & CSC ડિજિટલ પોર્ટલ
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                  સ્ટેશનરીથી સંપૂર્ણ અલગ ખાતું
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-bold mt-0.5">
                સરકારી ફોર્મ, પાન-આધાર, i-ખેડૂત, લાયસન્સ અને ડિજિટલ સેવાઓનો દૈનિક રોજમેળ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="hidden sm:flex bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black items-center gap-1.5 shadow-xs cursor-pointer"
              title="Excel રિપોર્ટ ડાઉનલોડ"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel ડાઉનલોડ</span>
            </button>

            <button
              onClick={onNavigateBack}
              className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-neutral-100 border-b border-neutral-200 px-4 pt-2.5 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer border-t-2 border-x ${
                activeTab === 'jobs'
                  ? 'bg-white text-blue-900 border-blue-900 border-b-white shadow-xs'
                  : 'text-neutral-600 border-transparent hover:text-black hover:bg-neutral-200/60'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>📋 કામ રજિસ્ટર ({jobs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer border-t-2 border-x ${
                activeTab === 'expenses'
                  ? 'bg-white text-red-900 border-red-800 border-b-white shadow-xs'
                  : 'text-neutral-600 border-transparent hover:text-black hover:bg-neutral-200/60'
              }`}
            >
              <DollarSign className="w-4 h-4 text-red-600" />
              <span>💸 પોર્ટલ ખર્ચા ({expenses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('daily_closing')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer border-t-2 border-x ${
                activeTab === 'daily_closing'
                  ? 'bg-white text-emerald-950 border-emerald-700 border-b-white shadow-xs'
                  : 'text-neutral-600 border-transparent hover:text-black hover:bg-neutral-200/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>📊 દૈનિક રોજમેળ & નફો</span>
            </button>

            <button
              onClick={() => setActiveTab('services_master')}
              className={`px-3 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer border-t-2 border-x ${
                activeTab === 'services_master'
                  ? 'bg-white text-purple-950 border-purple-700 border-b-white shadow-xs'
                  : 'text-neutral-600 border-transparent hover:text-black hover:bg-neutral-200/60'
              }`}
            >
              <Tag className="w-4 h-4 text-purple-600" />
              <span>⚙️ સર્વિસીસ & રેટ લિસ્ટ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {activeTab === 'jobs' && (
              <button
                onClick={() => setShowAddJobModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ નવું કામ ઉમેરો</span>
              </button>
            )}

            {activeTab === 'expenses' && (
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ નવો ખર્ચ ઉમેરો</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: JOBS REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'jobs' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            
            {/* QUICK SERVICE ADD CHIPS */}
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-950 flex items-center gap-1">
                  <span>⚡ ફાસ્ટ સેવા પસંદ કરો (ક્લિક કરી તરત નવું કામ ઉમેરો):</span>
                </span>
                <span className="text-[10px] text-blue-700 font-bold">1-ક્લિક ઓટો ભાવ</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {DEFAULT_SERVICES.slice(0, 10).map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setNewServiceName(srv.name);
                      setNewAmount(srv.defaultRate);
                      setShowAddJobModal(true);
                    }}
                    className="bg-white hover:bg-blue-600 hover:text-white text-neutral-800 border border-blue-300 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>{srv.name}</span>
                    <span className="bg-amber-100 text-amber-900 group-hover:bg-white px-1 py-0.2 rounded font-black text-[10px]">
                      ₹{srv.defaultRate}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ગ્રાહક, મોબાઇલ, i-ખેડૂત, ટોકન સર્ચ..."
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    className="w-full text-xs font-bold pl-9 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={jobStatusFilter}
                  onChange={e => setJobStatusFilter(e.target.value as any)}
                  className="bg-white border border-neutral-300 text-xs font-bold p-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">બધાં સ્ટેટસ</option>
                  <option value="pending">⏳ બાકી કામ</option>
                  <option value="in_progress">⚙️ પ્રોસેસમાં</option>
                  <option value="completed">✅ પૂર્ણ કામ</option>
                  <option value="unpaid">⚠️ બાકી પેમેન્ટ</option>
                </select>

                {/* Date Filter */}
                <select
                  value={jobDateFilter}
                  onChange={e => setJobDateFilter(e.target.value as any)}
                  className="bg-white border border-neutral-300 text-xs font-bold p-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">તમામ તારીખો</option>
                  <option value="today">આજના કામ ({todayStr})</option>
                </select>
              </div>

              <div className="text-xs font-bold text-neutral-500 self-end sm:self-auto">
                કુલ પરિણામ: <span className="font-black text-neutral-900">{filteredJobs.length}</span> કામ
              </div>
            </div>

            {/* JOBS TABLE */}
            <div className="flex-1 overflow-y-auto border border-neutral-200 rounded-xl bg-white shadow-inner">
              {filteredJobs.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 space-y-2">
                  <p className="text-3xl">📝</p>
                  <p className="font-bold text-sm text-neutral-600">હજુ સુધી કોઈ ઓનલાઇન કામ નોંધાયેલ નથી</p>
                  <p className="text-xs">ઉપર "+ નવું કામ ઉમેરો" અથવા સેવા ચિપ પર ક્લિક કરો.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-black sticky top-0 border-b border-neutral-200 z-10">
                    <tr>
                      <th className="p-2.5">ટોકન / તારીખ</th>
                      <th className="p-2.5">સેવા / કામ</th>
                      <th className="p-2.5">ગ્રાહક & મોબાઇલ</th>
                      <th className="p-2.5 text-right">ફી (₹)</th>
                      <th className="p-2.5 text-center">પેમેન્ટ સ્થિતિ</th>
                      <th className="p-2.5 text-center">કામ સ્ટેટસ</th>
                      <th className="p-2.5 text-center">એક્શન</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-medium">
                    {filteredJobs.map(job => {
                      const isUnpaid = job.paymentStatus === 'Pending' || job.paymentMode === 'બાકી';

                      return (
                        <tr key={job.id} className="hover:bg-blue-50/50 transition-colors">
                          {/* Token & Date */}
                          <td className="p-2.5">
                            <span className="font-black font-mono text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                              #{job.tokenNo}
                            </span>
                            <div className="text-[10px] text-neutral-500 font-bold mt-0.5">{job.date}</div>
                          </td>

                          {/* Service & App No */}
                          <td className="p-2.5">
                            <div className="font-black text-neutral-900 text-xs">{job.serviceName}</div>
                            {job.applicationNo && (
                              <div className="text-[10px] text-emerald-800 font-mono mt-0.5">
                                નં: <b>{job.applicationNo}</b>
                              </div>
                            )}
                            {job.notes && (
                              <div className="text-[10px] text-neutral-500 italic mt-0.5">{job.notes}</div>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="p-2.5">
                            <div className="font-bold text-neutral-900">{job.customerName}</div>
                            {job.mobile ? (
                              <div className="text-[10px] text-blue-700 font-mono flex items-center gap-1 mt-0.5">
                                <Smartphone className="w-3 h-3" />
                                <span>{job.mobile}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-neutral-400">મોબાઇલ નથી</div>
                            )}
                          </td>

                          {/* Fee */}
                          <td className="p-2.5 text-right">
                            <span className="font-black text-sm text-neutral-900 font-mono">
                              ₹{job.amount.toFixed(2)}
                            </span>
                            <div className="text-[10px] text-neutral-500 font-bold">
                              {job.paymentMode}
                            </div>
                          </td>

                          {/* Payment Status with 1-click Paid toggle */}
                          <td className="p-2.5 text-center">
                            {isUnpaid ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="bg-red-100 text-red-800 border border-red-300 font-black px-2 py-0.5 rounded text-[10px]">
                                  ⚠️ બાકી
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    onClick={() => handleQuickMarkPaid(job.id, 'Cash')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shadow-2xs"
                                    title="રોકડા મળી ગયા"
                                  >
                                    +કેશ
                                  </button>
                                  <button
                                    onClick={() => handleQuickMarkPaid(job.id, 'UPI')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer shadow-2xs"
                                    title="UPI થી મળ્યા"
                                  >
                                    +UPI
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                <span>ચૂકવાઈ ગયું</span>
                              </span>
                            )}
                          </td>

                          {/* Work Status with 1-click rotate */}
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleToggleStatus(job.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 mx-auto ${
                                job.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : job.status === 'in_progress'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                              }`}
                              title="સ્ટેટસ બદલવા ક્લિક કરો"
                            >
                              {job.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>થઈ ગયું</span>
                                </>
                              ) : job.status === 'in_progress' ? (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                  <span>પ્રોસેસમાં</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 text-red-600" />
                                  <span>બાકી છે</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* WhatsApp Slip */}
                              <button
                                onClick={() => handleSendWhatsAppReceipt(job)}
                                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-transform active:scale-95 cursor-pointer"
                                title="ગ્રાહકને WhatsApp પાવતી મોકલો"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => setEditingJob(job)}
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg cursor-pointer"
                                title="સુધારો કરો"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteJob(job.id, job.serviceName)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                                title="કાઢી નાખો"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PORTAL EXPENSES */}
        {/* ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="bg-red-50/70 p-3 rounded-xl border border-red-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-red-950 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  <span>ઓનલાઇન સેવા કેન્દ્રના સ્વતંત્ર ખર્ચા (Portal Expenses)</span>
                </h3>
                <p className="text-[10px] text-red-800 font-bold mt-0.5">
                  CSC/i-ખેડૂત વોલેટ રિચાર્જ, બ્રોડબેન્ડ ઇન્ટરનેટ, મંત્રા/મોર્ફો બાયોમેટ્રિક સાધનો અને સર્વર ફી
                </p>
              </div>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ખર્ચ ઉમેરો</span>
              </button>
            </div>

            {/* Expenses Table */}
            <div className="flex-1 overflow-y-auto border border-neutral-200 rounded-xl bg-white shadow-inner">
              {expenses.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 space-y-2">
                  <p className="text-3xl">💸</p>
                  <p className="font-bold text-sm text-neutral-600">હજુ સુધી કોઈ પોર્ટલ ખર્ચ નોંધાયેલ નથી</p>
                  <p className="text-xs">વોલેટ રિચાર્જ કે અન્ય ખર્ચ ઉમેરવા ઉપર "+ ખર્ચ ઉમેરો" ક્લિક કરો.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-black sticky top-0 border-b border-neutral-200 z-10">
                    <tr>
                      <th className="p-2.5">તારીખ</th>
                      <th className="p-2.5">ખર્ચનું નામ</th>
                      <th className="p-2.5">કેટેગરી</th>
                      <th className="p-2.5 text-right">રકમ (₹)</th>
                      <th className="p-2.5 text-center">પેમેન્ટ મોડ</th>
                      <th className="p-2.5 text-center">એક્શન</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-medium">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-red-50/40 transition-colors">
                        <td className="p-2.5 font-bold text-neutral-600">{exp.date}</td>
                        <td className="p-2.5 font-black text-neutral-900">
                          {exp.title}
                          {exp.notes && (
                            <div className="text-[10px] text-neutral-500 font-normal italic mt-0.5">
                              {exp.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="bg-neutral-100 text-neutral-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-black text-sm text-red-600 font-mono">
                          ₹{exp.amount.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center font-bold text-neutral-700">
                          {exp.paymentMode}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                            title="ડિલીટ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DAILY LEDGER & CLOSING (દૈનિક રોજમેળ) */}
        {/* ========================================================================= */}
        {activeTab === 'daily_closing' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            
            {/* Date Selector & Action Strip */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black">હિસાબ તારીખ:</span>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={closingDate}
                  onChange={e => setClosingDate(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-amber-300 font-mono font-bold text-xs p-1.5 rounded-lg outline-none w-32"
                />
                <button
                  onClick={() => setClosingDate(todayStr)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2 py-1.5 rounded-lg cursor-pointer"
                >
                  આજની તારીખ
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendDailySummaryWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp પર હિસાબ મોકલો</span>
                </button>
              </div>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Total Revenue */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="text-[11px] font-bold text-blue-800">આજની કુલ આવક</div>
                <div className="text-lg font-black text-blue-950 font-mono mt-0.5">
                  ₹{closingStats.totalRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-blue-600 font-bold">{closingStats.jobsCount} કામ થયા</div>
              </div>

              {/* Cash in Hand */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800">💵 કાઉન્ટર કેશ રોકડા</div>
                <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                  ₹{closingStats.cashRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">ગલ્લામાં રોકડ</div>
              </div>

              {/* Online / UPI */}
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl">
                <div className="text-[11px] font-bold text-indigo-800">📱 UPI / ઓનલાઇન</div>
                <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
                  ₹{closingStats.upiRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] text-indigo-700 font-bold">બેંક ખાતામાં જમા</div>
              </div>

              {/* Pending Due */}
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl">
                <div className="text-[11px] font-bold text-amber-900">⚠️ ગ્રાહક બાકી રકમ</div>
                <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
                  ₹{closingStats.unpaidDue.toFixed(2)}
                </div>
                <div className="text-[10px] text-amber-700 font-bold">લેવાના બાકી</div>
              </div>

              {/* Total Expenses */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <div className="text-[11px] font-bold text-red-800">💸 પોર્ટલ ખર્ચા</div>
                <div className="text-lg font-black text-red-950 font-mono mt-0.5">
                  ₹{closingStats.totalExpenses.toFixed(2)}
                </div>
                <div className="text-[10px] text-red-600 font-bold">{closingStats.expensesCount} ખર્ચા નોંધાયા</div>
              </div>

              {/* Net Profit */}
              <div className={`p-3 rounded-xl border ${
                closingStats.netProfit >= 0
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                  : 'bg-red-100 border-red-400 text-red-950'
              }`}>
                <div className="text-[11px] font-bold">📈 ચોખ્ખો દૈનિક નફો</div>
                <div className="text-lg font-black font-mono mt-0.5">
                  ₹{closingStats.netProfit.toFixed(2)}
                </div>
                <div className="text-[10px] font-bold">આવક - ખર્ચ</div>
              </div>
            </div>

            {/* Day's Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Day's Jobs List */}
              <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <span>📋 આજના કરેલા કામ ({closingJobs.length})</span>
                  </h4>
                  <span className="text-xs font-black text-blue-900">
                    કુલ: ₹{closingStats.totalRevenue.toFixed(2)}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-neutral-100 text-xs">
                  {closingJobs.length === 0 ? (
                    <p className="text-neutral-400 text-center py-4">આ તારીખે કોઈ કામ નોંધાયેલ નથી.</p>
                  ) : (
                    closingJobs.map(job => (
                      <div key={job.id} className="pt-1.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-neutral-900">{job.serviceName}</div>
                          <div className="text-[10px] text-neutral-500">
                            {job.customerName} • #{job.tokenNo} • {job.paymentMode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-neutral-900">₹{job.amount}</div>
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            job.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {job.paymentStatus === 'Paid' ? 'Paid' : 'બાકી'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Day's Expenses List */}
              <div className="bg-white border border-neutral-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <span>💸 આજના ખર્ચા ({closingExpenses.length})</span>
                  </h4>
                  <span className="text-xs font-black text-red-900">
                    કુલ: ₹{closingStats.totalExpenses.toFixed(2)}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-neutral-100 text-xs">
                  {closingExpenses.length === 0 ? (
                    <p className="text-neutral-400 text-center py-4">આ તારીખે કોઈ ખર્ચ નોંધાયેલ નથી.</p>
                  ) : (
                    closingExpenses.map(exp => (
                      <div key={exp.id} className="pt-1.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-neutral-900">{exp.title}</div>
                          <div className="text-[10px] text-neutral-500">
                            {exp.category} • {exp.paymentMode}
                          </div>
                        </div>
                        <div className="font-mono font-black text-red-600">
                          -₹{exp.amount}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SERVICES & PRICING MASTER (સર્વિસ રેટ લિસ્ટ) */}
        {/* ========================================================================= */}
        {activeTab === 'services_master' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
              <h3 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>માનક ઓનલાઇન સેવાઓ અને સરકારી પોર્ટલ દર પત્રક</span>
              </h3>
              <p className="text-[10px] text-purple-800 font-bold mt-0.5">
                નવું કામ ઉમેરતી વખતે આ માનક દરો ઓટોમેટિક ભરાશે. તમે જરૂર મુજબ ગ્રાહક દીઠ રકમ બદલી શકો છો.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DEFAULT_SERVICES.map(srv => (
                <div
                  key={srv.id}
                  className="bg-white border border-neutral-200 p-3 rounded-xl shadow-2xs hover:border-purple-400 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                      {srv.category}
                    </span>
                    <h4 className="text-xs font-black text-neutral-900 mt-1">{srv.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-purple-900">
                      ₹{srv.defaultRate}
                    </span>
                    <button
                      onClick={() => {
                        setNewServiceName(srv.name);
                        setNewAmount(srv.defaultRate);
                        setActiveTab('jobs');
                        setShowAddJobModal(true);
                      }}
                      className="block text-[10px] font-bold text-blue-600 hover:underline mt-0.5 cursor-pointer"
                    >
                      + કામ લો
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="bg-neutral-100 p-3 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-600 shrink-0">
          <div className="flex items-center gap-2">
            <span>🏪 પ્રિષા સ્ટેશનરી & ઓનલાઇન સેવાઓ, થરાદ</span>
            <span>•</span>
            <span className="text-emerald-700">સંચાલક: {storeSettings.ownerName || 'ભરત ચૌધરી'}</span>
          </div>

          <button
            onClick={onNavigateBack}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL 1: CREATE NEW JOB */}
      {/* ========================================================================= */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border-2 border-blue-600 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  +
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">નવું ઓનલાઇન કામ / ટોકન ઉમેરો</h3>
                  <p className="text-[10px] text-neutral-500 font-bold">ઓનલાઇન પોર્ટલ રજિસ્ટર</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddJobModal(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              
              {/* Service Name with datalist suggestions */}
              <div>
                <label className="font-bold block mb-1 text-neutral-800">સેવા / કામનું નામ *</label>
                <input
                  list="services-suggestion-list"
                  type="text"
                  placeholder="દા.ત. i-ખેડૂત પોર્ટલ અરજી, પાન કાર્ડ, આધાર..."
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600"
                  required
                />
                <datalist id="services-suggestion-list">
                  {DEFAULT_SERVICES.map(s => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>

              {/* Customer Name & Mobile */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-neutral-800">ગ્રાહકનું નામ</label>
                  <input
                    type="text"
                    placeholder="દા.ત. રમેશભાઈ ચૌધરી"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-neutral-800">મોબાઇલ નંબર</label>
                  <input
                    type="tel"
                    placeholder="દા.ત. 9876543210"
                    value={newCustomerMobile}
                    onChange={e => setNewCustomerMobile(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Fee Amount & Payment Mode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-neutral-800">ભાવ / ફી (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full font-black text-sm p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 font-mono text-emerald-800"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-neutral-800">પેમેન્ટ મોડ</label>
                  <select
                    value={newPaymentMode}
                    onChange={e => {
                      const mode = e.target.value as any;
                      setNewPaymentMode(mode);
                      if (mode === 'બાકી') setNewPaymentStatus('Pending');
                      else setNewPaymentStatus('Paid');
                    }}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Cash">કેશ (Cash)</option>
                    <option value="UPI">UPI / ઓનલાઇન</option>
                    <option value="બાકી">બાકી (Due)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-neutral-800">કામ સ્ટેટસ</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="completed">✅ થઈ ગયું</option>
                    <option value="in_progress">⚙️ પ્રોસેસમાં</option>
                    <option value="pending">⏳ બાકી છે</option>
                  </select>
                </div>
              </div>

              {/* Application / Token / Ref No */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-neutral-800">અરજી / એકનોલેજમેન્ટ નં (જો હોય તો)</label>
                  <input
                    type="text"
                    placeholder="દા.ત. GJ2026-IKH-8921"
                    value={newAppNo}
                    onChange={e => setNewAppNo(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-neutral-800">તારીખ</label>
                  <input
                    type="text"
                    value={newJobDate}
                    onChange={e => setNewJobDate(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold block mb-1 text-neutral-800">વિશેષ નોંધ (વૈકલ્પિક)</label>
                <input
                  type="text"
                  placeholder="દા.ત. ૭/૧૨ કાગળ બાકી છે, સાંજે પ્રિન્ટ લેવા આવશે..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-black shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  સાચવો (+ Save Job)
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 2: EDIT JOB */}
      {/* ========================================================================= */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border-2 border-indigo-600 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-black text-neutral-900">
                કામ સુધારો: #{editingJob.tokenNo}
              </h3>
              <button
                onClick={() => setEditingJob(null)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditJob} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">સેવા / કામનું નામ</label>
                <input
                  type="text"
                  value={editingJob.serviceName}
                  onChange={e => setEditingJob({ ...editingJob, serviceName: e.target.value })}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">ગ્રાહકનું નામ</label>
                  <input
                    type="text"
                    value={editingJob.customerName}
                    onChange={e => setEditingJob({ ...editingJob, customerName: e.target.value })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">મોબાઇલ</label>
                  <input
                    type="text"
                    value={editingJob.mobile || ''}
                    onChange={e => setEditingJob({ ...editingJob, mobile: e.target.value })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">ફી (₹)</label>
                  <input
                    type="number"
                    value={editingJob.amount}
                    onChange={e => setEditingJob({ ...editingJob, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full font-black p-2 border border-neutral-300 rounded-lg outline-none font-mono text-emerald-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">પેમેન્ટ મોડ</label>
                  <select
                    value={editingJob.paymentMode}
                    onChange={e => setEditingJob({ ...editingJob, paymentMode: e.target.value as any })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Cash">કેશ (Cash)</option>
                    <option value="UPI">UPI / ઓનલાઇન</option>
                    <option value="બાકી">બાકી (Due)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">પેમેન્ટ સ્થિતિ</label>
                  <select
                    value={editingJob.paymentStatus}
                    onChange={e => setEditingJob({ ...editingJob, paymentStatus: e.target.value as any })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                  >
                    <option value="Paid">ચૂકવાઈ ગયું</option>
                    <option value="Pending">બાકી છે</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">કામ સ્ટેટસ</label>
                  <select
                    value={editingJob.status}
                    onChange={e => setEditingJob({ ...editingJob, status: e.target.value as any })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                  >
                    <option value="completed">✅ થઈ ગયું</option>
                    <option value="in_progress">⚙️ પ્રોસેસમાં</option>
                    <option value="pending">⏳ બાકી છે</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">અરજી નં</label>
                  <input
                    type="text"
                    value={editingJob.applicationNo || ''}
                    onChange={e => setEditingJob({ ...editingJob, applicationNo: e.target.value })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">વિશેષ નોંધ</label>
                <input
                  type="text"
                  value={editingJob.notes || ''}
                  onChange={e => setEditingJob({ ...editingJob, notes: e.target.value })}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  અપડેટ કરો (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 3: ADD EXPENSE */}
      {/* ========================================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border-2 border-red-600 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-black text-neutral-900">+ નવો પોર્ટલ ખર્ચ ઉમેરો</h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ખર્ચનું નામ / વિગત *</label>
                <input
                  type="text"
                  placeholder="દા.ત. CSC વોલેટ રિચાર્જ ₹2000, બ્રોડબેન્ડ બિલ..."
                  value={newExpenseTitle}
                  onChange={e => setNewExpenseTitle(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">રકમ (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹ 500"
                    value={newExpenseAmount}
                    onChange={e => setNewExpenseAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full font-black text-sm p-2 border border-neutral-300 rounded-lg outline-none focus:border-red-600 font-mono text-red-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">કેટેગરી</label>
                  <select
                    value={newExpenseCategory}
                    onChange={e => setNewExpenseCategory(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-red-600 bg-white"
                  >
                    <option value="CSC / પોર્ટલ વોલેટ રિચાર્જ">CSC / વોલેટ રિચાર્જ</option>
                    <option value="ઇન્ટરનેટ / બ્રોડબેન્ડ બિલ">ઇન્ટરનેટ બિલ</option>
                    <option value="બાયોમેટ્રિક / મશીનરી ખર્ચ">બાયોમેટ્રિક / સાધનો</option>
                    <option value="પેપર / સ્માર્ટ કાર્ડ સામગ્રી">પેપર / કાર્ડ સામગ્રી</option>
                    <option value="અન્ય પરચૂરણ ખર્ચ">અન્ય ખર્ચ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">પેમેન્ટ મોડ</label>
                  <select
                    value={newExpenseMode}
                    onChange={e => setNewExpenseMode(e.target.value as any)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                  >
                    <option value="UPI">UPI / ઓનલાઇન</option>
                    <option value="Cash">કેશ (Cash)</option>
                    <option value="Bank">બેંક ટ્રાન્સફર</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">તારીખ</label>
                  <input
                    type="text"
                    value={newExpenseDate}
                    onChange={e => setNewExpenseDate(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">વિશેષ નોંધ (વૈકલ્પિક)</label>
                <input
                  type="text"
                  placeholder="નોંધ..."
                  value={newExpenseNotes}
                  onChange={e => setNewExpenseNotes(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  ખર્ચ સાચવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default OnlineServicesPortal;
