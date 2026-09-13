import React, { useState } from 'react';
import {
  Printer,
  X,
  FileDown,
  Trash2,
  Share2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Edit3,
  Save,
  Plus,
  ArrowRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { PrintJobRecord, PrintJobFile, StoreSettings, OrderRecord, BillItem } from '../types';
import { INITIAL_PRINT_JOBS } from '../data';

interface AdminPrintJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  printJobs: PrintJobRecord[];
  storeSettings: StoreSettings;
  onUpdateJob: (jobId: string, updates: Partial<PrintJobRecord>) => void;
  onDeleteJob: (jobId: string) => void;
  onConvertToInvoice: (job: PrintJobRecord, billItems: BillItem[], total: number) => void;
}

export const AdminPrintJobsModal: React.FC<AdminPrintJobsModalProps> = ({
  isOpen,
  onClose,
  printJobs,
  storeSettings,
  onUpdateJob,
  onDeleteJob,
  onConvertToInvoice
}) => {
  const effectiveJobs = printJobs && printJobs.length > 0 ? printJobs : INITIAL_PRINT_JOBS;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    effectiveJobs.length > 0 ? effectiveJobs[0].id : null
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Custom price editing state for active job
  const [editingPrices, setEditingPrices] = useState<{ [fileId: string]: number }>({});
  const [extraCharge, setExtraCharge] = useState<number>(0);
  const [extraChargeNote, setExtraChargeNote] = useState<string>('બાઈન્ડિંગ / અન્ય ખર્ચ');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  if (!isOpen) return null;

  const filteredJobs = effectiveJobs.filter(j => {
    if (filterStatus === 'all') return true;
    return j.status === filterStatus;
  });

  const activeJob = effectiveJobs.find(j => j.id === selectedJobId) || filteredJobs[0] || null;

  // File Download Helper with robust Blob conversion & New Tab fallback
  const handleDownloadFile = (file: PrintJobFile) => {
    if (!file.fileDataUrl) {
      alert('ફાઇલ ડેટા ઉપલબ્ધ નથી.');
      return;
    }

    try {
      if (file.fileDataUrl.startsWith('data:')) {
        const arr = file.fileDataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (file.fileType || 'application/octet-stream');
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        // Open directly in new tab (guaranteed to work in all browsers without security blocking)
        window.open(blobUrl, '_blank');

        // Also trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.fileName || `Print_Doc_${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(file.fileDataUrl, '_blank');
      }
    } catch (e) {
      console.error('Download error:', e);
      window.open(file.fileDataUrl, '_blank');
    }
  };

  // Download All Files for Active Job
  const handleDownloadAllFiles = (job: PrintJobRecord) => {
    job.files.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadFile(file);
      }, index * 250);
    });
  };

  // Calculate live total based on edited prices
  const calculateTotal = (job: PrintJobRecord) => {
    let subtotal = 0;
    job.files.forEach(f => {
      const unitPrice = editingPrices[f.id] !== undefined ? editingPrices[f.id] : (f.pricePerUnit || 0);
      subtotal += unitPrice;
    });

    const finalTotal = Math.max(0, subtotal + (extraCharge || 0) - (discountAmount || 0));
    return { subtotal, finalTotal };
  };

  // Generate WhatsApp Invoice Message to Send to Customer
  const handleSendWhatsAppBill = (job: PrintJobRecord) => {
    const { subtotal, finalTotal } = calculateTotal(job);

    let itemsBreakdown = '';
    job.files.forEach((f, idx) => {
      const price = editingPrices[f.id] !== undefined ? editingPrices[f.id] : (f.pricePerUnit || 0);
      const modeText = f.colorMode === 'black_white' ? 'B&W' : f.colorMode === 'color' ? 'કલર' : 'PVC કાર્ડ';
      const lamText = f.lamination ? ' + લેમિનેશન' : '';
      itemsBreakdown += `${idx + 1}. *${f.fileName}*\n   (${modeText}, ${f.paperSize}, ${f.copies} કોપી${lamText}) = ₹${price}\n`;
    });

    if (extraCharge > 0) {
      itemsBreakdown += `➕ *${extraChargeNote || 'અન્ય ચાર્જ'}:* ₹${extraCharge}\n`;
    }
    if (discountAmount > 0) {
      itemsBreakdown += `➖ *ડિસ્કાઉન્ટ:* -₹${discountAmount}\n`;
    }

    const msg =
      `🧾 *પ્રિન્ટિંગ બિલ - ${storeSettings.storeNameGu}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *જોબ નં:* ${job.jobNo}\n` +
      `👤 *ગ્રાહક:* ${job.customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${job.mobile}\n` +
      `📅 *તારીખ:* ${job.createdAt}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📑 *પ્રિન્ટ વિગત & રકમ:*\n${itemsBreakdown}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *કુલ ચૂકવવાપાત્ર રકમ:* ₹${finalTotal}/-\n` +
      `💳 *UPI ID:* ${storeSettings.upiId}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ તમારી ફાઇલો પ્રિન્ટ થઈને તૈયાર છે. રૂબરૂ મેળવવા અથવા ડિલિવરી માટે સંપર્ક કરો.\n\n` +
      `દુકાન: ${storeSettings.address}\n` +
      `સંપર્ક: +91 ${storeSettings.phone}`;

    window.open(`https://wa.me/91${job.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Save customized pricing to Job Record
  const handleSaveJobPricing = (job: PrintJobRecord) => {
    const { subtotal, finalTotal } = calculateTotal(job);
    const updatedFiles = job.files.map(f => ({
      ...f,
      pricePerUnit: editingPrices[f.id] !== undefined ? editingPrices[f.id] : (f.pricePerUnit || 0)
    }));

    onUpdateJob(job.id, {
      files: updatedFiles,
      subtotal,
      extraCharges: extraCharge,
      extraChargesNote: extraChargeNote,
      discount: discountAmount,
      totalAmount: finalTotal
    });

    alert('✅ ભાવ અને બિલ વિગત સાચવાઈ ગઈ!');
  };

  // Convert Job directly to official Store Invoice
  const handleConvertJobToInvoice = (job: PrintJobRecord) => {
    const { subtotal, finalTotal } = calculateTotal(job);

    const billItems: BillItem[] = job.files.map((f, idx) => {
      const price = editingPrices[f.id] !== undefined ? editingPrices[f.id] : (f.pricePerUnit || 0);
      const modeText = f.colorMode === 'black_white' ? 'B&W' : f.colorMode === 'color' ? 'કલર' : 'PVC';
      return {
        name: `પ્રિન્ટ: ${f.fileName} (${modeText} ${f.paperSize})`,
        qty: f.copies || 1,
        price: price || 0,
        unit: 'કોપી'
      };
    });

    if (extraCharge > 0) {
      billItems.push({
        name: extraChargeNote || 'બાઈન્ડિંગ / અન્ય સર્વિસ',
        qty: 1,
        price: extraCharge,
        unit: 'સર્વિસ'
      });
    }

    onConvertToInvoice(job, billItems, finalTotal);
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    }
    if (fileType.includes('sheet') || fileType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    return <FileCheck className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden border border-neutral-300 my-auto flex flex-col h-[90vh]">
        
        {/* TOP HEADER */}
        <div className="bg-[#0B1E48] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🖨️ ઓનલાઇન પ્રિન્ટિંગ ઓર્ડર્સ મેનેજર</span>
                <span className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  {printJobs.length} રિક્વેસ્ટ
                </span>
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                ગ્રાહકો દ્વારા અપલોડ કરાયેલી ફાઇલો ૧-ક્લિકમાં PC માં ડાઉનલોડ કરો અને જાતે ભાવ એડિટ કરી બિલ મોકલો.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN SPLIT VIEW: JOBS LIST (LEFT) + JOB DETAILS & BILL EDITOR (RIGHT) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT SIDEBAR: JOBS LIST */}
          <div className="w-full md:w-80 border-r border-neutral-200 flex flex-col bg-neutral-50 shrink-0 overflow-hidden">
            {/* Status Filter Tabs */}
            <div className="p-2 border-b border-neutral-200 bg-white flex items-center gap-1 overflow-x-auto text-[11px] font-black">
              {[
                { key: 'all', label: 'બધા' },
                { key: 'received', label: 'નવા' },
                { key: 'printed', label: 'પ્રિન્ટેડ' },
                { key: 'ready', label: 'તૈયાર' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                    filterStatus === tab.key
                      ? 'bg-[#0B1E48] text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 px-4 text-neutral-400">
                  <Printer className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">કોઈ પ્રિન્ટ રિક્વેસ્ટ નથી.</p>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isSelected = activeJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        // Initialize price states
                        const prices: { [k: string]: number } = {};
                        job.files.forEach(f => {
                          prices[f.id] = f.pricePerUnit || 0;
                        });
                        setEditingPrices(prices);
                        setExtraCharge(job.extraCharges || 0);
                        setExtraChargeNote(job.extraChargesNote || 'બાઈન્ડિંગ / અન્ય ખર્ચ');
                        setDiscountAmount(job.discount || 0);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                          {job.jobNo}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            job.status === 'received'
                              ? 'bg-blue-100 text-blue-800'
                              : job.status === 'printed'
                              ? 'bg-purple-100 text-purple-800'
                              : job.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {job.status === 'received'
                            ? 'નવી રિક્વેસ્ટ'
                            : job.status === 'printed'
                            ? 'પ્રિન્ટેડ'
                            : job.status === 'ready'
                            ? 'તૈયાર છે'
                            : job.status}
                        </span>
                      </div>

                      <p className="text-xs font-black text-neutral-900 truncate">
                        {job.customerName}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-bold">
                        📞 +91 {job.mobile}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium mt-1">
                        <span>{job.files.length} ફાઇલો</span>
                        <span>{job.createdAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT SIDE: SELECTED JOB DETAILS & LIVE PRICE / BILL EDITOR */}
          {activeJob ? (
            <div className="flex-1 flex flex-col bg-white overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TOP ACTIONS & STATUS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                      {activeJob.jobNo}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">
                      • {activeJob.createdAt}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-neutral-900 mt-1">
                    {activeJob.customerName} (📞 +91 {activeJob.mobile})
                  </h3>
                  <p className="text-xs text-neutral-600 font-medium">
                    ડિલિવરી: <span className="font-bold">{activeJob.deliveryType === 'pickup' ? '🏪 રૂબરૂ પિકઅપ' : `🛵 હોમ ડિલિવરી (${activeJob.address})`}</span>
                  </p>
                </div>

                {/* Status Switcher & Delete */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={activeJob.status}
                    onChange={e => onUpdateJob(activeJob.id, { status: e.target.value as any })}
                    className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-black text-neutral-800 focus:outline-none focus:border-blue-700"
                  >
                    <option value="received">🔵 નવી રિક્વેસ્ટ (Received)</option>
                    <option value="in_progress">🟡 પ્રિન્ટિંગ ચાલુ (Printing)</option>
                    <option value="printed">🟣 પ્રિન્ટ થઈ ગયું (Printed)</option>
                    <option value="ready">🟢 તૈયાર છે (Ready for pickup)</option>
                    <option value="completed">✅ પૂર્ણ થયેલ (Completed)</option>
                    <option value="cancelled">❌ રદ કરેલ (Cancelled)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDownloadAllFiles(activeJob)}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="આ ઓર્ડરની તમામ ફાઇલો ડાઉનલોડ કરો"
                  >
                    <FileDown className="w-4 h-4 text-blue-200" />
                    <span>બધી ફાઇલો ડાઉનલોડ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`શું તમે જોબ #${activeJob.jobNo} ડિલીટ કરવા માંગો છો?`)) {
                        onDeleteJob(activeJob.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-red-200 cursor-pointer"
                    title="આ જોબ ડિલીટ કરો"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* UPLOADED FILES LIST & PRICE INPUT PER FILE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-orange-600" />
                    <span>અપલોડ કરાયેલી ફાઇલો & પ્રિન્ટિંગ રકમ (Live Price Editor):</span>
                  </h4>
                  <span className="text-xs font-bold text-neutral-500">
                    કુલ {activeJob.files.length} ફાઇલો
                  </span>
                </div>

                <div className="space-y-3">
                  {activeJob.files.map((file, idx) => {
                    const currentPrice =
                      editingPrices[file.id] !== undefined
                        ? editingPrices[file.id]
                        : (file.pricePerUnit || 0);

                    return (
                      <div
                        key={file.id}
                        className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200 space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* File info */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType, file.fileName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                                {idx + 1}. {file.fileName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-600 flex-wrap">
                                <span className="bg-neutral-200 px-1.5 py-0.5 rounded text-[10px]">
                                  {file.colorMode === 'black_white'
                                    ? '⚪⚫ B&W'
                                    : file.colorMode === 'color'
                                    ? '🌈 કલર'
                                    : '🪪 PVC કાર્ડ'}
                                </span>
                                <span>• {file.paperSize}</span>
                                <span>• {file.sideOption === 'single_side' ? 'સિંગલ સાઇડ' : 'ડબલ સાઇડ'}</span>
                                {file.lamination && (
                                  <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-black">
                                    ✨ લેમિનેશન
                                  </span>
                                )}
                                <span className="font-black text-neutral-900">• કોપી: {file.copies}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action: Download to PC & Price Input */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="આ ફાઇલ PC માં ડાઉનલોડ કરો"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>ડાઉનલોડ</span>
                            </button>

                            {/* Price field */}
                            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-xl px-2 py-1">
                              <span className="text-xs font-black text-neutral-500">₹</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={currentPrice === 0 ? '' : currentPrice}
                                placeholder="ભાવ"
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setEditingPrices(prev => ({
                                    ...prev,
                                    [file.id]: val
                                  }));
                                }}
                                className="w-16 text-xs font-black text-neutral-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {file.notes && (
                          <p className="text-[11px] text-orange-900 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg font-bold">
                            📝 ગ્રાહકની સૂચના: {file.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EXTRA CHARGES & DISCOUNT BOX */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
                <h4 className="text-xs font-black text-neutral-800">
                  અન્ય સર્વિસ / બાઈન્ડિંગ / ડિસ્કાઉન્ટ ચાર્જ ઉમેરો:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                      અન્ય ચાર્જ વિગત:
                    </label>
                    <input
                      type="text"
                      value={extraChargeNote}
                      onChange={e => setExtraChargeNote(e.target.value)}
                      placeholder="દા.ત. સ્પાઈરલ બાઈન્ડિંગ"
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 font-bold text-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                      અન્ય ચાર્જ રકમ (+₹):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={extraCharge === 0 ? '' : extraCharge}
                      onChange={e => setExtraCharge(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 font-black text-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                      ડિસ્કાઉન્ટ (-₹):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount === 0 ? '' : discountAmount}
                      onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 font-black text-emerald-700"
                    />
                  </div>
                </div>

                {/* Final Total Calculation Display */}
                {(() => {
                  const { subtotal, finalTotal } = calculateTotal(activeJob);
                  return (
                    <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
                      <div>
                        <p className="text-xs text-neutral-500 font-bold">
                          સબટોટલ: ₹{subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-500 mr-2">કુલ બિલ રકમ:</span>
                        <span className="text-lg sm:text-xl font-black text-orange-700">
                          ₹{finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* BOTTOM ACTIONS: SAVE PRICE, WHATSAPP BILL & CREATE OFFICIAL INVOICE */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveJobPricing(activeJob)}
                  className="w-full sm:w-auto bg-neutral-800 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>ભાવ સેવ કરો</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppBill(activeJob)}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                    title="ગ્રાહકના WhatsApp પર આ બિલ મોકલો"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp બિલ મોકલો</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertJobToInvoice(activeJob)}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20"
                    title="સત્તાવાર ૧ પેજ ટેક્સ બિલ / ઇન્વોઇસ બનાવો"
                  >
                    <Printer className="w-4 h-4" />
                    <span>૧ પેજ બિલ બનાવો</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">
              <p className="text-sm font-bold">વિગત જોવા માટે ડાબી બાજુથી જોબ પસંદ કરો.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
