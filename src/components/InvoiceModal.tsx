import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, CheckCircle, Share2, Download, Phone, MapPin, Sparkles, ArrowRight, FileDown, Loader2 } from 'lucide-react';
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
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [order, storeSettings]);

  // 1. Direct PC Print using isolated iframe (works 100% reliably in PC, laptops and browsers)
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

      // Grab all computed styles or write clean print CSS
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice_${order.invoiceNo}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px;
              font-size: 12px;
            }
            * {
              box-sizing: border-box;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #333;
              padding: 6px 8px;
            }
            th {
              background-color: #f2f2f2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
          </style>
        </head>
        <body>
          ${billElement.innerHTML}
        </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      }, 350);
    } catch (e) {
      console.error('Print iframe error, fallback to window.print', e);
      window.print();
    }
  };

  // 2. Direct PDF Download (.pdf file) using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    const billElement = billContentRef.current;
    if (!billElement) return;

    try {
      setIsGeneratingPdf(true);

      // Create high-res canvas of the bill
      const canvas = await html2canvas(billElement, {
        scale: 2.5, // Crisp rendering for Gujarati fonts and text
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
      
      const imgWidth = pdfWidth - 20; // 10mm padding on left & right
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
      pdf.save(`Prisha_Bill_${order.invoiceNo}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      // Fallback: trigger print dialog to save as PDF
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
      `👤 *ગ્રાહકનું નામ:* ${order.customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${order.mobile}\n` +
      `📍 *સરનામું:* ${order.address}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *આઇટમ્સ:*\n${itemsText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *કુલ ચૂકવવાપાત્ર રકમ:* ₹${order.total}/-\n` +
      `💳 *પેમેન્ટ પદ્ધતિ:* ${order.paymentMode} (${order.paymentStatus})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *દુકાન:* ${storeSettings.address}\n` +
      `📞 *સંપર્ક:* +91 ${storeSettings.phone}\n\n` +
      `આભાર! ફરી પધારજો.`;

    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto">
        
        {/* TOP STATUS BAR (NO-PRINT) */}
        <div className="no-print bg-[#0B1E48] text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-2">
            {isSuccessView ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30">
                <Printer className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {isSuccessView ? '🎉 ઓર્ડર સફળતાપૂર્વક નોંધાઈ ગયો!' : '🧾 ટેક્સ ઇન્વોઇસ / બિલ'}
              </h3>
              <p className="text-[11px] text-blue-200 font-bold">
                ઓર્ડર નં: <span className="font-mono text-orange-400 font-black">{order.invoiceNo}</span> | {order.date}
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs disabled:opacity-50"
              title="PDF ફાઇલ ડાઉનલોડ કરો"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF બને છે...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-red-200" />
                  <span>PDF ડાઉનલોડ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="કમ્પ્યુટરમાં ડાયરેક્ટ પ્રિન્ટ કાઢો"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>પ્રિન્ટ (PC)</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL CANVAS */}
        <div
          ref={billContentRef}
          id="printable-bill-area"
          className="p-4 sm:p-6 bg-white text-black text-xs font-sans space-y-4"
        >
          
          {/* STORE HEADER WITH LOGOS */}
          <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-2">
            {/* Left Logo */}
            <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-lg border border-neutral-300 p-1 bg-neutral-50 overflow-hidden">
              {storeSettings.leftLogoUrl ? (
                <img src={storeSettings.leftLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🪪</span>
              )}
            </div>

            {/* Store Title & GST */}
            <div className="text-center flex-1">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-neutral-900 leading-tight">
                {storeSettings.storeNameEn}
              </h1>
              <h2 className="text-xs sm:text-sm font-black text-orange-700">
                {storeSettings.storeNameGu}
              </h2>
              <p className="text-[10px] font-bold text-neutral-600 mt-0.5">
                {storeSettings.tagline} • સંચાલક: {storeSettings.ownerName}
              </p>
              <p className="text-[9px] text-neutral-500 font-medium max-w-md mx-auto">
                {storeSettings.address}
              </p>
              <div className="flex items-center justify-center gap-3 mt-1 text-[10px] font-black text-neutral-800">
                <span>📞 +91 {storeSettings.phone}</span>
                <span>•</span>
                <span>GSTIN: {storeSettings.gstNumber}</span>
              </div>
            </div>

            {/* Right Logo / Seal */}
            <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-lg border border-neutral-300 p-1 bg-neutral-50 overflow-hidden">
              {storeSettings.rightLogoUrl ? (
                <img src={storeSettings.rightLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🏪</span>
              )}
            </div>
          </div>

          {/* INVOICE & CUSTOMER META INFO */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px]">
            <div className="space-y-0.5">
              <p className="font-bold text-neutral-500">ગ્રાહકની વિગત (Bill To):</p>
              <p className="font-black text-sm text-neutral-900">{order.customerName}</p>
              <p className="font-bold text-neutral-700">📞 +91 {order.mobile}</p>
              <p className="text-neutral-600 truncate">📍 {order.address}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold text-neutral-500">ઇન્વોઇસ વિગત:</p>
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
          <div className="border border-black rounded-md overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-neutral-200 text-black border-b border-black font-black">
                  <th className="p-1.5 text-center w-8">#</th>
                  <th className="p-1.5">આઇટમ વિગત (Description)</th>
                  <th className="p-1.5 text-center w-16">જથ્થો (Qty)</th>
                  <th className="p-1.5 text-right w-20">ભાવ (Rate)</th>
                  <th className="p-1.5 text-right w-24">કુલ (Amount)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-neutral-300 font-medium">
                    <td className="p-1.5 text-center font-bold text-neutral-500">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-neutral-900">
                      {it.name} {it.unit ? `(${it.unit})` : ''}
                    </td>
                    <td className="p-1.5 text-center font-black">{it.qty}</td>
                    <td className="p-1.5 text-right font-medium">₹{it.price.toFixed(2)}</td>
                    <td className="p-1.5 text-right font-black">₹{(it.price * it.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAL & QR CODE SECTION */}
          <div className="flex items-start justify-between gap-4 pt-1">
            {/* Payment Verification QR */}
            <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-2 bg-neutral-50 max-w-[240px]">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="UPI QR" className="w-16 h-16 object-contain rounded bg-white p-0.5 border" />
              )}
              <div className="text-[10px] space-y-0.5">
                <p className="font-black text-neutral-900">UPI પેમેન્ટ કન્ફર્મ</p>
                <p className="text-[9px] text-neutral-500 truncate">{storeSettings.upiId}</p>
                <p className="text-[9px] font-bold text-emerald-700">✓ 100% ડિજિટલ રસીદ</p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-56 space-y-1 text-right text-[11px]">
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
              <div className="flex justify-between border-t-2 border-black pt-1 font-black text-sm text-neutral-900">
                <span>કુલ રકમ (Total):</span>
                <span className="text-base text-orange-700">₹{order.total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] font-bold text-neutral-500">
                સ્થિતિ: <span className="text-emerald-700 font-black">{order.paymentStatus}</span>
              </p>
            </div>
          </div>

          {/* FOOTER & TERMS */}
          <div className="border-t border-neutral-300 pt-2 text-center text-[10px] text-neutral-500 space-y-0.5">
            <p className="font-bold text-neutral-800">{storeSettings.invoiceFooterNote}</p>
            <p className="text-[9px]">
              આ કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ છે. સહીની જરૂર નથી. • હેલ્પલાઇન: +91 {storeSettings.phone}
            </p>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (NO-PRINT) */}
        <div className="no-print bg-neutral-100 p-3 sm:p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600 font-bold text-center sm:text-left">
            💡 કમ્પ્યુટર કે પ્રિન્ટર માટે 'ડાયરેક્ટ પ્રિન્ટ' અથવા સેવ કરવા 'PDF ડાઉનલોડ' કરો.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>PDF ડાઉનલોડ કરો</span>
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-none bg-[#0B1E48] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>ડાયરેક્ટ પ્રિન્ટ (PC)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>પૂર્ણ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
