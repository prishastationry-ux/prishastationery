import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Plus, Trash2, FileText, CheckCircle2, Edit3, Building, Eye } from 'lucide-react';
import { StoreSettings } from '../types';

interface MultiQuotationModalProps {
  storeSettings: StoreSettings;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

interface FirmProfile {
  id: number;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  quoteNo: string;
  marginPercent: number; // e.g., 0% for L1, +4% for Firm 2, +8% for Firm 3
}

interface QuoteItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  basePrice: number; // Firm 1 L1 price
  firmPrices: { [firmId: number]: number }; // Custom price per firm
}

export default function MultiQuotationModal({
  storeSettings,
  onClose,
  showToast
}: MultiQuotationModalProps) {
  // General Quotation Info
  const [deptName, setDeptName] = useState('મામલતદાર કચેરી, થરાદ (સરકારી વિભાગ)');
  const [quoteDate, setQuoteDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [refNo, setRefNo] = useState(`QTN/2026-27/${Math.floor(100 + Math.random() * 900)}`);
  const [subject, setSubject] = useState('કચેરીના વર્ષ ૨૦૨૬-૨૭ ના ઉપયોગ અર્થે જરૂરી સ્ટેશનરી સાહિત્ય સપ્લાય કરવા બાબત.');
  const [validityNote, setValidityNote] = useState('૧. ભાવ ૩૦ દિવસ સુધી માન્ય રહેશે. ૨. જીએસટી અલગથી / સમાવિષ્ટ. ૩. માલ સમયસર કચેરીએ પહોંચતો કરવામાં આવશે.');

  // 5 Firm Profiles
  const [firms, setFirms] = useState<FirmProfile[]>([
    {
      id: 1,
      name: storeSettings.storeNameEn || 'PRISHA STATIONERY & XEROX',
      tagline: storeSettings.storeNameGu || 'પ્રિશા સ્ટેશનરી એન્ડ ઝેરોક્ષ (થરાદ)',
      address: storeSettings.address || 'મેઇન બજાર, પોલીસ સ્ટેશન સામે, થરાદ (બનાસકાંઠા)',
      phone: storeSettings.phone || '8140430395',
      gstin: storeSettings.gstNumber || '24AAFFP1234F1Z1',
      quoteNo: `${refNo}/L1`,
      marginPercent: 0 // L1 lowest
    },
    {
      id: 2,
      name: 'BANAS STATIONERY & TRADING CO.',
      tagline: 'બનાસ સ્ટેશનરી એન્ડ ટ્રેડિંગ કંપની',
      address: 'હાઇવે રોડ, થરાદ સેન્ટર (બનાસકાંઠા) - ૩૮૫૫૬૫',
      phone: '9825012345',
      gstin: '24BBTCO9876F2Z2',
      quoteNo: `${refNo}/F2`,
      marginPercent: 4 // +4%
    },
    {
      id: 3,
      name: 'GANESH PAPER & OFFICE SUPPLIERS',
      tagline: 'શ્રી ગણેશ પેપર એન્ડ ઓફિસ સપ્લાયર્સ',
      address: 'ગાયત્રી મંદિર રોડ, ડીસા (બનાસકાંઠા)',
      phone: '9426054321',
      gstin: '24GPOFF5544F3Z3',
      quoteNo: `${refNo}/F3`,
      marginPercent: 8 // +8%
    },
    {
      id: 4,
      name: 'AMBICA STATIONERS & PRINTERS',
      tagline: 'અંબિકા સ્ટેશનર્સ એન્ડ પ્રિન્ટર્સ',
      address: 'આબુ રોડ, પાલનપુર (બનાસકાંઠા)',
      phone: '9712398765',
      gstin: '24AMBPR1122F4Z4',
      quoteNo: `${refNo}/F4`,
      marginPercent: 12 // +12%
    },
    {
      id: 5,
      name: 'ROYAL STATIONERY & COMPUTER SERVICES',
      tagline: 'રોયલ સ્ટેશનરી એન્ડ કોમ્પ્યુટર સર્વિસીસ',
      address: 'ચાર રસ્તા પાસે, થરાદ (બનાસકાંઠા)',
      phone: '9898011223',
      gstin: '24ROYCS3344F5Z5',
      quoteNo: `${refNo}/F5`,
      marginPercent: 16 // +16%
    }
  ]);

  // Items List with firm specific calculated rates
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: '1',
      name: 'A4 Copier Paper 75 GSM (JK Copier)',
      qty: 10,
      unit: 'રિમ',
      basePrice: 280,
      firmPrices: { 1: 280, 2: 290, 3: 300, 4: 310, 5: 320 }
    },
    {
      id: '2',
      name: 'માસિક રજીસ્ટર ૨૦૦ પેજ (પાકા બાઇન્ડિંગ)',
      qty: 5,
      unit: 'નંગ',
      basePrice: 180,
      firmPrices: { 1: 180, 2: 188, 3: 195, 4: 200, 5: 210 }
    },
    {
      id: '3',
      name: 'બોલપેન બોક્સ (બ્લુ - ૨૦ પેન)',
      qty: 4,
      unit: 'બોક્સ',
      basePrice: 150,
      firmPrices: { 1: 150, 2: 156, 3: 162, 4: 168, 5: 175 }
    }
  ]);

  // New Item Input
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('નંગ');
  const [newItemBasePrice, setNewItemBasePrice] = useState(0);

  // Active view for preview/print modal
  const [selectedFirmForPrint, setSelectedFirmForPrint] = useState<FirmProfile | null>(null);
  const [showComparativePrint, setShowComparativePrint] = useState(false);

  // 1-Click Auto Generate 5 Firm Prices based on Margin %
  const handleAutoGeneratePrices = () => {
    const updated = items.map(item => {
      const firmPrices: { [firmId: number]: number } = {};
      firms.forEach(f => {
        if (f.id === 1) {
          firmPrices[1] = item.basePrice;
        } else {
          // Add margin percent and round to nearest whole rupee
          const raw = item.basePrice * (1 + f.marginPercent / 100);
          firmPrices[f.id] = Math.ceil(raw);
        }
      });
      return { ...item, firmPrices };
    });
    setItems(updated);
    if (showToast) showToast('⚡ ૫ અલગ કંપનીઓના ભાવ આપોઆપ ૧ કિલકમાં તૈયાર થઈ ગયા!');
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || newItemBasePrice <= 0) return;

    const newPrices: { [firmId: number]: number } = {};
    firms.forEach(f => {
      if (f.id === 1) newPrices[1] = newItemBasePrice;
      else newPrices[f.id] = Math.ceil(newItemBasePrice * (1 + f.marginPercent / 100));
    });

    const newItem: QuoteItem = {
      id: `it_${Date.now()}`,
      name: newItemName.trim(),
      qty: newItemQty,
      unit: newItemUnit,
      basePrice: newItemBasePrice,
      firmPrices: newPrices
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemBasePrice(0);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItemPriceForFirm = (itemId: string, firmId: number, price: number) => {
    setItems(
      items.map(it => {
        if (it.id === itemId) {
          return {
            ...it,
            firmPrices: {
              ...it.firmPrices,
              [firmId]: price
            }
          };
        }
        return it;
      })
    );
  };

  const handleUpdateFirmDetail = (firmId: number, field: keyof FirmProfile, val: any) => {
    setFirms(
      firms.map(f => (f.id === firmId ? { ...f, [field]: val } : f))
    );
  };

  const calculateFirmTotal = (firmId: number) => {
    return items.reduce((sum, item) => sum + (item.firmPrices[firmId] || item.basePrice) * item.qty, 0);
  };

  // Direct Browser Print for single firm quotation
  const handlePrintSingleQuotation = (firm: FirmProfile) => {
    const total = calculateFirmTotal(firm.id);
    const itemsRows = items
      .map(
        (it, idx) => `
      <tr style="border-bottom: 1.2px solid #000;">
        <td style="padding: 6px; text-align: center; border-right: 1.2px solid #000;">${idx + 1}</td>
        <td style="padding: 6px; border-right: 1.2px solid #000;"><b>${it.name}</b></td>
        <td style="padding: 6px; text-align: center; border-right: 1.2px solid #000;">${it.qty} ${it.unit}</td>
        <td style="padding: 6px; text-align: right; border-right: 1.2px solid #000;">₹${(it.firmPrices[firm.id] || it.basePrice).toFixed(2)}</td>
        <td style="padding: 6px; text-align: right; font-weight: bold;">₹${((it.firmPrices[firm.id] || it.basePrice) * it.qty).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation - ${firm.name}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 10px; }
          .quote-box { border: 2px solid #000; padding: 15px; }
          .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
          .firm-title { font-size: 20px; font-weight: 900; text-transform: uppercase; }
          .firm-sub { font-size: 13px; font-weight: bold; margin-top: 2px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.2px solid #000; }
          .meta-table td { padding: 6px; border: 1.2px solid #000; vertical-align: top; }
          .items-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 10px; }
          .items-table th { border: 1.2px solid #000; background: #f3f4f6; padding: 6px; text-align: center; }
          .total-row { font-size: 14px; font-weight: 900; text-align: right; border-top: 2px solid #000; padding-top: 5px; }
          .sign-box { width: 220px; text-align: center; float: right; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="quote-box">
          <div class="header-box">
            <div class="firm-title">${firm.name}</div>
            <div class="firm-sub">${firm.tagline}</div>
            <div style="font-size: 11px; margin-top: 3px;">📍 ${firm.address} | 📞 +91 ${firm.phone} ${firm.gstin ? `| GSTIN: ${firm.gstin}` : ''}</div>
            <div style="font-size: 14px; font-weight: 900; margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px;">
              📋 ભાવ પત્રક / ક્વોટેશન (QUOTATION)
            </div>
          </div>

          <table class="meta-table">
            <tr>
              <td style="width: 60%;">
                <b>પ્રતિ (To):</b><br/>
                <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">${deptName}</div>
              </td>
              <td style="width: 40%;">
                <b>ક્વોટેશન નં:</b> ${firm.quoteNo}<br/>
                <b>તારીખ:</b> ${quoteDate}<br/>
                <b>સંદર્ભ:</b> ${refNo}
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <b>વિષય:</b> ${subject}
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35px;">અ.નં</th>
                <th>વસ્તુ / સાહિત્યની વિગત</th>
                <th style="width: 80px;">જથ્થો</th>
                <th style="width: 90px;">ભાવ દર (₹)</th>
                <th style="width: 100px;">કુલ રકમ (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 14px; font-weight: 900; padding: 6px; border: 1.5px solid #000; background: #fafafa;">
            કુલ રકમ (Total Amount): ₹${total.toFixed(2)}/-
          </div>

          <div style="margin-top: 12px; font-size: 10.5px; border-top: 1px dashed #000; padding-top: 6px;">
            <b>શરતો:</b> ${validityNote}
          </div>

          <div class="sign-box">
            <div style="font-weight: bold; text-transform: uppercase;">For, ${firm.name}</div>
            <div style="height: 45px;"></div>
            <div style="border-top: 1px solid #000; font-weight: bold; font-size: 11px;">અધિકૃત સહી & સિક્કો</div>
          </div>
          <div style="clear: both;"></div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  // Direct Comparative Statement Print
  const handlePrintComparativeStatement = () => {
    const itemsRows = items
      .map(
        (it, idx) => `
      <tr style="border-bottom: 1px solid #000;">
        <td style="padding: 5px; text-align: center; border-right: 1px solid #000;">${idx + 1}</td>
        <td style="padding: 5px; border-right: 1px solid #000;"><b>${it.name}</b></td>
        <td style="padding: 5px; text-align: center; border-right: 1px solid #000;">${it.qty} ${it.unit}</td>
        ${firms
          .map(
            f => `
          <td style="padding: 5px; text-align: right; border-right: 1px solid #000; ${f.id === 1 ? 'background: #f0fdf4; font-weight: 900;' : ''}">
            ₹${((it.firmPrices[f.id] || it.basePrice) * it.qty).toFixed(2)}
          </td>
        `
          )
          .join('')}
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comparative Statement - ${refNo}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: -apple-system, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 10px; }
          .box { border: 2px solid #000; padding: 10px; }
          .title { font-size: 18px; font-weight: 900; text-align: center; margin-bottom: 4px; text-transform: uppercase; }
          .sub { text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 10px; }
          th, td { border: 1px solid #000; padding: 4px 6px; }
          th { background: #e5e7eb; text-align: center; }
          .l1-badge { background: #15803d; color: #fff; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="title">ભાવ તુલનાત્મક પત્રક (COMPARATIVE STATEMENT / TENDER SUMMARY)</div>
          <div class="sub">ખરીદનાર વિભાગ: ${deptName} | તારીખ: ${quoteDate} | સંદર્ભ નં: ${refNo}</div>
          <div style="font-weight: bold; margin-bottom: 6px;">વિષય: ${subject}</div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>વસ્તુની વિગત</th>
                <th style="width: 60px;">જથ્થો</th>
                ${firms
                  .map(
                    f => `
                  <th style="${f.id === 1 ? 'background: #dcfce7;' : ''}">
                    ${f.name}<br/>
                    <span style="font-size: 9px; color: #374151;">${f.id === 1 ? '🏆 (L1 - નિમ્નતમ)' : `Firm ${f.id}`}</span>
                  </th>
                `
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr style="font-weight: 900; font-size: 12px; background: #f9fafb;">
                <td colspan="3" style="text-align: right; padding: 6px;">કુલ સરવાળો (Total Amount ₹):</td>
                ${firms
                  .map(
                    f => `
                  <td style="text-align: right; padding: 6px; ${f.id === 1 ? 'background: #bbf7d0; font-size: 13px; font-weight: 900;' : ''}">
                    ₹${calculateFirmTotal(f.id).toFixed(2)}
                    ${f.id === 1 ? '<br/><span class="l1-badge">L1 LOWEST</span>' : ''}
                  </td>
                `
                  )
                  .join('')}
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 15px; border-top: 1px solid #000; padding-top: 8px;">
            <b>તારણ / ભલામણ (Purchase Committee Recommendation):</b><br/>
            ઉપરોક્ત સરખામણી પત્રક જોતા સૌથી ઓછા ભાવ <b>${firms[0].name} (₹${calculateFirmTotal(1).toFixed(2)})</b> ના હોવાથી L1 તરીકે મંજૂર કરવા યોગ્ય જણાય છે.
          </div>

          <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-weight: bold;">
            <div>૧. સભ્ય (ક્લાર્ક)<br/>________________</div>
            <div>૨. હિસાબી અધિકારી<br/>________________</div>
            <div>૩. અધ્યક્ષ / ખરીદ સમિતિ<br/>________________</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border-2 border-indigo-900 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-indigo-950 via-blue-950 to-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>📋 ૫ કંપનીઓનું તુલનાત્મક ક્વોટેશન જનરેટર</span>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  1-Click 5 Bids
                </span>
              </h2>
              <p className="text-xs text-indigo-200 font-bold">
                સરકારી / ખાનગી ટેન્ડર માટે ૧ ક્લિકમાં ૫ અલગ કંપનીના ક્વોટેશન & ભાવ તુલના પત્રક બનાવો
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-indigo-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MAIN BODY SCROLLABLE */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-bold text-neutral-800">
          
          {/* 1. GENERAL QUOTATION DETAILS */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider border-b pb-2">
              ૧. વિભાગ અને સંદર્ભ વિગત (Department & Tender Details)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  🏢 સરકારી વિભાગ / ગ્રાહકનું નામ:
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-indigo-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📅 ક્વોટેશન તારીખ:
                </label>
                <input
                  type="text"
                  value={quoteDate}
                  onChange={e => setQuoteDate(e.target.value)}
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-indigo-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  🔖 સંદર્ભ / ફાઇલ નંબર:
                </label>
                <input
                  type="text"
                  value={refNo}
                  onChange={e => setRefNo(e.target.value)}
                  className="w-full text-xs font-mono font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-indigo-700"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📌 વિષય (Subject):
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-indigo-700"
                />
              </div>
            </div>
          </div>

          {/* 2. ITEMS LIST INPUT */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                ૨. આઇટમ્સ અને ભાવ વિગત (Items & Base Rates)
              </h3>

              <button
                type="button"
                onClick={handleAutoGeneratePrices}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-xs shadow flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⚡ 1-Click 5-Firm Auto Generate Rates</span>
              </button>
            </div>

            {/* ADD ITEM ROW */}
            <div className="bg-white p-3 rounded-xl border border-neutral-300 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[10px] text-neutral-600 mb-0.5">આઇટમ નામ (Description):</label>
                <input
                  type="text"
                  placeholder="JK Copier Paper, Pens, Registers..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-neutral-600 mb-0.5">જથ્થો (Qty):</label>
                <input
                  type="number"
                  min="1"
                  value={newItemQty || ''}
                  onChange={e => setNewItemQty(Number(e.target.value) || 1)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-neutral-600 mb-0.5">એકમ (Unit):</label>
                <input
                  type="text"
                  placeholder="નંગ/રિમ"
                  value={newItemUnit}
                  onChange={e => setNewItemUnit(e.target.value)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-neutral-600 mb-0.5">મુખ્ય દર (L1 ₹):</label>
                <input
                  type="number"
                  placeholder="280"
                  value={newItemBasePrice || ''}
                  onChange={e => setNewItemBasePrice(Number(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-black py-1.5 rounded-lg text-xs flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ITEM PRICE COMPARISON GRID */}
            <div className="overflow-x-auto border border-neutral-300 rounded-xl bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b font-black text-neutral-700">
                  <tr>
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2 min-w-[180px]">વસ્તુની વિગત</th>
                    <th className="p-2 text-center w-16">જથ્થો</th>
                    {firms.map(f => (
                      <th
                        key={f.id}
                        className={`p-2 text-right min-w-[100px] ${
                          f.id === 1 ? 'bg-emerald-100 text-emerald-900 border-x border-emerald-300' : ''
                        }`}
                      >
                        {f.id === 1 ? '🏆 Firm 1 (L1)' : `Firm ${f.id}`}
                        <div className="text-[9px] font-normal text-neutral-500">
                          {f.marginPercent > 0 ? `+${f.marginPercent}%` : 'Base'}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-bold">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-neutral-50">
                      <td className="p-2 text-center">{idx + 1}</td>
                      <td className="p-2 font-black text-neutral-900">{it.name}</td>
                      <td className="p-2 text-center">{it.qty} {it.unit}</td>
                      {firms.map(f => (
                        <td
                          key={f.id}
                          className={`p-1.5 text-right ${
                            f.id === 1 ? 'bg-emerald-50/80 border-x border-emerald-200' : ''
                          }`}
                        >
                          <input
                            type="number"
                            value={it.firmPrices[f.id] ?? it.basePrice}
                            onChange={e => handleUpdateItemPriceForFirm(it.id, f.id, Number(e.target.value) || 0)}
                            className={`w-20 text-right p-1 text-xs font-black border rounded outline-none ${
                              f.id === 1 ? 'border-emerald-500 text-emerald-900' : 'border-neutral-300'
                            }`}
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-100 font-black text-xs text-neutral-900">
                    <td colSpan={3} className="p-2.5 text-right font-black">
                      કુલ સરવાળો (Total Amount ₹):
                    </td>
                    {firms.map(f => (
                      <td
                        key={f.id}
                        className={`p-2.5 text-right ${
                          f.id === 1 ? 'bg-emerald-200 text-emerald-950 font-black border-x border-emerald-400' : ''
                        }`}
                      >
                        ₹{calculateFirmTotal(f.id).toFixed(2)}
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. EDITABLE 5 FIRMS PROFILES & INDIVIDUAL PRINT BUTTONS */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
              <span>૩. ૫ પેઢીઓ/કંપનીઓના નામ અને સરનામા સુધારો (5 Vendor Profiles)</span>
              <button
                type="button"
                onClick={handlePrintComparativeStatement}
                className="bg-indigo-900 hover:bg-indigo-800 text-white font-black px-3 py-1.5 rounded-lg text-xs shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>📊 ભાવ તુલનાત્મક પત્રક (Comparative Summary) પ્રિન્ટ કરો</span>
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {firms.map(f => (
                <div
                  key={f.id}
                  className={`bg-white p-3 rounded-xl border space-y-2 relative ${
                    f.id === 1 ? 'border-2 border-emerald-500 shadow-sm' : 'border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className={`font-black text-xs ${f.id === 1 ? 'text-emerald-700' : 'text-neutral-800'}`}>
                      {f.id === 1 ? '🏆 Firm 1 (L1 - આપણી દુકાન)' : `કંપની ${f.id}`}
                    </span>
                    <span className="text-[10px] bg-neutral-100 font-bold px-2 py-0.5 rounded border">
                      કુલ: ₹{calculateFirmTotal(f.id)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-500">કંપની/દુકાનનું નામ:</label>
                    <input
                      type="text"
                      value={f.name}
                      onChange={e => handleUpdateFirmDetail(f.id, 'name', e.target.value)}
                      className="w-full text-xs font-black p-1 border border-neutral-300 rounded outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-500">સરનામું & ફોન:</label>
                    <input
                      type="text"
                      value={f.address}
                      onChange={e => handleUpdateFirmDetail(f.id, 'address', e.target.value)}
                      className="w-full text-[11px] font-bold p-1 border border-neutral-300 rounded outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={f.phone}
                      onChange={e => handleUpdateFirmDetail(f.id, 'phone', e.target.value)}
                      className="w-full text-[11px] font-bold p-1 border border-neutral-300 rounded outline-none"
                      placeholder="Phone"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handlePrintSingleQuotation(f)}
                      className="flex-1 bg-neutral-900 hover:bg-black text-white font-black py-1.5 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>પ્રિન્ટ / PDF ({f.id === 1 ? 'L1' : `Firm ${f.id}`})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRINT ALL BUTTONS BAR */}
          <div className="bg-indigo-950 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <p className="font-black text-amber-300 text-xs">
                ✨ ૧ ક્લિકમાં બધી ૫ કંપનીના અલગ અલગ ક્વોટેશન તૈયાર છે
              </p>
              <p className="text-[11px] text-indigo-200 font-bold">
                અલગ અલગ પ્રિન્ટ કાઢો અથવા ભાવ તુલનાત્મક પત્રક સીધું જ પ્રિન્ટ કરો.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrintComparativeStatement}
                className="bg-amber-500 hover:bg-amber-600 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>📊 ભાવ તુલનાત્મક પત્રક (L1)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  firms.forEach((f, idx) => {
                    setTimeout(() => handlePrintSingleQuotation(f), idx * 600);
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4 text-amber-200" />
                <span>⎙ એકસાથે ૫ ક્વોટેશન પ્રિન્ટ કરો</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
