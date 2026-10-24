import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Eye, EyeOff, Lock, Check, Plus, Trash2, Edit3, Shield } from 'lucide-react';

interface ChangePasswordModalProps {
  currentStoredPassword: string;
  ownerSecretNumber: string; // "8140430395"
  secondaryPasswords?: string[];
  onPasswordChanged: (newPass: string) => void;
  onUpdateSecondaryPasswords?: (passwords: string[]) => void;
  onClose: () => void;
}

export function ChangePasswordModal({
  currentStoredPassword,
  ownerSecretNumber,
  secondaryPasswords = [],
  onPasswordChanged,
  onUpdateSecondaryPasswords,
  onClose
}: ChangePasswordModalProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'secondary'>('main');

  // Main Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [verificationNumber, setVerificationNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Secondary Password Management State
  const [newSecPassInput, setNewSecPassInput] = useState('');
  const [secList, setSecList] = useState<string[]>(secondaryPasswords);
  const [editingSecIndex, setEditingSecIndex] = useState<number | null>(null);
  const [editingSecValue, setEditingSecValue] = useState<string>('');
  const [secSuccessMsg, setSecSuccessMsg] = useState('');

  const handleMainSubmit = (e: React.FormEvent) => {
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

  const handleAddSecondaryPassword = () => {
    const trimmed = newSecPassInput.trim();
    if (!trimmed) return;
    if (secList.includes(trimmed)) {
      alert('⚠️ આ પાસવર્ડ પહેલેથી જ ઉમેરેલો છે!');
      return;
    }
    const updated = [...secList, trimmed];
    setSecList(updated);
    setNewSecPassInput('');
    if (onUpdateSecondaryPasswords) {
      onUpdateSecondaryPasswords(updated);
    }
    setSecSuccessMsg(`✅ નવો પાસવર્ડ "${trimmed}" ઉમેરાઈ ગયો!`);
    setTimeout(() => setSecSuccessMsg(''), 2500);
  };

  const handleRemoveSecondaryPassword = (index: number) => {
    const removedPass = secList[index];
    const updated = secList.filter((_, idx) => idx !== index);
    setSecList(updated);
    if (onUpdateSecondaryPasswords) {
      onUpdateSecondaryPasswords(updated);
    }
    setSecSuccessMsg(`🗑️ પાસવર્ડ "${removedPass}" દૂર કર્યો.`);
    setTimeout(() => setSecSuccessMsg(''), 2500);
  };

  const handleSaveSecondaryEdit = (index: number) => {
    const trimmed = editingSecValue.trim();
    if (!trimmed) return;
    const updated = [...secList];
    updated[index] = trimmed;
    setSecList(updated);
    setEditingSecIndex(null);
    setEditingSecValue('');
    if (onUpdateSecondaryPasswords) {
      onUpdateSecondaryPasswords(updated);
    }
    setSecSuccessMsg(`✏️ પાસવર્ડ અપડેટ થયો!`);
    setTimeout(() => setSecSuccessMsg(''), 2500);
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
              <h3 className="font-black text-sm text-neutral-900">પાસવર્ડ સુરક્ષા કંટ્રોલ</h3>
              <p className="text-[11px] text-neutral-500 font-bold">એડમિન લૉગિન, ખરીદ ભાવ & એડિટ પાસવર્ડ્સ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'main'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>મુખ્ય એડમિન પાસવર્ડ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('secondary')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'secondary'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ખરીદ ભાવ & એડિટ પાસવર્ડ</span>
          </button>
        </div>

        {/* TAB 1: MAIN PASSWORD CHANGE */}
        {activeTab === 'main' && (
          <>
            {success ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-300">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-black text-sm text-emerald-900">મુખ્ય પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો!</h4>
                <p className="text-xs text-emerald-700 font-semibold">તમારો નવો પાસવર્ડ સેવ થઈ ગયો છે.</p>
              </div>
            ) : (
              <form onSubmit={handleMainSubmit} className="space-y-3 text-xs">
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
                    className="px-4 py-2 border rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                    <span>પાસવર્ડ બદલો</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 2: SECONDARY PASSWORDS MANAGEMENT */}
        {activeTab === 'secondary' && (
          <div className="space-y-3 text-xs">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 space-y-1">
              <h4 className="font-black text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>ખરીદ ભાવ (Cost Price) અને આઇટમ એડિટ પાસવર્ડ્સ</span>
              </h4>
              <p className="text-[11px] text-indigo-900 font-medium">
                આ પાસવર્ડ્સ વડે એડમિન પેનલમાં ખરીદ ભાવ અનલૉક કરી શકાશે તથા વસ્તુઓની વિગતો એડિટ કરી શકાશે.
              </p>
            </div>

            {secSuccessMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-black text-[11px]">
                {secSuccessMsg}
              </div>
            )}

            {/* Default Unchangeable System Passwords */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-neutral-700 block">
                🔒 સિસ્ટમ ડિફોલ્ટ પાસવર્ડ્સ (કાયમી કાર્યરત):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['0123', '2626', 'Prisha@2024'].map(p => (
                  <span
                    key={p}
                    className="px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded-lg font-mono font-black border border-neutral-300 text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <span>✓</span>
                    <span>{p}</span>
                  </span>
                ))}
                <span className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg font-mono font-bold border border-blue-200 text-xs">
                  (મુખ્ય એડમિન પાસવર્ડ પણ માન્ય છે)
                </span>
              </div>
            </div>

            {/* Custom Added Passwords List */}
            <div className="space-y-2 pt-1 border-t border-neutral-200">
              <span className="text-[11px] font-black text-neutral-700 block">
                ➕ તમારા ઉમેરેલા વધારાના પાસવર્ડ્સ ({secList.length}):
              </span>

              {secList.length === 0 ? (
                <p className="text-[11px] text-neutral-400 font-bold italic py-1">
                  હજુ કોઈ વધારાનો કસ્ટમ પાસવર્ડ ઉમેરેલ નથી. નીચેથી નવો પાસવર્ડ ઉમેરી શકો છો.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {secList.map((pass, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200"
                    >
                      {editingSecIndex === idx ? (
                        <div className="flex items-center gap-1 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingSecValue}
                            onChange={e => setEditingSecValue(e.target.value)}
                            className="flex-1 font-mono font-black text-xs p-1 bg-white border border-blue-500 rounded outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSecondaryEdit(idx)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-black cursor-pointer"
                          >
                            સેવ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSecIndex(null);
                              setEditingSecValue('');
                            }}
                            className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            રદ
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-black text-xs text-indigo-900">
                          🔑 {pass}
                        </span>
                      )}

                      {editingSecIndex !== idx && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSecIndex(idx);
                              setEditingSecValue(pass);
                            }}
                            className="text-blue-700 hover:text-blue-900 p-1 cursor-pointer"
                            title="પાસવર્ડ બદલો"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSecondaryPassword(idx)}
                            className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                            title="પાસવર્ડ ડિલીટ કરો"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Password Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="નવો પાસવર્ડ લખો (દા.ત. 5555)..."
                  value={newSecPassInput}
                  onChange={e => setNewSecPassInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSecondaryPassword();
                    }
                  }}
                  className="flex-1 font-mono font-bold p-2 border-2 border-neutral-300 rounded-xl outline-none focus:border-indigo-600 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddSecondaryPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>ઉમેરો (Add)</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-black cursor-pointer shadow"
              >
                થઈ ગયું (Done)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
