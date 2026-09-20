import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  X,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Package,
  Calendar,
  Layers,
  DollarSign,
  UserCheck,
  Building2,
  Filter
} from 'lucide-react';
import {
  OrderRecord,
  ProductItem,
  ExpenseRecord,
  PurchaseRecord,
  StoreSettings,
  RojmelEntry,
  KhataAccount
} from '../types';

interface CaAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: OrderRecord[];
  products?: ProductItem[];
  posItems?: ProductItem[];
  expenses?: ExpenseRecord[];
  purchases?: PurchaseRecord[];
  rojmelEntries?: RojmelEntry[];
  khataAccounts?: KhataAccount[];
  storeSettings: StoreSettings;
}

type PeriodFilter = 'current_month' | 'last_month' | 'fy_current' | 'all' | 'custom';
type ActiveTab = 'summary' | 'sales' | 'purchases' | 'expenses' | 'stock' | 'rojmel';

export const CaAuditModal: React.FC<CaAuditModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  products: initialProducts = [],
  posItems = [],
  expenses = [],
  purchases = [],
  rojmelEntries = [],
  khataAccounts = [],
  storeSettings
}) => {
  const products = initialProducts.length > 0 ? initialProducts : posItems;
  const [period, setPeriod] = useState<PeriodFilter>('current_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  if (!isOpen) return null;

  // Helper to parse dates formatted as 'DD/MM/YYYY' or ISO
  const parseEntryDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Determine date bounds
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Financial year calculation (April to March in India)
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const fyStartDate = new Date(fyStartYear, 3, 1); // 1st April
  const fyEndDate = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // 31st March

  const isDateInSelectedPeriod = (dateStr?: string): boolean => {
    if (period === 'all') return true;
    const d = parseEntryDate(dateStr);
    if (!d) return true;

    if (period === 'current_month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (period === 'last_month') {
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonthIdx;
    }
    if (period === 'fy_current') {
      return d >= fyStartDate && d <= fyEndDate;
    }
    if (period === 'custom') {
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        return d >= s && d <= e;
      }
      return true;
    }
    return true;
  };

  // Filtered datasets
  const filteredOrders = useMemo(
    () => orders.filter(o => isDateInSelectedPeriod(o.date)),
    [orders, period, customStartDate, customEndDate]
  );

  const filteredPurchases = useMemo(
    () => purchases.filter(p => isDateInSelectedPeriod(p.date)),
    [purchases, period, customStartDate, customEndDate]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter(e => isDateInSelectedPeriod(e.date)),
    [expenses, period, customStartDate, customEndDate]
  );

  const filteredRojmel = useMemo(
    () => rojmelEntries.filter(r => isDateInSelectedPeriod(r.date)),
    [rojmelEntries, period, customStartDate, customEndDate]
  );

  // Financial aggregates
  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCostOfGoodsSold = filteredOrders.reduce((sum, o) => {
    const cost = o.items.reduce((c, it) => {
      const prod = products.find(p => p.id === it.productId || p.nameGu === it.name || p.nameEn === it.name);
      const unitCost = prod?.costPrice ? Number(prod.costPrice) : Number(it.price) * 0.7;
      return c + unitCost * (it.qty || 1);
    }, 0);
    return sum + cost;
  }, 0);

  const totalGrossProfit = totalSalesAmount - totalCostOfGoodsSold;
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netEstimatedProfit = totalGrossProfit - totalExpensesAmount;

  // Closing Stock Valuation
  const totalStockUnits = products.reduce((sum, p) => {
    return sum + (typeof p.stock === 'number' ? Math.max(0, p.stock) : 0);
  }, 0);

  const totalStockCostValuation = products.reduce((sum, p) => {
    const units = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
    const cost = Number(p.costPrice) || (Number(p.price) * 0.7) || 0;
    return sum + units * cost;
  }, 0);

  const totalStockSalesValuation = products.reduce((sum, p) => {
    const units = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
    return sum + units * (Number(p.price) || 0);
  }, 0);

  // Khata Receivables
  const totalReceivables = khataAccounts.reduce((sum, a) => {
    return sum + (a.balance > 0 ? a.balance : 0);
  }, 0);

  // Cash in hand from Rojmel
  const totalRojmelJama = filteredRojmel.reduce((sum, r) => sum + (r.type === 'aavak' ? Number(r.amount) || 0 : 0), 0);
  const totalRojmelUdhar = filteredRojmel.reduce((sum, r) => sum + (r.type === 'javak' ? Number(r.amount) || 0 : 0), 0);
  const rojmelNetBalance = totalRojmelJama - totalRojmelUdhar;

  // Period label
  const getPeriodLabel = (): string => {
    if (period === 'current_month') {
      const monthNames = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
      return `${monthNames[currentMonth]} ${currentYear}`;
    }
    if (period === 'last_month') {
      const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const monthNames = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
      return `${monthNames[lastMonthIdx]} ${lastMonthYear}`;
    }
    if (period === 'fy_current') {
      return `નાણાકીય વર્ષ (FY ${fyStartYear}-${(fyStartYear + 1).toString().slice(2)})`;
    }
    if (period === 'custom') {
      return `${customStartDate || 'શરૂઆત'} થી ${customEndDate || 'અંત'}`;
    }
    return 'સમગ્ર સમયગાળો (All Time)';
  };

  // Helper to escape CSV fields safely
  const escapeCsv = (str: any): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  // 1. One-Click Excel / CSV Export for CA
  const handleExportCsv = (type: 'all_package' | 'sales' | 'purchases' | 'expenses' | 'stock') => {
    const periodName = getPeriodLabel().replace(/[^a-zA-Z0-9_\u0A80-\u0AFF]/g, '_');
    const storeName = (storeSettings.storeNameEn || 'PRISHA_STATIONERY').replace(/\s+/g, '_');

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Gujarati compatibility

    if (type === 'sales' || type === 'all_package') {
      csvContent += `=== વેચાણ રજિસ્ટર (SALES REGISTER / GSTR-1) ===\n`;
      csvContent += `પેઢીનું નામ,${escapeCsv(storeSettings.storeNameGu || storeSettings.storeNameEn)}\n`;
      csvContent += `GSTIN,${escapeCsv(storeSettings.gstNumber || 'Unregistered')},PAN,${escapeCsv(storeSettings.panNumber || 'N/A')}\n`;
      csvContent += `સમયગાળો,${escapeCsv(getPeriodLabel())}\n\n`;
      csvContent += `ક્રમ,તારીખ,બિલ નંબર,ગ્રાહકનું નામ,મોબાઇલ નંબર,સરનામું,આઇટમ્સ વિગત,પેમેન્ટ મોડ,સ્થિતિ,કુલ રકમ (₹)\n`;

      filteredOrders.forEach((o, idx) => {
        const itemsSummary = o.items.map(it => `${it.name} (${it.qty} x ₹${it.price})`).join('; ');
        csvContent += [
          idx + 1,
          escapeCsv(o.date),
          escapeCsv(o.invoiceNo),
          escapeCsv(o.customerName),
          escapeCsv(o.mobile),
          escapeCsv(o.address || 'Tharad'),
          escapeCsv(itemsSummary),
          escapeCsv(o.paymentMode),
          escapeCsv(o.paymentStatus),
          Number(o.total).toFixed(2)
        ].join(',') + '\n';
      });

      csvContent += `\nકુલ વેચાણ રકમ,₹${totalSalesAmount.toFixed(2)},કુલ બિલ સંખ્યા,${filteredOrders.length}\n\n`;
    }

    if (type === 'purchases' || type === 'all_package') {
      csvContent += `=== ખરીદી રજિસ્ટર (PURCHASE REGISTER / GSTR-2) ===\n`;
      csvContent += `ક્રમ,તારીખ,બિલ નંબર,વેપારી/કંપનીનું નામ,આઇટમ્સ સંખ્યા,પેમેન્ટ સ્ટેટસ,રકમ (₹)\n`;
      filteredPurchases.forEach((p, idx) => {
        csvContent += [
          idx + 1,
          escapeCsv(p.date),
          escapeCsv(p.billNo || `PUR-${idx + 1}`),
          escapeCsv(p.supplierName),
          escapeCsv(`${p.itemsCount || 1} આઇટમ્સ`),
          escapeCsv(p.paymentStatus || 'Paid'),
          Number(p.totalAmount).toFixed(2)
        ].join(',') + '\n';
      });
      csvContent += `\nકુલ ખરીદી રકમ,₹${totalPurchasesAmount.toFixed(2)}\n\n`;
    }

    if (type === 'expenses' || type === 'all_package') {
      csvContent += `=== દુકાન ખર્ચ રજિસ્ટર (EXPENSE REGISTER) ===\n`;
      csvContent += `ક્રમ,તારીખ,ખર્ચ કેટેગરી,વિગત/કારણ,નોંધ,રકમ (₹)\n`;
      filteredExpenses.forEach((e, idx) => {
        csvContent += [
          idx + 1,
          escapeCsv(e.date),
          escapeCsv(e.category),
          escapeCsv(e.title),
          escapeCsv(e.notes || '-'),
          Number(e.amount).toFixed(2)
        ].join(',') + '\n';
      });
      csvContent += `\nકુલ ખર્ચ રકમ,₹${totalExpensesAmount.toFixed(2)}\n\n`;
    }

    if (type === 'stock' || type === 'all_package') {
      csvContent += `=== હાજર સ્ટોક વેલ્યુએશન સમરી (CLOSING STOCK VALUATION) ===\n`;
      csvContent += `ક્રમ,પ્રોડક્ટનું નામ,કેટેગરી,હાજર જથ્થો,એકમ,પડતર ભાવ (Cost ₹),કુલ પડતર કિંમત (₹),વેચાણ ભાવ (Sale ₹),MRP (₹)\n`;
      products.forEach((p, idx) => {
        const units = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
        const cost = Number(p.costPrice) || (Number(p.price) * 0.7) || 0;
        const costVal = units * cost;
        csvContent += [
          idx + 1,
          escapeCsv(p.nameGu),
          escapeCsv(p.category),
          units,
          escapeCsv(p.unit || 'નંગ'),
          cost.toFixed(2),
          costVal.toFixed(2),
          Number(p.price).toFixed(2),
          p.mrp ? Number(p.mrp).toFixed(2) : ''
        ].join(',') + '\n';
      });
      csvContent += `\nકુલ સ્ટોક પડતર મૂલ્ય,₹${totalStockCostValuation.toFixed(2)},કુલ વેચાણ મૂલ્ય,₹${totalStockSalesValuation.toFixed(2)}\n\n`;
    }

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CA_Audit_${storeName}_${type}_${periodName}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  // 2. Print CA Summary Statement (1-page official report for CA)
  const handlePrintCaReport = () => {
    const printWin = window.open('', '_blank', 'width=850,height=1100');
    if (!printWin) {
      alert('પ્રિન્ટ વિન્ડો ખોલવાની મંજૂરી આપો (Pop-up unblock કરો).');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="utf-8">
  <title>CA Financial Audit Statement - ${storeSettings.storeNameEn}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .title-gu { font-size: 18px; font-weight: 900; margin: 0; color: #0B1E48; }
    .title-en { font-size: 13px; font-weight: 800; margin: 2px 0; color: #333; }
    .tax-line { font-size: 11px; font-weight: 700; margin-top: 4px; }
    .meta-box { width: 100%; border: 1.2px solid #000; border-collapse: collapse; margin-bottom: 12px; }
    .meta-box td { padding: 5px 8px; font-size: 11px; border: 1px solid #000; }
    .badge { font-size: 10px; font-weight: 900; background: #eee; padding: 2px 6px; border-radius: 4px; }
    .grid { display: table; width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .grid-row { display: table-row; }
    .grid-cell { display: table-cell; border: 1.2px solid #000; padding: 6px 10px; width: 50%; vertical-align: top; }
    .table-title { font-size: 12px; font-weight: 900; background: #f3f4f6; padding: 4px 6px; margin: -6px -10px 6px -10px; border-bottom: 1px solid #000; }
    .stat-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #ccc; }
    .stat-val { font-weight: 800; }
    .highlight-net { font-size: 13px; font-weight: 900; color: #047857; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
    .table-list { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10.5px; }
    .table-list th { border: 1px solid #000; background: #f3f4f6; padding: 4px 5px; text-align: left; }
    .table-list td { border: 1px solid #000; padding: 4px 5px; }
    .sign-grid { display: table; width: 100%; margin-top: 40px; }
    .sign-cell { display: table-cell; width: 50%; text-align: center; vertical-align: bottom; }
    .sign-line { width: 180px; border-top: 1.5px solid #000; margin: 40px auto 4px auto; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-gu">${storeSettings.storeNameGu}</div>
    <div class="title-en">${storeSettings.storeNameEn}</div>
    <div style="font-size: 10.5px; color: #444;">${storeSettings.address} • 📞 +91 ${storeSettings.phone}</div>
    <div class="tax-line">
      ${storeSettings.gstNumber ? `GSTIN: <b>${storeSettings.gstNumber}</b> • ` : ''}
      ${storeSettings.panNumber ? `PAN: <b>${storeSettings.panNumber}</b> • ` : ''}
      સંચાલક: <b>${storeSettings.ownerName || 'પ્રિષા સ્ટેશનરી'}</b>
    </div>
    <div style="margin-top: 6px; font-weight: 900; font-size: 12.5px; text-decoration: underline;">
      CA ઓડિટ & નાણાકીય સ્ટેટમેન્ટ (CHARTERED ACCOUNTANT SUMMARY)
    </div>
  </div>

  <table class="meta-box">
    <tr>
      <td style="width: 50%;"><b>ઓડિટ સમયગાળો:</b> ${getPeriodLabel()}</td>
      <td style="width: 50%;"><b>તૈયાર કર્યા તારીખ:</b> ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
    </tr>
    <tr>
      <td><b>કુલ સેલ્સ બિલ સંખ્યા:</b> ${filteredOrders.length} બિલ્સ</td>
      <td><b>ઓડિટ હેતુ:</b> GST રિટર્ન / ઇન્કમ ટેક્સ (ITR) / વાર્ષિક હિસાબ</td>
    </tr>
  </table>

  <!-- Profit & Loss and Trading Summary -->
  <div class="grid">
    <div class="grid-row">
      <!-- Left Column: Trading & Sales -->
      <div class="grid-cell">
        <div class="table-title">૧. ટર્નઓવર & વેચાણ વિગત (TRADING / SALES)</div>
        <div class="stat-row"><span>કુલ ગ્રોસ વેચાણ (Turnover):</span><span class="stat-val">₹${totalSalesAmount.toFixed(2)}</span></div>
        <div class="stat-row"><span>વેચેલ માલની પડતર કિંમત (COGS):</span><span class="stat-val">-₹${totalCostOfGoodsSold.toFixed(2)}</span></div>
        <div class="stat-row" style="font-weight: 800; color: #1e3a8a;"><span>કુલ ગ્રોસ નફો (Gross Profit):</span><span class="stat-val">₹${totalGrossProfit.toFixed(2)}</span></div>
        <div class="stat-row"><span>કુલ નવી માલ ખરીદી (Purchases):</span><span class="stat-val">₹${totalPurchasesAmount.toFixed(2)}</span></div>
      </div>

      <!-- Right Column: P&L Expenses & Net Profit -->
      <div class="grid-cell">
        <div class="table-title">૨. નફા-નુકસાન હિસાબ (PROFIT & LOSS A/C)</div>
        <div class="stat-row"><span>ગ્રોસ નફો (Gross Profit):</span><span class="stat-val">₹${totalGrossProfit.toFixed(2)}</span></div>
        <div class="stat-row"><span>કુલ પરચુરણ દુકાન ખર્ચ (Expenses):</span><span class="stat-val">-₹${totalExpensesAmount.toFixed(2)}</span></div>
        <div class="stat-row highlight-net">
          <span>ચોખ્ખો અંદાજિત નફો (Net Profit):</span>
          <span>₹${netEstimatedProfit.toFixed(2)}</span>
        </div>
        <div class="stat-row" style="margin-top: 4px;">
          <span>નફાનો અંદાજિત દર (Net Margin %):</span>
          <span class="stat-val">${totalSalesAmount > 0 ? ((netEstimatedProfit / totalSalesAmount) * 100).toFixed(1) : 0}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Balance Sheet & Assets Summary -->
  <div class="grid">
    <div class="grid-row">
      <div class="grid-cell">
        <div class="table-title">૩. ક્લોઝિંગ સ્ટોક મૂલ્યાંકન (CLOSING INVENTORY)</div>
        <div class="stat-row"><span>કુલ ઉપલબ્ધ પ્રોડક્ટ આઇટમ્સ:</span><span class="stat-val">${products.length} આઇટમ્સ</span></div>
        <div class="stat-row"><span>કુલ સ્ટોક નંગ (Physical Units):</span><span class="stat-val">${totalStockUnits} નંગ</span></div>
        <div class="stat-row" style="font-weight: 800;"><span>સ્ટોક પડતર મૂલ્ય (Cost Valuation):</span><span class="stat-val">₹${totalStockCostValuation.toFixed(2)}</span></div>
        <div class="stat-row"><span>સ્ટોક અંદાજિત વેચાણ મૂલ્ય (Market):</span><span class="stat-val">₹${totalStockSalesValuation.toFixed(2)}</span></div>
      </div>

      <div class="grid-cell">
        <div class="table-title">૪. લેણાં & રોકડ સિલક (RECEIVABLES & CASH)</div>
        <div class="stat-row"><span>ગ્રાહકો પાસેથી બાકી ઉધાર (Debtors):</span><span class="stat-val">₹${totalReceivables.toFixed(2)}</span></div>
        <div class="stat-row"><span>રોજમેળ જમા (Inflow):</span><span class="stat-val">₹${totalRojmelJama.toFixed(2)}</span></div>
        <div class="stat-row"><span>રોજમેળ જાવક (Outflow):</span><span class="stat-val">₹${totalRojmelUdhar.toFixed(2)}</span></div>
        <div class="stat-row" style="font-weight: 800;"><span>નેટ રોકડ સિલક (Net Rojmel):</span><span class="stat-val">₹${rojmelNetBalance.toFixed(2)}</span></div>
      </div>
    </div>
  </div>

  <!-- Signatures -->
  <div class="sign-grid">
    <div class="sign-cell">
      <div class="sign-line"></div>
      <div style="font-weight: 800;">ચાર્ટર્ડ એકાઉન્ટન્ટ (CA) સહી & સિક્કો</div>
      <div style="font-size: 9.5px; color: #666;">For Chartered Accountant</div>
    </div>
    <div class="sign-cell">
      <div class="sign-line"></div>
      <div style="font-weight: 800;">માલિક / સંચાલકની સહી (Proprietor)</div>
      <div style="font-size: 9.5px; color: #666;">For, ${storeSettings.storeNameEn}</div>
    </div>
  </div>

</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      try {
        printWin.print();
      } catch (e) {
        console.error(e);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-neutral-300 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0B1E48] to-[#1E3A8A] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  💼 CA ઓડિટ & GST એકાઉન્ટ્સ પોર્ટલ
                </h2>
                <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  1-Click Excel
                </span>
              </div>
              <p className="text-xs text-blue-200 font-bold">
                {storeSettings.storeNameGu} • ચાર્ટર્ડ એકાઉન્ટન્ટ ઓડિટ સ્ટેટમેન્ટ & એકાઉન્ટ્સ રજિસ્ટર
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportCsv('all_package')}
              className="bg-emerald-500 hover:bg-emerald-600 text-black px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
              title="CA માટે સમગ્ર ડેટા એક ક્લિકમાં એક્સેલ/CSV ડાઉનલોડ કરો"
            >
              <Download className="w-4 h-4" />
              <span>📥 CA પેકેજ (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCaReport}
              className="bg-amber-400 hover:bg-amber-500 text-black px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
              title="સત્તાવાર ૧ પેજ CA સ્ટેટમેન્ટ પ્રિન્ટ કરો"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ CA સ્ટેટમેન્ટ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-neutral-100 p-2.5 sm:p-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-neutral-700 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              સમયગાળો:
            </span>
            <button
              type="button"
              onClick={() => setPeriod('current_month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === 'current_month'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              ચાલુ મહિનો
            </button>
            <button
              type="button"
              onClick={() => setPeriod('last_month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === 'last_month'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              ગયો મહિનો
            </button>
            <button
              type="button"
              onClick={() => setPeriod('fy_current')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === 'fy_current'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              નાણાકીય વર્ષ (FY)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              બધો ડેટા
            </button>
            <button
              type="button"
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                period === 'custom'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
              }`}
            >
              કસ્ટમ તારીખ
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white p-1 rounded-lg border border-neutral-300">
              <span>તારીખ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="border border-neutral-300 rounded px-1.5 py-0.5 text-xs"
              />
              <span>થી</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="border border-neutral-300 rounded px-1.5 py-0.5 text-xs"
              />
            </div>
          )}

          <div className="text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            તારીખ રેન્જ: {getPeriodLabel()}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-3 pt-2 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            📊 CA ઓડિટ સમરી
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'sales'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            🧾 વેચાણ રજિસ્ટર ({filteredOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'purchases'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            🛒 ખરીદી રજિસ્ટર ({filteredPurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            💸 ખર્ચ રજિસ્ટર ({filteredExpenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'stock'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            📦 સ્ટોક વેલ્યુએશન ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rojmel')}
            className={`px-3.5 py-2 text-xs font-black border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'rojmel'
                ? 'border-blue-700 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            📈 રોજમેળ ({filteredRojmel.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 bg-neutral-50/50">
          
          {/* 1. SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Top Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                    <span>કુલ ટર્નઓવર (Sales)</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-blue-900 mt-1">
                    ₹{totalSalesAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10.5px] font-bold text-neutral-600 mt-0.5">
                    {filteredOrders.length} બિલ્સ નોંધાયેલ
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                    <span>નવી ખરીદી (Purchases)</span>
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-purple-900 mt-1">
                    ₹{totalPurchasesAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10.5px] font-bold text-neutral-600 mt-0.5">
                    {filteredPurchases.length} ખરીદી બિલ્સ
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                    <span>પરચુરણ ખર્ચ (Expenses)</span>
                    <DollarSign className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-red-700 mt-1">
                    ₹{totalExpensesAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10.5px] font-bold text-neutral-600 mt-0.5">
                    {filteredExpenses.length} વાઉચર એન્ટ્રી
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/40">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                    <span>ચોખ્ખો અંદાજિત નફો (Net P&L)</span>
                    <Receipt className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-800 mt-1">
                    ₹{netEstimatedProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10.5px] font-bold text-emerald-700 mt-0.5">
                    માર્જિન: {totalSalesAmount > 0 ? ((netEstimatedProfit / totalSalesAmount) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>

              {/* Secondary Balance Sheet Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="flex items-center gap-2 font-black text-xs text-neutral-800 border-b pb-2 mb-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>હાજર ક્લોઝિંગ સ્ટોક મૂલ્યાંકન</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">કુલ ઉપલબ્ધ પ્રોડક્ટ્સ:</span>
                      <span className="font-bold">{products.length} આઇટમ્સ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">સ્ટોક જથ્થો (Units):</span>
                      <span className="font-bold">{totalStockUnits} નંગ</span>
                    </div>
                    <div className="flex justify-between text-blue-900 font-bold border-t pt-1">
                      <span>પડતર મૂલ્ય (Cost Value):</span>
                      <span>₹{totalStockCostValuation.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>વેચાણ મૂલ્ય (Selling Value):</span>
                      <span>₹{totalStockSalesValuation.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="flex items-center gap-2 font-black text-xs text-neutral-800 border-b pb-2 mb-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>ખાતાવહી લેણાં (Debtors)</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">કુલ ખાતા ગ્રાહકો:</span>
                      <span className="font-bold">{khataAccounts.length} ગ્રાહકો</span>
                    </div>
                    <div className="flex justify-between text-red-700 font-bold border-t pt-1">
                      <span>ગ્રાહકો પાસે કુલ બાકી ઉધાર:</span>
                      <span>₹{totalReceivables.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-1">
                      * CA માટે ગ્રાહકોના બાકી લેણાંનું સ્ટેટમેન્ટ
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
                  <div className="flex items-center gap-2 font-black text-xs text-neutral-800 border-b pb-2 mb-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>રોકડ સિલક & રોજમેળ (Cash in Hand)</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">રોજમેળ આવક (જમા):</span>
                      <span className="font-bold text-emerald-700">₹{totalRojmelJama.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">રોજમેળ જાવક (ઉધાર):</span>
                      <span className="font-bold text-red-700">₹{totalRojmelUdhar.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-black font-black border-t pt-1">
                      <span>નેટ રોકડ સિલક (Net Cash):</span>
                      <span>₹{rojmelNetBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-black text-blue-900">
                    💡 તમારા ચાર્ટર્ડ એકાઉન્ટન્ટ (CA) ને આપવા માટે:
                  </div>
                  <div className="text-blue-700 font-medium">
                    ઉપર આપેલા <b>"📥 CA પેકેજ (Excel)"</b> બટન પર ક્લિક કરો જેથી વેચાણ, ખરીદી, ખર્ચ અને સ્ટોક બધા રજિસ્ટર એક ફાઇલમાં આવી જશે.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('all_package')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ડાઉનલોડ Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCaReport}
                    className="bg-[#0B1E48] hover:bg-black text-white text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>પ્રિન્ટ સ્ટેટમેન્ટ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. SALES REGISTER TAB */}
          {activeTab === 'sales' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-neutral-800">
                  વેચાણ રજિસ્ટર (GSTR-1 Format) • કુલ {filteredOrders.length} ઇન્વોઇસ
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('sales')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>સેલ્સ Excel ડાઉનલોડ</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 border-b font-black text-neutral-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">તારીખ</th>
                      <th className="p-2.5">બિલ નં</th>
                      <th className="p-2.5">ગ્રાહક</th>
                      <th className="p-2.5">મોબાઇલ</th>
                      <th className="p-2.5">આઇટમ્સ</th>
                      <th className="p-2.5">મોડ</th>
                      <th className="p-2.5 text-right">રકમ (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-neutral-500">
                          પસંદ કરેલ સમયગાળામાં કોઈ બિલ નોંધાયેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o, idx) => (
                        <tr key={o.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold text-neutral-500">{idx + 1}</td>
                          <td className="p-2.5 whitespace-nowrap">{o.date}</td>
                          <td className="p-2.5 font-black text-blue-900">{o.invoiceNo}</td>
                          <td className="p-2.5 font-bold text-neutral-800">{o.customerName}</td>
                          <td className="p-2.5 text-neutral-600">{o.mobile}</td>
                          <td className="p-2.5 max-w-[200px] truncate" title={o.items.map(i => `${i.name} (${i.qty})`).join(', ')}>
                            {o.items.map(i => `${i.name} x ${i.qty}`).join(', ')}
                          </td>
                          <td className="p-2.5">
                            <span className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {o.paymentMode}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-black text-black">
                            ₹{Number(o.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredOrders.length > 0 && (
                    <tfoot className="bg-neutral-100 border-t font-black text-black">
                      <tr>
                        <td colSpan={7} className="p-2.5 text-right">કુલ વેચાણ સરવાળો:</td>
                        <td className="p-2.5 text-right text-blue-900">₹{totalSalesAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* 3. PURCHASES REGISTER TAB */}
          {activeTab === 'purchases' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-neutral-800">
                  ખરીદી રજિસ્ટર (GSTR-2 Format) • કુલ {filteredPurchases.length} ખરીદી બિલ્સ
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('purchases')}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ખરીદી Excel ડાઉનલોડ</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 border-b font-black text-neutral-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">તારીખ</th>
                      <th className="p-2.5">બિલ નં</th>
                      <th className="p-2.5">વેપારી / સપ્લાયર</th>
                      <th className="p-2.5">કેટેગરી</th>
                      <th className="p-2.5">વિગત</th>
                      <th className="p-2.5 text-right">રકમ (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-neutral-500">
                          પસંદ કરેલ સમયગાળામાં કોઈ ખરીદી નોંધાયેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold text-neutral-500">{idx + 1}</td>
                          <td className="p-2.5 whitespace-nowrap">{p.date}</td>
                          <td className="p-2.5 font-bold text-purple-900">{p.billNo || `PUR-${idx + 1}`}</td>
                          <td className="p-2.5 font-bold text-neutral-800">{p.supplierName}</td>
                          <td className="p-2.5">{p.itemsCount || 1} આઇટમ્સ</td>
                          <td className="p-2.5 text-neutral-600">{p.paymentStatus === 'Paid' ? 'ચૂકવેલ' : 'બાકી'}</td>
                          <td className="p-2.5 text-right font-black text-black">
                            ₹{Number(p.totalAmount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredPurchases.length > 0 && (
                    <tfoot className="bg-neutral-100 border-t font-black text-black">
                      <tr>
                        <td colSpan={6} className="p-2.5 text-right">કુલ ખરીદી સરવાળો:</td>
                        <td className="p-2.5 text-right text-purple-900">₹{totalPurchasesAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* 4. EXPENSES REGISTER TAB */}
          {activeTab === 'expenses' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-neutral-800">
                  ખર્ચ રજિસ્ટર (Expense Ledger) • કુલ {filteredExpenses.length} વાઉચર્સ
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('expenses')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ખર્ચ Excel ડાઉનલોડ</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 border-b font-black text-neutral-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">તારીખ</th>
                      <th className="p-2.5">કેટેગરી</th>
                      <th className="p-2.5">વિગત / કારણ</th>
                      <th className="p-2.5">પેમેન્ટ</th>
                      <th className="p-2.5 text-right">રકમ (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-neutral-500">
                          પસંદ કરેલ સમયગાળામાં કોઈ ખર્ચ નોંધાયેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((e, idx) => (
                        <tr key={e.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold text-neutral-500">{idx + 1}</td>
                          <td className="p-2.5 whitespace-nowrap">{e.date}</td>
                          <td className="p-2.5 font-bold text-red-900">{e.category}</td>
                          <td className="p-2.5 text-neutral-700">{e.title}</td>
                          <td className="p-2.5 text-neutral-600">{e.notes || '-'}</td>
                          <td className="p-2.5 text-right font-black text-red-700">
                            ₹{Number(e.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot className="bg-neutral-100 border-t font-black text-black">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right">કુલ ખર્ચ સરવાળો:</td>
                        <td className="p-2.5 text-right text-red-700">₹{totalExpensesAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* 5. STOCK VALUATION TAB */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-neutral-800">
                  હાજર સ્ટોક વેલ્યુએશન સમરી • કુલ {products.length} આઇટમ્સ
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCsv('stock')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>સ્ટોક Excel ડાઉનલોડ</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 border-b font-black text-neutral-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">પ્રોડક્ટનું નામ</th>
                      <th className="p-2.5">કેટેગરી</th>
                      <th className="p-2.5 text-center">સ્ટોક જથ્થો</th>
                      <th className="p-2.5 text-right">પડતર ભાવ (Cost)</th>
                      <th className="p-2.5 text-right">કુલ પડતર મૂલ્ય</th>
                      <th className="p-2.5 text-right">વેચાણ ભાવ</th>
                      <th className="p-2.5 text-right">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {products.map((p, idx) => {
                      const units = typeof p.stock === 'number' ? Math.max(0, p.stock) : 0;
                      const cost = Number(p.costPrice) || (Number(p.price) * 0.7) || 0;
                      const costVal = units * cost;
                      return (
                        <tr key={p.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold text-neutral-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-neutral-900">{p.nameGu}</td>
                          <td className="p-2.5 text-neutral-600">{p.category}</td>
                          <td className="p-2.5 text-center font-bold">
                            {units} {p.unit || 'નંગ'}
                          </td>
                          <td className="p-2.5 text-right">₹{cost.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-black text-blue-900">₹{costVal.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-neutral-800">₹{Number(p.price).toFixed(2)}</td>
                          <td className="p-2.5 text-right text-neutral-500">{p.mrp ? `₹${Number(p.mrp).toFixed(2)}` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-neutral-100 border-t font-black text-black">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right">કુલ સ્ટોક પડતર મૂલ્ય:</td>
                      <td className="p-2.5 text-right text-blue-900">₹{totalStockCostValuation.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* 6. ROJMEL TAB */}
          {activeTab === 'rojmel' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-neutral-800">
                  રોજમેળ & કેશ બુક • કુલ {filteredRojmel.length} એન્ટ્રીઝ
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 border-b font-black text-neutral-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">તારીખ</th>
                      <th className="p-2.5">પ્રકાર</th>
                      <th className="p-2.5">વિગત / ખાતાનું નામ</th>
                      <th className="p-2.5">પેમેન્ટ મોડ</th>
                      <th className="p-2.5 text-right">જમા (આવક ₹)</th>
                      <th className="p-2.5 text-right">ઉધાર (જાવક ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredRojmel.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-neutral-500">
                          પસંદ કરેલ સમયગાળામાં કોઈ રોજમેળ એન્ટ્રી નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredRojmel.map((r, idx) => (
                        <tr key={r.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold text-neutral-500">{idx + 1}</td>
                          <td className="p-2.5 whitespace-nowrap">{r.date}</td>
                          <td className="p-2.5 font-black">
                            {r.type === 'aavak' ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">આવક (જમા)</span>
                            ) : (
                              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">જાવક (ઉધાર)</span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-neutral-800">
                            {r.category} {r.personName ? `(${r.personName})` : ''} {r.notes ? `- ${r.notes}` : ''}
                          </td>
                          <td className="p-2.5 text-neutral-600">{r.paymentMode || 'Cash'}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">
                            {r.type === 'aavak' ? `₹${Number(r.amount).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-red-700">
                            {r.type === 'javak' ? `₹${Number(r.amount).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-neutral-100 border-t font-black text-black">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right">રોકડ સિલક સરવાળો:</td>
                      <td className="p-2.5 text-right text-emerald-700">₹{totalRojmelJama.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-red-700">₹{totalRojmelUdhar.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="bg-neutral-100 p-3 sm:p-4 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-600 font-bold hidden sm:block">
            * આ તમામ ડેટા તમારા CA ના Tally, Busy કે Excel સોફ્ટવેરમાં સીધો ઈમ્પોર્ટ થઈ શકે છે.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-[#0B1E48] hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-black shadow-xs cursor-pointer ml-auto"
          >
            બંધ કરો (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
