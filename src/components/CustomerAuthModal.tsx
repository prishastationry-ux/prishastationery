import React, { useState } from 'react';
import {
  X,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { RegisteredCustomer } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerLogin: (customer: RegisteredCustomer) => void;
  existingCustomers: RegisteredCustomer[];
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onCustomerLogin,
  existingCustomers
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [captchaCode, setCaptchaCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const generateNewCaptcha = () => {
    setCaptchaCode(Math.floor(1000 + Math.random() * 9000).toString());
    setEnteredOtp('');
    setErrorMsg('');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMsg('મહેરબાની કરીને સાચો 10-અંકનો મોબાઈલ નંબર દાખલ કરો');
      return;
    }

    // Check if customer already exists
    const matched = existingCustomers.find(c => c.mobile === cleanMobile);
    if (matched) {
      setName(matched.name);
      if (matched.address) setAddress(matched.address);
    } else if (!name.trim()) {
      setErrorMsg('મહેરબાની કરીને તમારું પૂરું નામ દાખલ કરો');
      return;
    }

    setErrorMsg('');
    generateNewCaptcha();
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== captchaCode) {
      setErrorMsg('❌ આપેલ સિક્યોરિટી કોડ (OTP) ખોટો છે! ફરીથી પ્રયાસ કરો.');
      return;
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const matched = existingCustomers.find(c => c.mobile === cleanMobile);

    const loggedUser: RegisteredCustomer = {
      id: matched ? matched.id : `cust-${Date.now()}`,
      name: name.trim() || matched?.name || 'ગ્રાહક',
      mobile: cleanMobile,
      address: address.trim() || matched?.address || '',
      createdAt: matched?.createdAt || new Date().toLocaleDateString('en-GB'),
      lastLoginAt: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRegistered: true
    };

    onCustomerLogin(loggedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-300">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500 text-black rounded-xl font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">ગ્રાહક સાઇન-ઇન / નવું એકાઉન્ટ</h3>
              <p className="text-[11px] text-blue-200">ઓર્ડર ટ્રેકિંગ અને હિસ્ટ્રી માટે સરળ એકાઉન્ટ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs font-bold animate-shake">
              {errorMsg}
            </div>
          )}

          {step === 'input' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-neutral-800 mb-1">
                  📱 તમારો મોબાઈલ નંબર *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-અંકનો મોબાઈલ નંબર"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 focus:border-blue-700 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-800 mb-1">
                  👤 તમારું નામ *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 focus:border-blue-700 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  📍 તમારું સરનામું (ઓપ્શનલ)
                </label>
                <input
                  type="text"
                  placeholder="ગામ / સોસાયટી / તાલુકો"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:border-blue-700 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black py-3 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <span>આગળ વધો (OTP ચકાસણી)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center border-t border-neutral-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 underline"
                >
                  એકાઉન્ટ બનાવ્યા વગર સીધો ઓર્ડર કરો (Continue as Guest)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center space-y-1">
                <p className="text-xs font-bold text-neutral-700">મોબાઈલ નંબર: <span className="font-black text-blue-900">{mobile}</span></p>
                <p className="text-[11px] text-neutral-500">ગ્રાહકની ઓળખ ચકાસવા માટે નીચે આપેલ કોડ દાખલ કરો</p>
              </div>

              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-2xl border border-orange-300 text-center space-y-2">
                <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">સિક્યોરિટી ચકાસણી કોડ (OTP/Captcha)</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black tracking-widest text-blue-950 bg-white px-4 py-1.5 rounded-xl border border-blue-300 shadow-inner font-mono select-none">
                    {captchaCode}
                  </span>
                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    className="p-2 bg-white text-neutral-700 hover:bg-neutral-100 rounded-xl border border-neutral-300 cursor-pointer"
                    title="નવો કોડ મેળવો"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-800 mb-1">
                  🔑 ઉપર દર્શાવેલ 4-અંકનો કોડ અહીં લખો *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="દા.ત. 1234"
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)}
                  className="w-full text-center tracking-widest text-xl font-black py-2.5 bg-neutral-50 border-2 border-blue-600 rounded-2xl focus:border-orange-500 outline-none font-mono"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-1/3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  પાછા જાઓ
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>લૉગ-ઇન ચકાસો (Verify)</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-neutral-100 p-3 text-center text-[10px] text-neutral-500 border-t border-neutral-200">
          🔒 પ્રિષા સ્ટેશનરી સેફ ગ્રાહક ઓથેન્ટિકેશન • 100% સુરક્ષિત
        </div>

      </div>
    </div>
  );
};
