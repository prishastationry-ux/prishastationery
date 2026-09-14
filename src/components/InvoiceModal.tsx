import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, Share2, FileDown, Loader2, ArrowRight } from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  generateUpiQrDataUrl,
  getDefaultLeftLogoSvg,
  getDefaultRightLogoSvg,
  numberToWordsINR
} from '../lib/invoiceUtils';

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
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const billContentRef = useRef<HTMLDivElement>(null);

  // Generate Automatic Dynamic UPI Payment QR Code
  useEffect(() => {
    let isMounted = true;
    generateUpiQrDataUrl(
      storeSettings.upiId,
      storeSettings.payeeName || storeSettings.storeNameEn,
      order.total,
      order.invoiceNo
    ).then(url => {
      if (isMounted) {
        setUpiQrDataUrl(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [storeSettings.upiId, storeSettings.payeeName, storeSettings.storeNameEn, order.total, order.invoiceNo]);

  // Determine effective logos and QR code
  const effectiveLeftLogo = storeSettings.leftLogoUrl || getDefaultLeftLogoSvg();
  const effectiveRightLogo = storeSettings.rightLogoUrl || getDefaultRightLogoSvg();
  const effectiveQrCode = storeSettings.customQrUrl || upiQrDataUrl;
  const words = numberToWordsINR(order.total);

  // Generate self-contained HTML for rock-solid, single-page A4 printing (Government Recognized)
  const getInvoiceHtmlString = () => {
    const showLogos = storeSettings.billShowLogos !== false;
    const showQr = storeSettings.billShowQr !== false && !storeSettings.hideUpiOnBill;
    const showSignature = storeSettings.billShowSignature !== false;

    const itemsHtml = order.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1.2px solid #1a1a1a;">
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 6px; font-weight: 700;">
            ${it.name}${it.unit ? ` (${it.unit})` : ''}
          </td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-size: 10.5px;">
            ${it.name.includes('ઝેરોક્ષ') || it.name.includes('પ્રિન્ટ') || it.name.includes('સેવા') ? '9983' : '4901'}
          </td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-weight: 800;">${it.qty}</td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 6px; text-align: right; font-weight: 600;">₹${Number(it.price).toFixed(2)}</td>
          <td style="padding: 4px 6px; text-align: right; font-weight: 800;">₹${Number(it.price * it.qty).toFixed(2)}</td>
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
      margin: 8mm 10mm;
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .bill-wrapper {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      border: 1.5px solid #000000;
      padding: 8px 10px;
      background: #ffffff;
    }
    /* Government Header Strip */
    .govt-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    /* 3-Column Store Header with Passport-size Logos */
    .store-header-grid {
      display: table;
      width: 100%;
      border-bottom: 1.5px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .header-col-left, .header-col-right {
      display: table-cell;
      width: 75px;
      vertical-align: middle;
      text-align: center;
    }
    .header-col-center {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      padding: 0 8px;
    }
    /* Passport Size Photo Specification */
    .passport-logo {
      width: 68px;
      height: 68px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      padding: 2px;
      display: block;
      margin: 0 auto;
    }
    .store-name-en {
      font-size: 18px;
      font-weight: 900;
      margin: 0;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      color: #000000;
      line-height: 1.15;
    }
    .store-name-gu {
      font-size: 15px;
      font-weight: 800;
      margin: 2px 0 0 0;
      color: #000000;
    }
    .store-sub {
      font-size: 10.5px;
      font-weight: 700;
      margin-top: 2px;
    }
    .store-address {
      font-size: 10px;
      margin-top: 2px;
      color: #111827;
      line-height: 1.25;
    }
    .store-tax-ids {
      font-size: 10.5px;
      font-weight: 800;
      margin-top: 3px;
      color: #000000;
    }
    /* Two-Column Meta Grid */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.2px solid #000000;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .meta-table td {
      padding: 4px 6px;
      vertical-align: top;
    }
    .meta-left {
      width: 55%;
      border-right: 1.2px solid #000000;
    }
    .meta-right {
      width: 45%;
    }
    .meta-title {
      font-weight: 900;
      text-decoration: underline;
      margin-bottom: 2px;
      font-size: 10.5px;
      text-transform: uppercase;
    }
    .customer-name {
      font-size: 13px;
      font-weight: 800;
      margin: 1px 0;
    }
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      margin-bottom: 6px;
      font-size: 11.5px;
    }
    .items-table th {
      border: 1.2px solid #000000;
      padding: 4px 5px;
      font-weight: 800;
      background-color: #f3f4f6;
      font-size: 10.5px;
      text-transform: uppercase;
    }
    .items-table td {
      border-left: 1.2px solid #000000;
    }
    /* Summary Row (Amount in words & Totals) */
    .summary-grid {
      display: table;
      width: 100%;
      border: 1.2px solid #000000;
      margin-bottom: 6px;
      font-size: 11.5px;
    }
    .summary-left {
      display: table-cell;
      width: 58%;
      padding: 6px 8px;
      vertical-align: top;
      border-right: 1.2px solid #000000;
      background: #fafafa;
    }
    .summary-right {
      display: table-cell;
      width: 42%;
      padding: 5px 8px;
      vertical-align: top;
      text-align: right;
    }
    .words-label {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #374151;
    }
    .words-text {
      font-size: 11px;
      font-weight: 800;
      color: #000000;
      margin-top: 1px;
    }
    .grand-total-row {
      font-size: 14px;
      font-weight: 900;
      border-top: 1.2px solid #000000;
      padding-top: 3px;
      margin-top: 3px;
    }
    /* Bottom Section: QR & Terms on Left | Signatory on Right */
    .bottom-grid {
      display: table;
      width: 100%;
      border: 1.2px solid #000000;
      font-size: 10.5px;
    }
    .bottom-left {
      display: table-cell;
      width: 60%;
      padding: 6px 8px;
      vertical-align: middle;
      border-right: 1.2px solid #000000;
    }
    .bottom-right {
      display: table-cell;
      width: 40%;
      padding: 6px 8px;
      vertical-align: bottom;
      text-align: center;
    }
    /* Passport size QR Code */
    .qr-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .passport-qr {
      width: 78px;
      height: 78px;
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 1px;
      background: #ffffff;
      shrink: 0;
    }
    .qr-details {
      font-size: 10px;
      line-height: 1.35;
    }
    .terms-box {
      font-size: 9px;
      color: #374151;
      margin-top: 4px;
      line-height: 1.25;
      border-top: 1px dashed #d1d5db;
      padding-top: 3px;
    }
    /* Authorized Signatory Box */
    .signatory-box {
      text-align: center;
      padding: 2px;
    }
    .signatory-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .signature-image {
      max-height: 44px;
      max-width: 150px;
      object-fit: contain;
      margin: 2px auto;
      display: block;
    }
    .signature-line {
      width: 130px;
      border-bottom: 1.2px solid #000000;
      margin: 32px auto 3px auto;
    }
    .signatory-caption {
      font-size: 10.5px;
      font-weight: 800;
    }
    .footer-note {
      font-size: 9px;
      text-align: center;
      margin-top: 4px;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="bill-wrapper">
    
    <!-- 1. Government Recognized Header Strip -->
    <div class="govt-strip">
      <span>🇮🇳 ટેક્સ ઇન્વોઇસ / વેચાણ બિલ (TAX INVOICE)</span>
      <span>અસલ ગ્રાહક નકલ (ORIGINAL FOR RECIPIENT)</span>
    </div>

    <!-- 2. Store Header with Passport-size Logos -->
    <div class="store-header-grid">
      <div class="header-col-left">
        ${
          showLogos
            ? `<img src="${effectiveLeftLogo}" alt="Logo" class="passport-logo" />`
            : ''
        }
      </div>
      <div class="header-col-center">
        <h1 class="store-name-en">${storeSettings.storeNameEn}</h1>
        <h2 class="store-name-gu">${storeSettings.storeNameGu}</h2>
        <div class="store-sub">
          ${storeSettings.tagline}${storeSettings.ownerName ? ` • સંચાલક: ${storeSettings.ownerName}` : ''}
        </div>
        <div class="store-address">${storeSettings.address}</div>
        <div class="store-tax-ids">
          📞 +91 ${storeSettings.phone}${storeSettings.email ? ` • ✉️ ${storeSettings.email}` : ''}
          ${storeSettings.billShowGst !== false && storeSettings.gstNumber ? ` • <b>GSTIN:</b> ${storeSettings.gstNumber}` : ''}
          ${storeSettings.panNumber ? ` • <b>PAN:</b> ${storeSettings.panNumber}` : ''}
        </div>
      </div>
      <div class="header-col-right">
        ${
          showLogos
            ? `<img src="${effectiveRightLogo}" alt="CSC Emblem" class="passport-logo" />`
            : ''
        }
      </div>
    </div>

    <!-- 3. Customer & Invoice Details Table -->
    <table class="meta-table">
      <tr>
        <td class="meta-left">
          <div class="meta-title">ગ્રાહકની વિગત (BILLED TO / CUSTOMER):</div>
          <div class="customer-name">${order.customerName}</div>
          <div>📞 <b>મોબાઇલ:</b> +91 ${order.mobile}</div>
          <div>📍 <b>સરનામું:</b> ${order.address || 'કાઉન્ટર ગ્રાહક (Tharad)'}</div>
        </td>
        <td class="meta-right">
          <div class="meta-title">ઇન્વોઇસ વિગત (INVOICE DETAILS):</div>
          <div><b>બિલ નં (Inv No):</b> <span style="font-weight: 800; font-size: 12px;">${order.invoiceNo}</span></div>
          <div><b>તારીખ (Date):</b> ${order.date}</div>
          <div><b>ચૂકવણી પદ્ધતિ:</b> ${order.paymentMode} (${order.paymentStatus})</div>
          <div><b>સપ્લાય સ્થળ:</b> ગુજરાત (Place of Supply: 24-Gujarat)</div>
        </td>
      </tr>
    </table>

    <!-- 4. Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 28px; text-align: center;">#</th>
          <th style="text-align: left;">વસ્તુ / સેવાની વિગત (Description of Goods & Services)</th>
          <th style="width: 55px; text-align: center;">HSN/SAC</th>
          <th style="width: 48px; text-align: center;">જથ્થો</th>
          <th style="width: 70px; text-align: right;">દર (Rate)</th>
          <th style="width: 80px; text-align: right;">કુલ (Amount)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- 5. Totals & Amount in Words Grid -->
    <div class="summary-grid">
      <div class="summary-left">
        <div class="words-label">અક્ષરે રૂપિયા (Amount in Words):</div>
        <div class="words-text">${words.gu}</div>
        <div style="font-size: 10px; color: #4b5563; margin-top: 1px;">${words.en}</div>
        <div style="margin-top: 4px; font-size: 10px; font-weight: 700;">
          ✓ પ્રમાણિત કેન્દ્ર • ગ્રાહક સંતોષ એ અમારો ધ્યેય છે
        </div>
      </div>
      <div class="summary-right">
        <div>સબટોટલ (Subtotal): <b>₹${Number(order.subtotal).toFixed(2)}</b></div>
        ${
          order.discount > 0
            ? `<div style="color: #b91c1c;">ડિસ્કાઉન્ટ: -₹${Number(order.discount).toFixed(2)}</div>`
            : ''
        }
        <div class="grand-total-row">
          ચૂકવવાપાત્ર રકમ: ₹${Number(order.total).toFixed(2)}
        </div>
        <div style="font-size: 10px; margin-top: 1px;">
          સ્થિતિ: <b>${order.paymentStatus === 'Paid' ? '✅ ચૂકવેલ (PAID)' : '⚠️ બાકી (PENDING)'}</b>
        </div>
      </div>
    </div>

    <!-- 6. Bottom Section: Passport-size QR Code on Left | Authorized Signatory on Right -->
    <div class="bottom-grid">
      <div class="bottom-left">
        ${
          showQr && effectiveQrCode
            ? `
          <div class="qr-container">
            <img src="${effectiveQrCode}" alt="Payment QR" class="passport-qr" />
            <div class="qr-details">
              <div style="font-weight: 800; font-size: 10.5px; color: #000000;">
                📱 ઓટોમેટિક પેમેન્ટ QR કોડ
              </div>
              <div style="font-weight: 700; color: #15803d; font-size: 9.5px;">
                કોઈપણ UPI (GPay / PhonePe / Paytm) થી સ્કેન કરો
              </div>
              <div style="font-size: 9.5px; margin-top: 1px;">
                UPI ID: <b>${storeSettings.upiId}</b>
              </div>
              <div style="font-size: 9.5px; color: #1f2937;">
                Payee: <b>${storeSettings.payeeName || storeSettings.storeNameEn}</b>
              </div>
            </div>
          </div>
        `
            : `
          <div style="font-weight: 700; font-size: 10.5px;">
            📞 પેમેન્ટ / હેલ્પલાઇન: +91 ${storeSettings.phone} • UPI ID: ${storeSettings.upiId}
          </div>
        `
        }

        <div class="terms-box">
          <b>શરતો & નિયમો:</b> ${storeSettings.billTermsNote || '૧. ખરીદેલ માલ પરત લેવાશે નહિ. ૨. વિવાદનું સ્થળ: થરાદ કોર્ટ.'}
        </div>
      </div>

      <div class="bottom-right">
        ${
          showSignature
            ? `
          <div class="signatory-box">
            <div class="signatory-title">
              ${storeSettings.signatoryTitle || `For, ${storeSettings.storeNameEn}`}
            </div>
            ${
              storeSettings.signatureUrl
                ? `<img src="${storeSettings.signatureUrl}" alt="Signature" class="signature-image" />`
                : `<div class="signature-line"></div>`
            }
            <div class="signatory-caption">
              ${storeSettings.signatoryName || 'Authorized Signatory / અધિકૃત સહી'}
            </div>
          </div>
        `
            : `
          <div style="padding-top: 30px; font-weight: 800; font-size: 10.5px;">
            ${storeSettings.storeNameEn}
          </div>
        `
        }
      </div>
    </div>

    <!-- 7. Footer Note -->
    <div class="footer-note">
      ${storeSettings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!'} • કમ્પ્યુટર જનરેટેડ ઇન્વોઇસ
    </div>

  </div>
</body>
</html>`;
  };

  // 1. Direct Print: Opens dedicated print window or full-sized A4 frame (100% single page, non-blank)
  const handleDirectPrint = () => {
    try {
      const printWin = window.open('', '_blank', 'width=850,height=1000');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(getInvoiceHtmlString());
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.error('Print window error:', e);
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Popup blocked, falling back to hidden A4 frame');
    }

    try {
      let iframe = document.getElementById('prisha-direct-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'prisha-direct-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '794px';
        iframe.style.height = '1123px';
        iframe.style.border = 'none';
        iframe.style.zIndex = '-9999';
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
        }, 350);
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print trigger error:', err);
      window.print();
    }
  };

  // 2. Direct A4 PDF Download with offscreen zero-scroll canvas (never blank)
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      const offscreenDiv = document.createElement('div');
      offscreenDiv.id = 'prisha-pdf-render-div';
      offscreenDiv.style.position = 'fixed';
      offscreenDiv.style.left = '-9999px';
      offscreenDiv.style.top = '0';
      offscreenDiv.style.width = '794px';
      offscreenDiv.style.backgroundColor = '#ffffff';
      offscreenDiv.style.color = '#000000';
      offscreenDiv.style.padding = '8px 12px';
      offscreenDiv.style.zIndex = '-9999';

      offscreenDiv.innerHTML = getInvoiceHtmlString();
      document.body.appendChild(offscreenDiv);

      const billWrapper = (offscreenDiv.querySelector('.bill-wrapper') as HTMLElement) || offscreenDiv;

      const canvas = await html2canvas(billWrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850
      });

      document.body.removeChild(offscreenDiv);

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
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
      `📍 *સરનામું:* ${order.address || 'Tharad'}\n` +
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

  const showLogos = storeSettings.billShowLogos !== false;
  const showQr = storeSettings.billShowQr !== false && !storeSettings.hideUpiOnBill;
  const showSignature = storeSettings.billShowSignature !== false;

  return (
    <div className="invoice-modal-overlay fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="invoice-modal-card bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-neutral-300 print:border-none print:shadow-none my-auto">
        
        {/* TOP STATUS & CONTROLS BAR (NO-PRINT) */}
        <div className="no-print bg-[#0B1E48] text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black border border-orange-500/30">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{isSuccessView ? '🎉 ઓર્ડર નોંધાઈ ગયો (બિલ તૈયાર)' : '🧾 સરકારી માન્ય ટેક્સ ઇન્વોઇસ'}</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  ૧ પેજ પ્રિન્ટ તૈયાર
                </span>
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
              <span>🖨️ પ્રિન્ટ (૧ પેજ)</span>
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

        {/* PRINTABLE BILL CANVAS - 100% GOVERNMENT RECOGNIZED SINGLE-PAGE DESIGN */}
        <div
          ref={billContentRef}
          id="printable-bill-area"
          className="p-4 sm:p-6 bg-white text-black text-[12px] font-sans space-y-2.5 print:p-0 print:space-y-2 print:text-[11px] print:w-full"
        >
          {/* A. GOVT RECOGNIZED TOP STRIP */}
          <div className="flex items-center justify-between border-b-2 border-black pb-1 text-[11px] sm:text-xs font-black uppercase tracking-wide">
            <span className="flex items-center gap-1">
              <span>🇮🇳</span>
              <span>ટેક્સ ઇન્વોઇસ / વેચાણ બિલ (TAX INVOICE)</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-neutral-700 font-bold">
              અસલ ગ્રાહક નકલ (ORIGINAL FOR RECIPIENT)
            </span>
          </div>

          {/* B. 3-COLUMN STORE HEADER WITH PASSPORT-SIZE LOGOS */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-2">
            {/* Left Logo (Passport size: 68x68px) */}
            <div className="w-[72px] shrink-0 text-center">
              {showLogos && (
                <img
                  src={effectiveLeftLogo}
                  alt="Store Logo"
                  className="w-[68px] h-[68px] object-contain rounded-lg border border-neutral-300 p-1 mx-auto bg-white"
                  title="પ્રિષા સ્ટેશનરી લોગો (Passport Size)"
                />
              )}
            </div>

            {/* Centered Store Details */}
            <div className="flex-1 text-center min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-black leading-tight uppercase">
                {storeSettings.storeNameEn}
              </h1>
              <h2 className="text-sm sm:text-base font-black text-black leading-tight">
                {storeSettings.storeNameGu}
              </h2>
              <div className="text-[11px] font-bold text-black mt-0.5">
                {storeSettings.tagline}
                {storeSettings.ownerName ? ` • સંચાલક: ${storeSettings.ownerName}` : ''}
              </div>
              <div className="text-[10.5px] text-neutral-800 font-medium max-w-lg mx-auto leading-tight mt-0.5">
                {storeSettings.address}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10.5px] font-bold text-black pt-0.5">
                <span>📞 +91 {storeSettings.phone}</span>
                {storeSettings.email && <span>• ✉️ {storeSettings.email}</span>}
                {storeSettings.billShowGst !== false && storeSettings.gstNumber && (
                  <span>• <b>GSTIN:</b> {storeSettings.gstNumber}</span>
                )}
                {storeSettings.panNumber && (
                  <span>• <b>PAN:</b> {storeSettings.panNumber}</span>
                )}
              </div>
            </div>

            {/* Right Logo / CSC Digital Emblem (Passport size: 68x68px) */}
            <div className="w-[72px] shrink-0 text-center">
              {showLogos && (
                <img
                  src={effectiveRightLogo}
                  alt="CSC Emblem"
                  className="w-[68px] h-[68px] object-contain rounded-lg border border-neutral-300 p-1 mx-auto bg-white"
                  title="CSC ડિજિટલ સેવા એમ્બ્લેમ (Passport Size)"
                />
              )}
            </div>
          </div>

          {/* C. CUSTOMER & INVOICE META (TWO COLUMNS TABLE) */}
          <div className="grid grid-cols-2 border border-black text-[11px] sm:text-xs">
            {/* Left: Customer */}
            <div className="p-2 border-r border-black space-y-0.5">
              <div className="text-[10px] font-black uppercase text-neutral-600 underline">
                ગ્રાહકની વિગત (BILLED TO / CUSTOMER):
              </div>
              <div className="text-xs sm:text-sm font-black text-black">{order.customerName}</div>
              <div className="font-bold text-black">📞 +91 {order.mobile}</div>
              <div className="text-black font-medium">📍 {order.address || 'કાઉન્ટર ગ્રાહક (Tharad)'}</div>
            </div>

            {/* Right: Invoice */}
            <div className="p-2 space-y-0.5">
              <div className="text-[10px] font-black uppercase text-neutral-600 underline">
                ઇન્વોઇસ વિગત (INVOICE DETAILS):
              </div>
              <div className="font-bold text-black">
                બિલ નં: <span className="font-mono font-black text-xs">{order.invoiceNo}</span>
              </div>
              <div className="font-bold text-black">તારીખ: {order.date}</div>
              <div className="font-bold text-black">ચૂકવણી: {order.paymentMode} ({order.paymentStatus})</div>
              <div className="text-black text-[10px]">સપ્લાય સ્થળ: ગુજરાત (24-Gujarat)</div>
            </div>
          </div>

          {/* D. ITEMS TABLE */}
          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse text-[11.5px] border border-black">
              <thead>
                <tr className="bg-neutral-100 text-black border-b border-black font-black text-[10.5px]">
                  <th className="p-1.5 text-center w-8 border-r border-black">#</th>
                  <th className="p-1.5 border-r border-black">વસ્તુ / સેવાની વિગત (Description of Goods & Services)</th>
                  <th className="p-1.5 text-center w-16 border-r border-black">HSN/SAC</th>
                  <th className="p-1.5 text-center w-14 border-r border-black">જથ્થો</th>
                  <th className="p-1.5 text-right w-16 border-r border-black">દર (₹)</th>
                  <th className="p-1.5 text-right w-20">કુલ (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="p-1.5 text-center font-bold text-black border-r border-black">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-black border-r border-black">
                      {it.name} {it.unit ? `(${it.unit})` : ''}
                    </td>
                    <td className="p-1.5 text-center text-[10px] text-neutral-600 border-r border-black">
                      {it.name.includes('ઝેરોક્ષ') || it.name.includes('પ્રિન્ટ') || it.name.includes('સેવા') ? '9983' : '4901'}
                    </td>
                    <td className="p-1.5 text-center font-black text-black border-r border-black">{it.qty}</td>
                    <td className="p-1.5 text-right font-medium text-black border-r border-black">
                      ₹{Number(it.price).toFixed(2)}
                    </td>
                    <td className="p-1.5 text-right font-black text-black">
                      ₹{Number(it.price * it.qty).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* E. TOTALS & WORDS SUMMARY ROW */}
          <div className="grid grid-cols-12 border border-black bg-neutral-50/50 text-[11.5px]">
            {/* Left 7 cols: In Words */}
            <div className="col-span-7 p-2 border-r border-black space-y-1">
              <div className="text-[10px] font-black uppercase text-neutral-600">
                અક્ષરે રૂપિયા (Amount in Words):
              </div>
              <div className="text-xs font-black text-black">{words.gu}</div>
              <div className="text-[10px] text-neutral-600 italic">{words.en}</div>
              <div className="text-[10px] font-bold text-emerald-800 pt-0.5">
                ✓ અધિકૃત પ્રિષા સ્ટેશનરી & ઓનલાઇન સર્વિસ
              </div>
            </div>

            {/* Right 5 cols: Totals */}
            <div className="col-span-5 p-2 text-right space-y-0.5 bg-white">
              <div className="font-bold text-black">
                સબટોટલ: ₹{Number(order.subtotal).toFixed(2)}
              </div>
              {order.discount > 0 && (
                <div className="font-bold text-red-600">
                  ડિસ્કાઉન્ટ: -₹{Number(order.discount).toFixed(2)}
                </div>
              )}
              <div className="text-sm font-black text-black border-t border-black pt-1 mt-1">
                કુલ રકમ (Total): ₹{Number(order.total).toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-neutral-700">
                સ્થિતિ: {order.paymentStatus === 'Paid' ? '✅ ચૂકવેલ' : '⚠️ બાકી'}
              </div>
            </div>
          </div>

          {/* F. BOTTOM ROW: PASSPORT-SIZE QR CODE ON LEFT | AUTHORIZED SIGNATORY ON RIGHT */}
          <div className="grid grid-cols-12 border border-black text-[11px]">
            {/* Left 7 cols: Automatic QR Code & Terms */}
            <div className="col-span-7 p-2.5 border-r border-black flex flex-col justify-between">
              {showQr && effectiveQrCode ? (
                <div className="flex items-center gap-3">
                  {/* Passport-size QR Code (approx 78x78px) */}
                  <img
                    src={effectiveQrCode}
                    alt="Automatic UPI Payment QR Code"
                    className="w-[78px] h-[78px] object-contain border border-black rounded p-0.5 bg-white shrink-0"
                    title="આ QR કોડ GPay/PhonePe થી સ્કેન કરી બિલનું પેમેન્ટ કરો"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-black text-black text-xs flex items-center gap-1">
                      <span>📱 ઓટોમેટિક પેમેન્ટ QR કોડ</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700">
                      GPay / PhonePe / Paytm થી સ્કેન કરો
                    </div>
                    <div className="text-[10px] text-neutral-800">
                      UPI ID: <span className="font-mono font-bold text-black">{storeSettings.upiId}</span>
                    </div>
                    <div className="text-[9.5px] text-neutral-600 truncate">
                      રકમ: <b>₹{Number(order.total).toFixed(2)}</b> (Bill: {order.invoiceNo})
                    </div>
                  </div>
                </div>
              ) : (
                <div className="font-bold text-xs text-neutral-800">
                  📞 પેમેન્ટ સંપર્ક: +91 {storeSettings.phone} • UPI: {storeSettings.upiId}
                </div>
              )}

              <div className="text-[9px] text-neutral-700 pt-1.5 mt-1 border-t border-dashed border-neutral-300 leading-tight">
                <b>શરતો:</b> {storeSettings.billTermsNote || 'ખરીદેલ માલ પરત લેવાશે નહિ. ફક્ત એક્સચેન્જ થઈ શકશે. વિવાદનું સ્થળ: થરાદ કોર્ટ.'}
              </div>
            </div>

            {/* Right 5 cols: Authorized Signatory Box */}
            <div className="col-span-5 p-2.5 flex flex-col justify-between text-center bg-neutral-50/30">
              {showSignature ? (
                <div className="space-y-1 my-auto">
                  <div className="text-[10px] font-black uppercase text-neutral-800">
                    {storeSettings.signatoryTitle || `For, ${storeSettings.storeNameEn}`}
                  </div>
                  
                  {storeSettings.signatureUrl ? (
                    <div className="h-10 flex items-center justify-center">
                      <img
                        src={storeSettings.signatureUrl}
                        alt="Authorized Signature"
                        className="max-h-10 max-w-[140px] object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-32 border-b border-black mx-auto my-3"></div>
                  )}

                  <div className="text-[10.5px] font-black text-black border-t border-neutral-300 pt-0.5">
                    {storeSettings.signatoryName || 'Authorized Signatory / અધિકૃત સહી'}
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center font-bold text-xs">
                  {storeSettings.storeNameEn}
                </div>
              )}
            </div>
          </div>

          {/* G. FOOTER NOTE */}
          <div className="text-center text-[9.5px] text-neutral-600 pt-1">
            {storeSettings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!'} • કમ્પ્યુટર જનરેટેડ ટેક્સ ઇન્વોઇસ
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
