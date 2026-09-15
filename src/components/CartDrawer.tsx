import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Check,
  QrCode,
  Banknote,
  Copy,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  Camera,
  Upload,
  AlertCircle
} from 'lucide-react';
import { CartItem, StoreSettings } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  storeSettings: StoreSettings;
  onConfirmOrder: (orderDetails: {
    customerName: string;
    mobile: string;
    address: string;
    paymentMode: 'UPI' | 'Cash';
    paymentScreenshot?: string;
  }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  storeSettings,
  onConfirmOrder
}) => {
  // Step in Checkout: 1 = Review Cart, 2 = Customer Info & Payment
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [address3, setAddress3] = useState('');
  const [address4, setAddress4] = useState('');
  const [address5, setAddress5] = useState('');
  const isUpiAllowed = !storeSettings.hideUpiOnBill && storeSettings.billShowUpi !== false;
  const paymentMode = 'UPI'; // Enforce UPI
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [formError, setFormError] = useState('');

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Reset to Step 1 when cart is opened or emptied
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormError('');
    }
  }, [isOpen]);

  // Generate UPI QR Code dynamically based on cart total
  useEffect(() => {
    if (cartTotal > 0 && paymentMode === 'UPI') {
      const upiString = `upi://pay?pa=${encodeURIComponent(storeSettings.upiId)}&pn=${encodeURIComponent(storeSettings.payeeName)}&am=${cartTotal}&cu=INR&tn=PrishaStationeryOrder`;
      QRCode.toDataURL(upiString, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then(url => setUpiQrUrl(url))
        .catch(err => console.error(err));
    }
  }, [cartTotal, paymentMode, storeSettings.upiId, storeSettings.payeeName]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleProceedToStep2 = () => {
    if (cart.length === 0) return;
    setStep(2);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentScreenshot(reader.result);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError('⚠️ કૃપા કરીને તમારું પૂરું નામ દાખલ કરો.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setFormError('⚠️ કૃપા કરીને માન્ય ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો.');
      return;
    }
    if (!address1.trim() || !address2.trim() || !address3.trim() || !address4.trim() || !address5.trim()) {
      setFormError('⚠️ કૃપા કરીને સરનામાની તમામ વિગતો (ઘર નંબર, ગામ, તાલુકો, જિલ્લો, પિનકોડ) દાખલ કરો.');
      return;
    }
    if (!paymentScreenshot) {
      setFormError('⚠️ ઓર્ડર કન્ફર્મ કરવા માટે ઓનલાઇન પેમેન્ટ (QR સ્કેન) કરી સ્ક્રીનશોટ અપલોડ કરવો ફરજિયાત છે!');
      return;
    }

    setFormError('');
    const fullAddress = `${address1.trim()}, મુ/પો: ${address2.trim()}, તા: ${address3.trim()}, જિ: ${address4.trim()}, પિનકોડ: ${address5.trim()}`;
    
    onConfirmOrder({
      customerName: customerName.trim(),
      mobile: mobile.trim(),
      address: fullAddress,
      paymentMode: 'Online',
      paymentScreenshot: paymentScreenshot || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* BACKDROP OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
      />

      {/* SIDE DRAWER CONTAINER */}
      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-neutral-300">
        
        {/* DRAWER HEADER */}
        <div className="p-3.5 sm:p-4 bg-[#0B1E48] text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {step === 1 ? `તમારું શોપિંગ કાર્ટ (${totalItemsCount})` : 'ઓર્ડર અને પેમેન્ટ વિગતો'}
              </h2>
              <p className="text-[10px] text-neutral-300 font-bold">
                {step === 1 ? 'પસંદ કરેલી વસ્તુઓ તપાસો' : 'પગલું ૨: સરનામું અને ચુકવણી'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 flex items-center justify-between text-xs font-black">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-orange-600' : 'text-emerald-700'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 1 ? 'bg-orange-500 text-black' : 'bg-emerald-600 text-white'
            }`}>
              {step === 1 ? '1' : <Check className="w-3 h-3" />}
            </span>
            <span>૧. વસ્તુઓની યાદી</span>
          </div>

          <span className="text-neutral-300">━━━━━━━━</span>

          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-orange-600' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 2 ? 'bg-orange-500 text-black' : 'bg-neutral-300 text-neutral-700'
            }`}>
              2
            </span>
            <span>૨. ડિલિવરી & પેમેન્ટ</span>
          </div>
        </div>

        {/* DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center text-3xl">
                🛒
              </div>
              <h3 className="text-base font-black text-neutral-800">તમારું કાર્ટ ખાલી છે!</h3>
              <p className="text-xs text-neutral-500 max-w-xs font-medium">
                હોમ પેજ પરથી નોટબુક, સ્ટેશનરી અથવા ઓનલાઇન સેવાઓ પસંદ કરીને કાર્ટમાં ઉમેરો.
              </p>
              <button
                onClick={onClose}
                className="bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                ખરીદી શરૂ કરો
              </button>
            </div>
          ) : step === 1 ? (
            /* ========================================================================= */
            /* STEP 1: CART ITEMS LIST */
            /* ========================================================================= */
            <div className="space-y-3">
              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {cart.map(item => (
                  <div key={item.product.id} className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors">
                    
                    {/* Item Icon or Custom Image */}
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.nameGu} className="w-full h-full object-cover" />
                      ) : (
                        item.product.icon || '📦'
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-neutral-900 leading-snug truncate">
                        {item.product.nameGu}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-bold truncate">
                        {item.product.nameEn}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-orange-700">
                          ₹{item.product.price}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">/ {item.product.unit}</span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-neutral-100 rounded-lg p-1 border border-neutral-200">
                      <button
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-white hover:bg-neutral-200 text-neutral-800 flex items-center justify-center text-xs font-black shadow-2xs cursor-pointer transition-transform active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black w-5 text-center text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-orange-500 hover:bg-orange-600 text-black flex items-center justify-center text-xs font-black shadow-2xs cursor-pointer transition-transform active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total for Item & Delete */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-neutral-900">
                        ₹{item.product.price * item.quantity}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-neutral-400 hover:text-red-600 p-1 transition-colors mt-0.5"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Quick Bill Summary Card */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                  <span>કુલ આઇટમ્સ:</span>
                  <span>{totalItemsCount} નંગ</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                  <span>ડિલિવરી / પ્રોસેસિંગ ફી:</span>
                  <span className="text-emerald-700 font-black">મફત (Free)</span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex items-center justify-between text-sm font-black text-neutral-900">
                  <span>કુલ ચૂકવવાપાત્ર રકમ:</span>
                  <span className="text-base font-black text-orange-700">₹{cartTotal}/-</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STEP 2: CUSTOMER DETAILS & PAYMENT SELECTION */
            /* ========================================================================= */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* Back to Step 1 Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>કાર્ટમાં ફેરફાર કરો</span>
              </button>

              {formError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-200 text-xs font-black">
                  {formError}
                </div>
              )}

              {/* Customer Inputs */}
              <div className="space-y-2.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>ગ્રાહકની માહિતી (Customer Details)</span>
                </h4>

                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    તમારું પૂરું નામ (Full Name) *
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. ભરતભાઈ પટેલ"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    મોબાઇલ નંબર (Mobile No) *
                  </label>
                  <input
                    type="tel"
                    placeholder="દા.ત. 9825012345"
                    value={mobile}
                    maxLength={10}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                      ઘર નંબર / મહોલ્લો / શેરી (House No / Street) *
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. ૧૦૧, પટેલ વાસ"
                      value={address1}
                      onChange={e => setAddress1(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                      ગામ / શહેર (Village / City) *
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. વાવ"
                      value={address2}
                      onChange={e => setAddress2(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">તાલુકો *</label>
                      <input
                        type="text"
                        placeholder="દા.ત. થરાદ"
                        value={address3}
                        onChange={e => setAddress3(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">જિલ્લો *</label>
                      <input
                        type="text"
                        placeholder="દા.ત. બનાસકાંઠા"
                        value={address4}
                        onChange={e => setAddress4(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                      પિનકોડ (Pincode) *
                    </label>
                    <input
                      type="tel"
                      placeholder="દા.ત. 385565"
                      value={address5}
                      maxLength={6}
                      onChange={e => setAddress5(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Payment Section */}
              <div className="space-y-2.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-orange-600" />
                  <span>ફરજિયાત ઓનલાઇન પેમેન્ટ (Online Payment)</span>
                </h4>

                <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center text-center space-y-2.5">
                  <p className="text-[11px] font-black text-red-700">
                    ⚠️ રોકડ (Cash on Delivery) સુવિધા ઉપલબ્ધ નથી. ઓર્ડર માટે ફરજિયાત પેમેન્ટ કરવાનું રહેશે.
                  </p>
                  <p className="text-[11px] font-black text-neutral-800">
                    📱 નીચેનો QR કોડ સ્કેન કરીને <span className="text-orange-600">₹{cartTotal}/-</span> ચૂકવો
                  </p>
                  
                  {upiQrUrl && (
                    <div className="p-2 bg-white rounded-lg border shadow-xs">
                      <img src={upiQrUrl} alt="UPI QR" className="w-36 h-36 object-contain" />
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] font-black bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                    <span>UPI ID: <strong className="text-blue-800 font-mono">{storeSettings.upiId}</strong></span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-neutral-500 hover:text-black p-0.5 ml-1 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* MANDATORY SCREENSHOT UPLOAD SECTION */}
                  <div className="w-full pt-2 border-t border-dashed border-red-300 text-left">
                    <label className="text-[11px] font-black text-neutral-800 flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1 text-red-600">
                        <Camera className="w-3.5 h-3.5 text-orange-600" />
                        <span>પેમેન્ટ સ્ક્રીનશોટ (ફરજિયાત *)</span>
                      </span>
                      {paymentScreenshot && (
                        <span className="text-emerald-700 text-[10px] font-black flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> અપલોડ થઈ ગયું
                        </span>
                      )}
                    </label>

                    {paymentScreenshot ? (
                      <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                        <img
                          src={paymentScreenshot}
                          alt="Payment Proof"
                          className="w-14 h-14 object-cover rounded-lg border border-emerald-300"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-emerald-900 truncate">
                            ✅ સ્ક્રીનશોટ સિલેક્ટ થઈ ગયો
                          </p>
                          <label className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer block mt-0.5">
                            <span>ફોટો બદલો</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentScreenshot('')}
                          className="p-1 text-neutral-400 hover:text-red-600"
                          title="Remove Screenshot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-orange-400 hover:border-orange-600 rounded-xl bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer text-center">
                        <Upload className="w-6 h-6 text-orange-600 mb-1" />
                        <span className="text-xs font-black text-orange-950">
                          પેમેન્ટ કરેલ સ્ક્રીનશોટ અહીં અપલોડ કરો *
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold mt-0.5">
                          (Google Pay / PhonePe / Paytm માંથી સ્ક્રીનશોટ સિલેક્ટ કરો)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* DRAWER FOOTER / ACTION BUTTON */}
        {cart.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-neutral-600">ચૂકવવાપાત્ર રકમ:</span>
              <span className="text-base text-orange-700 font-black">₹{cartTotal}/-</span>
            </div>

            {step === 1 ? (
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <span>આગળ વધો (Proceed to Checkout)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ઓર્ડર કન્ફર્મ કરો અને રસીદ મેળવો</span>
              </button>
            )}
          </div>
        )}

      </aside>
    </div>
  );
};
