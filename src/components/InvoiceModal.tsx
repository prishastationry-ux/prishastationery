import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, CheckCircle, Share2, FileDown, Loader2, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceModalProps {
  order: OrderRecord;
  storeSettings: StoreSettings;
  onClose: () => void;
  isSuccessView?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  storeSettings,
  onClose,
  isSuccessView = false
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const billContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate QR code for invoice payment verification
    const upiUrl = storeSettings.customQrUrl || `upi://pay?pa=${encodeURIComponent(storeSettings.upiId)}&pn=${encodeURIComponent(storeSettings.payeeName)}&am=${order.total}&cu=INR&tn=Invoice_${order.invoiceNo}`;
    QRCode.toDataURL(upiUrl, {
      width: 130,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [order, storeSettings]);

  // 1. Direct PC Print using isolated iframe - Scaled specifically for EXACT 1-PAGE A4 output with logo
  const handleDirectPrint = () => {
    const billElement = billContentRef.current;
    if (!billElement) {
      window.print();
      return;
    }

    try {
      const existingIframe = document.getElementById('prisha-print-iframe');
      if (existingIframe) existingIframe.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'prisha-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice_${order.invoiceNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              html, body {
                width: 100%;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", Helvetica, Arial, sans-serif;
              color: #000000;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.35;
            }
            * {
              box-sizing: border-box;
            }
            .bill-wrapper {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
              padding: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
            }
            th, td {
              border: 1px solid #222222;
              padding: 4px 6px;
            }
            th {
              background-color: #f1f3f5 !important;
              font-weight: 800;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="bill-wrapper">
            ${billElement.innerHTML}
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      }, 400);
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    }
  };

  // 2. Direct A4 PDF Download with multi-page support for large orders
  const handleDownloadPdf = async () => {
    const billElement = billContentRef.current;
    if (!billElement) return;

    try {
      setIsGeneratingPdf(true);

      const canvas = await html2canvas(billElement, {
        scale: 2.0,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10; // 10mm margin
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      let heightLeft = printHeight;
      let position = margin;
      let pageHeight = pdfHeight - (margin * 2);

      // First page
      pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
      heightLeft -= pageHeight;

      // Additional pages if bill is long (> 5-10 items)
      while (heightLeft >= 0) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Prisha_Bill_${order.invoiceNo}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      handleDirectPrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    let itemsText = '';
    order.items.forEach((item, idx) => {
      itemsText += `${idx + 1}. *${item.name}* x ${item.qty} = ₹${item.price * item.qty}\n`;
    });

    const msg =
      `🧾 *ઓર્ડર રસીદ - ${storeSettings.storeNameGu}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *બિલ / ઓર્ડર નં:* ${order.invoiceNo}\n` +
      `📅 *તારીખ:* ${order.date}\n` +
      `👤 *ગ્રાહક:* ${order.customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${order.mobile}\n` +
      `📍 *સરનામું:* ${order.address}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *આઇટમ્સ:*\n${itemsText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *કુલ ચૂકવવાપાત્ર રકમ:* ₹${order.total}/-\n` +
      `💳 *પેમેન્ટ:* ${order.paymentMode} (${order.paymentStatus})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *દુકાન:* ${storeSettings.address}\n` +
      `📞 *સંપર્ક:* +91 ${storeSettings.phone}\n\n` +
      `આભાર! ફરી પધારજો.`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > * {
            display: none !important;
          }
          div.fixed {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
          }
          #printable-bill-area, #printable-bill-area * {
            display: block !important;
            visibility: visible !important;
          }
          #printable-bill-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto">
        
        {/* TOP STATUS BAR (NO-PRINT) */}
        <div className="no-print bg-[#0B1E48] text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-2">
            {isSuccessView ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
                <CheckCircle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30">
                <Printer className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {isSuccessView ? '🎉 ઓર્ડર નોંધાઈ ગયો (બિલ તૈયાર)' : '🧾 ટેક્સ ઇન્વોઇસ / બિલ'}
              </h3>
              <p className="text-[11px] text-blue-200 font-bold">
                ઓર્ડર નં: <span className="font-mono text-orange-400 font-black">{order.invoiceNo}</span> | {order.date}
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="૧ પેજમાં બિલ પ્રિન્ટ / PDF સેવ કરો"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ પ્રિન્ટ</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL CANVAS - STRICT 1-PAGE COMPACT & CRISP LAYOUT */}
        <div
          ref={billContentRef}
          id="printable-bill-area"
          className="p-4 bg-white text-black text-[11px] font-sans space-y-2.5"
        >
          
          {/* STORE HEADER WITH LOGOS */}
          <div className="border-b-2 border-black pb-2 flex items-center justify-between gap-2">
            {/* Left Logo */}
            {storeSettings.billShowLogos !== false && (
              <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg border border-neutral-300 p-0.5 bg-neutral-50 overflow-hidden">
                {storeSettings.leftLogoUrl ? (
                  <img src={storeSettings.leftLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl">🪪</span>
                )}
              </div>
            )}

            {/* Store Title & GST */}
            <div className="text-center flex-1 px-1">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900 leading-tight uppercase">
                {storeSettings.storeNameEn}
              </h1>
              <h2 className="text-xs font-black text-orange-700 leading-tight">
                {storeSettings.storeNameGu}
              </h2>
              <p className="text-[9.5px] font-bold text-neutral-700 mt-0.5">
                {storeSettings.tagline} {storeSettings.ownerName ? `• સંચાલક: ${storeSettings.ownerName}` : ''}
              </p>
              <p className="text-[9px] text-neutral-600 font-medium max-w-md mx-auto leading-tight">
                {storeSettings.address}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mt-0.5 text-[9.5px] font-black text-neutral-800">
                <span>📞 +91 {storeSettings.phone}</span>
                {storeSettings.email && (
                  <>
                    <span>•</span>
                    <span>✉️ {storeSettings.email}</span>
                  </>
                )}
                {storeSettings.billShowGst !== false && storeSettings.gstNumber && (
                  <>
                    <span>•</span>
                    <span>GSTIN: {storeSettings.gstNumber}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right Logo / Seal */}
            {storeSettings.billShowLogos !== false && (
              <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg border border-neutral-300 p-0.5 bg-neutral-50 overflow-hidden">
                {storeSettings.rightLogoUrl ? (
                  <img src={storeSettings.rightLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl">🏪</span>
                )}
              </div>
            )}
          </div>

          {/* RUNNING OFFER BANNER (IF ENABLED) */}
          {storeSettings.billShowSpecialOffer !== false && storeSettings.billSpecialOffer && (
            <div className="bg-amber-50 border border-amber-300 rounded px-2 py-0.5 text-[10px] text-amber-900 font-black text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{storeSettings.billSpecialOffer}</span>
            </div>
          )}

          {/* INVOICE & CUSTOMER META INFO */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2 rounded border border-neutral-200 text-[10.5px]">
            <div className="space-y-0.5">
              <p className="font-bold text-neutral-500 text-[9.5px]">ગ્રાહકની વિગત (Bill To):</p>
              <p className="font-black text-xs text-neutral-900">{order.customerName}</p>
              <p className="font-bold text-neutral-700">📞 +91 {order.mobile}</p>
              <p className="text-neutral-600 truncate">📍 {order.address}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold text-neutral-500 text-[9.5px]">ઇન્વોઇસ વિગત:</p>
              <p className="font-black text-xs text-neutral-900">
                બિલ નં: <span className="text-orange-700 font-mono font-black">{order.invoiceNo}</span>
              </p>
              <p className="text-neutral-700 font-bold">તારીખ: {order.date}</p>
              <p className="font-extrabold text-neutral-800">
                પદ્ધતિ: <span className="text-blue-700 font-black">{order.paymentMode}</span>
              </p>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="border border-black rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-neutral-100 text-black border-b border-black font-black">
                  <th className="p-1 text-center w-7">#</th>
                  <th className="p-1">આઇટમ વિગત (Description)</th>
                  <th className="p-1 text-center w-14">જથ્થો (Qty)</th>
                  <th className="p-1 text-right w-16">ભાવ (Rate)</th>
                  <th className="p-1 text-right w-20">કુલ (Amount)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-neutral-300 font-medium">
                    <td className="p-1 text-center font-bold text-neutral-500">{idx + 1}</td>
                    <td className="p-1 font-bold text-neutral-900">
                      {it.name} {it.unit ? `(${it.unit})` : ''}
                    </td>
                    <td className="p-1 text-center font-black">{it.qty}</td>
                    <td className="p-1 text-right font-medium">₹{it.price.toFixed(2)}</td>
                    <td className="p-1 text-right font-black">₹{(it.price * it.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAL & QR CODE SECTION */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            {/* Payment Verification QR */}
            {storeSettings.billShowQr !== false ? (
              <div className="flex items-center gap-2 border border-neutral-200 rounded p-1.5 bg-neutral-50 max-w-[240px]">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="UPI QR" className="w-14 h-14 object-contain rounded bg-white p-0.5 border shrink-0" />
                )}
                <div className="text-[9.5px] space-y-0.5 leading-tight">
                  <p className="font-black text-neutral-900">UPI પેમેન્ટ વેરિફિકેશન</p>
                  {!storeSettings.hideUpiOnBill && (
                    <p className="text-[8.5px] text-neutral-600 truncate">{storeSettings.upiId}</p>
                  )}
                  <p className="text-[8.5px] font-bold text-emerald-700">✓ 100% સુરક્ષિત ડિજિટલ બિલ</p>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-black text-emerald-700">✓ પ્રમાણિત કરાયેલ ઓર્ડર</div>
            )}

            {/* Price Calculations */}
            <div className="w-52 space-y-0.5 text-right text-[10.5px]">
              <div className="flex justify-between font-bold text-neutral-600">
                <span>સબટોટલ (Subtotal):</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>ડિસ્કાઉન્ટ (Discount):</span>
                  <span>- ₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-black pt-0.5 font-black text-xs text-neutral-900">
                <span>કુલ રકમ (Total):</span>
                <span className="text-sm text-orange-700">₹{order.total.toFixed(2)}</span>
              </div>
              <p className="text-[9.5px] font-bold text-neutral-500">
                સ્થિતિ: <span className="text-emerald-700 font-black">{order.paymentStatus}</span>
              </p>
            </div>
          </div>

          {/* FRAUD WARNING ALERT (IF ENABLED) */}
          {storeSettings.billShowFraudWarning !== false && storeSettings.billFraudWarning && (
            <div className="bg-red-50 border border-red-200 rounded px-2 py-0.5 text-[9px] text-red-800 font-black flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-600 shrink-0" />
              <span>{storeSettings.billFraudWarning}</span>
            </div>
          )}

          {/* FOOTER & TERMS */}
          <div className="border-t border-neutral-300 pt-1.5 text-center text-[9px] text-neutral-500 space-y-0.5">
            <p className="font-bold text-neutral-800">{storeSettings.invoiceFooterNote}</p>
            <p className="text-[8.5px]">
              {storeSettings.billTermsNote || 'આ કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ છે. સહીની જરૂર નથી.'} • હેલ્પલાઇન: +91 {storeSettings.phone}
            </p>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (NO-PRINT) */}
        <div className="no-print bg-neutral-100 p-3 sm:p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600 font-bold text-center sm:text-left">
            💡 ૧ પેજમાં કમ્પ્યુટરમાં પ્રિન્ટ કાઢવા અથવા PDF સેવ કરવા 'પ્રિન્ટ' પર ક્લિક કરો.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-none bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>🖨️ પ્રિન્ટ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>પૂર્ણ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
