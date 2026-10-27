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
  AlertCircle,
  Truck,
  Package,
  Tag,
  Info,
  Store
} from 'lucide-react';
import { CartItem, StoreSettings } from '../types';
import { GUJARAT_DISTRICTS, getVillagesForTaluka, getPincodeForTaluka } from '../lib/gujaratDistricts';

export interface CustomerOrderPayload {
  customerName: string;
  mobile: string;
  address: string;
  paymentMode: 'UPI' | 'Cash' | 'Online';
  paymentScreenshot?: string;
  discount?: number;
  discountCode?: string;
  subtotal: number;
  deliveryCharge: number;
  deliveryType: 'cover' | 'parcel' | 'pickup';
  packageWeightKg: number;
  platformFee: number;
  packingCharge: number;
  otherFee: number;
  otherFeeLabel?: string;
  total: number;
  transactionId?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  pincode?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  storeSettings: StoreSettings;
  onConfirmOrder: (orderDetails: CustomerOrderPayload) => void;
  isAdminUnlocked?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  storeSettings,
  onConfirmOrder,
  isAdminUnlocked = false
}) => {
  // Step in Checkout: 1 = Review Cart, 2 = Customer Info & Payment
  const [step, setStep] = useState<1 | 2>(1);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number} | null>(null);

  // Delivery configuration state: cover | parcel | pickup
  const [deliveryType, setDeliveryType] = useState<'cover' | 'parcel' | 'pickup'>('cover');
  const [packageWeightKg, setPackageWeightKg] = useState<number>(1);

  // Payment mode state: Online (UPI QR) or Cash (Pay at Shop Counter)
  const [paymentMode, setPaymentMode] = useState<'Online' | 'Cash'>('Online');

  // Form Fields - Structured Address
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [stateSelection, setStateSelection] = useState<'Gujarat' | 'Other'>('Gujarat');
  const [customStateName, setCustomStateName] = useState('');
  
  // Gujarat location fields
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('banaskantha');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('થરાદ (Tharad)');
  const [villageName, setVillageName] = useState<string>('');
  const [houseStreet, setHouseStreet] = useState<string>('');
  const [pincode, setPincode] = useState<string>('385565');
  
  // Other State fields
  const [otherDistrict, setOtherDistrict] = useState<string>('');
  const [otherCityTaluka, setOtherCityTaluka] = useState<string>('');
  const [otherVillageStreet, setOtherVillageStreet] = useState<string>('');
  const [otherPincode, setOtherPincode] = useState<string>('');

  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [formError, setFormError] = useState('');

  // Cart subtotal
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Delivery & Platform Fee Calculations
  const isFreeDelivery = Boolean(
    storeSettings.deliveryFreeAbove &&
    storeSettings.deliveryFreeAbove > 0 &&
    cartTotal >= storeSettings.deliveryFreeAbove
  );

  // Is this order a shop counter / cash / admin logged-in order?
  const isZeroFeeOrder = isAdminUnlocked === true || paymentMode === 'Cash' || deliveryType === 'pickup';

  const coverCharge = storeSettings.deliveryCoverCharge ?? 50;
  const parcelPerKgCharge = storeSettings.deliveryChargePerKg ?? 100;
  const rawDeliveryCharge = deliveryType === 'pickup'
    ? 0
    : deliveryType === 'cover'
      ? coverCharge
      : (parcelPerKgCharge * Math.max(1, packageWeightKg));
  const deliveryCharge = (isZeroFeeOrder || storeSettings.deliveryChargeEnabled === false || isFreeDelivery)
    ? 0
    : rawDeliveryCharge;

  const platformFee = (storeSettings.platformFeeEnabled === true && (storeSettings.platformFeeAmount || 0) > 0 && !isZeroFeeOrder)
    ? (storeSettings.platformFeeAmount || 0)
    : 0;
  const packingCharge = (isZeroFeeOrder || storeSettings.packingChargeEnabled === false)
    ? 0
    : (storeSettings.packingChargeAmount ?? 30);
  const otherFee = (!isZeroFeeOrder && storeSettings.otherFeeEnabled && (storeSettings.otherFeeAmount || 0) > 0) ? (storeSettings.otherFeeAmount || 0) : 0;
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;

  // Final Payable Grand Total (Before Payment)
  const finalPayableTotal = Math.max(0, cartTotal + deliveryCharge + platformFee + packingCharge + otherFee - discountAmount);

  // Active District object
  const activeDistrict = GUJARAT_DISTRICTS.find(d => d.id === selectedDistrictId) || GUJARAT_DISTRICTS[0];

  // Available villages for current taluka
  const suggestedVillages = getVillagesForTaluka(selectedTaluka);

  // When District changes, update Taluka and Pincode
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const districtObj = GUJARAT_DISTRICTS.find(d => d.id === districtId);
    if (districtObj && districtObj.talukas.length > 0) {
      const firstTaluka = districtObj.talukas[0];
      setSelectedTaluka(firstTaluka);
      const autoPin = getPincodeForTaluka(firstTaluka);
      if (autoPin) setPincode(autoPin);
    }
  };

  // When Taluka changes, update Pincode
  const handleTalukaChange = (talukaName: string) => {
    setSelectedTaluka(talukaName);
    const autoPin = getPincodeForTaluka(talukaName);
    if (autoPin) {
      setPincode(autoPin);
    }
  };

  // Auto-detect if cart contains heavier items or documents
  useEffect(() => {
    if (cart.length > 0) {
      const totalQuantity = cart.reduce((sum, it) => sum + it.quantity, 0);
      const hasBulkyItems = cart.some(it => 
        it.product.nameGu.includes('ચોપડા') ||
        it.product.nameGu.includes('નોટબુક') ||
        it.product.nameGu.includes('રીમ') ||
        it.product.nameGu.includes('ફાઇલ') ||
        it.product.nameGu.includes('ક્લે') ||
        it.product.nameGu.includes('કંપાસ') ||
        it.product.nameGu.includes('બેગ')
      );
      if (hasBulkyItems || totalQuantity >= 4) {
        setDeliveryType('parcel');
        const estimatedWeight = Math.max(1, Math.ceil(totalQuantity / 4));
        setPackageWeightKg(estimatedWeight);
      } else {
        setDeliveryType('cover');
      }
    }
  }, [cart.length]);

  // Generate QR Code with FINAL PAYABLE TOTAL (including delivery & all fees)
  useEffect(() => {
    if (storeSettings.upiId && finalPayableTotal > 0) {
      const payeeName = storeSettings.payeeName || storeSettings.storeNameEn || 'Prisha Stationery';
      const upiLink = `upi://pay?pa=${storeSettings.upiId}&pn=${encodeURIComponent(payeeName)}&am=${finalPayableTotal}&cu=INR`;
      QRCode.toDataURL(upiLink, { width: 256, margin: 1 })
        .then(url => setUpiQrUrl(url))
        .catch(err => console.error(err));
    }
  }, [storeSettings.upiId, storeSettings.payeeName, storeSettings.storeNameEn, finalPayableTotal]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToStep2 = () => {
    setFormError('');
    setStep(2);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Default name to "Happy Customer" if empty
    const finalCustomerName = customerName.trim() || 'Happy Customer';
    const finalMobile = mobile.trim();

    if (finalMobile && finalMobile.length < 10) {
      setFormError('⚠️ કૃપા કરીને માન્ય ૧૦ આંકડાનો મોબાઇલ નંબર દાખલ કરો.');
      return;
    }

    let fullAddress = '';
    let stateVal = 'ગુજરાત (Gujarat)';
    let districtVal = activeDistrict.nameGu;
    let talukaVal = selectedTaluka;
    let villageVal = villageName.trim();
    let pinVal = pincode.trim();

    if (deliveryType === 'pickup') {
      fullAddress = `🏪 દુકાને રૂબરૂ પિકઅપ (${storeSettings.storeNameGu || storeSettings.storeNameEn || 'દુકાન'} - ${storeSettings.address || 'દુકાન સરનામે'})`;
      stateVal = 'ગુજરાત (Gujarat)';
      districtVal = 'દુકાને પિકઅપ';
      talukaVal = 'રૂબરૂ';
      villageVal = 'દુકાન કાઉન્ટર';
      pinVal = storeSettings.pincode || '385565';
    } else if (stateSelection === 'Gujarat') {
      if (!houseStreet.trim()) {
        setFormError('⚠️ કૃપા કરીને ઘર નંબર, સોસાયટી અથવા શેરીનું નામ દાખલ કરો.');
        return;
      }
      if (!villageVal) {
        setFormError('⚠️ કૃપા કરીને તમારું ગામ કે શહેર પસંદ કરો અથવા લખો.');
        return;
      }
      if (!pinVal || pinVal.length < 6) {
        setFormError('⚠️ કૃપા કરીને માન્ય ૬ આંકડાનો પિનકોડ દાખલ કરો.');
        return;
      }
      fullAddress = `${houseStreet.trim()}, મુ/પો: ${villageVal}, તા: ${talukaVal}, જિ: ${districtVal}, ગુજરાત - ${pinVal}`;
    } else {
      stateVal = customStateName.trim() || 'અન્ય રાજ્ય';
      districtVal = otherDistrict.trim();
      talukaVal = otherCityTaluka.trim();
      villageVal = otherVillageStreet.trim();
      pinVal = otherPincode.trim();

      if (!stateVal || !districtVal || !talukaVal || !villageVal || !pinVal) {
        setFormError('⚠️ કૃપા કરીને સરનામાની તમામ વિગતો (રાજ્ય, જિલ્લો, શહેર/તાલુકો, સરનામું અને પિનકોડ) દાખલ કરો.');
        return;
      }
      fullAddress = `${villageVal}, ${talukaVal}, જિ: ${districtVal}, ${stateVal} - ${pinVal}`;
    }

    if (paymentMode === 'Online' && !paymentScreenshot) {
      setFormError('⚠️ ઓર્ડર કન્ફર્મ કરવા માટે ઓનલાઇન પેમેન્ટ (QR સ્કેન) કરી સ્ક્રીનશોટ અપલોડ કરવો ફરજિયાત છે!');
      return;
    }

    setFormError('');

    onConfirmOrder({
      customerName: finalCustomerName,
      mobile: finalMobile,
      address: fullAddress,
      state: stateVal,
      district: districtVal,
      taluka: talukaVal,
      village: villageVal,
      pincode: pinVal,
      paymentMode: paymentMode,
      paymentScreenshot: paymentScreenshot || undefined,
      subtotal: cartTotal,
      deliveryCharge: deliveryCharge,
      deliveryType: deliveryType,
      packageWeightKg: packageWeightKg,
      platformFee: platformFee,
      packingCharge: packingCharge,
      otherFee: otherFee,
      otherFeeLabel: storeSettings.otherFeeLabel || 'અન્ય સર્વિસ ચાર્જ',
      discount: discountAmount,
      total: finalPayableTotal,
      transactionId: transactionId.trim() || undefined
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
      <aside className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-neutral-300">
        
        {/* DRAWER HEADER */}
        <div className="p-3.5 sm:p-4 bg-[#0B1E48] text-white flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">
                {step === 1 ? `તમારું શોપિંગ કાર્ટ (${totalItemsCount})` : 'ઓર્ડર અને પેમેન્ટ વિગતો'}
              </h2>
              <p className="text-[10px] text-neutral-300 font-bold">
                {step === 1 ? 'પસંદ કરેલી વસ્તુઓ & ચાર્જ વિગત' : 'પગલું ૨: સરનામું અને ઓનલાઇન પેમેન્ટ'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEPPER PROGRESS */}
        <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 flex items-center justify-between text-xs font-black shrink-0">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-orange-600' : 'text-emerald-700'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 1 ? 'bg-orange-500 text-black' : 'bg-emerald-600 text-white'
            }`}>
              {step === 1 ? '1' : <Check className="w-3 h-3" />}
            </span>
            <span>૧. વસ્તુઓ & ચાર્જીસ</span>
          </div>

          <span className="text-neutral-300">━━━━━━━━</span>

          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-orange-600' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              step === 2 ? 'bg-orange-500 text-black' : 'bg-neutral-300 text-neutral-700'
            }`}>
              2
            </span>
            <span>૨. સરનામું & પેમેન્ટ</span>
          </div>
        </div>

        {/* DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
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
            /* STEP 1: CART ITEMS LIST & LIVE CHARGES BREAKDOWN */
            /* ========================================================================= */
            <div className="space-y-3.5">
              
              {/* Product items list */}
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
                        className="text-neutral-400 hover:text-red-600 p-1 transition-colors mt-0.5 cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* DELIVERY TYPE SELECTION BOX */}
              {storeSettings.deliveryChargeEnabled !== false && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <span>ડિલિવરી પ્રકાર પસંદ કરો (Delivery Type):</span>
                    </span>
                    {isFreeDelivery && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        🎉 ફ્રી ડિલિવરી ઓફર
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Option 1: Cover / Envelope */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('cover')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        deliveryType === 'cover'
                          ? 'bg-white border-blue-600 ring-2 ring-blue-400 text-blue-950 font-black shadow-xs'
                          : 'bg-white/70 border-neutral-300 text-neutral-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs">✉️ કવર / ડોક્યુમેન્ટ</span>
                        <span className="text-blue-700 font-black">₹{coverCharge}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-normal mt-0.5">
                        કાર્ડ, કાગળ, પ્રમાણપત્ર
                      </p>
                    </button>

                    {/* Option 2: Parcel by Weight */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('parcel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        deliveryType === 'parcel'
                          ? 'bg-white border-blue-600 ring-2 ring-blue-400 text-blue-950 font-black shadow-xs'
                          : 'bg-white/70 border-neutral-300 text-neutral-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs">📦 પાર્સલ (પ્રતિ KG)</span>
                        <span className="text-blue-700 font-black">₹{parcelPerKgCharge}/KG</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-normal mt-0.5">
                        નોટબુક, સ્ટેશનરી સામાન
                      </p>
                    </button>

                    {/* Option 3: Shop Pickup (Free) */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        deliveryType === 'pickup'
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400 text-emerald-950 font-black shadow-xs'
                          : 'bg-white/70 border-neutral-300 text-neutral-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs">🏪 દુકાનેથી પિકઅપ</span>
                        <span className="text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">₹0 ફ્રી</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                        રૂબરૂ લેવા (કોઈ ચાર્જ નહિ)
                      </p>
                    </button>
                  </div>

                  {/* Parcel Weight Selector */}
                  {deliveryType === 'parcel' && (
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-200 text-xs">
                      <span className="font-bold text-neutral-700">પાર્સલ વજન (Weight):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPackageWeightKg(w => Math.max(1, w - 1))}
                          className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 font-black text-neutral-800 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-black text-blue-900 min-w-12 text-center">
                          {packageWeightKg} KG
                        </span>
                        <button
                          type="button"
                          onClick={() => setPackageWeightKg(w => Math.min(20, w + 1))}
                          className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 font-black text-neutral-800 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                        <span className="text-neutral-400 text-[11px] font-bold">
                          = ₹{parcelPerKgCharge * packageWeightKg}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pickup Info Banner in Step 1 */}
                  {deliveryType === 'pickup' && (
                    <div className="flex items-center gap-2 bg-emerald-100/70 border border-emerald-300 text-emerald-900 p-2.5 rounded-lg text-xs font-bold">
                      <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        દુકાનેથી પિકઅપ પસંદ કર્યું છે: ડિલિવરી ચાર્જ અને પેકિંગ ચાર્જ <strong>₹૦ (સંપૂર્ણ મફત)</strong> રહેશે!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* COMPLETE CHARGES BREAKDOWN CARD */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                  <span>સામાન કુલ (Cart Subtotal):</span>
                  <span className="font-black text-neutral-900">₹{cartTotal.toFixed(2)}</span>
                </div>

                {/* Delivery Charge */}
                {deliveryType === 'pickup' ? (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1.5 font-black">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>🏪 દુકાનેથી પિકઅપ:</span>
                    </span>
                    <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      ₹0 (મફત / કોઈ ચાર્જ નહિ)
                    </span>
                  </div>
                ) : storeSettings.deliveryChargeEnabled !== false ? (
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        ડિલિવરી ચાર્જ ({deliveryType === 'cover' ? '✉️ કવર' : `📦 પાર્સલ ${packageWeightKg} KG`}):
                      </span>
                    </span>
                    {isFreeDelivery ? (
                      <span className="text-emerald-700 font-black">મફત (Free)</span>
                    ) : (
                      <span className="text-blue-900 font-black">+₹{deliveryCharge.toFixed(2)}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>ડિલિવરી:</span>
                    <span className="font-black">મફત (Free)</span>
                  </div>
                )}

                {/* Platform Fee */}
                {platformFee > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 text-indigo-600" />
                      <span>પ્લેટફોર્મ સર્વિસ ફી (Platform Fee):</span>
                    </span>
                    <span className="text-indigo-900 font-black">+₹{platformFee.toFixed(2)}</span>
                  </div>
                )}

                {/* Safe Packing Charge */}
                {storeSettings.packingChargeEnabled !== false && packingCharge > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>સુરક્ષિત પેકિંગ ચાર્જ (Packing):</span>
                    </span>
                    <span className="text-emerald-900 font-black">+₹{packingCharge.toFixed(2)}</span>
                  </div>
                )}

                {/* Other Custom Fee */}
                {storeSettings.otherFeeEnabled && otherFee > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      <span>{storeSettings.otherFeeLabel || 'અન્ય ચાર્જ'}:</span>
                    </span>
                    <span className="text-purple-900 font-black">+₹{otherFee.toFixed(2)}</span>
                  </div>
                )}

                {/* Promo discount if any */}
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-red-600">
                    <span>ડિસ્કાઉન્ટ ({appliedPromo?.code}):</span>
                    <span className="font-black">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* FINAL PAYABLE TOTAL */}
                <div className="border-t-2 border-neutral-300 pt-2 flex items-center justify-between text-sm font-black text-neutral-900">
                  <div>
                    <span>કુલ ચૂકવવાપાત્ર રકમ (Grand Total):</span>
                    <p className="text-[10px] text-neutral-500 font-normal">
                      બધા ચાર્જિસ સહિત ચોખ્ખી રકમ
                    </p>
                  </div>
                  <span className="text-lg font-black text-orange-700">₹{finalPayableTotal}/-</span>
                </div>
              </div>

              {/* Guarantees Note */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-start gap-2 text-emerald-900 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  ૧૦૦% સુરક્ષિત પેકિંગ સાથે બનાસકાંઠા / સમગ્ર ગુજરાતમાં ઝડપી ડિલિવરી.
                </span>
              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* STEP 2: CUSTOMER DETAILS, GUJARAT AUTO ADDRESS & PAYMENT SELECTION */
            /* ========================================================================= */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* Back to Step 1 Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>કાર્ટ & ચાર્જિસમાં ફેરફાર કરો</span>
              </button>

              {formError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-200 text-xs font-black flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-2.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5 border-b pb-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>ગ્રાહકની માહિતી (Customer Details)</span>
                </h4>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-700 block">
                      તમારું પૂરું નામ (Full Name)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomerName('Happy Customer')}
                      className="text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      😊 Happy Customer
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="ખાલી રાખશો તો 'Happy Customer' લખાશે"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    મોબાઇલ નંબર (Mobile No - વૈકલ્પિક)
                  </label>
                  <input
                    type="tel"
                    placeholder="વૈકલ્પિક (ખાલી રાખી શકો છો)"
                    value={mobile}
                    maxLength={10}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              {/* STRUCTURED ADDRESS OR SHOP PICKUP CARD */}
              {deliveryType === 'pickup' ? (
                <div className="space-y-3 bg-emerald-50/80 p-3.5 rounded-xl border-2 border-emerald-300">
                  <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">🏪 દુકાનેથી રૂબરૂ પિકઅપ (Shop Pickup)</h4>
                      <p className="text-[10px] text-emerald-700 font-bold">ડિલિવરી સરનામું ભરવાની જરૂર નથી</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs space-y-1.5 text-neutral-800">
                    <p className="font-black text-emerald-950 text-xs">
                      {storeSettings.storeNameGu || storeSettings.storeNameEn || 'પ્રિશા સ્ટેશનરી & ઝેરોક્ષ'}
                    </p>
                    {storeSettings.address && (
                      <p className="text-neutral-600 text-[11px] flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <span>{storeSettings.address}</span>
                      </p>
                    )}
                    {storeSettings.phoneDisplay && (
                      <p className="text-neutral-600 text-[11px] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>સંપર્ક: <strong>{storeSettings.phoneDisplay}</strong></span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-100/80 p-2 rounded-lg border border-emerald-300 text-[11px] text-emerald-900 font-bold">
                    <span>💡 ઓર્ડર મળ્યા બાદ તૈયાર રાખવામાં આવશે. તમે દુકાને આવીને સરળતાથી સામાન મેળવી શકો છો.</span>
                  </div>
                </div>
              ) : (
              <div className="space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    <span>ડિલિવરી સરનામું (Delivery Address)</span>
                  </h4>

                  {/* State selector toggle */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-300 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setStateSelection('Gujarat')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        stateSelection === 'Gujarat'
                          ? 'bg-[#0B1E48] text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      ગુજરાત
                    </button>
                    <button
                      type="button"
                      onClick={() => setStateSelection('Other')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        stateSelection === 'Other'
                          ? 'bg-[#0B1E48] text-white shadow-2xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      અન્ય રાજ્ય
                    </button>
                  </div>
                </div>

                {stateSelection === 'Gujarat' ? (
                  /* ========================================================= */
                  /* GUJARAT AUTO DISTRICT, TALUKA & VILLAGE DROPDOWN SECTION  */
                  /* ========================================================= */
                  <div className="space-y-2.5">
                    
                    {/* State is Gujarat badge */}
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-[11px] font-bold">
                      <span className="font-black">રાજ્ય:</span>
                      <span>ગુજરાત (Gujarat) - ડિલિવરી ઉપલબ્ધ ✅</span>
                    </div>

                    {/* District & Taluka Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      
                      {/* District Dropdown (All 33 districts of Gujarat) */}
                      <div>
                        <label className="text-[11px] font-black text-neutral-800 block mb-1">
                          ૧. જિલ્લો (District) *
                        </label>
                        <select
                          value={selectedDistrictId}
                          onChange={e => handleDistrictChange(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none cursor-pointer"
                        >
                          {GUJARAT_DISTRICTS.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.nameGu}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Taluka Dropdown (Auto populated from selected district) */}
                      <div>
                        <label className="text-[11px] font-black text-neutral-800 block mb-1">
                          ૨. તાલુકો (Taluka) *
                        </label>
                        <select
                          value={selectedTaluka}
                          onChange={e => handleTalukaChange(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none cursor-pointer"
                        >
                          {activeDistrict.talukas.map((t, idx) => (
                            <option key={idx} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Village / City with Datalist & Quick Selection Pills */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-neutral-800 block">
                          ૩. ગામ / શહેર (Village / City) *
                        </label>
                        <span className="text-[10px] text-neutral-400 font-bold">
                          ઓટો લિસ્ટમાંથી પસંદ કરો અથવા ટાઈપ કરો
                        </span>
                      </div>

                      <input
                        type="text"
                        list="village-datalist-options"
                        placeholder="દા.ત. વાવ, થરાદ, રાધનપુર, ડીસા કે તમારું ગામ..."
                        value={villageName}
                        onChange={e => setVillageName(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />

                      {/* Datalist for automatic autocomplete suggestions */}
                      <datalist id="village-datalist-options">
                        {suggestedVillages.map((v, idx) => (
                          <option key={idx} value={v} />
                        ))}
                      </datalist>

                      {/* Quick click pills for popular villages */}
                      {suggestedVillages.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] text-neutral-500 font-bold">ઝડપી પસંદગી:</span>
                          {suggestedVillages.slice(0, 7).map((v, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setVillageName(v)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                villageName === v
                                  ? 'bg-blue-800 text-white border-blue-900 font-black'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* House No / Street / Society */}
                    <div>
                      <label className="text-[11px] font-black text-neutral-800 block mb-1">
                        ૪. ઘર નંબર / સોસાયટી / શેરી (House / Street / Area) *
                      </label>
                      <input
                        type="text"
                        placeholder="દા.ત. ૧૦૧, ખોડિયાર નગર, મેઇન બજાર"
                        value={houseStreet}
                        onChange={e => setHouseStreet(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>

                    {/* Pincode with Auto Suggestion */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-black text-neutral-800 block">
                          ૫. પિનકોડ (Pincode) *
                        </label>
                        <span className="text-[10px] text-blue-700 font-bold">
                          તાલુકા મુજબ ઓટો પિનકોડ
                        </span>
                      </div>
                      <input
                        type="tel"
                        placeholder="દા.ત. 385565"
                        value={pincode}
                        maxLength={6}
                        onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>

                  </div>
                ) : (
                  /* ========================================================= */
                  /* OTHER STATE FORM                                          */
                  /* ========================================================= */
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                        રાજ્યનું નામ (State) *
                      </label>
                      <input
                        type="text"
                        placeholder="દા.ત. રાજસ્થાન / મહારાષ્ટ્ર"
                        value={customStateName}
                        onChange={e => setCustomStateName(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                          જિલ્લો (District) *
                        </label>
                        <input
                          type="text"
                          placeholder="દા.ત. જાલોર / સાંચોર"
                          value={otherDistrict}
                          onChange={e => setOtherDistrict(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                          તાલુકો / શહેર (City / Tehsil) *
                        </label>
                        <input
                          type="text"
                          placeholder="દા.ત. સાંચોર"
                          value={otherCityTaluka}
                          onChange={e => setOtherCityTaluka(e.target.value)}
                          className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                        સરનામું / ગામ / સોસાયટી *
                      </label>
                      <input
                        type="text"
                        placeholder="મકાન નં, શેરી, વિસ્તાર"
                        value={otherVillageStreet}
                        onChange={e => setOtherVillageStreet(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                        પિનકોડ (Pincode) *
                      </label>
                      <input
                        type="tel"
                        placeholder="દા.ત. 343040"
                        value={otherPincode}
                        maxLength={6}
                        onChange={e => setOtherPincode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

              </div>
              )}

              {/* PAYMENT SECTION - ONLINE QR OR CASH AT SHOP */}
              <div className="space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-orange-600" />
                    <span>ચુકવણી પદ્ધતિ પસંદ કરો (Payment Mode)</span>
                  </h4>
                  <span className="text-xs font-black text-orange-700">
                    કુલ: ₹{finalPayableTotal}/-
                  </span>
                </div>

                {/* Mode Selector: Online QR vs Cash at Shop */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('Online')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMode === 'Online'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-400 text-blue-950 font-black shadow-xs'
                        : 'bg-white/70 border-neutral-300 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span className="font-black text-xs">📱 ઓનલાઇન QR</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-normal mt-0.5">
                      Google Pay, PhonePe, Paytm
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMode === 'Cash'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400 text-emerald-950 font-black shadow-xs'
                        : 'bg-white/70 border-neutral-300 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="font-black text-xs">💵 દુકાને રોકડ</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-normal mt-0.5">
                      કાઉન્ટર પર રોકડ (Cash)
                    </p>
                  </button>
                </div>

                {/* Amount Summary Pill */}
                <div className="bg-white p-2.5 rounded-lg border border-neutral-200 text-[11px] font-bold text-neutral-800 space-y-1">
                  <div className="flex justify-between">
                    <span>સામાન: ₹{cartTotal}</span>
                    <span>
                      {deliveryType === 'pickup'
                        ? '🏪 પિકઅપ: ₹0 (ફ્રી)'
                        : deliveryCharge > 0
                          ? `ડિલિવરી: ₹${deliveryCharge}`
                          : 'ડિલિવરી: ફ્રી'}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600 text-[10.5px]">
                    {platformFee > 0 && <span>પ્લેટફોર્મ: ₹{platformFee}</span>}
                    {packingCharge > 0 && <span>પેકિંગ: ₹{packingCharge}</span>}
                    {otherFee > 0 && <span>અન્ય: ₹{otherFee}</span>}
                  </div>
                  <div className="border-t pt-1 flex justify-between font-black text-orange-700 text-xs">
                    <span>કુલ ચૂકવવાપાત્ર રકમ:</span>
                    <span>₹{finalPayableTotal}/-</span>
                  </div>
                </div>

                {/* IF CASH AT SHOP SELECTED */}
                {paymentMode === 'Cash' ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-xs">
                        ✓
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-emerald-950">
                          💵 દુકાને રૂબરૂ રોકડ પેમેન્ટ (Cash at Shop)
                        </h5>
                        <p className="text-[10.5px] text-emerald-700 font-bold">
                          કોઈ ઓનલાઇન પેમેન્ટ કે સ્ક્રીનશોટની જરૂર નથી
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/95 rounded-lg border border-emerald-200 text-[11px] text-neutral-700 space-y-1">
                      <p className="font-bold text-emerald-900">• તમારો ઓર્ડર તરત જ નોંધાઈ જશે.</p>
                      <p>• જ્યારે તમે સામાન લેવા આવો ત્યારે દુકાને કાઉન્ટર પર <strong className="text-emerald-800 text-xs">₹{finalPayableTotal}/- રોકડા</strong> ચૂકવવાના રહેશે.</p>
                      <p className="text-emerald-800 font-bold">• પેમેન્ટ સ્ટેટસ: બાકી (કાઉન્ટર પર રોકડ ચુકવણી)</p>
                    </div>
                  </div>
                ) : (
                  /* IF ONLINE QR SELECTED */
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col items-center text-center space-y-2.5">
                    <p className="text-[11px] font-black text-neutral-800">
                      📱 નીચેનો QR કોડ સ્કેન કરીને <span className="text-blue-700 text-sm font-black">₹{finalPayableTotal}/-</span> ચૂકવો
                    </p>
                    
                    {upiQrUrl && (
                      <div className="p-2 bg-white rounded-lg border shadow-xs">
                        <img src={upiQrUrl} alt="UPI QR" className="w-40 h-40 object-contain" />
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[11px] font-black bg-white px-2.5 py-1 rounded-md border border-neutral-200">
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
                    <div className="w-full pt-2 border-t border-dashed border-blue-300 text-left">
                      <label className="text-[11px] font-black text-neutral-800 flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1 text-red-600">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>પેમેન્ટ સ્ક્રીનશોટ (ફરજિયાત *)</span>
                        </span>
                        {paymentScreenshot && (
                          <span className="text-emerald-700 text-[10px] font-black flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> અપલોડ થઈ ગયું
                          </span>
                        )}
                      </label>

                      {/* Transaction ID Input */}
                      <div className="mb-3">
                        <label className="text-[10px] font-bold text-neutral-600 block mb-1">
                          Transaction ID / Reference No (વૈકલ્પિક)
                        </label>
                        <input
                          type="text"
                          placeholder="દા.ત. UPI Ref No. 123456789012"
                          value={transactionId}
                          onChange={e => setTransactionId(e.target.value)}
                          className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-neutral-300 rounded-lg focus:border-blue-700 outline-none"
                        />
                      </div>
                      
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
                            className="p-1 text-neutral-400 hover:text-red-600 cursor-pointer"
                            title="Remove Screenshot"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer text-center">
                          <Upload className="w-6 h-6 text-blue-600 mb-1" />
                          <span className="text-xs font-black text-blue-950">
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
                )}
              </div>

            </form>
          )}
        </div>

        {/* DRAWER FOOTER / ACTION BUTTON */}
        {cart.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-neutral-600">
                {step === 1
                  ? 'કુલ ચૂકવવાપાત્ર રકમ (ચાર્જીસ સહિત):'
                  : paymentMode === 'Cash'
                    ? 'દુકાને રોકડ ચૂકવવાની રકમ:'
                    : 'ઓનલાઇન ચૂકવેલ રકમ:'}
              </span>
              <span className="text-base text-orange-700 font-black">₹{finalPayableTotal}/-</span>
            </div>

            {step === 1 ? (
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <span>{deliveryType === 'pickup' ? 'ઓર્ડર અને પેમેન્ટ (Step 2)' : 'સરનામું અને પેમેન્ટ (Step 2)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                className={`w-full text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98 ${
                  paymentMode === 'Cash'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#0B1E48] hover:bg-blue-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {paymentMode === 'Cash'
                    ? `ઓર્ડર કન્ફર્મ કરો (દુકાને રોકડ ₹${finalPayableTotal})`
                    : 'ઓર્ડર કન્ફર્મ કરો અને રસીદ મેળવો'}
                </span>
              </button>
            )}
          </div>
        )}

      </aside>
    </div>
  );
};
