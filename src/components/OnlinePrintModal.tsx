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
  Info
} from 'lucide-react';
import { PrintJobFile, PrintJobRecord, StoreSettings } from '../types';

interface OnlinePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  onSubmitPrintJob: (job: PrintJobRecord) => void;
}

export const OnlinePrintModal: React.FC<OnlinePrintModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  onSubmitPrintJob
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

  // Helper to read file as data url for local preview and admin downloading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newFileItem: PrintJobFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          fileDataUrl: result,
          copies: 1,
          colorMode: 'black_white',
          sideOption: 'single_side',
          paperSize: 'A4',
          lamination: false,
          notes: ''
        };

        setFilesList(prev => [...prev, newFileItem]);
      };
      reader.readAsDataURL(file);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (fileType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-7 h-7 text-red-600" />;
    }
    if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext || '')) {
      return <ImageIcon className="w-7 h-7 text-blue-600" />;
    }
    if (fileType.includes('sheet') || fileType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
    }
    return <FileCheck className="w-7 h-7 text-orange-600" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filesList.length === 0) {
      alert('કૃપા કરીને ઓછામાં ઓછી એક ફાઇલ અપલોડ કરો.');
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

    const newJob: PrintJobRecord = {
      id: `print-job-${Date.now()}`,
      jobNo,
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      deliveryType,
      files: filesList,
      createdAt: dateFormatted,
      status: 'received',
      subtotal: 0,
      extraCharges: 0,
      discount: 0,
      totalAmount: 0, // Admin will edit and set actual price upon reviewing pages
      paymentStatus: 'Pending',
      paymentMode: 'UPI'
    };

    onSubmitPrintJob(newJob);
    setSubmittedJob(newJob);
    setIsSubmitting(false);
    setTimeout(() => {
      setSubmittedJob(null);
      onClose();
    }, 3000);
  };

  const handleSendWhatsAppOrder = (job: PrintJobRecord) => {
    let fileDetails = '';
    job.files.forEach((f, idx) => {
      const modeText = f.colorMode === 'black_white' ? 'બ્લેક & વ્હાઇટ' : f.colorMode === 'color' ? 'કલર પ્રિન્ટ' : 'PVC કાર્ડ';
      const sideText = f.sideOption === 'single_side' ? 'સિંગલ સાઇડ' : 'ડબલ સાઇડ';
      const lamText = f.lamination ? ' + લેમિનેશન' : '';
      fileDetails += `\n📄 *ફાઇલ ${idx + 1}:* ${f.fileName}\n   • ${modeText} | ${f.paperSize} | ${sideText}${lamText}\n   • કોપી: ${f.copies}${f.notes ? `\n   • સૂચના: ${f.notes}` : ''}\n`;
    });

    const msg =
      `🖨️ *ઓનલાઇન પ્રિન્ટ રિક્વેસ્ટ - ${storeSettings.storeNameGu}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *જોબ નં:* ${job.jobNo}\n` +
      `📅 *તારીખ:* ${job.createdAt}\n` +
      `👤 *ગ્રાહક:* ${job.customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${job.mobile}\n` +
      `🚚 *ડિલિવરી:* ${job.deliveryType === 'pickup' ? 'દુકાનેથી રૂબરૂ પિકઅપ' : `હોમ ડિલિવરી (${job.address})`}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📑 *પ્રિન્ટ કરવા માટેની ફાઇલો (${job.files.length}):*` +
      fileDetails +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 ફાઇલો વેબસાઇટ પર સબમિટ થઈ ગઈ છે. કૃપા કરીને પ્રિન્ટ કરી બિલ મોકલો.\n\nઆભાર!`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-neutral-300 my-auto flex flex-col max-h-[95vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0B1E48] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🖨️ ઓનલાઇન પ્રિન્ટિંગ & ડોક્યુમેન્ટ સર્વિસ</span>
                <span className="bg-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Photo, PDF, Excel, Word કે અન્ય કોઈ પણ ફાઇલ અપલોડ કરો — અમે પ્રિન્ટ કરી તૈયાર રાખીશું!
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

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {submittedJob ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center py-6 px-4 space-y-5">
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
                  તમારી કુલ <span className="font-black text-neutral-900">{submittedJob.files.length} ફાઇલો</span> દુકાનદારને મળી ગઈ છે. દુકાનદાર ફાઇલો પ્રિન્ટ કરી તમને બિલ સાથે જાણ કરશે.
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
                    <span>૧. પ્રિન્ટ કરવા માટેની ફાઇલો અપલોડ કરો (PDF, Photo, Word, Excel વગેરે):</span>
                  </label>
                  <span className="text-[11px] font-bold text-neutral-500">
                    {filesList.length} ફાઇલ પસંદ કરેલ
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
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    સપોર્ટ: PDF, JPG / PNG ફોટો, Word (.docx), Excel (.xlsx), કાર્ડ વગેરે (એકસાથે ઘણી બધી ફાઇલો ઉમેરી શકાય છે)
                  </p>
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
                        {/* Top: File Name, Size & Delete */}
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType, file.fileName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                                {index + 1}. {file.fileName}
                              </p>
                              <p className="text-[11px] text-neutral-500 font-bold">
                                {formatFileSize(file.fileSize)}
                              </p>
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

                        {/* Middle: Controls Grid (Color, Side, Paper Size, Lamination, Copies) */}
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

              {/* CUSTOMER CONTACT DETAILS */}
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
                      placeholder="દા.ત. રમેશભાઈ પટેલ"
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
                disabled={isSubmitting || filesList.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <Printer className="w-5 h-5" />
                <span>પ્રિન્ટ રિક્વેસ્ટ સબમિટ કરો ({filesList.length} ફાઇલો)</span>
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
