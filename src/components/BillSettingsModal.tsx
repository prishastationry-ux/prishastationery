import React, { useState } from 'react';
import { FileText, X, Save, ShieldAlert, Sparkles, Image, Check, Eye, QrCode, Phone, MapPin } from 'lucide-react';
import { StoreSettings } from '../types';

interface BillSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (updated: Partial<StoreSettings>) => void;
  onUploadImage?: (e: React.ChangeEvent<HTMLInputElement>, target: 'leftLogo' | 'rightLogo' | 'customQr') => void;
}

export const BillSettingsModal: React.FC<BillSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onUploadImage
}) => {
  const [formData, setFormData] = useState<Partial<StoreSettings>>({
    storeNameEn: settings.storeNameEn || '',
    storeNameGu: settings.storeNameGu || '',
    tagline: settings.tagline || '',
    ownerName: settings.ownerName || '',
    phone: settings.phone || '',
    gstNumber: settings.gstNumber || '',
    address: settings.address || '',
    upiId: settings.upiId || '',
    payeeName: settings.payeeName || '',
    leftLogoUrl: settings.leftLogoUrl || '',
    rightLogoUrl: settings.rightLogoUrl || '',
    customQrUrl: settings.customQrUrl || '',
    invoiceFooterNote: settings.invoiceFooterNote || '',
    billFraudWarning: settings.billFraudWarning || '⚠️ સાવચેતી: કોઈપણ ઓનલાઇન છેતરપિંડીથી બચવા ફક્ત આ જ સત્તાવાર UPI QR / પ્રિષા સ્ટેશનરી પર પેમેન્ટ કરવું.',
    billSpecialOffer: settings.billSpecialOffer || '🎉 આ બિલ પર આગામી ખરીદીમાં વિશેષ ૫% ડિસ્કાઉન્ટ મેળવો!',
    billShowGst: settings.billShowGst !== false,
    billShowQr: settings.billShowQr !== false,
    billShowLogos: settings.billShowLogos !== false,
    billShowFraudWarning: settings.billShowFraudWarning !== false,
    billShowSpecialOffer: settings.billShowSpecialOffer !== false,
    billTermsNote: settings.billTermsNote || 'કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ. ખરીદેલ માલ પરત લેવાશે નહિ.'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border-2 border-neutral-800 shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>🧾 બિલ ડિઝાઇન અને વિગતો કસ્ટમાઇઝેશન (Bill Settings)</span>
              </h2>
              <p className="text-[11px] text-blue-200 font-bold">
                બિલનું નામ, GST, લોગો, ફ્રોડ વોર્નિંગ મેસેજ, સ્પેશિયલ ઓફર અને શરતો અહીંથી એડિટ કરો
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-50/40">
          
          {/* SECTION 1: STORE HEADER DETAILS */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-700"></span>
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                ૧. દુકાન હેડર વિગતો (Store Header Details)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાનનું અંગ્રેજી નામ (English Title):
                </label>
                <input
                  type="text"
                  value={formData.storeNameEn}
                  onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાનનું ગુજરાતી નામ (Gujarati Title):
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
                  ટેગલાઇન / મુખ્ય સેવાઓ (Tagline):
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
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
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  દુકાનનું સરનામું (Shop Address on Bill):
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  હેલ્પલાઇન / મોબાઇલ નંબર:
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black text-neutral-700">
                    GST નંબર (GSTIN):
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-blue-700">
                    <input
                      type="checkbox"
                      checked={formData.billShowGst}
                      onChange={e => setFormData({ ...formData, billShowGst: e.target.checked })}
                      className="rounded accent-blue-700"
                    />
                    <span>બિલમાં દર્શાવો</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700 uppercase"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LOGOS & PAYMENT QR CODE */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  ૨. લોગો અને પેમેન્ટ QR કોડ (Logos & Payment QR)
                </h3>
              </div>
              <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-orange-700">
                <input
                  type="checkbox"
                  checked={formData.billShowLogos}
                  onChange={e => setFormData({ ...formData, billShowLogos: e.target.checked })}
                  className="rounded accent-orange-600"
                />
                <span>લોગો બતાવો</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  ડાબો લોગો URL / ફોટો:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... અથવા અપલોડ કરો"
                    value={formData.leftLogoUrl}
                    onChange={e => setFormData({ ...formData, leftLogoUrl: e.target.value })}
                    className="flex-1 text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  />
                  {onUploadImage && (
                    <label className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <Image className="w-3.5 h-3.5" />
                      <span>અપલોડ</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onUploadImage(e, 'leftLogo')}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  જમણો લોગો URL / ફોટો:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... અથવા અપલોડ કરો"
                    value={formData.rightLogoUrl}
                    onChange={e => setFormData({ ...formData, rightLogoUrl: e.target.value })}
                    className="flex-1 text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  />
                  {onUploadImage && (
                    <label className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <Image className="w-3.5 h-3.5" />
                      <span>અપલોડ</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onUploadImage(e, 'rightLogo')}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-neutral-700 block mb-1">
                  સત્તાવાર UPI ID:
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black text-neutral-700">
                    કસ્ટમ QR કોડ ફોટો (Custom QR):
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={formData.billShowQr}
                      onChange={e => setFormData({ ...formData, billShowQr: e.target.checked })}
                      className="rounded accent-emerald-600"
                    />
                    <span>QR કોડ બતાવો</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ઓટો QR કોડ અથવા કસ્ટમ ફોટો"
                    value={formData.customQrUrl}
                    onChange={e => setFormData({ ...formData, customQrUrl: e.target.value })}
                    className="flex-1 text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                  />
                  {onUploadImage && (
                    <label className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>અપલોડ</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => onUploadImage(e, 'customQr')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FRAUD WARNING, SPECIAL OFFER & BILL TERMS */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                ૩. છેતરપિંડી સાવચેતી, સ્પેશિયલ ઓફર & શરતો (Fraud Warning & Offers)
              </h3>
            </div>

            {/* Fraud Protection Note */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-red-700 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>છેતરપિંડીથી બચવા સાવચેતી મેસેજ (Fraud Protection Alert):</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-red-700">
                  <input
                    type="checkbox"
                    checked={formData.billShowFraudWarning}
                    onChange={e => setFormData({ ...formData, billShowFraudWarning: e.target.checked })}
                    className="rounded accent-red-600"
                  />
                  <span>બિલ પર દર્શાવો</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.billFraudWarning}
                onChange={e => setFormData({ ...formData, billFraudWarning: e.target.value })}
                placeholder="દા.ત. કોઈપણ છેતરપિંડીથી બચવા ફક્ત આ જ સત્તાવાર UPI QR પર પેમેન્ટ કરવું."
                className="w-full text-xs font-bold p-2 bg-red-50/50 border border-red-200 rounded-lg outline-none focus:border-red-600 text-red-900"
              />
            </div>

            {/* Special Running Offer on Bill */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>બિલ પર ચાલતી સ્પેશિયલ ઓફર લાઇન (Running Offer Text):</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-amber-700">
                  <input
                    type="checkbox"
                    checked={formData.billShowSpecialOffer}
                    onChange={e => setFormData({ ...formData, billShowSpecialOffer: e.target.checked })}
                    className="rounded accent-amber-600"
                  />
                  <span>બિલ પર દર્શાવો</span>
                </label>
              </div>
              <input
                type="text"
                value={formData.billSpecialOffer}
                onChange={e => setFormData({ ...formData, billSpecialOffer: e.target.value })}
                placeholder="દા.ત. આ બિલ પર આગામી ખરીદીમાં વિશેષ ૫% ડિસ્કાઉન્ટ મેળવો!"
                className="w-full text-xs font-bold p-2 bg-amber-50/50 border border-amber-200 rounded-lg outline-none focus:border-amber-600 text-amber-900"
              />
            </div>

            {/* Footer Terms */}
            <div>
              <label className="text-[11px] font-black text-neutral-700 block mb-1">
                બિલ નીચેની શરતો અને આભાર નોટ (Footer Terms / Thank You Note):
              </label>
              <textarea
                rows={2}
                value={formData.invoiceFooterNote}
                onChange={e => setFormData({ ...formData, invoiceFooterNote: e.target.value })}
                className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
              />
            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="p-3.5 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-[11px] font-bold text-neutral-500 hidden sm:block">
            💾 સેવ કરતાં જ તમામ નવા બિલો અને પ્રિન્ટ્સમાં આ જ માહિતી દેખાશે.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-800 text-xs font-black rounded-xl border border-neutral-300 cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-[#0B1E48] hover:bg-blue-900 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-orange-400" />
              <span>બિલ સેટિંગ્સ સેવ કરો</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
