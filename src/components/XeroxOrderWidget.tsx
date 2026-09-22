import React, { useState, useRef, useMemo } from 'react';
import {
  Printer,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Trash2,
  FileCheck,
  CreditCard,
  Ticket,
  Sparkles,
  X,
  Settings,
  ArrowRight,
  Plus
} from 'lucide-react';
import { ProductItem, StoreSettings } from '../types';
import { saveFileToCloudStorage } from '../lib/fileStorage';

interface XeroxOrderWidgetProps {
  storeSettings: StoreSettings;
  onAddToCart: (product: ProductItem) => void;
  onDirectOrder: (product: ProductItem) => void;
  isAdminUnlocked?: boolean;
  onOpenSettings?: () => void;
  showToast: (msg: string) => void;
}

export const XeroxOrderWidget: React.FC<XeroxOrderWidgetProps> = ({
  storeSettings,
  onAddToCart,
  onDirectOrder,
  isAdminUnlocked,
  onOpenSettings,
  showToast
}) => {
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<'print' | 'pvc_card' | 'call_letter'>('print');
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  
  // Print options
  const [pageCount, setPageCount] = useState<number>(1);
  const [copies, setCopies] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [sideOption, setSideOption] = useState<'single' | 'double'>('single');
  const [needLamination, setNeedLamination] = useState<boolean>(false);
  
  // PVC Card options
  const [pvcCardType, setPvcCardType] = useState<string>('આધાર કાર્ડ (Aadhaar Card)');
  const [pvcCardCount, setPvcCardCount] = useState<number>(1);
  const [pvcSideOption, setPvcSideOption] = useState<'double' | 'single'>('double'); // બંને બાજુ (Front & Back) By Default!
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontBase64, setFrontBase64] = useState<string>('');
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backBase64, setBackBase64] = useState<string>('');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  
  // Call Letter options
  const [callLetterPages, setCallLetterPages] = useState<number>(1);
  const [callLetterCopies, setCallLetterCopies] = useState<number>(1);

  const [instructions, setInstructions] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pricing configuration from store settings
  const bwSingleRate = storeSettings.xeroxBwSingleRate ?? 2;
  const bwDoubleRate = storeSettings.xeroxBwDoubleRate ?? 3;
  const colorSingleRate = storeSettings.xeroxColorSingleRate ?? 10;
  const colorDoubleRate = storeSettings.xeroxColorDoubleRate ?? 15;
  const laminationRate = storeSettings.xeroxLaminationRate ?? 20;
  const pvcCardRate = storeSettings.pvcCardRate ?? 100;
  const pvcSingleRate = Math.round(pvcCardRate * 0.7);
  const callLetterRate = storeSettings.callLetterRate ?? 0;
  const callLetterOfferText = storeSettings.callLetterOfferText || 'નવરાત્રી સ્પેશિયલ: કોલ લેટર પ્રિન્ટ ફ્રી!';

  // Calculate rate based on service type
  const totalAmount = useMemo(() => {
    if (serviceType === 'pvc_card') {
      const perCardPrice = pvcSideOption === 'double' ? pvcCardRate : pvcSingleRate;
      return Math.max(0, pvcCardCount * perCardPrice);
    }
    if (serviceType === 'call_letter') {
      return Math.max(0, callLetterPages * callLetterCopies * callLetterRate);
    }
    // Regular Print
    let unitRate = colorMode === 'bw'
      ? (sideOption === 'single' ? bwSingleRate : bwDoubleRate)
      : (sideOption === 'single' ? colorSingleRate : colorDoubleRate);
    
    const printSubtotal = pageCount * unitRate * copies;
    const laminationTotal = needLamination ? pageCount * laminationRate * copies : 0;
    return Math.max(0, printSubtotal + laminationTotal);
  }, [
    serviceType,
    pvcCardCount,
    pvcCardRate,
    pvcSingleRate,
    pvcSideOption,
    callLetterPages,
    callLetterCopies,
    callLetterRate,
    colorMode,
    sideOption,
    bwSingleRate,
    bwDoubleRate,
    colorSingleRate,
    colorDoubleRate,
    pageCount,
    copies,
    needLamination,
    laminationRate
  ]);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      showToast('⚠️ મહત્તમ 25 MB સુધીની ફાઇલ અપલોડ કરી શકાય છે.');
      return;
    }

    setFile(selectedFile);

    // Read as Base64 data URL for preview and storing in order
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
      showToast(`📄 "${selectedFile.name}" અપલોડ થઈ ગઈ.`);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFrontFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      showToast('⚠️ મહત્તમ 25 MB સુધીની ફાઇલ અપલોડ કરી શકાય છે.');
      return;
    }
    setFrontFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setFrontBase64(reader.result as string);
      showToast(`💳 આગળની બાજુ (Front) ફાઇલ અપલોડ થઈ ગઈ.`);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleBackFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      showToast('⚠️ મહત્તમ 25 MB સુધીની ફાઇલ અપલોડ કરી શકાય છે.');
      return;
    }
    setBackFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setBackBase64(reader.result as string);
      showToast(`💳 પાછળની બાજુ (Back) ફાઇલ અપલોડ થઈ ગઈ.`);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const createServiceProductItem = (): ProductItem => {
    if (serviceType === 'pvc_card') {
      const sideText = pvcSideOption === 'double' ? 'બંને બાજુ (આગળ + પાછળ)' : '૧ બાજુ (ફક્ત આગળ)';
      const fileSummaryList: string[] = [];
      if (frontFile) fileSummaryList.push(`આગળ: ${frontFile.name}`);
      if (backFile) fileSummaryList.push(`પાછળ: ${backFile.name}`);
      if (file) fileSummaryList.push(`ફાઇલ: ${file.name}`);

      const fileLabel = fileSummaryList.length > 0 ? ` [${fileSummaryList.join(' | ')}]` : '';
      const activeImage = frontBase64 || fileBase64 || backBase64 || '';
      const gallery = [frontBase64, backBase64].filter(Boolean);

      const attachedFilesList: Array<{ fileName: string; fileDataUrl: string; fileSize?: number; id: string }> = [];

      if (frontBase64) {
        const fId = `f-pvc-front-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const fName = `આગળની બાજુ (Front) - ${frontFile ? frontFile.name : `${pvcCardType}_Front.jpg`}`;
        attachedFilesList.push({
          id: fId,
          fileName: fName,
          fileDataUrl: frontBase64,
          fileSize: frontFile?.size || Math.round(frontBase64.length * 0.75)
        });
        saveFileToCloudStorage(fId, frontBase64, fName, frontFile?.type || 'image/jpeg', frontFile?.size).catch(() => {});
      }

      if (pvcSideOption === 'double' && backBase64) {
        const bId = `f-pvc-back-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const bName = `પાછળની બાજુ (Back) - ${backFile ? backFile.name : `${pvcCardType}_Back.jpg`}`;
        attachedFilesList.push({
          id: bId,
          fileName: bName,
          fileDataUrl: backBase64,
          fileSize: backFile?.size || Math.round(backBase64.length * 0.75)
        });
        saveFileToCloudStorage(bId, backBase64, bName, backFile?.type || 'image/jpeg', backFile?.size).catch(() => {});
      }

      if (fileBase64 && attachedFilesList.length === 0) {
        const docId = `f-pvc-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const docName = file ? file.name : `${pvcCardType}.pdf`;
        attachedFilesList.push({
          id: docId,
          fileName: docName,
          fileDataUrl: fileBase64,
          fileSize: file?.size || Math.round(fileBase64.length * 0.75)
        });
        saveFileToCloudStorage(docId, fileBase64, docName, file?.type || 'application/pdf', file?.size).catch(() => {});
      }

      return {
        id: `pvc-card-${Date.now()}`,
        nameGu: `💳 PVC સ્માર્ટ કાર્ડ (${pvcCardType} - ${pvcCardCount} નંગ, ${sideText})${fileLabel}`,
        nameEn: `PVC Smart Card (${pvcCardType} - ${pvcCardCount} Qty, ${pvcSideOption === 'double' ? 'Both Sides' : 'Front Only'})`,
        price: totalAmount,
        costPrice: Math.round(pvcCardCount * (pvcSideOption === 'double' ? 40 : 25)),
        stock: 'સેવા',
        isService: true,
        unit: `${pvcCardCount} કાર્ડ`,
        category: 'services',
        icon: '💳',
        imageUrl: activeImage,
        galleryImages: gallery.length > 0 ? gallery : undefined,
        attachedFiles: attachedFilesList.length > 0 ? attachedFilesList : undefined,
        badge: pvcSideOption === 'double' ? 'બંને બાજુ PVC' : 'સિંગલ PVC',
        description: `પ્રકાર: ${pvcCardType} | બાજુ: ${sideText} | નંગ: ${pvcCardCount} | ફાઇલો: ${fileSummaryList.length > 0 ? fileSummaryList.join(', ') : 'કાઉન્ટર પર આપશે'}${instructions ? ` | નોંધ: ${instructions}` : ''}`
      };
    }

    const fileLabel = file ? ` [ફાઇલ: ${file.name}]` : '';

    if (serviceType === 'call_letter') {
      const attachedFilesList: Array<{ fileName: string; fileDataUrl: string; fileSize?: number; id: string }> = [];
      if (fileBase64) {
        const cId = `f-call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const cName = file ? file.name : 'કોલ લેટર.pdf';
        attachedFilesList.push({
          id: cId,
          fileName: cName,
          fileDataUrl: fileBase64,
          fileSize: file?.size || Math.round(fileBase64.length * 0.75)
        });
        saveFileToCloudStorage(cId, fileBase64, cName, file?.type || 'application/pdf', file?.size).catch(() => {});
      }

      return {
        id: `call-letter-${Date.now()}`,
        nameGu: `🎫 કોલ લેટર પ્રિન્ટ (${callLetterPages} પેજ, ${callLetterCopies} નકલ)${callLetterRate === 0 ? ' [નવરાત્રી ફ્રી]' : ''}${fileLabel}`,
        nameEn: `Exam Call Letter / Hall Ticket Print (${callLetterPages} Pgs, ${callLetterCopies} Copies)`,
        price: totalAmount,
        costPrice: 0,
        stock: 'સેવા',
        isService: true,
        unit: `${callLetterCopies} સેટ`,
        category: 'services',
        icon: '🎫',
        imageUrl: fileBase64 || '',
        attachedFiles: attachedFilesList.length > 0 ? attachedFilesList : undefined,
        badge: 'કોલ લેટર',
        description: `કોલ લેટર / હોલ ટિકિટ | પેજ: ${callLetterPages} | નકલ: ${callLetterCopies} | ભાવ: ₹${totalAmount} | ફાઇલ: ${file ? file.name : 'કાઉન્ટર પર આપશે'}${instructions ? ` | નોંધ: ${instructions}` : ''}`
      };
    }

    // Standard Xerox / Print
    const colorLabel = colorMode === 'bw' ? 'બ્લેક & વ્હાઇટ' : 'કલર';
    const sideLabel = sideOption === 'single' ? 'એક બાજુ' : 'બંને બાજુ (Back-to-Back)';
    const lamText = needLamination ? ' + લેમિનેશન' : '';

    const attachedFilesList: Array<{ fileName: string; fileDataUrl: string; fileSize?: number; id: string }> = [];
    if (fileBase64) {
      const pId = `f-xerox-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const pName = file ? file.name : 'પ્રિન્ટ દસ્તાવેજ.pdf';
      attachedFilesList.push({
        id: pId,
        fileName: pName,
        fileDataUrl: fileBase64,
        fileSize: file?.size || Math.round(fileBase64.length * 0.75)
      });
      saveFileToCloudStorage(pId, fileBase64, pName, file?.type || 'application/pdf', file?.size).catch(() => {});
    }

    return {
      id: `print-service-${Date.now()}`,
      nameGu: `🖨️ ઓનલાઇન ઝેરોક્ષ / પ્રિન્ટ (${pageCount} પેજ, ${colorLabel}, ${sideLabel}${lamText})${fileLabel}`,
      nameEn: `Online Xerox / Print - ${pageCount} Pgs (${colorMode === 'bw' ? 'B/W' : 'Color'}, ${sideOption})${needLamination ? ' + Lam' : ''}`,
      price: totalAmount,
      costPrice: Math.round(totalAmount * 0.4),
      stock: 'સેવા',
      isService: true,
      unit: `${copies} સેટ`,
      category: 'printing',
      icon: '🖨️',
      imageUrl: fileBase64 || '',
      attachedFiles: attachedFilesList.length > 0 ? attachedFilesList : undefined,
      badge: 'ઝેરોક્ષ ઓર્ડર',
      description: `ફાઇલ: ${file ? file.name : 'કાઉન્ટર પર આપશે'} | પેજ: ${pageCount} | કોપી: ${copies} | ${colorLabel} | ${sideLabel}${needLamination ? ' | લેમિનેશન: હા' : ''}${instructions ? ` | નોંધ: ${instructions}` : ''}`
    };
  };

  const handleAddToCartAndAddAnother = () => {
    const item = createServiceProductItem();
    onAddToCart(item);
    showToast(`🛒 "${item.nameGu.slice(0, 35)}..." કાર્ટમાં ઉમેરાઈ ગયું! હવે બીજી ફાઇલ ઉમેરો.`);
    // Reset file states so the customer can instantly add another document
    setFile(null);
    setFileBase64('');
    setFrontFile(null);
    setFrontBase64('');
    setBackFile(null);
    setBackBase64('');
    setInstructions('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (frontInputRef.current) frontInputRef.current.value = '';
    if (backInputRef.current) backInputRef.current.value = '';
  };

  const handleAddToCartClick = () => {
    const item = createServiceProductItem();
    onAddToCart(item);
    showToast(`🛒 "${item.nameGu.slice(0, 35)}..." કાર્ટમાં ઉમેરાઈ ગયું! (₹${totalAmount})`);
    setIsOpenModal(false);
  };

  const handleDirectOrderClick = () => {
    const item = createServiceProductItem();
    onDirectOrder(item);
    setIsOpenModal(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-600" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-blue-600" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <FileCheck className="w-5 h-5 text-orange-600" />;
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SLEEK COMPACT CUSTOMER BAR (Does NOT block or clutter the page) */}
      {/* ========================================================================= */}
      <div className="mb-4 bg-gradient-to-r from-blue-950 via-slate-900 to-[#0B1E48] rounded-xl p-2.5 sm:p-3 shadow-md border border-blue-800 text-white flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-all">
        
        {/* Left Info with quick service tags */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-orange-500 text-black flex items-center justify-center shrink-0 font-black shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-white">
                ઓનલાઇન ઝેરોક્ષ, પ્રિન્ટ & PVC કાર્ડ
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.2 rounded-full border border-emerald-500/40">
                લાઇવ ભાવ ગણતરી
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-neutral-300 flex-wrap mt-0.5">
              <span className="bg-white/10 px-1.5 py-0.2 rounded text-neutral-200">
                🖨️ ઝેરોક્ષ ₹{bwSingleRate}
              </span>
              <span className="bg-purple-500/20 text-purple-200 px-1.5 py-0.2 rounded font-bold border border-purple-400/30">
                💳 PVC કાર્ડ ₹{pvcCardRate}
              </span>
              <span className="bg-amber-500/20 text-amber-200 px-1.5 py-0.2 rounded font-bold border border-amber-400/30">
                🎫 કોલ લેટર {callLetterRate === 0 ? 'ફ્રી ₹0' : `₹${callLetterRate}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAdminUnlocked && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="ભાવ સેટિંગ્સ બદલો"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>ફાઇલ અપલોડ & ઓર્ડર કરો</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED POPUP / MODAL FOR XEROX, PVC & PRINT ORDERS */}
      {/* ========================================================================= */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border-2 border-neutral-800 shadow-2xl space-y-3 relative text-neutral-900">
            
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-950 via-slate-900 to-[#0B1E48] text-white p-3.5 sm:p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-black flex items-center justify-center font-black">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-white">
                    🖨️ ઓનલાઇન ઝેરોક્ષ, પ્રિન્ટ & PVC કાર્ડ ઓર્ડર
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    ફાઇલ અપલોડ કરો અને લાઇવ ભાવ ગણતરી સાથે ઓનલાઇન ઓર્ડર કરો
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5">
              
              {/* Service Tabs */}
              <div>
                <label className="block text-xs font-black text-neutral-800 mb-1.5">
                  ૧. સેવા પસંદ કરો (Select Service):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setServiceType('print')}
                    className={`p-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      serviceType === 'print'
                        ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-orange-400" />
                    <span>ઝેરોક્ષ / પ્રિન્ટ</span>
                    <span className="text-[9px] opacity-80">₹{bwSingleRate} થી શરૂ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('pvc_card')}
                    className={`p-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      serviceType === 'pvc_card'
                        ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-300" />
                    <span>PVC સ્માર્ટ કાર્ડ</span>
                    <span className="text-[9px] opacity-80">₹{pvcCardRate} / કાર્ડ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('call_letter')}
                    className={`p-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      serviceType === 'call_letter'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-emerald-300" />
                    <span>કોલ લેટર</span>
                    <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.2 rounded font-black">
                      {callLetterRate === 0 ? 'ફ્રી' : `₹${callLetterRate}`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Service-specific Options */}
              {serviceType === 'pvc_card' && (
                <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-purple-700" />
                      <span>💳 PVC પ્લાસ્ટિક સ્માર્ટ કાર્ડ ઓપ્શન્સ</span>
                    </span>
                    <span className="text-[11px] font-black text-purple-800 bg-purple-200 px-2 py-0.5 rounded">
                      ભાવ: ₹{pvcSideOption === 'double' ? pvcCardRate : pvcSingleRate} / કાર્ડ
                    </span>
                  </div>

                  {/* Side Selection: બંને બાજુ (Front & Back) vs ૧ બાજુ */}
                  <div>
                    <label className="block text-[11px] font-black text-purple-950 mb-1">
                      પ્રિન્ટ સાઇડ (બાજુ પસંદ કરો):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPvcSideOption('double')}
                        className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          pvcSideOption === 'double'
                            ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                            : 'bg-white text-neutral-800 border-purple-200 hover:bg-purple-100/50'
                        }`}
                      >
                        <span>📑 બંને બાજુ (આગળ & પાછળ)</span>
                        <span className="text-[10px] bg-purple-700 text-purple-100 px-1.5 py-0.2 rounded">₹{pvcCardRate}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPvcSideOption('single')}
                        className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          pvcSideOption === 'single'
                            ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                            : 'bg-white text-neutral-800 border-purple-200 hover:bg-purple-100/50'
                        }`}
                      >
                        <span>📄 ૧ બાજુ (ફક્ત આગળ)</span>
                        <span className="text-[10px] bg-purple-700 text-purple-100 px-1.5 py-0.2 rounded">₹{pvcSingleRate}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        કાર્ડનો પ્રકાર:
                      </label>
                      <select
                        value={pvcCardType}
                        onChange={e => setPvcCardType(e.target.value)}
                        className="w-full p-2 rounded-lg border border-purple-300 bg-white text-xs font-black outline-none"
                      >
                        <option value="આધાર કાર્ડ (Aadhaar Card)">આધાર કાર્ડ (Aadhaar Card)</option>
                        <option value="આયુષ્માન કાર્ડ (Ayushman Card)">આયુષ્માન ભારત કાર્ડ</option>
                        <option value="પાન કાર્ડ (PAN Card)">પાન કાર્ડ (PAN Card)</option>
                        <option value="ડ્રાઇવિંગ લાયસન્સ (Driving Licence)">ડ્રાઇવિંગ લાયસન્સ</option>
                        <option value="ચૂંટણી કાર્ડ (Voter ID Card)">ચૂંટણી કાર્ડ (Voter ID)</option>
                        <option value="ઇ-શ્રમ કાર્ડ (e-Shram Card)">ઇ-શ્રમ કાર્ડ</option>
                        <option value="રેશન કાર્ડ (Ration Card)">રેશન કાર્ડ (Ration Card)</option>
                        <option value="શાળા/કૉલેજ ID કાર્ડ">શાળા/કૉલેજ ID કાર્ડ</option>
                        <option value="અન્ય સ્માર્ટ કાર્ડ">અન્ય સ્માર્ટ કાર્ડ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        કુલ કાર્ડ સંખ્યા (Quantity):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={pvcCardCount}
                          onChange={e => setPvcCardCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full p-2 rounded-lg border border-purple-300 bg-white text-xs font-black outline-none font-mono"
                        />
                        <span className="text-xs font-bold text-purple-900">નંગ</span>
                      </div>
                    </div>
                  </div>

                  {/* PVC Dual Side File Upload Section */}
                  {pvcSideOption === 'double' ? (
                    <div className="space-y-2 pt-1 border-t border-purple-200">
                      <label className="block text-[11px] font-black text-purple-950">
                        આગળ અને પાછળ બંને બાજુની ફાઇલ / ફોટો અપલોડ કરો:
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Front Side Upload */}
                        <div className="p-2.5 rounded-xl border border-dashed border-purple-300 bg-white space-y-1 text-center">
                          <input
                            ref={frontInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={e => e.target.files?.[0] && handleFrontFileSelect(e.target.files[0])}
                            className="hidden"
                          />
                          <p className="text-[10px] font-black text-purple-900">૧. આગળની બાજુ (Front)</p>
                          {frontFile ? (
                            <div className="flex items-center justify-between bg-purple-50 p-1.5 rounded border border-purple-200">
                              <span className="text-[10px] font-bold text-purple-950 truncate max-w-[140px]">
                                {frontFile.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFrontFile(null);
                                  setFrontBase64('');
                                  if (frontInputRef.current) frontInputRef.current.value = '';
                                }}
                                className="text-red-600 hover:text-red-700 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="w-full py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center justify-center gap-1"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>આગળનો ભાગ અપલોડ</span>
                            </button>
                          )}
                        </div>

                        {/* Back Side Upload */}
                        <div className="p-2.5 rounded-xl border border-dashed border-purple-300 bg-white space-y-1 text-center">
                          <input
                            ref={backInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={e => e.target.files?.[0] && handleBackFileSelect(e.target.files[0])}
                            className="hidden"
                          />
                          <p className="text-[10px] font-black text-purple-900">૨. પાછળની બાજુ (Back)</p>
                          {backFile ? (
                            <div className="flex items-center justify-between bg-purple-50 p-1.5 rounded border border-purple-200">
                              <span className="text-[10px] font-bold text-purple-950 truncate max-w-[140px]">
                                {backFile.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBackFile(null);
                                  setBackBase64('');
                                  if (backInputRef.current) backInputRef.current.value = '';
                                }}
                                className="text-red-600 hover:text-red-700 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="w-full py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center justify-center gap-1"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>પાછળનો ભાગ અપલોડ</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[9.5px] text-neutral-600 text-center">
                        અથવા જો આખું આધાર કાર્ડ ૧ જ PDF ફાઇલમાં હોય તો નીચે આપેલા મુખ્ય બોક્સમાં PDF અપલોડ કરી શકો છો.
                      </p>
                    </div>
                  ) : null}

                  <p className="text-[10px] text-purple-700 font-medium">
                    * ઓરિજિનલ પ્લાસ્ટિક PVC વોટરપ્રૂફ કાર્ડ, લાઈફટાઇમ પ્રિન્ટિંગ કલર ગેરેંટી.
                  </p>
                </div>
              )}

              {serviceType === 'call_letter' && (
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{callLetterOfferText}</span>
                    </span>
                    <span className="text-[11px] font-black text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded">
                      {callLetterRate === 0 ? 'રૂપિયા ૦ (ફ્રી)' : `₹${callLetterRate} / પેજ`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        પેજ સંખ્યા:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={callLetterPages}
                        onChange={e => setCallLetterPages(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-emerald-300 bg-white text-xs font-black outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        નકલ (Copies):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={callLetterCopies}
                        onChange={e => setCallLetterCopies(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-emerald-300 bg-white text-xs font-black outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {serviceType === 'print' && (
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-300 space-y-3">
                  {/* Color & Side options */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        કલર મોડ:
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setColorMode('bw')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                            colorMode === 'bw'
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          ⬛ B/W
                        </button>
                        <button
                          type="button"
                          onClick={() => setColorMode('color')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                            colorMode === 'color'
                              ? 'bg-orange-500 text-black border-orange-600'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          🎨 કલર
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        બાજુ (Side):
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setSideOption('single')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                            sideOption === 'single'
                              ? 'bg-blue-900 text-white border-blue-950'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          ૧ બાજુ
                        </button>
                        <button
                          type="button"
                          onClick={() => setSideOption('double')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                            sideOption === 'double'
                              ? 'bg-blue-900 text-white border-blue-950'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          ૨ બાજુ
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pages, Copies & Lamination */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        પેજ સંખ્યા:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={pageCount}
                        onChange={e => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-neutral-300 bg-white text-xs font-black outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        નકલ (Copies):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={copies}
                        onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-neutral-300 bg-white text-xs font-black outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        લેમિનેશન:
                      </label>
                      <button
                        type="button"
                        onClick={() => setNeedLamination(!needLamination)}
                        className={`w-full p-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                          needLamination
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {needLamination ? `✓ હા (+₹${laminationRate})` : 'ના'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Box */}
              <div>
                <label className="block text-xs font-black text-neutral-800 mb-1.5">
                  ૨. ફાઇલ અથવા ડોક્યુમેન્ટ અપલોડ કરો (PDF / JPG / PNG / Excel / Word):
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {file ? (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(file.name)}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-950 truncate">{file.name}</p>
                        <p className="text-[10px] text-emerald-700 font-bold">
                          {(file.size / 1024).toFixed(1)} KB • તૈયાર છે
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFileBase64('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer"
                      title="ફાઇલ દૂર કરો"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-neutral-300 hover:border-orange-400 bg-neutral-50/60'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-1" />
                    <p className="text-xs font-black text-neutral-800">
                      અહીં ક્લિક કરીને ફાઇલ પસંદ કરો અથવા ડ્રેગ કરો
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      PDF, JPG/PNG ફોટો, Excel, Word ડોક્યુમેન્ટ (મહત્તમ 50 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  ખાસ સૂચના (ઓપ્શનલ):
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="દા.ત. ફ્રન્ટ & બેક કલર કરજો, લેમિનેશન કડક કરજો"
                  className="w-full p-2 text-xs font-bold border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              {/* Live Calculation Summary & Action Buttons */}
              <div className="bg-neutral-900 text-white p-3.5 rounded-xl flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                  <div>
                    <span className="text-[11px] text-neutral-400 font-bold block">
                      કુલ ઓર્ડર રકમ (Live Calculation):
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-orange-400">₹{totalAmount}</span>
                      <span className="text-xs text-neutral-400">
                        {serviceType === 'pvc_card'
                          ? `(${pvcCardCount} કાર્ડ x ₹${pvcSideOption === 'double' ? pvcCardRate : pvcSingleRate} ${pvcSideOption === 'double' ? '[બંને બાજુ]' : '[૧ બાજુ]'})`
                          : serviceType === 'call_letter'
                          ? callLetterRate === 0
                            ? '(નવરાત્રી ફ્રી)'
                            : `(${callLetterPages * callLetterCopies} પેજ)`
                          : `(${pageCount} પેજ x ${copies} કોપી)`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 font-bold flex items-center gap-1.5 self-start sm:self-auto">
                    <span>⚡ એક જ ઓર્ડરમાં વધુ પ્રિન્ટ/કાર્ડ પણ ઉમેરી શકો છો!</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Add to Cart and configure another file */}
                  <button
                    type="button"
                    onClick={handleAddToCartAndAddAnother}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
                    title="આ આઇટમ ઉમેરીને બીજી ફાઇલ/પ્રિન્ટ ઉમેરો"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ બીજી ફાઇલ / પ્રિન્ટ ઉમેરો</span>
                  </button>

                  {/* Option 2: Add to cart and close */}
                  <button
                    type="button"
                    onClick={handleAddToCartClick}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-400" />
                    <span>કાર્ટમાં ઉમેરો</span>
                  </button>

                  {/* Option 3: Direct Order */}
                  <button
                    type="button"
                    onClick={handleDirectOrderClick}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>સીધો ઓર્ડર કરો</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
