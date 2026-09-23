import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Building2, HelpCircle, Save, Plus, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';
import { InvoiceModal } from './InvoiceModal';

interface GemBillGeneratorModalProps {
  storeSettings: StoreSettings;
  orders: OrderRecord[];
  onSaveOrder: (newOrder: OrderRecord) => void;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

const STATIONERY_HSN_HELP = [
  { code: '4802', rate: '12%', desc: 'A4 Copier Paper, Xerox Paper, Ledger Books, Legal Paper' },
  { code: '4820', rate: '12%', desc: 'Registers, Notebooks, Account Books, Writing Pads, Diaries' },
  { code: '9608', rate: '12%', desc: 'Ballpoint Pens, Gel Pens, Markers, Highlighters' },
  { code: '3926', rate: '18%', desc: 'Plastic L-Folders, Button Files, Display Files, Strip Files' },
  { code: '8472', rate: '18%', desc: 'Stapler Machines, Hole Punching Machines, Laminators' },
  { code: '8205', rate: '18%', desc: 'Scissors, Paper Cutters, Tape Dispensers' },
  { code: '3506', rate: '18%', desc: 'Fevicol, Adhesive Glue Sticks, Cellotapes' },
  { code: '8443', rate: '18%', desc: 'Printer Ink Bottles, Toner Cartridges, Ribbon Cartridges' },
];

export default function GemBillGeneratorModal({
  storeSettings,
  orders,
  onSaveOrder,
  onClose,
  showToast
}: GemBillGeneratorModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  // GeM Contract Details
  const [gemContractNo, setGemContractNo] = useState<string>(`GEMC-5116877${Math.floor(100000 + Math.random() * 900000)}`);
  const [gemContractDate, setGemContractDate] = useState<string>(new Date().toLocaleDateString('en-IN'));
  const [consigneeDept, setConsigneeDept] = useState<string>('મામલતદાર કચેરી, થરાદ (સરકારી વિભાગ)');
  const [officerName, setOfficerName] = useState<string>('મામલતદાર શ્રી / નાયબ મામલતદાર શ્રી');
  const [officerMobile, setOfficerMobile] = useState<string>('9428012345');
  const [consigneeGstin, setConsigneeGstin] = useState<string>('24AHGPD1234F1Z1');
  const [consigneeAddress, setConsigneeAddress] = useState<string>('તાલુકા સેવા સદન, થરાદ, બનાસકાંઠા (ગુજરાત) - 385565');
  
  // Items List
  const [items, setItems] = useState<Array<{ name: string; qty: number; price: number; hsnCode: string; unit: string }>>([
    { name: 'A4 Rim Paper 75 GSM (JK Copier)', qty: 10, price: 280, hsnCode: '4802', unit: 'રિમ' },
    { name: 'Ball Pen Box (Blue 20 Pcs)', qty: 5, price: 150, hsnCode: '9608', unit: 'બોક્સ' },
    { name: 'Plastic L-Folder (100 Pcs Pack)', qty: 2, price: 350, hsnCode: '3926', unit: 'પેક' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemHsn, setNewItemHsn] = useState('4802');
  const [newItemUnit, setNewItemUnit] = useState('નંગ');

  const [showHsnGuide, setShowHsnGuide] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<OrderRecord | null>(null);

  // Load from existing order
  const handleLoadOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const found = orders.find(o => o.id === orderId);
    if (found) {
      setOfficerName(found.customerName || officerName);
      setOfficerMobile(found.mobile || officerMobile);
      if (found.consigneeDept) setConsigneeDept(found.consigneeDept);
      if (found.gemContractNo) setGemContractNo(found.gemContractNo);
      if (found.gemContractDate) setGemContractDate(found.gemContractDate);
      if (found.consigneeGstin) setConsigneeGstin(found.consigneeGstin);
      if (found.address) setConsigneeAddress(found.address);

      setItems(
        found.items.map(it => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          hsnCode: it.hsnCode || '4802',
          unit: it.unit || 'નંગ'
        }))
      );
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || newItemPrice <= 0) return;
    setItems([
      ...items,
      {
        name: newItemName.trim(),
        qty: newItemQty,
        price: newItemPrice,
        hsnCode: newItemHsn,
        unit: newItemUnit
      }
    ]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateSubtotal = () => items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleGenerateAndPreview = () => {
    if (items.length === 0) {
      alert('કૃપા કરીને બિલમાં ઓછામાં ઓછી ૧ વસ્તુ ઉમેરો.');
      return;
    }

    const sub = calculateSubtotal();
    const invNo = selectedOrderId
      ? orders.find(o => o.id === selectedOrderId)?.invoiceNo || `GEM-${Math.floor(1000 + Math.random() * 9000)}`
      : `GEM-${Math.floor(1000 + Math.random() * 9000)}`;

    const gemOrder: OrderRecord = {
      id: selectedOrderId || `gem_ord_${Date.now()}`,
      invoiceNo: invNo,
      customerName: officerName,
      mobile: officerMobile,
      address: consigneeAddress,
      gstin: consigneeGstin,
      items: items.map(it => ({
        id: `it_${Math.random()}`,
        name: it.name,
        price: it.price,
        qty: it.qty,
        unit: it.unit,
        hsnCode: it.hsnCode
      })),
      subtotal: sub,
      discount: 0,
      total: sub,
      paymentMode: 'GeM Portal Online (Govt Bill)',
      paymentStatus: 'Paid',
      orderStatus: 'delivered',
      orderType: 'counter',
      date: `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      gemContractNo: gemContractNo,
      gemContractDate: gemContractDate,
      consigneeDept: consigneeDept,
      consigneeGstin: consigneeGstin
    };

    onSaveOrder(gemOrder);
    setPreviewOrder(gemOrder);
    if (showToast) showToast('🏛️ GeM સરકારી બિલ તૈયાર થઈ ગયું!');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border-2 border-blue-900 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER BAR */}
        <div className="bg-[#0B1E48] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>🏛️ GeM પોર્ટલ સરકારી બિલ જનરેટર</span>
                <span className="bg-orange-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Govt e-Marketplace
                </span>
              </h2>
              <p className="text-xs text-blue-200 font-bold">
                100% GeM Contract Matched • HSN Breakdown • PDF Under 5 MB Compliant
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-blue-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-bold text-neutral-800">
          
          {/* LOAD EXISTING ORDER OPTION */}
          {orders.length > 0 && (
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                <span>હાલના ઓર્ડરમાંથી બિલ ડેટા લોડ કરો (Select Existing Order):</span>
              </div>
              <select
                value={selectedOrderId}
                onChange={e => handleLoadOrder(e.target.value)}
                className="bg-white text-xs font-bold px-3 py-1.5 border border-blue-400 rounded-lg outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="">-- નવું જ GeM બિલ બનાવો --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.invoiceNo} - {o.customerName} (₹{o.total}) - {o.date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. GeM CONTRACT & BUYING DEPT METADATA */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center justify-between border-b pb-2">
              <span>૧. GeM કન્ટ્રાક્ટ & ખરીદનાર વિભાગની વિગત (GeM Order Metadata)</span>
              <button
                type="button"
                onClick={() => setShowHsnGuide(!showHsnGuide)}
                className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>સ્ટેશનરી HSN કોડ ગાઇડ</span>
              </button>
            </h3>

            {/* HSN Helper Banner */}
            {showHsnGuide && (
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-[11px] space-y-1.5 animate-in fade-in">
                <p className="font-black text-amber-900">📌 સ્ટેશનરી અને ઝેરોક્ષ માટેના માન્ય GeM HSN કોડ્સ:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-neutral-800">
                  {STATIONERY_HSN_HELP.map(h => (
                    <div key={h.code} className="bg-white p-1.5 rounded border border-amber-200">
                      <b className="font-mono text-blue-900">HSN {h.code}</b> ({h.rate}): {h.desc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📑 GeM કન્ટ્રાક્ટ નંબર (Contract No):
                </label>
                <input
                  type="text"
                  value={gemContractNo}
                  onChange={e => setGemContractNo(e.target.value)}
                  placeholder="GEMC-5116877051234"
                  className="w-full text-xs font-mono font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📅 કન્ટ્રાક્ટ તારીખ (Contract Date):
                </label>
                <input
                  type="text"
                  value={gemContractDate}
                  onChange={e => setGemContractDate(e.target.value)}
                  placeholder="23/09/2026"
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  🏢 સરકારી વિભાગનું નામ (Buying Dept):
                </label>
                <input
                  type="text"
                  value={consigneeDept}
                  onChange={e => setConsigneeDept(e.target.value)}
                  placeholder="મામલતદાર કચેરી, થરાદ"
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  👤 અધિકારી / સંપર્ક વ્યક્તિનું નામ:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  placeholder="નાયબ મામલતદાર શ્રી"
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📞 અધિકારીનો મોબાઇલ નંબર:
                </label>
                <input
                  type="tel"
                  value={officerMobile}
                  onChange={e => setOfficerMobile(e.target.value)}
                  placeholder="9428012345"
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  🏛️ ખરીદનાર વિભાગનો GSTIN / TAN:
                </label>
                <input
                  type="text"
                  value={consigneeGstin}
                  onChange={e => setConsigneeGstin(e.target.value)}
                  placeholder="24AHGPD1234F1Z1"
                  className="w-full text-xs font-mono font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-extrabold text-neutral-700 mb-1">
                  📍 કન્સાઇની ડિલિવરી સરનામું (Consignee Address):
                </label>
                <input
                  type="text"
                  value={consigneeAddress}
                  onChange={e => setConsigneeAddress(e.target.value)}
                  placeholder="તાલુકા સેવા સદન, થરાદ, બનાસકાંઠા (ગુજરાત) - 385565"
                  className="w-full text-xs font-black p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          {/* 2. ITEMS LIST AND ADD ITEM BAR */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
              <span>૨. ખરીદેલ માલ / આઇટમ્સ વિગત (Item Schedule)</span>
              <span className="text-orange-700 font-black">
                કુલ રકમ: ₹{calculateSubtotal()}/-
              </span>
            </h3>

            {/* ADD ITEM INPUT BAR */}
            <div className="bg-white p-3 rounded-xl border border-neutral-300 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[10px] text-neutral-600 mb-0.5">આઇટમ નામ (Description):</label>
                <input
                  type="text"
                  placeholder="A4 Copier Paper, Pens, Files..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] text-neutral-600 mb-0.5">HSN કોડ:</label>
                <input
                  type="text"
                  placeholder="4802"
                  value={newItemHsn}
                  onChange={e => setNewItemHsn(e.target.value)}
                  className="w-full text-xs font-mono font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
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
                <label className="block text-[10px] text-neutral-600 mb-0.5">દર (Rate ₹):</label>
                <input
                  type="number"
                  placeholder="280"
                  value={newItemPrice || ''}
                  onChange={e => setNewItemPrice(Number(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-1.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  <span>ઉમેરો</span>
                </button>
              </div>
            </div>

            {/* TABLE OF ADDED ITEMS */}
            <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 border-b font-black text-neutral-700">
                  <tr>
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">વસ્તુ / સેવાની વિગત</th>
                    <th className="p-2 text-center w-20">HSN</th>
                    <th className="p-2 text-center w-16">જથ્થો</th>
                    <th className="p-2 text-right w-24">દર (₹)</th>
                    <th className="p-2 text-right w-24">કુલ (₹)</th>
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-bold">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-neutral-400 font-bold">
                        બિલમાં કોઈ આઇટમ ઉમેરેલ નથી. ઉપરથી આઇટમ ઉમેરો.
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="p-2 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 font-black text-neutral-900">{it.name}</td>
                        <td className="p-2 text-center font-mono">{it.hsnCode}</td>
                        <td className="p-2 text-center">{it.qty} {it.unit}</td>
                        <td className="p-2 text-right">₹{it.price}</td>
                        <td className="p-2 text-right font-black text-orange-700">₹{it.price * it.qty}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STATUTORY COMPLIANCE BADGE */}
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-black text-emerald-900 text-xs">
                  ✓ 100% GeM Portal Compliant Government Bill Format
                </p>
                <p className="text-[11px] text-emerald-800">
                  આ બિલ સીધું જ GeM Portal પર સેલર ઇનવોઇસ અપલોડ માટે માન્ય છે. PDF સાઇઝ ૫ MB થી ઓછી જનરેટ થાય છે.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGenerateAndPreview}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl shadow flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-orange-300" />
              <span>GeM બિલ પ્રિન્ટ / PDF ડાઉનલોડ જુઓ</span>
            </button>
          </div>

        </div>
      </div>

      {/* RENDER INVOICE MODAL WHEN GENERATED */}
      {previewOrder && (
        <InvoiceModal
          order={previewOrder}
          storeSettings={storeSettings}
          onClose={() => setPreviewOrder(null)}
          isSuccessView={false}
          showToast={showToast}
        />
      )}
    </div>
  );
}
