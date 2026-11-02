import React from 'react';
import { StoreSettings } from '../types';
import { MaintenanceStatus } from '../utils/maintenanceHelper';
import { Wrench, Clock, Phone, KeyRound, ShieldAlert, Sparkles, Store } from 'lucide-react';
import { getDefaultLeftLogoSvg } from '../lib/invoiceUtils';

interface MaintenanceScreenProps {
  status: MaintenanceStatus;
  storeSettings: StoreSettings;
  onAdminLoginClick: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  status,
  storeSettings,
  onAdminLoginClick
}) => {
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BRAND HEADER */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center p-1 overflow-hidden shadow-lg">
            <img
              src={storeSettings.leftLogoUrl || getDefaultLeftLogoSvg()}
              alt="Prisha Stationery"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-orange-400 tracking-tight uppercase">
              {storeSettings.storeNameEn || 'PRISHA STATIONERY & ONLINE SERVICES'}
            </h1>
            <p className="text-xs font-bold text-slate-300">{storeSettings.storeNameGu || 'પ્રિષા સ્ટેશનરી અને ઓનલાઇન સર્વિસ • થરાદ'}</p>
          </div>
        </div>

        {/* Emergency Admin Login Button */}
        <button
          onClick={onAdminLoginClick}
          className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
          title="સંચાલક / એડમિન લૉગિન કરો"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Admin Login</span>
        </button>
      </header>

      {/* MAIN MAINTENANCE BODY */}
      <main className="max-w-xl mx-auto w-full my-auto z-10 py-8 text-center space-y-6">
        
        {/* Animated Icon Badge */}
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center text-slate-950 font-black text-4xl sm:text-5xl mx-auto shadow-2xl shadow-orange-500/30 animate-pulse">
            🛠️
          </div>
          <span className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-slate-900 shadow-md uppercase">
            Maintenance
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            સેવાઓ હાલ મેન્ટેનન્સ માટે બંધ છે
          </h2>
          <p className="text-sm font-bold text-orange-400">
            {storeSettings.storeNameGu} • CSC પોર્ટલ & સ્ટેશનરી માર્ટ
          </p>
        </div>

        {/* REOPEN TIME HIGHLIGHT CARD */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 p-5 rounded-3xl border-2 border-amber-500/80 shadow-2xl space-y-2 text-left">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>સેવાઓ પુનઃ શરૂ થવાનો સમય:</span>
            </span>
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
              {status.type === 'afternoon' ? '🍱 બપોરનો વિરામ' : status.type === 'night' ? '🌙 રાત્રિ વિરામ' : '🛠️ મેન્ટેનન્સ'}
            </span>
          </div>

          <p className="text-xl sm:text-2xl font-black text-white font-mono pt-1">
            ⏰ {status.reopenTime || storeSettings.maintenanceReopenTime || 'ટૂંક સમયમાં શરૂ થશે'}
          </p>

          <p className="text-xs text-slate-300 font-bold leading-relaxed pt-1">
            {status.reason || storeSettings.maintenanceMessage || 'દુકાનની દૈનિક ઇન્વેન્ટરી, દૈનિક રોકડ હિસાબ અને ઓનલાઇન પોર્ટલ સ્ટોક મેન્ટેનન્સ ચાલી રહ્યું છે. કૃપા કરીને દર્શાવેલ સમયે ફરી પધારો.'}
          </p>
        </div>

        {/* Emergency Contact Bar */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-white font-black">કટોકટી અથવા અગત્યના કામ માટે:</p>
              <p className="text-slate-400 text-[11px]">સંચાલક: BHARAT CHAUDHARY (થરાદ)</p>
            </div>
          </div>
          <a
            href={`tel:${storeSettings.phone || '8140430395'}`}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>📞 સીધો ફોન કરો: {storeSettings.phoneDisplay || '+91 81404 30395'}</span>
          </a>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs font-bold text-slate-500 z-10 border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} {storeSettings.storeNameEn} • All rights reserved</p>
        <button
          onClick={onAdminLoginClick}
          className="text-amber-400 hover:underline font-black text-xs cursor-pointer flex items-center gap-1"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>એડમિન પેનલ ઓપન કરવા અહિયાં ક્લિક કરો</span>
        </button>
      </footer>

    </div>
  );
};
