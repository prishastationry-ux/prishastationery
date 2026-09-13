import React, { useState, useRef } from 'react';
import { Printer, X, CheckCircle, Share2, FileDown, Loader2, ArrowRight } from 'lucide-react';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const billContentRef = useRef<HTMLDivElement>(null);

  // Generate self-contained HTML for rock-solid A4 printing without blank pages
  const getInvoiceHtmlString = () => {
    const itemsHtml = order.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1.5px solid #000000;">
          <td style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="border: 1.5px solid #000000; padding: 6px 8px; font-weight: 700;">${it.name}${it.unit ? ` (${it.unit})` : ''}</td>
          <td style="border: 1.5px solid #000000; padding: 6px 6px; text-align: center; font-weight: 700;">${it.qty}</td>
          <td style="border: 1.5px solid #000000; padding: 6px 8px; text-align: right; font-weight: 600;">₹${Number(it.price).toFixed(2)}</td>
          <td style="border: 1.5px solid #000000; padding: 6px 8px; text-align: right; font-weight: 800;">₹${Number(it.price * it.qty).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.invoiceNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", "Gujarati MT", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }
    .bill-wrapper {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      padding: 6px 0;
    }
    .header-block {
      text-align: center;
      margin-bottom: 24px;
    }
    .store-name-en {
      font-size: 21px;
      font-weight: 900;
      margin: 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000000;
    }
    .store-name-gu {
      font-size: 18px;
      font-weight: 800;
      margin: 4px 0 0 0;
      color: #000000;
    }
    .store-tagline {
      font-size: 13px;
      font-weight: 700;
      margin-top: 5px;
      color: #000000;
    }
    .store-address {
      font-size: 12px;
      margin-top: 3px;
      color: #000000;
    }
    .store-contact {
      font-size: 12.5px;
      font-weight: 700;
      margin-top: 4px;
      color: #000000;
    }
    .offer-line {
      font-size: 12px;
      font-weight: 700;
      margin-top: 6px;
      color: #000000;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 18px;
      font-size: 13px;
      line-height: 1.5;
    }
    .meta-left {
      text-align: left;
    }
    .meta-right {
      text-align: right;
    }
    .meta-heading {
      font-weight: 700;
      color: #000000;
    }
    .customer-name {
      font-size: 15px;
      font-weight: 800;
      color: #000000;
      margin-top: 2px;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .invoice-table th {
      border: 1.5px solid #000000;
      padding: 7px 6px;
      font-weight: 800;
      background-color: #fbfbfb;
    }
    .invoice-table td {
      border: 1.5px solid #000000;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 6px;
      margin-bottom: 24px;
    }
    .certified-text {
      font-size: 13px;
      font-weight: 700;
      color: #000000;
      padding-top: 4px;
    }
    .totals-box {
      text-align: right;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .grand-total {
      font-size: 15px;
      font-weight: 900;
      margin-top: 2px;
    }
    .fraud-warning {
      margin-top: 22px;
      font-size: 12px;
      font-weight: 700;
      color: #000000;
      line-height: 1.4;
    }
    .footer-section {
      margin-top: 16px;
      text-align: center;
      font-size: 11.5px;
      line-height: 1.5;
      color: #000000;
      border-top: 1px solid #e0e0e0;
      padding-top: 10px;
    }
    .footer-terms {
      font-size: 11px;
      margin-top: 4px;
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="bill-wrapper">
    <div class="header-block">
      <h1 class="store-name-en">${storeSettings.storeNameEn}</h1>
      <h2 class="store-name-gu">${storeSettings.storeNameGu}</h2>
      <div class="store-tagline">
        ${storeSettings.tagline}${storeSettings.ownerName ? ` • સંચાલક: ${storeSettings.ownerName}` : ''}
      </div>
      <div class="store-address">${storeSettings.address}</div>
      <div class="store-contact">
        📞 +91 ${storeSettings.phone}${storeSettings.billShowGst !== false && storeSettings.gstNumber ? ` • GSTIN: ${storeSettings.gstNumber}` : ''}
      </div>
      ${
        storeSettings.billShowSpecialOffer !== false && storeSettings.billSpecialOffer
          ? `<div class="offer-line">${storeSettings.billSpecialOffer}</div>`
          : ''
      }
    </div>

    <div class="meta-row">
      <div class="meta-left">
        <div class="meta-heading">ગ્રાહકની વિગત (Bill To):</div>
        <div class="customer-name">${order.customerName}</div>
        <div style="font-weight: 700;">📞 +91 ${order.mobile}</div>
        <div>📍 ${order.address}</div>
      </div>
      <div class="meta-right">
        <div class="meta-heading">ઇન્વોઇસ વિગત:</div>
        <div style="font-weight: 700; margin-top: 2px;">
          બિલ નં: <span style="font-weight: 800;">${order.invoiceNo}</span>
        </div>
        <div style="font-weight: 700;">તારીખ: ${order.date}</div>
        <div style="font-weight: 700;">પદ્ધતિ: ${order.paymentMode}</div>
      </div>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 38px; text-align: center;">#</th>
          <th style="text-align: left;">આઇટમ વિગત (Description)</th>
          <th style="width: 90px; text-align: center;">જથ્થો (Qty)</th>
          <th style="width: 100px; text-align: right;">ભાવ (Rate)</th>
          <th style="width: 120px; text-align: right;">કુલ (Amount)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-row">
      <div class="certified-text">
        ✓ પ્રમાણિત કરાયેલ ઓર્ડર
      </div>
      <div class="totals-box">
        <div style="font-weight: 700;">સબટોટલ (Subtotal): ₹${Number(order.subtotal).toFixed(2)}</div>
        ${order.discount > 0 ? `<div style="font-weight: 700;">ડિસ્કાઉન્ટ: -₹${Number(order.discount).toFixed(2)}</div>` : ''}
        <div class="grand-total">કુલ રકમ (Total): ₹${Number(order.total).toFixed(2)}</div>
        <div style="font-weight: 700; margin-top: 3px;">સ્થિતિ: ${order.paymentStatus}</div>
      </div>
    </div>

    ${
      storeSettings.billShowFraudWarning !== false && storeSettings.billFraudWarning
        ? `<div class="fraud-warning">${storeSettings.billFraudWarning}</div>`
        : ''
    }

    <div class="footer-section">
      <div style="font-weight: 700;">${storeSettings.invoiceFooterNote}</div>
      <div class="footer-terms">
        ${storeSettings.billTermsNote || 'કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ. ખરીદેલ માલ પરત લેવાશે નહિ.'} • હેલ્પલાઇન: +91 ${storeSettings.phone}
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // 1. Direct Print using dedicated invisible iframe (Guaranteed 100% non-blank print in all browsers)
  const handleDirectPrint = () => {
    try {
      let iframe = document.getElementById('prisha-direct-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'prisha-direct-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(getInvoiceHtmlString());
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Iframe print failed, using window.print fallback', e);
            window.print();
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print trigger error:', err);
      window.print();
    }
  };

  // 2. Direct A4 PDF Download with high-resolution canvas
  const handleDownloadPdf = async () => {
    const billElement = billContentRef.current;
    if (!billElement) return;

    try {
      setIsGeneratingPdf(true);

      const canvas = await html2canvas(billElement, {
        scale: 2.5,
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

      const margin = 10;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - margin * 2));
      pdf.save(`Prisha_Bill_${order.invoiceNo}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      handleDirectPrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 3. WhatsApp Order Receipt Sharing
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
    <div className="invoice-modal-overlay fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="invoice-modal-card bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto">
        
        {/* TOP STATUS & CONTROLS BAR (NO-PRINT) */}
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
              title="૧ પેજમાં બિલ પ્રિન્ટ કરો"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ પ્રિન્ટ</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs disabled:opacity-50"
              title="PDF ડાઉનલોડ કરો"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>PDF ડાઉનલોડ</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="WhatsApp પર શેર કરો"
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

        {/* PRINTABLE BILL CANVAS - 100% IDENTICAL MATCH TO USER'S OFFICIAL PDF */}
        <div
          ref={billContentRef}
          id="printable-bill-area"
          className="p-6 sm:p-8 bg-white text-black text-[13px] font-sans space-y-4 print:p-0 print:space-y-3 print:text-[12px] print:w-full"
        >
          {/* 1. CENTERED STORE HEADER */}
          <div className="text-center space-y-1 pb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black leading-tight uppercase">
              {storeSettings.storeNameEn}
            </h1>
            <h2 className="text-lg sm:text-xl font-black text-black leading-tight">
              {storeSettings.storeNameGu}
            </h2>
            <div className="text-xs sm:text-sm font-bold text-black mt-1">
              {storeSettings.tagline}
              {storeSettings.ownerName ? ` • સંચાલક: ${storeSettings.ownerName}` : ''}
            </div>
            <div className="text-[11.5px] sm:text-xs text-black font-medium max-w-lg mx-auto leading-tight">
              {storeSettings.address}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs sm:text-[12.5px] font-bold text-black pt-0.5">
              <span>📞 +91 {storeSettings.phone}</span>
              {storeSettings.billShowGst !== false && storeSettings.gstNumber && (
                <>
                  <span>•</span>
                  <span>GSTIN: {storeSettings.gstNumber}</span>
                </>
              )}
            </div>
            {storeSettings.billShowSpecialOffer !== false && storeSettings.billSpecialOffer && (
              <div className="text-xs sm:text-[12.5px] font-bold text-black pt-0.5">
                {storeSettings.billSpecialOffer}
              </div>
            )}
          </div>

          {/* 2. CUSTOMER & INVOICE META (TWO COLUMNS) */}
          <div className="flex justify-between items-start pt-2 text-[12.5px] sm:text-[13px] leading-relaxed">
            <div>
              <div className="font-bold text-black">ગ્રાહકની વિગત (Bill To):</div>
              <div className="text-sm sm:text-base font-black text-black mt-0.5">{order.customerName}</div>
              <div className="font-bold text-black">📞 +91 {order.mobile}</div>
              <div className="text-black font-medium">📍 {order.address}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">ઇન્વોઇસ વિગત:</div>
              <div className="font-bold text-black mt-0.5">
                બિલ નં: <span className="font-black text-black font-mono">{order.invoiceNo}</span>
              </div>
              <div className="font-bold text-black">તારીખ: {order.date}</div>
              <div className="font-bold text-black">પદ્ધતિ: {order.paymentMode}</div>
            </div>
          </div>

          {/* 3. ITEMS TABLE - SOLID BLACK BORDER SCHEMA */}
          <div className="overflow-hidden pt-1">
            <table className="w-full text-left border-collapse text-[12.5px] sm:text-[13px] border-[1.5px] border-black">
              <thead>
                <tr className="bg-neutral-50 print:bg-white text-black border-b-[1.5px] border-black font-black">
                  <th className="p-2 text-center w-9 border-r-[1.5px] border-black">#</th>
                  <th className="p-2 border-r-[1.5px] border-black">આઇટમ વિગત (Description)</th>
                  <th className="p-2 text-center w-24 border-r-[1.5px] border-black">જથ્થો (Qty)</th>
                  <th className="p-2 text-right w-24 border-r-[1.5px] border-black">ભાવ (Rate)</th>
                  <th className="p-2 text-right w-28">કુલ (Amount)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b-[1.5px] border-black">
                    <td className="p-2 text-center font-bold text-black border-r-[1.5px] border-black">{idx + 1}</td>
                    <td className="p-2 font-bold text-black border-r-[1.5px] border-black">
                      {it.name} {it.unit ? `(${it.unit})` : ''}
                    </td>
                    <td className="p-2 text-center font-bold text-black border-r-[1.5px] border-black">{it.qty}</td>
                    <td className="p-2 text-right font-medium text-black border-r-[1.5px] border-black">
                      ₹{Number(it.price).toFixed(2)}
                    </td>
                    <td className="p-2 text-right font-black text-black">
                      ₹{Number(it.price * it.qty).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. TOTALS & CERTIFICATION ROW */}
          <div className="flex justify-between items-start pt-1 text-[13px] sm:text-[13.5px]">
            <div className="font-bold text-black pt-1">
              ✓ પ્રમાણિત કરાયેલ ઓર્ડર
            </div>
            <div className="text-right space-y-0.5">
              <div className="font-bold text-black">
                સબટોટલ (Subtotal): ₹{Number(order.subtotal).toFixed(2)}
              </div>
              {order.discount > 0 && (
                <div className="font-bold text-black">
                  ડિસ્કાઉન્ટ: -₹{Number(order.discount).toFixed(2)}
                </div>
              )}
              <div className="text-sm sm:text-base font-black text-black pt-0.5">
                કુલ રકમ (Total): ₹{Number(order.total).toFixed(2)}
              </div>
              <div className="font-bold text-black pt-0.5">
                સ્થિતિ: {order.paymentStatus}
              </div>
            </div>
          </div>

          {/* 5. FRAUD WARNING ALERT */}
          {storeSettings.billShowFraudWarning !== false && storeSettings.billFraudWarning && (
            <div className="pt-2 text-xs sm:text-[12.5px] text-black font-bold leading-relaxed">
              {storeSettings.billFraudWarning}
            </div>
          )}

          {/* 6. FOOTER & TERMS */}
          <div className="border-t border-neutral-300 print:border-black pt-3 text-center text-xs text-black space-y-1">
            <div className="font-bold">{storeSettings.invoiceFooterNote}</div>
            <div className="text-[11px] sm:text-xs text-neutral-800 print:text-black">
              {storeSettings.billTermsNote || 'કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ. ખરીદેલ માલ પરત લેવાશે નહિ.'} • હેલ્પલાઇન: +91 {storeSettings.phone}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (NO-PRINT) */}
        <div className="no-print bg-neutral-100 p-3 sm:p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600 font-bold text-center sm:text-left">
            💡 કમ્પ્યુટર અથવા પ્રિન્ટરમાં ૧ પેજનું કાગળ પ્રિન્ટ કરવા માટે 'પ્રિન્ટ' બટન દબાવો.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex-1 sm:flex-none bg-[#0B1E48] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>🖨️ પ્રિન્ટ (A4 Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
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
