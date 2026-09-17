import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  Trash2,
  Plus,
  Printer,
  X,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  MapPin,
  Share2,
  Layers,
  FileDown,
  Info,
  Loader2,
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { PrintJobFile, PrintJobRecord, StoreSettings } from '../types';
import {
  saveFileToStorage,
  uploadFileObjectInChunks,
  formatFileSize,
  MAX_FILE_SIZE
} from '../lib/fileStorage';

interface OnlinePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  onSubmitJob: (job: PrintJobRecord) => void;
}

export const OnlinePrintModal: React.FC<OnlinePrintModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  onSubmitJob
}) => {
  const [filesList, setFilesList] = useState<PrintJobFile[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'home_delivery'>('pickup');
  const [submittedJob, setSubmittedJob] = useState<PrintJobRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Stream-upload files up to 5 GB directly in chunks with real-time speed & progress
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray: File[] = Array.from(selectedFiles);

    // Validate 5 GB size limit
    for (const file of filesArray) {
      if (file.size > MAX_FILE_SIZE) {
        alert(
          `⚠️ ફાઇલ "${file.name}" 5 GB કરતાં મોટી છે (${formatFileSize(file.size)}).\nમહત્તમ 5 GB સુધીની 4K પ્રિન્ટ ફાઇલો અને PDF અપલોડ કરી શકાય છે.`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    filesArray.forEach((file: File) => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newFileItem: PrintJobFile = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileBlob: file,
        uploadStatus: 'uploading',
        uploadProgress: 0,
        uploadSpeed: 'શરૂ થઈ રહ્યું છે...',
        copies: 1,
        colorMode: 'black_white',
        sideOption: 'single_side',
        paperSize: 'A4',
        lamination: false,
        notes: ''
      };

      setFilesList(prev => [...prev, newFileItem]);

      // Stream upload chunks with real-time progress & speed
      uploadFileObjectInChunks(
        file,
        fileId,
        file.name,
        file.type || 'application/octet-stream',
        (prog) => {
          setFilesList(prev =>
            prev.map(item =>
              item.id === fileId
                ? {
                    ...item,
                    uploadProgress: prog.percent,
                    uploadSpeed: prog.speed,
                    uploadStatus: prog.percent >= 100 ? 'completed' : 'uploading'
                  }
                : item
            )
          );
        }
      ).then(success => {
        setFilesList(prev =>
          prev.map(item =>
            item.id === fileId
              ? {
                  ...item,
                  uploadedToCloud: success,
                  uploadStatus: success ? 'completed' : 'error',
                  uploadProgress: success ? 100 : item.uploadProgress,
                  uploadSpeed: success ? 'પૂર્ણ' : 'ભૂલ'
                }
              : item
          )
        );
      });
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateFileOption = (id: string, updates: Partial<PrintJobFile>) => {
    setFilesList(prev =>
      prev.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveFile = (id: string) => {
    setFilesList(prev => prev.filter(f => f.id !== id));
  };

  const handleRetryUpload = (fileItem: PrintJobFile) => {
    if (!fileItem.fileBlob) return;
    setFilesList(prev =>
      prev.map(f =>
        f.id === fileItem.id
          ? {
              ...f,
              uploadStatus: 'uploading',
              uploadProgress: 0,
              uploadSpeed: 'ફરી શરૂ...'
            }
          : f
      )
    );

    uploadFileObjectInChunks(
      fileItem.fileBlob,
      fileItem.id,
      fileItem.fileName,
      fileItem.fileType,
      (prog) => {
        setFilesList(prev =>
          prev.map(item =>
            item.id === fileItem.id
              ? {
                  ...item,
                  uploadProgress: prog.percent,
                  uploadSpeed: prog.speed,
                  uploadStatus: prog.percent >= 100 ? 'completed' : 'uploading'
                }
              : item
          )
        );
      }
    ).then(success => {
      setFilesList(prev =>
        prev.map(item =>
          item.id === fileItem.id
            ? {
                ...item,
                uploadedToCloud: success,
                uploadStatus: success ? 'completed' : 'error',
                uploadProgress: success ? 100 : item.uploadProgress,
                uploadSpeed: success ? 'પૂર્ણ' : 'ભૂલ'
              }
            : item
        )
      );
    });
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-7 h-7 text-red-600" />;
    }
    if (fileType?.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'ico', 'gif', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-7 h-7 text-blue-600" />;
    }
    if (fileType.includes('sheet') || fileType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
    }
    return <FileCheck className="w-7 h-7 text-orange-600" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filesList.length === 0) {
      alert('કૃપા કરીને ઓછામાં ઓછી એક ફાઇલ અપલોડ કરો.');
      return;
    }

    const stillUploading = filesList.some(f => f.uploadStatus === 'uploading');
    if (stillUploading) {
      alert('⚠️ ફાઇલ હજી ક્લાઉડમાં અપલોડ થઈ રહી છે. કૃપા કરીને ૧૦૦% અપલોડ પૂર્ણ થવા દો.');
      return;
    }

    const failedFiles = filesList.filter(f => f.uploadStatus === 'error' || !f.uploadedToCloud);
    if (failedFiles.length > 0) {
      alert(`⚠️ "${failedFiles[0].fileName}" ક્લાઉડમાં અપલોડ થઈ નથી. કૃપા કરીને 'ફરી પ્રયાસ કરો' બટન દબાવી અપલોડ પૂર્ણ કરો.`);
      return;
    }

    if (!customerName.trim()) {
      alert('કૃપા કરીને તમારું પૂરું નામ લખો.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      alert('કૃપા કરીને ૧૦ અંકનો સાચો મોબાઇલ નંબર લખો.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const jobNo = `PRN-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalJobSize = filesList.reduce((sum, f) => sum + (f.fileSize || 0), 0);

    // Strip in-memory blob references before storing
    const cleanFiles = filesList.map(f => {
      const { fileBlob, ...rest } = f;
      return rest;
    });

    const newJob: PrintJobRecord = {
      id: `print-job-${Date.now()}`,
      jobNo,
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      deliveryType,
      files: cleanFiles,
      totalJobSize,
      createdAt: dateFormatted,
      status: 'received',
      subtotal: 0,
      extraCharges: 0,
      discount: 0,
      totalAmount: 0,
      paymentStatus: 'Pending',
      paymentMode: 'UPI'
    };

    onSubmitJob(newJob);
    setSubmittedJob(newJob);
    setIsSubmitting(false);
  };

  const handleSendWhatsAppOrder = (job: PrintJobRecord) => {
    let fileDetails = '';
    job.files.forEach((f, idx) => {
      const modeText = f.colorMode === 'black_white' ? 'બ્લેક & વ્હાઇટ' : f.colorMode === 'color' ? 'કલર પ્રિન્ટ' : 'PVC કાર્ડ';
      const sideText = f.sideOption === 'single_side' ? 'સિંગલ સાઇડ' : 'ડબલ સાઇડ';
      const lamText = f.lamination ? ' + લેમિનેશન' : '';
      fileDetails += `\n📄 *ફાઇલ ${idx + 1}:* ${f.fileName} (${formatFileSize(f.fileSize)})\n   • ${modeText} | ${f.paperSize} | ${sideText}${lamText}\n   • કોપી: ${f.copies}${f.notes ? `\n   • સૂચના: ${f.notes}` : ''}\n`;
    });

    const totalSizeText = job.totalJobSize ? ` (${formatFileSize(job.totalJobSize)})` : '';

    const msg =
      `🖨️ *ઓનલાઇન પ્રિન્ટ રિક્વેસ્ટ - ${storeSettings.storeNameGu}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *જોબ નં:* ${job.jobNo}\n` +
      `📅 *તારીખ:* ${job.createdAt}\n` +
      `👤 *ગ્રાહક:* ${job.customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${job.mobile}\n` +
      `🚚 *ડિલિવરી:* ${job.deliveryType === 'pickup' ? 'દુકાનેથી રૂબરૂ પિકઅપ' : `હોમ ડિલિવરી (${job.address})`}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📑 *પ્રિન્ટ કરવા માટેની ફાઇલો (${job.files.length})${totalSizeText}:*` +
      fileDetails +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 ફાઇલો વેબસાઇટ પર સુરક્ષિત સબમિટ થઈ ગઈ છે. કૃપા કરીને પ્રિન્ટ કરી બિલ મોકલો.\n\nઆભાર!`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalFilesSize = filesList.reduce((sum, f) => sum + (f.fileSize || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-neutral-300 my-auto flex flex-col max-h-[95vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0B1E48] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30 shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>ઓનલાઇન ઝેરોક્ષ / પ્રિન્ટ ઓર્ડર</span>
                <span className="text-[10px] bg-orange-500 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Live
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                ઘેરબેઠાં PDF કે 4K ફોટો અપલોડ કરો (5 GB સુધી) • અમે તાત્કાલિક પ્રિન્ટ કરી આપીશું
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {submittedJob ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center py-6 sm:py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-neutral-900">
                  🎉 તમારી પ્રિન્ટ રિક્વેસ્ટ સફળતાપૂર્વક નોંધાઈ ગઈ છે!
                </h3>
                <p className="text-sm font-bold text-orange-700">
                  જોબ નંબર: <span className="font-mono text-base font-black bg-orange-100 px-2 py-0.5 rounded">{submittedJob.jobNo}</span>
                </p>
                <p className="text-xs text-neutral-600 max-w-md mx-auto pt-1">
                  તમારી કુલ <span className="font-black text-neutral-900">{submittedJob.files.length} ફાઇલો ({formatFileSize(submittedJob.totalJobSize || 0)})</span> દુકાનદારને સુરક્ષિત મળી ગઈ છે.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppOrder(submittedJob)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp પર ઓર્ડર કન્ફર્મ કરો</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedJob(null);
                    setFilesList([]);
                    onClose();
                  }}
                  className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-6 py-3 rounded-2xl text-sm font-black cursor-pointer"
                >
                  બંધ કરો
                </button>
              </div>
            </div>
          ) : (
            /* UPLOAD & FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* FILE UPLOAD DROPZONE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-neutral-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-orange-600" />
                    <span>૧. પ્રિન્ટ કરવા માટેની ફાઇલો અપલોડ કરો (PDF, Photo, Docs):</span>
                  </label>
                  <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {filesList.length} ફાઇલ {totalFilesSize > 0 && `(${formatFileSize(totalFilesSize)})`}
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50 rounded-2xl p-6 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-black text-neutral-800">
                    ફાઇલ પસંદ કરવા માટે અહીં ક્લિક કરો અથવા ખેંચીને મૂકો (Drag & Drop)
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-orange-800 font-black bg-orange-100/80 px-2 py-0.5 rounded-full">
                      🚀 ૫ GB (5 GB) સુધીની 4K પ્રિન્ટ ફાઇલ સપોર્ટેડ છે (Zero Quality Loss)
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      PDF, JPG/PNG ફોટો, Word, Excel વગેરે
                    </span>
                  </div>
                </div>
              </div>

              {/* LIST OF UPLOADED FILES WITH CUSTOM PRINT CONTROLS */}
              {filesList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-neutral-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-700" />
                      <span>૨. દરેક ફાઇલ માટે પ્રિન્ટ ઓપ્શન પસંદ કરો:</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>વધુ ફાઇલ ઉમેરો</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filesList.map((file, index) => (
                      <div
                        key={file.id}
                        className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200 shadow-2xs space-y-3"
                      >
                        {/* Top: File Name, Size Badge & Delete */}
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType, file.fileName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                                {index + 1}. {file.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-black text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded">
                                  {formatFileSize(file.fileSize)}
                                </span>
                                {file.uploadStatus === 'completed' && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    અપલોડ થઈ ગયું
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="આ ફાઇલ હટાવો"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Upload Progress & Speed Bar (Live Indicator) */}
                        {file.uploadStatus === 'uploading' && (
                          <div className="bg-orange-50/80 p-2.5 rounded-xl border border-orange-200 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-black text-orange-950">
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                                અપલોડ થઈ રહ્યું છે: {file.uploadProgress || 0}%
                              </span>
                              <span className="font-mono text-orange-700 bg-orange-100 px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                સ્પીડ: {file.uploadSpeed || '0 KB/s'}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-200 rounded-full"
                                style={{ width: `${Math.max(5, file.uploadProgress || 0)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Failed / Error Retry Banner */}
                        {file.uploadStatus === 'error' && (
                          <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              ક્લાઉડ અપલોડ નિષ્ફળ થયું.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRetryUpload(file)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>ફરી પ્રયાસ કરો</span>
                            </button>
                          </div>
                        )}

                        {/* Middle: Controls Grid (Color, Side, Paper Size, Copies) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          {/* Color Mode */}
                          <div>
                            <label className="block text-[10px] font-black text-neutral-600 mb-1">
                              કલર મોડ:
                            </label>
                            <select
                              value={file.colorMode}
                              onChange={e =>
                                handleUpdateFileOption(file.id, {
                                  colorMode: e.target.value as any
                                })
                              }
                              className="w-full bg-white border border-neutral-300 rounded-xl px-2 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                            >
                              <option value="black_white">⚪⚫ બ્લેક & વ્હાઇટ</option>
                              <option value="color">🌈 કલર પ્રિન્ટ</option>
                              <option value="pvc_card">🪪 PVC સ્માર્ટ કાર્ડ</option>
                            </select>
                          </div>

                          {/* Side Option */}
                          <div>
                            <label className="block text-[10px] font-black text-neutral-600 mb-1">
                              સાઇડ (બાજુ):
                            </label>
                            <select
                              value={file.sideOption}
                              onChange={e =>
                                handleUpdateFileOption(file.id, {
                                  sideOption: e.target.value as any
                                })
                              }
                              className="w-full bg-white border border-neutral-300 rounded-xl px-2 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                            >
                              <option value="single_side">📄 સિંગલ સાઇડ (૧ બાજુ)</option>
                              <option value="double_side">📑 ડબલ સાઇડ (બંને બાજુ)</option>
                            </select>
                          </div>

                          {/* Paper Size */}
                          <div>
                            <label className="block text-[10px] font-black text-neutral-600 mb-1">
                              પેપર સાઇઝ:
                            </label>
                            <select
                              value={file.paperSize}
                              onChange={e =>
                                handleUpdateFileOption(file.id, {
                                  paperSize: e.target.value as any
                                })
                              }
                              className="w-full bg-white border border-neutral-300 rounded-xl px-2 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                            >
                              <option value="A4">A4 પેપર</option>
                              <option value="A5">A5 પેપર (અડધું)</option>
                              <option value="Legal">લીગલ (Legal દસ્તાવેજ)</option>
                              <option value="4x6 Photo">4x6 ફોટો પેપર</option>
                              <option value="PVC Card">PVC સ્માર્ટ કાર્ડ</option>
                            </select>
                          </div>

                          {/* Copies Count */}
                          <div>
                            <label className="block text-[10px] font-black text-neutral-600 mb-1">
                              જથ્થો (કોપી):
                            </label>
                            <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFileOption(file.id, {
                                    copies: Math.max(1, file.copies - 1)
                                  })
                                }
                                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 font-black text-neutral-700 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-black text-xs text-neutral-900">
                                {file.copies}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFileOption(file.id, {
                                    copies: file.copies + 1
                                  })
                                }
                                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 font-black text-neutral-700 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Lamination Tick + Special Notes */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-black text-neutral-800 select-none hover:bg-neutral-50">
                            <input
                              type="checkbox"
                              checked={file.lamination}
                              onChange={e =>
                                handleUpdateFileOption(file.id, {
                                  lamination: e.target.checked
                                })
                              }
                              className="w-4 h-4 text-orange-600 rounded cursor-pointer accent-orange-600"
                            />
                            <span>✨ લેમિનેશન કરવું છે (Lamination)</span>
                          </label>

                          <div className="flex-1 w-full sm:w-auto">
                            <input
                              type="text"
                              placeholder="ખાસ સૂચના (દા.ત. પેજ નં ૧ થી ૫, સ્પાઈરલ બાઈન્ડિંગ વગેરે)"
                              value={file.notes || ''}
                              onChange={e =>
                                handleUpdateFileOption(file.id, {
                                  notes: e.target.value
                                })
                              }
                              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOMER CONTACT DETAILS & SUBMIT */}
              {filesList.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-3">
                    <h3 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-700" />
                      <span>૩. તમારી વિગત (Customer Details):</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black text-neutral-700 mb-1">
                          તમારું પૂરું નામ *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="દા.ત. ભરતભાઈ પટેલ"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-blue-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-neutral-700 mb-1">
                          મોબાઇલ નંબર (WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="૧૦ અંકનો મોબાઇલ નંબર"
                          value={mobile}
                          onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-blue-700"
                        />
                      </div>
                    </div>

                    {/* Delivery Option */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-black text-neutral-700">
                        ડિલિવરી વિકલ્પ:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            deliveryType === 'pickup'
                              ? 'bg-blue-900 text-white border-blue-900'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span>🏪 દુકાનેથી રૂબરૂ પિકઅપ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryType('home_delivery')}
                          className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            deliveryType === 'home_delivery'
                              ? 'bg-blue-900 text-white border-blue-900'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span>🛵 હોમ ડિલિવરી</span>
                        </button>
                      </div>

                      {deliveryType === 'home_delivery' && (
                        <div className="pt-1">
                          <input
                            type="text"
                            placeholder="તમારું પૂરું સરનામું લખો"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-blue-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NOTICE BOX */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-[11.5px] leading-relaxed">
                      <p className="font-bold">
                        💡 <span className="font-black">બિલ અને પેમેન્ટ વિગત:</span> ફાઇલો સબમિટ થયા પછી દુકાનદાર પાનાની ચોક્કસ ગણતરી કરી બિલ બનાવી તમને WhatsApp પર મોકલશે.
                      </p>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting || filesList.length === 0 || filesList.some(f => f.uploadStatus === 'uploading')}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                        <span>પ્રિન્ટ રિક્વેસ્ટ નોંધાઈ રહી છે...</span>
                      </>
                    ) : filesList.some(f => f.uploadStatus === 'uploading') ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                        <span>ફાઇલ ક્લાઉડમાં અપલોડ થઈ રહી છે... રાહ જુઓ</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>પ્રિન્ટ રિક્વેસ્ટ સબમિટ કરો ({filesList.length} ફાઇલો • {formatFileSize(totalFilesSize)})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
