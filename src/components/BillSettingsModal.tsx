import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Save,
  Image as ImageIcon,
  QrCode,
  PenTool,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Building2,
  Trash2,
  Upload
} from 'lucide-react';
import { StoreSettings } from '../types';
import {
  compressAndResizeImage,
  generateUpiQrDataUrl,
  getDefaultLeftLogoSvg,
  getDefaultRightLogoSvg
} from '../lib/invoiceUtils';

interface BillSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (updated: Partial<StoreSettings>) => void;
  onUploadImage?: (e: React.ChangeEvent<HTMLInputElement>, target: 'leftLogo' | 'rightLogo' | 'customQr' | 'signature') => void;
}

export const BillSettingsModal: React.FC<BillSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<StoreSettings>>({
    ...settings
  });

  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');
  const [showSignPad, setShowSignPad] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state whenever settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        storeNameEn: settings.storeNameEn || '',
        storeNameGu: settings.storeNameGu || '',
        tagline: settings.tagline || '',
        ownerName: settings.ownerName || '',
        phone: settings.phone || '8140430395',
        whatsappNumber: settings.whatsappNumber || '8140430395',
        email: settings.email || 'prishastationry@gmail.com',
        gstNumber: settings.gstNumber || '',
        panNumber: settings.panNumber || 'BTQPC3756D',
        address: settings.address || '',
        upiId: settings.upiId || '8140430395@apl',
        payeeName: settings.payeeName || 'PRISHA STATIONERY',
        leftLogoUrl: settings.leftLogoUrl || '',
        rightLogoUrl: settings.rightLogoUrl || '',
        customQrUrl: settings.customQrUrl || '',
        invoiceFooterNote: settings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર! માલ પરત લેવામાં આવશે નહિ. ફક્ત એક્સચેન્જ થઈ શકશે.',
        billFraudWarning: settings.billFraudWarning || '⚠️ સાવચેતી: કોઈપણ ઓનલાઇન છેતરપિંડીથી બચવા ફક્ત આ જ સત્તાવાર UPI QR / પ્રિષા સ્ટેશનરી પર પેમેન્ટ કરવું.',
        billSpecialOffer: settings.billSpecialOffer || '🎉 આ બિલ પર આગામી ખરીદીમાં વિશેષ ૫% ડિસ્કાઉન્ટ મેળવો!',
        billShowPan: settings.billShowPan !== false,
        billShowGst: settings.billShowGst !== false,
        billShowQr: settings.billShowQr !== false,
        billShowUpi: settings.billShowUpi !== false,
        billShowAddress: settings.billShowAddress !== false,
        billShowHelpline: settings.billShowHelpline !== false,
        billShowLogos: settings.billShowLogos !== false,
        billShowTerms: settings.billShowTerms !== false,
        billShowTagline: settings.billShowTagline !== false,
        billShowOwnerName: settings.billShowOwnerName !== false,
        billShowHsnColumn: settings.billShowHsnColumn !== false,
        billShowWords: settings.billShowWords !== false,
        billShowBankDetails: settings.billShowBankDetails || false,
        billShowWatermark: settings.billShowWatermark !== false,
        billWatermarkType: settings.billWatermarkType || 'both',
        billWatermarkOpacity: settings.billWatermarkOpacity ?? 30,
        billWatermarkText: settings.billWatermarkText || 'PRISHA STATIONERY & XEROX (THARAD)',
        hideUpiOnBill: settings.hideUpiOnBill || false,
        showMrpOnStore: settings.showMrpOnStore !== false,
        showDiscountOnStore: settings.showDiscountOnStore !== false,
        billShowFraudWarning: settings.billShowFraudWarning !== false,
        billShowSpecialOffer: settings.billShowSpecialOffer !== false,
        billTermsNote: settings.billTermsNote || 'કમ્પ્યુટર જનરેટેડ ટેક્સ ઇન્વોઇસ. ખરીદેલ માલ પરત લેવાશે નહિ. ફક્ત એક્સચેન્જ થઈ શકશે. વિવાદનું સ્થળ: થરાદ કોર્ટ.',
        qrCodeMode: settings.qrCodeMode || 'dynamic',
        signatureUrl: settings.signatureUrl || '',
        billShowSignature: settings.billShowSignature !== false,
        signatoryTitle: settings.signatoryTitle || 'For, PRISHA STATIONERY & ONLINE SERVICES',
        signatoryName: settings.signatoryName || 'Authorized Signatory / અધિકૃત સહી',
        bankName: settings.bankName || 'State Bank of India',
        accountNumber: settings.accountNumber || '',
        ifscCode: settings.ifscCode || '',
        invoicePrefix: settings.invoicePrefix || 'prisha',
        nextInvoiceSeq: settings.nextInvoiceSeq || 1,
        invoiceGstRate: settings.invoiceGstRate || 0,
        invoiceDefaultHsn: settings.invoiceDefaultHsn || '4901'
      });
    }
  }, [isOpen, settings]);

  // Generate a live preview of the UPI QR Code
  useEffect(() => {
    if (isOpen && formData.upiId) {
      generateUpiQrDataUrl(
        formData.upiId,
        formData.payeeName || formData.storeNameEn || 'PRISHA STATIONERY',
        150,
        'INV-PREVIEW'
      ).then(url => setPreviewQrUrl(url));
    }
  }, [isOpen, formData.upiId, formData.payeeName, formData.storeNameEn]);

  if (!isOpen) return null;

  // Direct In-Modal Image Uploader with instant client-side downscaling & compression
  const handleImageFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'leftLogoUrl' | 'rightLogoUrl' | 'customQrUrl' | 'signatureUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Downscale to crisp passport-photo size (max 320x320)
      const compressedDataUrl = await compressAndResizeImage(file, 320, 320, 0.88);
      setFormData(prev => ({
        ...prev,
        [field]: compressedDataUrl
      }));
      e.target.value = '';
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('ફોટો વાંચવામાં ભૂલ આવી, કૃપા કરીને બીજી ઇમેજ પસંદ કરો.');
    }
  };

  // Canvas Drawing Handlers for Digital Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0B1E48'; // Official deep blue ink color
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignCanvas = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setFormData(prev => ({
      ...prev,
      signatureUrl: dataUrl
    }));
    setShowSignPad(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border-2 border-neutral-800 shadow-2xl overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>🧾 સરકારી માન્ય બિલ સેટિંગ્સ & કસ્ટમાઇઝેશન (Bill Settings)</span>
              </h2>
              <p className="text-[11px] text-blue-200 font-bold">
                ઓટોમેટિક પેમેન્ટ QR કોડ, પાસપોર્ટ સાઇઝ લોગો, અધિકૃત સહી (Signatory) અને GST ટેક્સ ઇન્વોઇસ સુધારા
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-50/40">
          
          {/* ========================================================================= */}
          {/* 1. STORE HEADER & GOVERNMENT TAX IDENTIFIERS */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                ૧. દુકાન વિગતો & સરકારી ટેક્સ નંબરો (Store Details & Tax IDs)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાનનું અંગ્રેજી નામ (English Store Name):
                </label>
                <input
                  type="text"
                  value={formData.storeNameEn}
                  onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાનનું ગુજરાતી નામ (Gujarati Name):
                </label>
                <input
                  type="text"
                  value={formData.storeNameGu}
                  onChange={e => setFormData({ ...formData, storeNameGu: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  સંચાલકનું નામ (Owner Name):
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  સંપૂર્ણ સરનામું (Address for Bill):
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  સત્તાવાર GSTIN નંબર (GST Number):
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase font-mono"
                  placeholder="24BTQPC3756D1Z5"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  GST ટેક્સ ટકાવારી (Default Tax %):
                </label>
                <select
                  value={formData.invoiceGstRate || 0}
                  onChange={e => setFormData({ ...formData, invoiceGstRate: Number(e.target.value) })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                >
                  <option value={0}>0% (ટેક્સ મુક્ત / Exempted)</option>
                  <option value={5}>5% GST (2.5% CGST + 2.5% SGST)</option>
                  <option value={12}>12% GST (6% CGST + 6% SGST)</option>
                  <option value={18}>18% GST (9% CGST + 9% SGST - સ્ટેશનરી/સેવા)</option>
                  <option value={28}>28% GST (14% CGST + 14% SGST)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  ડિફોલ્ટ HSN/SAC કોડ (Default HSN):
                </label>
                <input
                  type="text"
                  value={formData.invoiceDefaultHsn || '4901'}
                  onChange={e => setFormData({ ...formData, invoiceDefaultHsn: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 font-mono"
                  placeholder="4901 (પુસ્તકો), 9983 (Xerox/Print)"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  બિલ નંબર પ્રીફિક્સ (Invoice Prefix):
                </label>
                <input
                  type="text"
                  value={formData.invoicePrefix || 'prisha'}
                  onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 font-mono uppercase"
                  placeholder="prisha અથવા INV અથવા GST"
                />
                <span className="text-[9.5px] text-neutral-500 font-medium">દા.ત. prisha000001 અથવા INV-2026-001</span>
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  હાલનો/આગામી બિલ ક્રમાંક (Next Bill No):
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.nextInvoiceSeq || 1}
                  onChange={e => setFormData({ ...formData, nextInvoiceSeq: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 font-mono"
                  placeholder="1"
                />
                <span className="text-[9.5px] text-neutral-500 font-medium">બિલ નંબર અહીંથી આગળ વધશે</span>
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  PAN નંબર (PAN Number):
                </label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={e => setFormData({ ...formData, panNumber: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase font-mono"
                  placeholder="BTQPC3756D"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાન કોલિંગ નંબર (Phone):
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1 flex items-center gap-1">
                  <span className="text-emerald-600">💬</span>
                  <span>WhatsApp હેલ્પલાઇન નંબર:</span>
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber || ''}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  placeholder="8140430395"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1 flex items-center gap-1">
                  <span className="text-red-500">📧</span>
                  <span>Gmail / ઈમેલ (Email):</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  placeholder="prishastationry@gmail.com"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  ટેગલાઇન / પ્રકાર (Tagline):
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              {/* Bank Details Inputs */}
              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  🏛️ બેંકનું નામ (Bank Name):
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  placeholder="State Bank of India"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  💳 એકાઉન્ટ નંબર (Bank A/c No):
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 font-mono"
                  placeholder="3958XXXXXXXX"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  🏦 IFSC કોડ (IFSC Code):
                </label>
                <input
                  type="text"
                  value={formData.ifscCode || ''}
                  onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase font-mono"
                  placeholder="SBIN0060045"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1.5 ADMIN BILL DISPLAY TOGGLES (બિલમાં શું બતાવવું / છુપાવવું) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4 rounded-xl border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                  બિલ વિગત કંટ્રોલ (Admin Display Toggles - શું બતાવવું / છુપાવવું)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                ⚡ એક ક્લિક પર ચાલુ/બંધ (Live Toggles)
              </span>
            </div>

            <p className="text-[11px] text-neutral-600 font-medium">
              તમે જે વિગત પર ટિકમાર્ક કરશો તે જ વિગત ગ્રાહકના બિલ અને પ્રિન્ટમાં દેખાશે. જો કોઈ વિગત ન બતાવવી હોય તો ફક્ત અનટિક કરો:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {/* Toggle GST */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowGst !== false}
                    onChange={e => setFormData({ ...formData, billShowGst: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">GSTIN નંબર બતાવો</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 font-medium">GSTIN</span>
              </label>

              {/* Toggle PAN */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowPan !== false}
                    onChange={e => setFormData({ ...formData, billShowPan: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">PAN નંબર બતાવો</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 font-medium">PAN</span>
              </label>

              {/* Toggle Payment QR */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-emerald-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowQr !== false}
                    onChange={e => setFormData({ ...formData, billShowQr: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-900">પેમેન્ટ QR કોડ બતાવો</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">UPI QR</span>
              </label>

              {/* Toggle UPI ID Text */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowUpi !== false}
                    onChange={e => setFormData({ ...formData, billShowUpi: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">UPI ID લખાણ બતાવો</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 font-medium">UPI ID</span>
              </label>

              {/* Toggle Address */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowAddress !== false}
                    onChange={e => setFormData({ ...formData, billShowAddress: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">દુકાન સરનામું બતાવો</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Address</span>
              </label>

              {/* Toggle Helpline & Email */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowHelpline !== false}
                    onChange={e => setFormData({ ...formData, billShowHelpline: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">ફોન/Email હેલ્પલાઇન</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Helpline</span>
              </label>

              {/* Toggle Tagline */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowTagline !== false}
                    onChange={e => setFormData({ ...formData, billShowTagline: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">ટેગલાઇન & સેવાઓ</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Tagline</span>
              </label>

              {/* Toggle Owner Name */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowOwnerName !== false}
                    onChange={e => setFormData({ ...formData, billShowOwnerName: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">સંચાલકનું નામ (Owner)</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Owner</span>
              </label>

              {/* Toggle Logos */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowLogos !== false}
                    onChange={e => setFormData({ ...formData, billShowLogos: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">પાસપોર્ટ સાઇઝ લોગો</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Logos</span>
              </label>

              {/* Toggle Watermark */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 shadow-2xs hover:border-purple-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowWatermark !== false}
                    onChange={e => setFormData({ ...formData, billShowWatermark: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-purple-900">સિક્યોરિટી વોટરમાર્ક</span>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Watermark</span>
              </label>

              {/* Toggle HSN Column */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowHsnColumn !== false}
                    onChange={e => setFormData({ ...formData, billShowHsnColumn: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">HSN/SAC કોડ કોલમ</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">HSN Code</span>
              </label>

              {/* Toggle Words */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowWords !== false}
                    onChange={e => setFormData({ ...formData, billShowWords: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">અક્ષરે રૂપિયા (Words)</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Words</span>
              </label>

              {/* Toggle Signature */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowSignature !== false}
                    onChange={e => setFormData({ ...formData, billShowSignature: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">અધિકૃત સહી/સ્ટેમ્પ</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Signature</span>
              </label>

              {/* Toggle Terms */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowTerms !== false}
                    onChange={e => setFormData({ ...formData, billShowTerms: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">શરતો & નિયમો બોક્સ</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Terms</span>
              </label>

              {/* Toggle Fraud Warning */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-100 shadow-2xs hover:border-amber-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowFraudWarning !== false}
                    onChange={e => setFormData({ ...formData, billShowFraudWarning: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-900">છેતરપિંડી સાવચેતી</span>
                </div>
                <span className="text-[10px] text-amber-600 font-medium">Security</span>
              </label>

              {/* Toggle Special Offer */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowSpecialOffer !== false}
                    onChange={e => setFormData({ ...formData, billShowSpecialOffer: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">૫% ડિસ્કાઉન્ટ ઓફર</span>
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Offer</span>
              </label>

              {/* Toggle Bank Details */}
              <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.billShowBankDetails === true}
                    onChange={e => setFormData({ ...formData, billShowBankDetails: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">બેંક ખાતા વિગતો</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Bank A/c</span>
              </label>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1.8 WATERMARK SECURITY & OPACITY SETTINGS (વોટરમાર્ક કંટ્રોલ) */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    બિલ પાછળ વોટરમાર્ક & પારદર્શકતા (Watermark Security & Opacity %)
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-bold">
                    બિલની અસલિયત સાબિત કરવા પાછળ દુકાનનું નામ અથવા લોગો 30% વિઝિબલ રાખવાનો કંટ્રોલ
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-purple-900">
                <input
                  type="checkbox"
                  checked={formData.billShowWatermark !== false}
                  onChange={e => setFormData({ ...formData, billShowWatermark: e.target.checked })}
                  className="rounded accent-purple-600 w-4 h-4"
                />
                <span>વોટરમાર્ક ચાલુ રાખો</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* Watermark Type Selector */}
                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    વોટરમાર્કનો પ્રકાર (Watermark Type):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, billWatermarkType: 'both' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        formData.billWatermarkType === 'both' || !formData.billWatermarkType
                          ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      👑 નામ + લોગો બંને
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, billWatermarkType: 'name' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        formData.billWatermarkType === 'name'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      ✍️ ફક્ત નામ (Text)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, billWatermarkType: 'logo' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                        formData.billWatermarkType === 'logo'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      🖼️ ફક્ત લોગો (Logo)
                    </button>
                  </div>
                </div>

                {/* Watermark Text */}
                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    વોટરમાર્ક લખાણ (Watermark Text):
                  </label>
                  <input
                    type="text"
                    value={formData.billWatermarkText || ''}
                    onChange={e => setFormData({ ...formData, billWatermarkText: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-purple-700 uppercase"
                    placeholder="PRISHA STATIONERY & XEROX (THARAD)"
                  />
                </div>

                {/* Watermark Opacity Slider (% Control) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-neutral-700">
                      પારદર્શકતા / વિઝિબિલિટી (Opacity %):
                    </label>
                    <span className="text-xs font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                      {formData.billWatermarkOpacity ?? 30}% વિઝિબલ
                    </span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={formData.billWatermarkOpacity ?? 30}
                    onChange={e => setFormData({ ...formData, billWatermarkOpacity: Number(e.target.value) })}
                    className="w-full accent-purple-700 cursor-pointer"
                  />

                  {/* Quick percentage buttons */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-neutral-500 font-bold">ઝડપી પસંદગી:</span>
                    {[10, 20, 30, 40, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFormData({ ...formData, billWatermarkOpacity: pct })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                          formData.billWatermarkOpacity === pct
                            ? 'bg-purple-800 text-white border-purple-800'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Watermark Preview Sample Box */}
              <div className="p-3 bg-neutral-100/70 rounded-xl border border-neutral-300 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden min-h-[160px]">
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                  લાઇવ વોટરમાર્ક પ્રિવ્યુ (Live Sample Preview)
                </div>

                {/* Simulated Watermark in Background */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-opacity"
                  style={{ opacity: (formData.billWatermarkOpacity ?? 30) / 100 }}
                >
                  <div className="transform -rotate-15 flex flex-col items-center justify-center p-2 text-center">
                    {(formData.billWatermarkType === 'logo' || formData.billWatermarkType === 'both' || !formData.billWatermarkType) && (
                      <img
                        src={formData.leftLogoUrl || getDefaultLeftLogoSvg()}
                        alt="Watermark Preview"
                        className="w-14 h-14 object-contain grayscale mb-1"
                      />
                    )}
                    {(formData.billWatermarkType === 'name' || formData.billWatermarkType === 'both' || !formData.billWatermarkType) && (
                      <div className="text-sm font-black tracking-widest text-black uppercase font-mono leading-tight">
                        {formData.billWatermarkText || formData.storeNameEn || 'PRISHA STATIONERY & XEROX'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Invoice Table on top */}
                <div className="relative z-10 w-full bg-white/90 p-2 rounded border border-neutral-300 text-[10px] shadow-xs pointer-events-none">
                  <div className="flex justify-between font-bold border-b pb-1">
                    <span>૧. Xerox A4 B/W (50 Qty)</span>
                    <span>₹100.00</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 text-emerald-800">
                    <span>કુલ રકમ:</span>
                    <span>₹100.00 [PAID]</span>
                  </div>
                </div>

                <div className="text-[9.5px] text-neutral-600 font-bold z-10">
                  {formData.billShowWatermark !== false
                    ? `🛡️ વોટરમાર્ક ${formData.billWatermarkOpacity ?? 30}% ની સાથે બિલમાં આ જ રીતે પાછળ દેખાશે.`
                    : '⚠️ વોટરમાર્ક હાલ બંધ (Unchecked) કરેલ છે.'}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. PASSPORT SIZE LOGOS (LEFT & RIGHT) */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  ૨. પાસપોર્ટ સાઇઝ લોગો (Passport-Size Logos)
                </h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.billShowLogos}
                  onChange={e => setFormData({ ...formData, billShowLogos: e.target.checked })}
                  className="rounded accent-blue-600"
                />
                <span>બિલ પર લોગો બતાવો</span>
              </label>
            </div>

            <p className="text-[11px] text-neutral-600 font-medium">
              💡 યુઝર સૂચના મુજબ બિલનું પેજ મોટું ન થઈ જાય તે માટે લોગોની સાઇઝ પાસપોર્ટ સાઇઝ ફોટો (68x68 px) જેટલી કોમ્પેક્ટ રાખવામાં આવી છે.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Logo Box */}
              <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-neutral-800">
                    ડાબો લોગો (Left Logo - Prisha Stationery):
                  </span>
                  {formData.leftLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, leftLogoUrl: '' })}
                      className="text-[10px] text-red-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>રીસેટ ડિફોલ્ટ</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Passport-size preview */}
                  <div className="w-[68px] h-[68px] border-2 border-neutral-300 rounded-lg p-1 bg-white shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={formData.leftLogoUrl || getDefaultLeftLogoSvg()}
                      alt="Left Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>📁 નવો લોગો ફોટો પસંદ કરો</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageFileSelect(e, 'leftLogoUrl')}
                      />
                    </label>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {formData.leftLogoUrl ? '✅ કસ્ટમ લોગો સેવ થયેલ છે' : '⚡ ડિફોલ્ટ ઓફિશિયલ એમ્બ્લેમ લોગો સેટ છે'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Logo Box */}
              <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-neutral-800">
                    જમણો લોગો (Right Logo - CSC Digital Seva):
                  </span>
                  {formData.rightLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rightLogoUrl: '' })}
                      className="text-[10px] text-red-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>રીસેટ ડિફોલ્ટ</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Passport-size preview */}
                  <div className="w-[68px] h-[68px] border-2 border-neutral-300 rounded-lg p-1 bg-white shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={formData.rightLogoUrl || getDefaultRightLogoSvg()}
                      alt="Right Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>📁 નવો લોગો ફોટો પસંદ કરો</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageFileSelect(e, 'rightLogoUrl')}
                      />
                    </label>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {formData.rightLogoUrl ? '✅ કસ્ટમ લોગો સેવ થયેલ છે' : '⚡ ડિફોલ્ટ CSC ડિજિટલ સેવા એમ્બ્લેમ સેટ છે'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. AUTOMATIC UPI QR CODE & CUSTOM PAYMENT QR */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  ૩. ઓટોમેટિક પેમેન્ટ QR કોડ (Automatic Payment QR)
                </h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-800">
                <input
                  type="checkbox"
                  checked={formData.billShowQr}
                  onChange={e => setFormData({ ...formData, billShowQr: e.target.checked })}
                  className="rounded accent-emerald-600"
                />
                <span>બિલ પર QR કોડ બતાવો</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    સત્તાવાર UPI ID (GPay, PhonePe, Paytm):
                  </label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 font-mono"
                    placeholder="8140430395@apl"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-medium">
                    આ UPI ID પર ગ્રાહક સ્કેન કરશે એટલે બિલની ચોક્કસ રકમ આપમેળે ભરાઈ જશે.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    ખાતાધારકનું નામ (Payee Name):
                  </label>
                  <input
                    type="text"
                    value={formData.payeeName}
                    onChange={e => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase"
                    placeholder="PRISHA STATIONERY"
                  />
                </div>

                {/* Custom QR Override Upload */}
                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    અથવા દુકાનનો કસ્ટમ સ્ટેન્ડી QR ફોટો (જો અપલોડ કરવો હોય તો):
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-neutral-700" />
                      <span>કસ્ટમ QR ફોટો અપલોડ</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageFileSelect(e, 'customQrUrl')}
                      />
                    </label>
                    {formData.customQrUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, customQrUrl: '' })}
                        className="text-xs text-red-600 font-bold hover:underline"
                      >
                        રીસેટ (ઓટો QR વાપરો)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Preview Box (Passport size) */}
              <div className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-200 flex flex-col items-center justify-center text-center space-y-2">
                <div className="text-[11px] font-black text-neutral-800">
                  લાઇવ પેમેન્ટ QR કોડ પ્રિવ્યુ (Passport Size: 78x78):
                </div>
                <div className="w-[82px] h-[82px] bg-white p-1 rounded-lg border-2 border-black flex items-center justify-center shadow-2xs">
                  {formData.customQrUrl ? (
                    <img
                      src={formData.customQrUrl}
                      alt="Custom QR"
                      className="w-full h-full object-contain"
                    />
                  ) : previewQrUrl ? (
                    <img
                      src={previewQrUrl}
                      alt="Auto Dynamic UPI QR"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-[9px] text-neutral-400 font-bold">QR લોડ થાય છે...</div>
                  )}
                </div>
                <div className="text-[10px] font-bold text-emerald-800">
                  {formData.customQrUrl ? '📌 કસ્ટમ સ્ટેન્ડી QR કોડ' : '⚡ ઓટોમેટિક ડાયનેમિક બિલ રકમ QR કોડ'}
                </div>
                <div className="text-[9.5px] text-neutral-600 font-mono">
                  UPI: {formData.upiId || '8140430395@apl'}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. AUTHORIZED SIGNATORY & STAMP (GOVERNMENT COMPLIANT MANDATE) */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-800" />
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  ૪. અધિકૃત સહી & સ્ટેમ્પ (Authorized Signatory & Stamp)
                </h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-blue-900">
                <input
                  type="checkbox"
                  checked={formData.billShowSignature}
                  onChange={e => setFormData({ ...formData, billShowSignature: e.target.checked })}
                  className="rounded accent-blue-600"
                />
                <span>બિલ પર સહી/સ્ટેમ્પ દર્શાવો</span>
              </label>
            </div>

            <p className="text-[11px] text-neutral-600 font-medium">
              🏛️ <b>સરકારી માન્યતા નિયમ:</b> સરકારી ઓફિસો, પંચાયત અને ટેક્સ ઇન્વોઇસમાં અધિકૃત સહી (Authorized Signatory) ફરજિયાત હોય છે. તમે તમારી સહીનો ફોટો/સ્ટેમ્પ અપલોડ કરી શકો છો અથવા સ્ક્રીન પર સહી દોરી શકો છો.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    ફર્મનું નામ (Signatory Title):
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryTitle}
                    onChange={e => setFormData({ ...formData, signatoryTitle: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase"
                    placeholder="For, PRISHA STATIONERY & ONLINE SERVICES"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-neutral-700 block mb-1">
                    સહી કેપ્શન (Signatory Designation):
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryName}
                    onChange={e => setFormData({ ...formData, signatoryName: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                    placeholder="Authorized Signatory / અધિકૃત સહી"
                  />
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {/* Upload Signature Image Button */}
                  <label className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-orange-400" />
                    <span>📁 સહી / સ્ટેમ્પ ફોટો અપલોડ</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageFileSelect(e, 'signatureUrl')}
                    />
                  </label>

                  {/* Draw Signature Button */}
                  <button
                    type="button"
                    onClick={() => setShowSignPad(prev => !prev)}
                    className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PenTool className="w-3.5 h-3.5 text-blue-700" />
                    <span>✍️ સ્ક્રીન પર સહી દોરો</span>
                  </button>

                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureUrl: '' })}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>સહી કાઢી નાખો</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Preview Box */}
              <div className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-200 flex flex-col items-center justify-center text-center space-y-2">
                <div className="text-[11px] font-black text-neutral-800">
                  બિલ પર સહી કેવું દેખાશે (Live Preview):
                </div>

                <div className="w-full max-w-[200px] border border-neutral-300 bg-white p-2 rounded-lg shadow-2xs space-y-1">
                  <div className="text-[9px] font-black text-neutral-700 uppercase truncate">
                    {formData.signatoryTitle || 'For, PRISHA STATIONERY'}
                  </div>

                  <div className="h-12 flex items-center justify-center border-b border-dashed border-neutral-300">
                    {formData.signatureUrl ? (
                      <img
                        src={formData.signatureUrl}
                        alt="Signature Preview"
                        className="max-h-11 max-w-[150px] object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-neutral-400 italic">
                        [સહી લાઇન: ________________]
                      </span>
                    )}
                  </div>

                  <div className="text-[9.5px] font-black text-neutral-800 pt-0.5">
                    {formData.signatoryName || 'Authorized Signatory'}
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 font-medium">
                  {formData.signatureUrl
                    ? '✅ ડિજિટલ સહી / સ્ટેમ્પ સેટ થયેલ છે'
                    : '💡 સહી અપલોડ ન કરો તો પણ બિલમાં સહી કરવાની ખાલી લાઇન આવશે'}
                </div>
              </div>
            </div>

            {/* Interactive Drawing Pad (If Opened) */}
            {showSignPad && (
              <div className="p-3 rounded-xl border-2 border-blue-600 bg-blue-50/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-blue-700" />
                    <span>ડિજિટલ પેનથી તમારી સહી અહીં દોરો (Draw Signature):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignPad(false)}
                    className="text-neutral-500 hover:text-black p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-2 border-neutral-400 rounded-lg bg-white overflow-hidden shadow-inner flex justify-center">
                  <canvas
                    ref={signCanvasRef}
                    width={360}
                    height={120}
                    className="cursor-crosshair touch-none bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={clearSignCanvas}
                    className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>સાફ કરો (Clear)</span>
                  </button>

                  <button
                    type="button"
                    onClick={saveDrawnSignature}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>આ સહી લાગુ કરો (Apply)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5. BILL TERMS, FRAUD WARNING & OFFERS */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                ૫. બિલ શરતો & સુરક્ષા નોંધ (Terms & Security)
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  બિલની શરતો અને નિયમો (Invoice Terms Note):
                </label>
                <input
                  type="text"
                  value={formData.billTermsNote}
                  onChange={e => setFormData({ ...formData, billTermsNote: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  બિલ ફૂટર આભાર સંદેશ (Footer Thank You Note):
                </label>
                <input
                  type="text"
                  value={formData.invoiceFooterNote}
                  onChange={e => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          {/* SAVE & SUBMIT FOOTER BAR */}
          <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-white sticky bottom-0 p-3 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 shadow-lg">
            <p className="text-[11px] text-neutral-600 font-bold text-center sm:text-left">
              💡 સેટિંગ્સ સેવ કરતા જ તમામ નવા અને જૂના બિલમાં સુધારો આપમેળે લાગુ થઈ જશે.
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                રદ કરો
              </button>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>બિલ સેટિંગ્સ સેવ કરો (Save Settings)</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
