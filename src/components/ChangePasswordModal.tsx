import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Eye, EyeOff, Lock, Check } from 'lucide-react';

interface ChangePasswordModalProps {
  currentStoredPassword: string;
  ownerSecretNumber: string; // "8140430395"
  onPasswordChanged: (newPass: string) => void;
  onClose: () => void;
}

export function ChangePasswordModal({
  currentStoredPassword,
  ownerSecretNumber,
  onPasswordChanged,
  onClose
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [verificationNumber, setVerificationNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Verify Old Password
    if (oldPassword !== currentStoredPassword) {
      setError('❌ જૂનો પાસવર્ડ ખોટો છે! સાચો પાસવર્ડ દાખલ કરો.');
      return;
    }

    // 2. Verify Secret Number (8140430395)
    const cleanSecretInput = verificationNumber.replace(/\D/g, '');
    const cleanExpected = ownerSecretNumber.replace(/\D/g, '') || '8140430395';

    if (cleanSecretInput !== cleanExpected && cleanSecretInput !== '8140430395') {
      setError('❌ સિક્રેટ વેરિફિકેશન નંબર ખોટો છે! તમારો માન્ય મોબાઇલ નંબર દાખલ કરો.');
      return;
    }

    // 3. Verify New Password
    if (!newPassword.trim() || newPassword.length < 4) {
      setError('❌ નવો પાસવર્ડ ઓછામાં ઓછો ૪ અક્ષરનો હોવો જોઈએ!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('❌ નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ બંને સરખા નથી!');
      return;
    }

    // Success
    setSuccess(true);
    setTimeout(() => {
      onPasswordChanged(newPassword);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full border-2 border-neutral-900 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-neutral-900">એડમિન પાસવર્ડ બદલો</h3>
              <p className="text-[11px] text-neutral-500 font-bold">સુરક્ષિત વેરિફિકેશન સાથે પાસવર્ડ અપડેટ કરો</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-300">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-emerald-900">પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો!</h4>
            <p className="text-xs text-emerald-700 font-semibold">તમારો નવો પાસવર્ડ સેવ થઈ ગયો છે.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            
            {/* 1. Old Password */}
            <div>
              <label className="font-black block mb-1 text-neutral-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>૧. હાલનો (જૂનો) પાસવર્ડ:</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Current Password..."
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full font-bold p-2.5 pr-9 border-2 border-neutral-300 rounded-xl outline-none focus:border-blue-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. Secret Verification Number (User: 8140430395) */}
            <div>
              <label className="font-black block mb-1 text-neutral-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>૨. સિક્રેટ વેરિફિકેશન નંબર (Owner Security Number):</span>
              </label>
              <input
                type="text"
                placeholder="દા.ત. 8140430395"
                value={verificationNumber}
                onChange={e => setVerificationNumber(e.target.value)}
                className="w-full font-black p-2.5 border-2 border-neutral-300 rounded-xl outline-none focus:border-blue-700 placeholder:font-normal"
                required
              />
              <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                (સુરક્ષા માટે માલિકનો અધિકૃત મોબાઇલ નંબર દાખલ કરવો ફરજિયાત છે)
              </span>
            </div>

            {/* 3. New Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="font-black block mb-1 text-neutral-800">
                  ૩. નવો પાસવર્ડ:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full font-bold p-2.5 border-2 border-neutral-300 rounded-xl outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div>
                <label className="font-black block mb-1 text-neutral-800">
                  ૪. કન્ફર્મ નવો પાસવર્ડ:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full font-bold p-2.5 border-2 border-neutral-300 rounded-xl outline-none focus:border-blue-700"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[11px] font-black text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-xl font-bold text-neutral-600 hover:bg-neutral-100"
              >
                રદ કરો
              </button>
              <button
                type="submit"
                className="bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                <span>પાસવર્ડ બદલો (Update Password)</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
