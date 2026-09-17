import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  Edit3,
  Save,
  Plus,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Eye,
  Loader2,
  Zap,
  UploadCloud,
  RefreshCw
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PrintJobRecord, PrintJobFile, StoreSettings, OrderRecord, BillItem } from '../types';
import {
  getFileFromCloudStorage,
  getFileFromStorage,
  uploadFileObjectInChunks,
  deleteFileFromCloudStorage,
  isForeignBlobUrl,
  createBlobUrl,
  createBlobUrlAsync,
  downloadFileSafely,
  openFileInNewTab,
  formatFileSize,
  formatSpeed
} from '../lib/fileStorage';

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
  const [cloudFiles, setCloudFiles] = useState<any[]>([]);

  // Real-time listener for files uploaded directly to cloud storage (collection 'print_files')
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'print_files'), (snap) => {
      const files: any[] = [];
      snap.forEach(doc => {
        files.push(doc.data());
      });
      files.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
      setCloudFiles(files);
    }, (err) => {
      console.warn('print_files sync notice:', err);
    });
    return () => unsub();
  }, [isOpen]);

  const effectiveJobs = useMemo(() => {
    const baseJobs = Array.isArray(printJobs) ? [...printJobs] : [];
    
    // Check if any cloudFile is missing from baseJobs
    const existingFileIds = new Set<string>();
    baseJobs.forEach(job => {
      (job.files || []).forEach(f => existingFileIds.add(f.id));
    });

    const unlinkedFiles = cloudFiles.filter(cf => cf && cf.id && !existingFileIds.has(cf.id));
    
    const synthesizedJobs: PrintJobRecord[] = unlinkedFiles.map((cf) => {
      const isImg = cf.fileType?.includes('image') || cf.fileName?.match(/\.(jpg|jpeg|png|webp|ico|bmp|svg|gif)$/i);
      const isPdf = cf.fileType?.includes('pdf') || cf.fileName?.toLowerCase().endsWith('.pdf');
      const dateStr = cf.uploadedAt ? new Date(cf.uploadedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'તાજેતરમાં અપલોડ';
      return {
        id: `cloud-${cf.id}`,
        jobNo: `PRN-${cf.id.slice(-4).toUpperCase()}`,
        customerName: 'ઓનલાઇન કસ્ટમર (મોબાઇલ ફાઇલ)',
        mobile: storeSettings?.phone || '9723712381',
        address: 'દુકાન પિકઅપ',
        deliveryType: 'pickup',
        files: [{
          id: cf.id,
          fileName: cf.fileName || 'ડોક્યુમેન્ટ ફાઇલ',
          fileSize: cf.fileSize || 0,
          fileType: cf.fileType || (isImg ? 'image/jpeg' : isPdf ? 'application/pdf' : 'application/octet-stream'),
          copies: 1,
          colorMode: isImg ? 'color' : 'black_white',
          sideOption: 'single_side',
          paperSize: isImg ? '4x6 Photo' : 'A4',
          lamination: false,
          notes: 'મોબાઇલ લિંક પરથી સીધું અપલોડ',
          uploadedToCloud: true,
          uploadStatus: 'completed',
          uploadProgress: 100,
          fileDataUrl: ''
        }],
        totalJobSize: cf.fileSize || 0,
        createdAt: dateStr,
        status: 'received',
        subtotal: isImg ? 15 : 5,
        extraCharges: 0,
        discount: 0,
        totalAmount: isImg ? 15 : 5,
        paymentStatus: 'Pending',
        paymentMode: 'UPI'
      };
    });

    return [...synthesizedJobs, ...baseJobs];
  }, [printJobs, cloudFiles, storeSettings]);

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if ((!selectedJobId || !effectiveJobs.some(j => j.id === selectedJobId)) && effectiveJobs.length > 0) {
      setSelectedJobId(effectiveJobs[0].id);
    }
  }, [effectiveJobs, selectedJobId]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Custom price editing state for active job
  const [editingPrices, setEditingPrices] = useState<{ [fileId: string]: number }>({});
  const [extraCharge, setExtraCharge] = useState<number>(0);
  const [extraChargeNote, setExtraChargeNote] = useState<string>('બાઈન્ડિંગ / અન્ય ખર્ચ');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    fileId: string;
    percent: number;
    speed: string;
    loadedBytes?: number;
    totalBytes?: number;
  } | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    file: PrintJobFile;
    blobUrl: string;
    dataUrl: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [missingFileData, setMissingFileData] = useState<{
    file: PrintJobFile;
    job: PrintJobRecord;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleDeleteJobWithCloud = async (job: PrintJobRecord) => {
    if (job.files && Array.isArray(job.files)) {
      for (const f of job.files) {
        if (f.id) {
          deleteFileFromCloudStorage(f.id).catch(() => {});
        }
      }
    }
    if (job.id.startsWith('cloud-')) {
      const rawFileId = job.id.replace('cloud-', '');
      deleteFileFromCloudStorage(rawFileId).catch(() => {});
      setCloudFiles(prev => prev.filter(cf => cf.id !== rawFileId));
    }
    onDeleteJob(job.id);
    showToast('🗑️ પ્રિન્ટ જોબ ડિલીટ કરાઈ!');
  };

  if (!isOpen) return null;

  const filteredJobs = effectiveJobs.filter(j => {
    if (filterStatus === 'all') return true;
    return j.status === filterStatus;
  });

  const activeJob = effectiveJobs.find(j => j.id === selectedJobId) || filteredJobs[0] || null;

  // Retrieve complete file dataUrl from memory, IndexedDB, or chunked cloud storage
  const getFullFileDataUrl = async (file: PrintJobFile): Promise<string | null> => {
    if (file.fileDataUrl && file.fileDataUrl.length > 50 && !isForeignBlobUrl(file.fileDataUrl)) {
      return file.fileDataUrl;
    }
    return await getFileFromCloudStorage(file.id);
  };

  // Safe File Download directly to PC using Blob & ObjectURL
  const handleDownloadFile = async (file: PrintJobFile) => {
    setLoadingFileId(file.id);
    setDownloadProgress({ fileId: file.id, percent: 0, speed: 'શોધી રહ્યું છે...' });
    try {
      let fileUrl = file.fileDataUrl;
      const needsFreshFetch = !fileUrl || fileUrl.length < 50 || fileUrl.startsWith('blob:');
      if (needsFreshFetch) {
        fileUrl = await getFileFromCloudStorage(file.id, (prog) => {
          setDownloadProgress({
            fileId: file.id,
            percent: prog.percent,
            speed: prog.speed,
            loadedBytes: prog.loadedBytes,
            totalBytes: prog.totalBytes
          });
        });
      }

      if (!fileUrl) {
        // Fallback: check local IndexedDB
        fileUrl = await getFileFromStorage(file.id);
      }

      if (!fileUrl) {
        if (activeJob) {
          setMissingFileData({ file, job: activeJob });
        } else {
          showToast(`⚠️ આ ફાઇલ (${file.fileName}) નો ડેટા ક્લાઉડમાં મળ્યો નથી.`);
        }
        return;
      }

      setDownloadProgress({ fileId: file.id, percent: 100, speed: 'PC માં સાચવી રહ્યા છીએ...' });
      const success = await downloadFileSafely(fileUrl, file.fileName || `Print_Document_${Date.now()}`);
      if (success) {
        showToast(`✅ ફાઇલ "${file.fileName}" તમારા PC માં ડાઉનલોડ થઈ ગઈ!`);
      } else {
        showToast('⚠️ ફાઇલ ડાઉનલોડ કરવામાં સમસ્યા આવી.');
      }
    } catch (e) {
      console.error('Download error:', e);
      showToast('⚠️ ફાઇલ ડાઉનલોડ કરવામાં ભૂલ આવી.');
    } finally {
      setLoadingFileId(null);
      setDownloadProgress(null);
    }
  };

  // Open file in-screen document viewer (view right there without automatic download)
  const handleViewFileOnScreen = async (file: PrintJobFile) => {
    setLoadingFileId(file.id);
    setDownloadProgress({ fileId: file.id, percent: 0, speed: 'લોડ થઈ રહ્યું છે...' });
    try {
      let fileUrl = file.fileDataUrl;
      const needsFreshFetch = !fileUrl || fileUrl.length < 50 || fileUrl.startsWith('blob:');
      if (needsFreshFetch) {
        fileUrl = await getFileFromCloudStorage(file.id, (prog) => {
          setDownloadProgress({
            fileId: file.id,
            percent: prog.percent,
            speed: prog.speed,
            loadedBytes: prog.loadedBytes,
            totalBytes: prog.totalBytes
          });
        });
      }

      if (!fileUrl) {
        // Fallback: check local IndexedDB
        fileUrl = await getFileFromStorage(file.id);
      }

      if (!fileUrl) {
        if (activeJob) {
          setMissingFileData({ file, job: activeJob });
        } else {
          showToast(`⚠️ આ ફાઇલ (${file.fileName}) નો ડેટા ક્લાઉડમાં મળ્યો નથી.`);
        }
        return;
      }

      setViewingFile({ file, blobUrl: fileUrl, dataUrl: fileUrl });
    } catch (e) {
      console.error('Error opening file on screen:', e);
      showToast('⚠️ ફાઇલ સ્ક્રીન પર ખોલવામાં ભૂલ આવી.');
    } finally {
      setLoadingFileId(null);
      setDownloadProgress(null);
    }
  };

  // Admin attach or replace file directly from PC (e.g. file received on WhatsApp Web)
  const handleAttachFileToJob = async (jobId: string, fileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setLoadingFileId(fileId);
    setDownloadProgress({ fileId, percent: 0, speed: 'અપલોડ શરૂ...' });

    try {
      const success = await uploadFileObjectInChunks(
        selected,
        fileId,
        selected.name,
        selected.type || 'application/octet-stream',
        (prog) => {
          setDownloadProgress({
            fileId,
            percent: prog.percent,
            speed: prog.speed,
            loadedBytes: prog.loadedBytes,
            totalBytes: prog.totalBytes
          });
        }
      );

      if (success) {
        const job = effectiveJobs.find(j => j.id === jobId);
        if (job) {
          const updatedFiles = job.files.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  fileName: selected.name,
                  fileSize: selected.size,
                  fileType: selected.type || 'application/octet-stream',
                  uploadedToCloud: true,
                  fileDataUrl: ''
                }
              : f
          );
          onUpdateJob(jobId, { files: updatedFiles });
        }
        showToast(`✅ ફાઇલ "${selected.name}" ક્લાઉડમાં સેવ થઈ ગઈ! હવે તમે તેને ડાઉનલોડ કે જોઈ શકો છો.`);
      } else {
        showToast('⚠️ ફાઇલ અપલોડ કરવામાં નિષ્ફળતા મળી.');
      }
    } catch (err) {
      console.error('Attach file error:', err);
      showToast('⚠️ ફાઇલ અપલોડ કરવામાં ભૂલ આવી.');
    } finally {
      setLoadingFileId(null);
      setDownloadProgress(null);
      e.target.value = '';
    }
  };

  // Download All Files for Active Job
  const handleDownloadAllFiles = async (job: PrintJobRecord) => {
    for (let i = 0; i < job.files.length; i++) {
      await handleDownloadFile(job.files[i]);
      // brief delay between browser downloads
      await new Promise(res => setTimeout(res, 350));
    }
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
                  {effectiveJobs.length} રિક્વેસ્ટ
                </span>
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                ગ્રાહકો દ્વારા અપલોડ કરાયેલી ફાઇલો ૧-ક્લિકમાં PC માં ડાઉનલોડ કરો અને જાતે ભાવ એડિટ કરી બિલ મોકલો.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {effectiveJobs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  effectiveJobs.forEach(j => handleDeleteJobWithCloud(j));
                }}
                className="bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-red-500/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>બધા ડીલીટ કરો</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                        <div className="flex items-center gap-1.5">
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJobWithCloud(job);
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="આ પ્રિન્ટ જોબ ડિલીટ કરો"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-black text-neutral-900 truncate">
                        {job.customerName}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-bold">
                        📞 +91 {job.mobile}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium mt-1">
                        <span>
                          {job.files.length} ફાઇલો • {formatFileSize(job.totalJobSize || job.files.reduce((a, b) => a + (b.fileSize || 0), 0))}
                        </span>
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
                      handleDeleteJobWithCloud(activeJob);
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    title="આ જોબ ડિલીટ કરો"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ડિલીટ</span>
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
                                <span className="font-black text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                                  {formatFileSize(file.fileSize)}
                                </span>
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
                                {file.uploadedToCloud ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    ક્લાઉડ તૈયાર
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    ક્લાઉડ ડેટા બાકી
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action: View on Screen, Download to PC & Price Input */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleViewFileOnScreen(file)}
                              disabled={loadingFileId === file.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50 transition"
                              title="સ્ક્રીન પર જ આ ફાઇલ જુઓ (View On Screen)"
                            >
                              {loadingFileId === file.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              <span>જુઓ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              disabled={loadingFileId === file.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50 transition"
                              title="આ ઓરિજનલ ફાઇલ PC માં ડાઉનલોડ કરો"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>ડાઉનલોડ</span>
                            </button>

                            {/* Attach or replace file directly from PC */}
                            <label
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs transition"
                              title="આ ફાઇલ PC માંથી અપલોડ / રિપ્લેસ કરો"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>ફાઇલ જોડો</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleAttachFileToJob(activeJob.id, file.id, e)}
                              />
                            </label>

                            {/* Quick WhatsApp request for this file */}
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `નમસ્તે ${activeJob.customerName}જી, પ્રીશા સ્ટેશનરીમાંથી.\nતમારા ઓર્ડર #${activeJob.jobNo} માટેની પ્રિન્ટ ફાઇલ (${file.fileName}) અહીં WhatsApp પર Document તરીકે મોકલી આપવા વિનંતી.`;
                                window.open(`https://wa.me/91${activeJob.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition"
                              title="ગ્રાહક પાસેથી WhatsApp પર આ ફાઇલ મંગાવો"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
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

                        {/* Download / View Speed and Progress Bar */}
                        {downloadProgress && downloadProgress.fileId === file.id && (
                          <div className="bg-blue-50/90 border border-blue-200 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-black text-blue-950">
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ડાઉનલોડ / લોડિંગ થઈ રહ્યું છે: {downloadProgress.percent}%
                              </span>
                              <span className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px] flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                સ્પીડ: {downloadProgress.speed}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-200 rounded-full"
                                style={{ width: `${Math.max(5, downloadProgress.percent)}%` }}
                              />
                            </div>
                          </div>
                        )}

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

      {/* IN-APP TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-90 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-black border border-neutral-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL: MISSING CLOUD FILE ACTION DIALOG (1-Click WhatsApp Request or Attach from PC) */}
      {missingFileData && (
        <div className="fixed inset-0 z-80 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-neutral-900 text-center mb-1">
              ફાઇલ ક્લાઉડમાં ઉપલબ્ધ નથી
            </h3>
            <p className="text-xs text-neutral-600 text-center mb-4 leading-relaxed">
              ઓર્ડર <span className="font-bold text-neutral-800">#{missingFileData.job.jobNo}</span> ({missingFileData.job.customerName}) ની ફાઇલ <span className="font-bold text-neutral-800">"{missingFileData.file.fileName}"</span> ગ્રાહકના જૂના સત્રમાંથી આવેલી હોવાથી તેનો ડેટા ક્લાઉડમાં સેવ થઈ શક્યો નથી.
            </p>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 mb-4 text-xs text-amber-900">
              <p className="font-black mb-1">👉 નીચેનામાંથી કોઈપણ ૧ વિકલ્પ પસંદ કરો:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>ગ્રાહકને ૧ ક્લિકમાં WhatsApp મેસેજ મોકલી ફાઇલ મંગાવો.</li>
                <li>અથવા WhatsApp Web માંથી ફાઇલ ડાઉનલોડ કરી અહીં સીધી જોડી દો.</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const msg = `નમસ્તે ${missingFileData.job.customerName}જી, પ્રીશા સ્ટેશનરીમાંથી.\nતમારા પ્રિન્ટ ઓર્ડર #${missingFileData.job.jobNo} માટેની ફાઇલ (${missingFileData.file.fileName}) અહીં WhatsApp પર Document તરીકે મોકલી આપવા વિનંતી જેથી અમે પ્રિન્ટ કરી શકીએ.`;
                  window.open(`https://wa.me/91${missingFileData.job.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
                  showToast('📲 WhatsApp ખુલી ગયું છે!');
                  setMissingFileData(null);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>૧. ગ્રાહક પાસેથી WhatsApp પર ફાઇલ મંગાવો</span>
              </button>

              <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition">
                <UploadCloud className="w-4 h-4" />
                <span>૨. PC માંથી આ ફાઇલ જોડો (Attach File)</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const f = missingFileData.file;
                    const j = missingFileData.job;
                    setMissingFileData(null);
                    await handleAttachFileToJob(j.id, f.id, e);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setMissingFileData(null)}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-black py-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                બંધ કરો (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingFile && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-300">
            {/* Viewer Top Bar */}
            <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                  {getFileIcon(viewingFile.file.fileType, viewingFile.file.fileName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">{viewingFile.file.fileName}</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {viewingFile.file.paperSize} • {viewingFile.file.colorMode === 'black_white' ? '⚪⚫ B&W' : '🌈 કલર'} • {viewingFile.file.copies} કોપી
                    {viewingFile.file.fileSize ? ` • ${formatFileSize(viewingFile.file.fileSize)}` : ''}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Print, Download, Close */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open(viewingFile.blobUrl, '_blank');
                    if (printWin) {
                      setTimeout(() => printWin.print(), 500);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  title="આ ફાઇલ પ્રિન્ટ કરો"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">પ્રિન્ટ કરો</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await downloadFileSafely(viewingFile.blobUrl || viewingFile.dataUrl, viewingFile.file.fileName);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  title="ઓરિજનલ ફાઇલ PC માં ડાઉનલોડ કરો"
                >
                  <FileDown className="w-4 h-4" />
                  <span>ડાઉનલોડ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingFile(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white p-1.5 rounded-xl cursor-pointer transition"
                  title="બંધ કરો"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content Body */}
            <div className="flex-1 bg-neutral-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              {viewingFile.file.fileType.includes('pdf') || viewingFile.file.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${viewingFile.blobUrl}#toolbar=1`}
                  className="w-full h-full rounded-2xl border border-neutral-300 bg-white shadow-inner"
                  title={viewingFile.file.fileName}
                />
              ) : viewingFile.file.fileType?.includes('image') ||
                ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'ico', 'gif', 'svg'].some(ext => viewingFile.file.fileName.toLowerCase().endsWith(ext)) ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-2xl p-2 overflow-auto">
                  <img
                    src={viewingFile.blobUrl}
                    alt={viewingFile.file.fileName}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-neutral-300 max-w-md shadow-sm">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-3" />
                  <h4 className="font-black text-neutral-900 mb-1">{viewingFile.file.fileName}</h4>
                  <p className="text-xs text-neutral-600 mb-4">
                    આ ફાઇલનું પ્રિવ્યૂ સીધું સ્ક્રીન પર જોઈ શકાય તેમ નથી. તમે નીચે આપેલ બટનથી તેને ડાઉનલોડ કરી શકો છો.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await downloadFileSafely(viewingFile.blobUrl || viewingFile.dataUrl, viewingFile.file.fileName);
                    }}
                    className="bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>ડાઉનલોડ કરો</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
