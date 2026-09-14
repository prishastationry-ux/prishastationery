import React, { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp, Package, DollarSign, Download, Printer, Filter, CheckCircle2, AlertTriangle, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { OrderRecord, ProductItem, ExpenseRecord, StoreSettings } from '../types';

interface DailyReportModalProps {
  orders: OrderRecord[];
  posItems: ProductItem[];
  expenses: ExpenseRecord[];
  storeSettings: StoreSettings;
  onClose: () => void;
  onOpenInvoice?: (order: OrderRecord) => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  orders,
  posItems,
  expenses,
  storeSettings,
  onClose,
  onOpenInvoice
}) => {
  // Today's date default: YYYY-MM-DD for standard html date picker
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewTab, setViewTab] = useState<'daily' | 'stock' | 'profit' | 'tax'>('daily');

  // Format selected date for matching order string (en-GB: DD/MM/YYYY)
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  }, [selectedDate]);

  // Filter orders matching selected date
  const filteredOrders = useMemo(() => {
    if (!formattedSelectedDate) return orders;
    return orders.filter(o => {
      const orderDatePart = o.date.split(' ')[0];
      return orderDatePart === formattedSelectedDate;
    });
  }, [orders, formattedSelectedDate]);

  // Filter expenses matching selected date
  const filteredExpenses = useMemo(() => {
    if (!formattedSelectedDate) return expenses;
    return expenses.filter(e => {
      const expDatePart = e.date.split(' ')[0];
      return expDatePart === formattedSelectedDate;
    });
  }, [expenses, formattedSelectedDate]);

  // Day Financial Calculations
  const dayCalculations = useMemo(() => {
    let totalSales = 0;
    let totalDiscount = 0;
    let totalTaxCollected = 0;
    let totalEstimatedCost = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;
    let paidSales = 0;
    let pendingSales = 0;
    let totalUnitsSold = 0;

    // Item-level breakdown for the day
    const itemSummaryMap: Record<string, { name: string; qty: number; totalAmount: number; estimatedProfit: number }> = {};

    filteredOrders.forEach(ord => {
      totalSales += ord.total;
      totalDiscount += ord.discount || 0;
      totalTaxCollected += ord.tax || 0;

      if (ord.paymentMode === 'Cash') cashSales += ord.total;
      else if (ord.paymentMode === 'UPI') upiSales += ord.total;
      else if (ord.paymentMode === 'બાકી (Credit)') creditSales += ord.total;
      else upiSales += ord.total;

      if (ord.paymentStatus === 'Paid') paidSales += ord.total;
      else pendingSales += ord.total;

      ord.items.forEach(it => {
        totalUnitsSold += it.qty;
        const matchingProd = posItems.find(p => p.id === it.productId || p.nameGu === it.name || p.nameEn === it.name);
        const costPrice = matchingProd ? matchingProd.costPrice : (it.price * 0.8);
        const profitPerUnit = Math.max(0, it.price - costPrice);
        const itemProfit = profitPerUnit * it.qty;
        totalEstimatedCost += (costPrice * it.qty);

        if (!itemSummaryMap[it.name]) {
          itemSummaryMap[it.name] = { name: it.name, qty: 0, totalAmount: 0, estimatedProfit: 0 };
        }
        itemSummaryMap[it.name].qty += it.qty;
        itemSummaryMap[it.name].totalAmount += (it.price * it.qty);
        itemSummaryMap[it.name].estimatedProfit += itemProfit;
      });
    });

    const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = Math.max(0, totalSales - totalEstimatedCost);
    const netProfit = Math.max(0, grossProfit - totalExpenseAmount);

    return {
      totalBills: filteredOrders.length,
      totalSales,
      totalDiscount,
      totalTaxCollected,
      totalEstimatedCost,
      grossProfit,
      totalExpenseAmount,
      netProfit,
      cashSales,
      upiSales,
      creditSales,
      paidSales,
      pendingSales,
      totalUnitsSold,
      topItems: Object.values(itemSummaryMap).sort((a, b) => b.totalAmount - a.totalAmount)
    };
  }, [filteredOrders, filteredExpenses, posItems]);

  // Stock Summary & Valuation
  const stockMetrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalSellingValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    posItems.forEach(p => {
      const stock = typeof p.stock === 'number' ? p.stock : 0;
      totalStockUnits += stock;
      totalCostValuation += (p.costPrice * stock);
      totalSellingValuation += (p.price * stock);

      if (stock === 0 && !p.isService) outOfStockCount++;
      else if (stock <= 5 && !p.isService) lowStockCount++;
    });

    const potentialStockProfit = Math.max(0, totalSellingValuation - totalCostValuation);

    return {
      totalProducts: posItems.length,
      totalStockUnits,
      totalCostValuation,
      totalSellingValuation,
      potentialStockProfit,
      lowStockCount,
      outOfStockCount
    };
  }, [posItems]);

  // Export Daily Report as CSV
  const handleExportDailyCsv = () => {
    const rows = [
      ['તારીખ (Date)', formattedSelectedDate || 'All Time'],
      ['દુકાનનું નામ', storeSettings.storeNameGu],
      ['કુલ બિલ સંખ્યા', String(dayCalculations.totalBills)],
      ['કુલ વેચાણ (Gross Sales)', `Rs. ${dayCalculations.totalSales.toFixed(2)}`],
      ['કુલ ડિસ્કાઉન્ટ', `Rs. ${dayCalculations.totalDiscount.toFixed(2)}`],
      ['અંદાજિત માલ ખરીદ ખર્ચ (Cost of Goods)', `Rs. ${dayCalculations.totalEstimatedCost.toFixed(2)}`],
      ['ગ્રોસ નફો (Gross Profit)', `Rs. ${dayCalculations.grossProfit.toFixed(2)}`],
      ['દુકાન ખર્ચ (Daily Expenses)', `Rs. ${dayCalculations.totalExpenseAmount.toFixed(2)}`],
      ['ચોખ્ખો નફો (Net Profit)', `Rs. ${dayCalculations.netProfit.toFixed(2)}`],
      ['રોકડ પેમેન્ટ (Cash)', `Rs. ${dayCalculations.cashSales.toFixed(2)}`],
      ['UPI / ઓનલાઇન પેમેન્ટ', `Rs. ${dayCalculations.upiSales.toFixed(2)}`],
      ['બાકી (Credit)', `Rs. ${dayCalculations.creditSales.toFixed(2)}`],
      [''],
      ['ઓર્ડર લિસ્ટ (Bills List):'],
      ['બિલ નંબર', 'તારીખ & સમય', 'ગ્રાહકનું નામ', 'મોબાઇલ', 'પેમેન્ટ મોડ', 'સ્ટેટસ', 'રકમ (Total)']
    ];

    filteredOrders.forEach(o => {
      rows.push([
        o.invoiceNo,
        o.date,
        o.customerName,
        o.mobile,
        o.paymentMode,
        o.paymentStatus,
        `Rs. ${o.total.toFixed(2)}`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Prisha_Daily_Report_${formattedSelectedDate.replace(/\//g, '-') || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Daily Report
  const handlePrintDailyReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0B1E48] via-indigo-900 to-[#0B1E48] text-white p-4 flex items-center justify-between gap-3 border-b-2 border-orange-500">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black shadow">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>📈 દૈનિક વેચાણ, નફો & સ્ટોક રિપોર્ટ (Daily ERP Report)</span>
              </h2>
              <p className="text-xs text-orange-300 font-bold">
                {storeSettings.storeNameGu} • {formattedSelectedDate ? `તારીખ: ${formattedSelectedDate}` : 'બધો ડેટા'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportDailyCsv}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
              title="CSV / Excel ફાઇલમાં સેવ કરો"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel / CSV સેવ</span>
            </button>
            <button
              type="button"
              onClick={handlePrintDailyReport}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
              title="રિપોર્ટ પ્રિન્ટ કરો"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">પ્રિન્ટ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DATE SELECTOR & NAVIGATION TABS */}
        <div className="bg-neutral-100 p-3 border-b border-neutral-300 flex flex-wrap items-center justify-between gap-3">
          {/* Date Picker Bar */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="text-xs font-black text-neutral-700">તારીખ પસંદ કરો:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-black text-neutral-900 bg-transparent outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-[10px] font-bold text-blue-700 hover:underline ml-1"
              >
                બધો ડેટા
              </button>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewTab('daily')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewTab === 'daily'
                  ? 'bg-[#0B1E48] text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-300/60'
              }`}
            >
              📊 આજનો હિસાબ
            </button>
            <button
              type="button"
              onClick={() => setViewTab('profit')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewTab === 'profit'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-300/60'
              }`}
            >
              💰 નફો & માર્જિન
            </button>
            <button
              type="button"
              onClick={() => setViewTab('stock')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewTab === 'stock'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-300/60'
              }`}
            >
              📦 લાઈવ સ્ટોક વેલ્યુ
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: DAILY SALES SUMMARY */}
          {viewTab === 'daily' && (
            <div className="space-y-4">
              {/* KEY STATS CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[11px] font-bold text-orange-900 block">💰 કુલ વેચાણ (Sales)</span>
                  <span className="text-lg sm:text-xl font-black text-orange-700">₹{dayCalculations.totalSales.toFixed(2)}</span>
                  <span className="text-[10px] text-orange-800 font-bold block mt-0.5">{dayCalculations.totalBills} બિલ બન્યા</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-900 block">✨ ચોખ્ખો નફો (Net Profit)</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700">₹{dayCalculations.netProfit.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">ગ્રોસ: ₹{dayCalculations.grossProfit.toFixed(2)}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[11px] font-bold text-blue-900 block">💳 UPI / રોકડ વેચાણ</span>
                  <div className="text-xs font-bold text-blue-950 mt-1 space-y-0.5">
                    <div>UPI: <b>₹{dayCalculations.upiSales.toFixed(2)}</b></div>
                    <div>Cash: <b>₹{dayCalculations.cashSales.toFixed(2)}</b></div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-900 block">📉 ખર્ચ & બાકી રકમ</span>
                  <div className="text-xs font-bold text-rose-950 mt-1 space-y-0.5">
                    <div>ખર્ચ: <b>₹{dayCalculations.totalExpenseAmount.toFixed(2)}</b></div>
                    <div>બાકી: <b className="text-red-700">₹{dayCalculations.creditSales.toFixed(2)}</b></div>
                  </div>
                </div>
              </div>

              {/* DETAILED ORDERS TABLE FOR THE SELECTED DAY */}
              <div className="bg-white rounded-xl border border-neutral-300 shadow-2xs overflow-hidden">
                <div className="bg-neutral-100 px-3 py-2 border-b border-neutral-300 flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span>આજના તમામ બિલ / ઓર્ડર્સ ({filteredOrders.length})</span>
                  </span>
                  <span className="text-[11px] font-bold text-neutral-600">
                    કુલ આઇટમ્સ વેચાઈ: {dayCalculations.totalUnitsSold} નંગ
                  </span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 font-black text-neutral-700 text-[11px]">
                      <tr>
                        <th className="p-2.5">બિલ નં</th>
                        <th className="p-2.5">સમય / તારીખ</th>
                        <th className="p-2.5">ગ્રાહક</th>
                        <th className="p-2.5">મોબાઇલ</th>
                        <th className="p-2.5">આઇટમ્સ</th>
                        <th className="p-2.5">પેમેન્ટ</th>
                        <th className="p-2.5 text-right">રકમ (₹)</th>
                        <th className="p-2.5 text-center">ક્રિયા</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-bold text-neutral-800">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-neutral-50/80">
                          <td className="p-2.5 font-mono font-black text-blue-700">{o.invoiceNo}</td>
                          <td className="p-2.5 text-[11px] text-neutral-600">{o.date}</td>
                          <td className="p-2.5 font-black text-neutral-900">{o.customerName}</td>
                          <td className="p-2.5 text-neutral-600">+91 {o.mobile}</td>
                          <td className="p-2.5 text-[11px] text-neutral-600 max-w-[180px] truncate">
                            {o.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {o.paymentMode} ({o.paymentStatus})
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-black text-neutral-900">₹{o.total.toFixed(2)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenInvoice && onOpenInvoice(o)}
                              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded text-[11px] font-black cursor-pointer inline-flex items-center gap-1"
                              title="બિલ જુઓ / પ્રિન્ટ કરો"
                            >
                              <Printer className="w-3 h-3 text-neutral-600" />
                              <span>જુઓ</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-neutral-500 font-bold">
                            પસંદ કરેલ તારીખે કોઈ બિલ બનેલ નથી.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOP SELLING PRODUCTS TODAY */}
              {dayCalculations.topItems.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-300 p-3 shadow-2xs space-y-2">
                  <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>આજે સૌથી વધુ વેચાયેલ વસ્તુઓ (Top Selling Items Today):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {dayCalculations.topItems.slice(0, 6).map((it, idx) => (
                      <div key={idx} className="bg-neutral-50 p-2 rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-black text-neutral-900">{it.name}</p>
                          <p className="text-[10px] text-neutral-500 font-bold">વેચાયા: {it.qty} નંગ</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-orange-700">₹{it.totalAmount.toFixed(2)}</p>
                          <p className="text-[10px] text-emerald-700 font-bold">+₹{it.estimatedProfit.toFixed(2)} નફો</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFIT & MARGIN ANALYSIS */}
          {viewTab === 'profit' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-4 rounded-xl shadow-md border border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>💵 નફા-નુકસાન સ્ટેટમેન્ટ (Profit & Loss Analysis)</span>
                  </h3>
                  <span className="bg-emerald-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {formattedSelectedDate ? `તારીખ: ${formattedSelectedDate}` : 'બધો ડેટા'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-emerald-200 block font-bold">કુલ ગ્રોસ વેચાણ</span>
                    <span className="text-base sm:text-lg font-black text-white">₹{dayCalculations.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-emerald-200 block font-bold">માલ ખરીદ પડતર ભાવ (Cost)</span>
                    <span className="text-base sm:text-lg font-black text-rose-300">₹{dayCalculations.totalEstimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-emerald-200 block font-bold">દુકાન ખર્ચ (Expenses)</span>
                    <span className="text-base sm:text-lg font-black text-amber-300">₹{dayCalculations.totalExpenseAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-emerald-200 block font-bold">ચોખ્ખો ચોખ્ખો નફો (Net)</span>
                    <span className="text-base sm:text-xl font-black text-emerald-300">₹{dayCalculations.netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* EXPENSES FOR THE DAY */}
              <div className="bg-white rounded-xl border border-neutral-300 p-3 shadow-2xs space-y-2">
                <h4 className="text-xs font-black text-neutral-900 flex items-center justify-between">
                  <span>📉 આજના ખર્ચની વિગતો (Daily Expenses List):</span>
                  <span className="text-neutral-600 font-bold text-[11px]">કુલ ખર્ચ: ₹{dayCalculations.totalExpenseAmount.toFixed(2)}</span>
                </h4>
                <div className="divide-y divide-neutral-200 max-h-48 overflow-y-auto">
                  {filteredExpenses.map(exp => (
                    <div key={exp.id} className="py-2 flex items-center justify-between text-xs font-bold">
                      <div>
                        <span className="text-neutral-900">{exp.title}</span>
                        <span className="text-[10px] text-neutral-500 ml-2">({exp.category} • {exp.date})</span>
                      </div>
                      <span className="text-red-700 font-black">-₹{exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <p className="text-center py-4 text-xs text-neutral-400 font-bold">
                      આ તારીખ માટે કોઈ ખર્ચ નોંધાયેલ નથી.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE STOCK VALUATION */}
          {viewTab === 'stock' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-950 to-blue-950 text-white p-4 rounded-xl shadow-md border border-blue-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-orange-400" />
                    <span>📦 દુકાન સંપૂર્ણ સ્ટોક વેલ્યુએશન (Live Stock Valuation)</span>
                  </h3>
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    કુલ {stockMetrics.totalProducts} પ્રોડક્ટ્સ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-blue-200 block font-bold">હાજર માલનો જથ્થો</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400">{stockMetrics.totalStockUnits} નંગ</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-blue-200 block font-bold">કુલ ખરીદ રોકાણ (Cost)</span>
                    <span className="text-base sm:text-lg font-black text-rose-300">₹{stockMetrics.totalCostValuation.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-blue-200 block font-bold">કુલ વેચાણ મૂલ્ય (MRP)</span>
                    <span className="text-base sm:text-lg font-black text-amber-300">₹{stockMetrics.totalSellingValuation.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                    <span className="text-[10px] text-blue-200 block font-bold">સંભવિત નફો (Expected)</span>
                    <span className="text-base sm:text-lg font-black text-emerald-300">+₹{stockMetrics.potentialStockProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* STOCK STATUS TABLE */}
              <div className="bg-white rounded-xl border border-neutral-300 shadow-2xs overflow-hidden">
                <div className="bg-neutral-100 px-3 py-2 border-b border-neutral-300 flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-800">
                    દરેક વસ્તુનો હાજર સ્ટોક & ખરીદ-વેચાણ ભાવ
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">ખલાસ: {stockMetrics.outOfStockCount}</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">ઓછો સ્ટોક: {stockMetrics.lowStockCount}</span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 font-black text-neutral-700 text-[11px]">
                      <tr>
                        <th className="p-2">વસ્તુનું નામ</th>
                        <th className="p-2">કેટેગરી</th>
                        <th className="p-2 text-center">હાજર સ્ટોક</th>
                        <th className="p-2 text-right">ખરીદ ભાવ (Cost)</th>
                        <th className="p-2 text-right">વેચાણ ભાવ (MRP)</th>
                        <th className="p-2 text-right">નફો / નંગ</th>
                        <th className="p-2 text-right">કુલ સ્ટોક વેલ્યુ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-bold text-neutral-800">
                      {posItems.map(p => {
                        const stock = typeof p.stock === 'number' ? p.stock : 0;
                        const profitPerUnit = Math.max(0, p.price - p.costPrice);
                        const totalItemCostVal = p.costPrice * stock;
                        const totalItemSellingVal = p.price * stock;

                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/80">
                            <td className="p-2 font-black text-neutral-900">
                              {p.nameGu}
                              <span className="block text-[10px] text-neutral-500">{p.nameEn}</span>
                            </td>
                            <td className="p-2 text-[11px] text-neutral-600">{p.category}</td>
                            <td className="p-2 text-center">
                              {p.isService ? (
                                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full text-[10px] font-black">સેવા</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  stock === 0 ? 'bg-red-100 text-red-900' : stock <= 5 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                  {stock} {p.unit}
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right text-rose-700">₹{p.costPrice.toFixed(2)}</td>
                            <td className="p-2 text-right text-neutral-900 font-black">₹{p.price.toFixed(2)}</td>
                            <td className="p-2 text-right text-emerald-700">+₹{profitPerUnit.toFixed(2)}</td>
                            <td className="p-2 text-right text-blue-900 font-black">₹{totalItemSellingVal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTION */}
        <div className="bg-neutral-100 p-3 border-t border-neutral-300 flex items-center justify-between">
          <p className="text-xs text-neutral-600 font-bold">
            💡 આ ડેટા રિયલ-ટાઇમ ઓટોમેટિક કેલ્ક્યુલેટ થાય છે. તમે કોઈપણ તારીખનો રિપોર્ટ Excel માં ડાઉનલોડ કરી શકો છો.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-xs font-black shadow cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
