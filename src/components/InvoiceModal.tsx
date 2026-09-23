import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, Share2, FileDown, Loader2, ArrowRight } from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  generateUpiQrDataUrl,
  getImmediateQrFallbackUrl,
  getDefaultLeftLogoSvg,
  getDefaultRightLogoSvg,
  numberToWordsINR
} from '../lib/invoiceUtils';
import { calculateGstBreakup, detectHsnAndGst } from '../lib/gstHsnMaster';

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
  const [billFormat, setBillFormat] = useState<'a4' | 'corporate_gst' | 'gem_portal' | 'thermal'>(
    order.gemContractNo ? 'gem_portal' : 'a4'
  );
  const [gemContractNo, setGemContractNo] = useState<string>(
    order.gemContractNo || `GEMC-511687705${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [gemContractDate, setGemContractDate] = useState<string>(
    order.gemContractDate || order.date.split(' ')[0] || new Date().toLocaleDateString('en-IN')
  );
  const [consigneeDept, setConsigneeDept] = useState<string>(
    order.consigneeDept || order.customerName || 'મામલતદાર કચેરી, થરાદ (સરકારી વિભાગ)'
  );
  const [consigneeGstin, setConsigneeGstin] = useState<string>(
    order.consigneeGstin || '24AHGPD1234F1Z1'
  );
  const [consigneeAddress, setConsigneeAddress] = useState<string>(
    order.address || 'થરાદ, બનાસકાંઠા (ગુજરાત) - 385565'
  );
  const [showGemGuideModal, setShowGemGuideModal] = useState<boolean>(false);
  const billContentRef = useRef<HTMLDivElement>(null);

  // Generate Automatic Dynamic UPI Payment QR Code with exact bill amount
  useEffect(() => {
    let isMounted = true;
    generateUpiQrDataUrl(
      storeSettings.upiId || '8140430395@apl',
      storeSettings.payeeName || storeSettings.storeNameEn || 'PRISHA STATIONERY',
      order.total,
      order.invoiceNo
    ).then(url => {
      if (isMounted && url) {
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
  const fallbackImmediateQr = getImmediateQrFallbackUrl(
    storeSettings.upiId || '8140430395@apl',
    storeSettings.payeeName || storeSettings.storeNameEn || 'PRISHA STATIONERY',
    order.total,
    order.invoiceNo
  );
  const effectiveQrCode = upiQrDataUrl || fallbackImmediateQr;
  const words = numberToWordsINR(order.total);

  const isPendingBill =
    order.paymentStatus === 'Pending' ||
    order.paymentStatus === 'બાકી' ||
    (typeof order.paymentMode === 'string' &&
      (order.paymentMode.includes('બાકી') ||
        order.paymentMode.toLowerCase().includes('credit') ||
        order.paymentMode.toLowerCase().includes('pending')));

  // Accurate Item-Level & Corporate HSN/SAC GST Calculation Engine
  const gstBreakup = calculateGstBreakup(
    order.items.map(it => ({
      name: it.name,
      qty: it.qty,
      price: it.price,
      hsnCode: it.hsnCode,
      gstRate: it.gstRate
    })),
    order.discount || 0
  );

  const isCorporateGstMode = billFormat === 'corporate_gst';
  const isGemPortalMode = billFormat === 'gem_portal';

  // Visibility Flags from Admin Toggles
  const showLogos = storeSettings.billShowLogos !== false;
  const showQr = storeSettings.billShowQr !== false && !storeSettings.hideUpiOnBill;
  const showUpi = storeSettings.billShowUpi !== false && !storeSettings.hideUpiOnBill;
  const showGst = storeSettings.billShowGst !== false && Boolean(storeSettings.gstNumber);
  const showPan = storeSettings.billShowPan !== false && Boolean(storeSettings.panNumber);
  const showAddress = storeSettings.billShowAddress !== false && Boolean(storeSettings.address);
  const showHelpline = storeSettings.billShowHelpline !== false;
  const showTagline = storeSettings.billShowTagline !== false && Boolean(storeSettings.tagline);
  const showOwnerName = storeSettings.billShowOwnerName !== false && Boolean(storeSettings.ownerName);
  const showHsnColumn = storeSettings.billShowHsnColumn !== false;
  const showWords = storeSettings.billShowWords !== false;
  const showBankDetails = storeSettings.billShowBankDetails !== false;
  const showSignature = storeSettings.billShowSignature !== false;
  const showTerms = storeSettings.billShowTerms !== false;

  // Watermark Settings (~30% default opacity control)
  const showWatermark = storeSettings.billShowWatermark !== false;
  const watermarkOpacity = (storeSettings.billWatermarkOpacity ?? 30) / 100;
  const watermarkText = storeSettings.billWatermarkText || storeSettings.storeNameEn || 'PRISHA STATIONERY & XEROX (THARAD)';
  const watermarkType = storeSettings.billWatermarkType || 'both';

  // Generate self-contained HTML for professional Corporate A4 printing (Tata/Birla/Reliance style)
  const getInvoiceHtmlString = (overrideQr?: string) => {
    const activeQr = overrideQr || effectiveQrCode;
    const itemsHtml = order.items
      .map((it, idx) => {
        const itemHsn = it.hsnCode || detectHsnAndGst(it.name).hsnCode;
        const itemRate = it.gstRate !== undefined ? it.gstRate : detectHsnAndGst(it.name).gstRate;
        const lineTotal = Number(it.price * it.qty);
        const unitTaxableRate = (itemRate > 0 && (isCorporateGstMode || isGemPortalMode))
          ? it.price / (1 + itemRate / 100)
          : it.price;
        const taxableVal = itemRate > 0 ? lineTotal / (1 + itemRate / 100) : lineTotal;
        const displayRate = (isCorporateGstMode || isGemPortalMode) ? unitTaxableRate : it.price;

        return `
        <tr style="border-bottom: 1.2px solid #1a1a1a;">
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 6px; font-weight: 700;">
            ${it.name}${it.unit ? ` (${it.unit})` : ''}
          </td>
          ${
            showHsnColumn
              ? `<td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-family: monospace; font-size: 10.5px;">
                  ${itemHsn}
                </td>`
              : ''
          }
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-weight: 800;">${it.qty}</td>
          <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 6px; text-align: right; font-weight: 600;">₹${displayRate.toFixed(2)}</td>
          ${
            (isCorporateGstMode || isGemPortalMode)
              ? `<td style="border-right: 1.2px solid #1a1a1a; padding: 4px 5px; text-align: right; font-size: 10px;">₹${taxableVal.toFixed(2)}</td>
                 <td style="border-right: 1.2px solid #1a1a1a; padding: 4px 4px; text-align: center; font-size: 10px;">${itemRate}%</td>`
              : ''
          }
          <td style="padding: 4px 6px; text-align: right; font-weight: 800;">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');

    const hsnBreakupRowsHtml = gstBreakup.rows
      .map(
        r => `
      <tr style="font-weight: 700; border-bottom: 1px solid #1a1a1a;">
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a; font-family: monospace;">${r.hsnCode}</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a; text-align: left; font-size: 9px;">${r.description}</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a; text-align: right;">₹${r.taxableValue.toFixed(2)}</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a;">${r.cgstRate}%</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a; text-align: right;">₹${r.cgstAmount.toFixed(2)}</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a;">${r.sgstRate}%</td>
        <td style="padding: 3px 4px; border-right: 1px solid #1a1a1a; text-align: right;">₹${r.sgstAmount.toFixed(2)}</td>
        <td style="padding: 3px 4px; text-align: right; font-weight: 900;">₹${r.totalTax.toFixed(2)}</td>
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
      position: relative;
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      border: 1.5px solid #000000;
      padding: 8px 10px;
      background: #ffffff;
      overflow: hidden;
    }
    .watermark-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 0;
      text-align: center;
      width: 85%;
      user-select: none;
    }
    .watermark-logo-img {
      width: 100px;
      height: 100px;
      object-fit: contain;
      filter: grayscale(100%);
      margin-bottom: 6px;
    }
    .watermark-title-text {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-family: monospace;
      color: #000000;
      line-height: 1.15;
    }
    .watermark-sub-text {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 4px;
      color: #1a1a1a;
    }
    .bill-main-content {
      position: relative;
      z-index: 1;
    }
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
    .terms-box {
      font-size: 9px;
      color: #374151;
      margin-top: 4px;
      line-height: 1.25;
      border-top: 1px dashed #d1d5db;
      padding-top: 3px;
    }
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
    
    <!-- Watermark Layer (~30% Opacity) -->
    ${
      showWatermark
        ? `
      <div class="watermark-overlay">
        ${
          watermarkType === 'logo' || watermarkType === 'both'
            ? `<img src="${effectiveLeftLogo}" class="watermark-logo-img" alt="Watermark Logo" />`
            : ''
        }
        ${
          watermarkType === 'name' || watermarkType === 'both'
            ? `<div class="watermark-title-text">${watermarkText}</div>
               <div class="watermark-sub-text">TAX INVOICE • ORIGINAL FOR RECIPIENT</div>`
            : ''
        }
      </div>
    `
        : ''
    }

    <div class="bill-main-content">
      <!-- 1. Corporate / GeM Header Strip -->
      <div class="govt-strip" style="${isGemPortalMode ? 'background: #0B1E48; color: #ffffff; padding: 4px 8px; font-weight: 900;' : ''}">
        <span>${isGemPortalMode ? '🏛️ GOVERNMENT e-MARKETPLACE (GeM) - TAX INVOICE / સરકારી ટેક્સ ઇન્વોઇસ' : '🇮🇳 ટેક્સ ઇન્વોઇસ (TAX INVOICE)'}</span>
        <span>${isGemPortalMode ? 'ORIGINAL FOR RECIPIENT' : 'અસલ ગ્રાહક નકલ (ORIGINAL FOR RECIPIENT)'}</span>
      </div>

      <!-- 2. Store Header with Logos -->
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
          ${
            showTagline || showOwnerName
              ? `<div class="store-sub">
                  ${showTagline ? storeSettings.tagline : ''}${showTagline && showOwnerName ? ' • ' : ''}${showOwnerName ? `સંચાલક: ${storeSettings.ownerName}` : ''}
                </div>`
              : ''
          }
          ${showAddress ? `<div class="store-address">${storeSettings.address}</div>` : ''}
          <div class="store-tax-ids">
            ${showHelpline ? `📞 +91 ${storeSettings.phone}${storeSettings.email ? ` • ✉️ ${storeSettings.email}` : ''}` : ''}
            ${showGst ? ` • <b>GSTIN:</b> ${storeSettings.gstNumber}` : ''}
            ${showPan ? ` • <b>PAN:</b> ${storeSettings.panNumber}` : ''}
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

      ${
        isGemPortalMode
          ? `
      <!-- GeM Contract Order Highlight Bar -->
      <div style="background: #eff6ff; border: 1.5px solid #1d4ed8; padding: 5px 8px; margin-bottom: 6px; border-radius: 4px; font-size: 10.5px;">
        <div style="display: flex; justify-content: space-between; font-weight: 900; color: #1e3a8a;">
          <span>📑 GeM કન્ટ્રાક્ટ ઓર્ડર નં: <span style="font-family: monospace; font-size: 12px; color: #1d4ed8;">${gemContractNo}</span></span>
          <span>📅 ઓર્ડર તારીખ: ${gemContractDate}</span>
        </div>
        <div style="margin-top: 2px; font-size: 10px; color: #1e40af;">
          🏢 ખરીદનાર વિભાગ (Buying Dept): <b>${consigneeDept}</b> | GSTIN/TAN: <b>${consigneeGstin}</b>
        </div>
      </div>
      `
          : ''
      }

      <!-- 3. Customer & Invoice Details Table -->
      <table class="meta-table">
        <tr>
          <td class="meta-left">
            <div class="meta-title">${isGemPortalMode ? 'ખરીદનાર / કન્સાઇની (BUYER / CONSIGNEE):' : 'ગ્રાહકની વિગત (BILLED TO / CUSTOMER):'}</div>
            <div class="customer-name">${isGemPortalMode ? consigneeDept : order.customerName}</div>
            <div><b>અધિકારી / સંપર્ક:</b> ${order.customerName} (📞 +91 ${order.mobile})</div>
            <div>📍 <b>સરનામું:</b> ${isGemPortalMode ? consigneeAddress : (order.address || 'કાઉન્ટર ગ્રાહક (Tharad)')}</div>
            <div><b>GSTIN / TAN:</b> ${isGemPortalMode ? consigneeGstin : (order.gstin || 'Unregistered / કાઉન્ટર')}</div>
            <div><b>રાજ્ય:</b> ગુજરાત (State Code: 24-Gujarat)</div>
          </td>
          <td class="meta-right">
            <div class="meta-title">ઇન્વોઇસ વિગત (INVOICE DETAILS):</div>
            <div><b>બિલ નં (Inv No):</b> <span style="font-weight: 800; font-size: 12px;">${order.invoiceNo}</span></div>
            <div><b>ઇન્વોઇસ તારીખ:</b> ${order.date}</div>
            ${isGemPortalMode ? `<div><b>GeM કન્ટ્રાક્ટ નં:</b> <b style="font-family: monospace;">${gemContractNo}</b></div>` : ''}
            <div><b>ચૂકવણી પદ્ધતિ:</b> ${isGemPortalMode ? 'GeM Online Payment / PFMS' : order.paymentMode} (${order.paymentStatus || 'Paid'})</div>
            <div><b>સપ્લાય સ્થળ:</b> 24-ગુજરાત (Place of Supply: 24-Gujarat)</div>
            <div><b>રિવર્સ ચાર્જ (Reverse Charge):</b> ના (No)</div>
          </td>
        </tr>
      </table>

      <!-- 4. Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">#</th>
            <th style="text-align: left;">વસ્તુ / સેવાની વિગત (Description of Goods & Services)</th>
            ${showHsnColumn ? `<th style="width: 55px; text-align: center;">HSN/SAC</th>` : ''}
            <th style="width: 44px; text-align: center;">જથ્થો</th>
            <th style="width: 65px; text-align: right;">દર (Rate)</th>
            ${
              (isCorporateGstMode || isGemPortalMode)
                ? `<th style="width: 65px; text-align: right;">કરપાત્ર (Taxable)</th>
                   <th style="width: 40px; text-align: center;">GST%</th>`
                : ''
            }
            <th style="width: 75px; text-align: right;">કુલ (Amount)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- 5. Totals & Amount in Words Grid -->
      <div class="summary-grid">
        <div class="summary-left">
          ${
            showWords
              ? `
            <div class="words-label">અક્ષરે રૂપિયા (Amount in Words):</div>
            <div class="words-text">${words.gu}</div>
            <div style="font-size: 10px; color: #4b5563; margin-top: 1px;">${words.en}</div>
          `
              : `<div class="words-text">${storeSettings.storeNameGu} • અધિકૃત ટેક્સ ઇન્વોઇસ</div>`
          }
          <div style="margin-top: 4px; font-size: 10px; font-weight: 700; color: #047857;">
            ${isGemPortalMode ? '✓ GeM Portal Government Tax Invoice' : '✓ પ્રમાણિત કર ઇન્વોઇસ • ગ્રાહક સંતોષ એ અમારો ધ્યેય છે'}
          </div>
        </div>
        <div class="summary-right">
          <div>સબટોટલ (Subtotal): <b>₹${Number(order.subtotal).toFixed(2)}</b></div>
          ${
            order.discount > 0
              ? `<div style="color: #b91c1c;">ડિસ્કાઉન્ટ: -₹${Number(order.discount).toFixed(2)}</div>`
              : ''
          }
          ${
            (isCorporateGstMode || isGemPortalMode)
              ? `
            <div style="font-size: 10px; color: #374151;">કરપાત્ર રકમ: ₹${gstBreakup.totalTaxableValue.toFixed(2)}</div>
            <div style="font-size: 10px; color: #374151;">કુલ GST ટેક્સ (CGST+SGST): ₹${gstBreakup.totalTax.toFixed(2)}</div>
          `
              : ''
          }
          <div class="grand-total-row">
            ચૂકવવાપાત્ર રકમ: ₹${Number(order.total).toFixed(2)}
          </div>
          <div style="font-size: 10px; margin-top: 1px;">
            સ્થિતિ: <b>${isPendingBill ? '⚠️ બાકી (PENDING)' : '✅ ચૂકતે / જમા (PAID)'}</b> (${order.paymentMode})
          </div>
        </div>
      </div>

      ${
        (isCorporateGstMode || isGemPortalMode)
          ? `
      <!-- 5.1 Corporate / GeM HSN/SAC GST Tax Summary Schedule -->
      <div style="margin: 4px 0;">
        <div style="font-size: 9.5px; font-weight: 900; color: #1e3a8a; margin-bottom: 2px;">
          📊 GST ટેક્સ બ્રેકઅપ સમરી (HSN/SAC Summary - ${isGemPortalMode ? 'GeM Schedule' : 'Corporate Tax Schedule'}):
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #000; font-size: 9.5px; text-align: center;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.2px solid #000; font-weight: 800;">
              <th style="padding: 2.5px; border-right: 1px solid #000;">HSN / SAC</th>
              <th style="padding: 2.5px; border-right: 1px solid #000; text-align: left;">વસ્તુ / સેવા વર્ણન</th>
              <th style="padding: 2.5px; border-right: 1px solid #000;">કરપાત્ર રકમ (Taxable ₹)</th>
              <th style="padding: 2.5px; border-right: 1px solid #000;">CGST %</th>
              <th style="padding: 2.5px; border-right: 1px solid #000;">CGST રકમ (₹)</th>
              <th style="padding: 2.5px; border-right: 1px solid #000;">SGST %</th>
              <th style="padding: 2.5px; border-right: 1px solid #000;">SGST રકમ (₹)</th>
              <th style="padding: 2.5px;">કુલ ટેક્સ (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${hsnBreakupRowsHtml}
            <tr style="font-weight: 900; background: #fafafa; border-top: 1.2px solid #000;">
              <td colspan="2" style="padding: 3px; border-right: 1px solid #000; text-align: center;">કુલ સરવાળો (Total)</td>
              <td style="padding: 3px; border-right: 1px solid #000; text-align: right;">₹${gstBreakup.totalTaxableValue.toFixed(2)}</td>
              <td style="padding: 3px; border-right: 1px solid #000;">-</td>
              <td style="padding: 3px; border-right: 1px solid #000; text-align: right;">₹${gstBreakup.totalCgst.toFixed(2)}</td>
              <td style="padding: 3px; border-right: 1px solid #000;">-</td>
              <td style="padding: 3px; border-right: 1px solid #000; text-align: right;">₹${gstBreakup.totalSgst.toFixed(2)}</td>
              <td style="padding: 3px; text-align: right;">₹${gstBreakup.totalTax.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      ${
        isGemPortalMode
          ? `
      <!-- GeM Portal Statutory Undertaking & Certification -->
      <div style="border: 1.2px solid #1d4ed8; background: #f0f9ff; padding: 4px 6px; font-size: 8.5px; margin: 4px 0; border-radius: 3px; line-height: 1.3; color: #1e3a8a;">
        <b>🏛️ GeM STATUTORY CERTIFICATION:</b> Certified that the particulars given above are true and correct and the amount, item specifications, HSN/SAC codes, and GST tax breakups match 100% with GeM Contract Order Number <b>${gemContractNo}</b> dated <b>${gemContractDate}</b> on Government e-Marketplace Portal (gem.gov.in). Uploaded Tax Invoice file format is PDF and under 5 MB size limit as mandated by GeM Portal guidelines.
      </div>
      `
          : ''
      }

      <!-- 6. Bottom Section: Details on Left | Authorized Signatory on Right -->
      <div class="bottom-grid">
        <div class="bottom-left">
          ${
            showQr && activeQr
              ? `
            <div style="display: flex; align-items: center; gap: 8px; border: 1.2px solid ${isPendingBill ? '#b91c1c' : '#10b981'}; background: ${isPendingBill ? '#fffbeb' : '#f0fdf4'}; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px;">
              <img src="${activeQr}" alt="Payment QR" style="width: 68px; height: 68px; object-fit: contain; border: 1px solid #000; background: #fff; padding: 1px; border-radius: 4px; flex-shrink: 0;" />
              <div style="line-height: 1.25;">
                <div style="font-weight: 900; font-size: 10px; color: ${isPendingBill ? '#b91c1c' : '#047857'};">
                  ${isPendingBill ? '📱 બાકી રકમ ચૂકવવા UPI QR કોડ' : '✅ પેમેન્ટ વેરિફિકેશન & દુકાન UPI QR'}
                </div>
                <div style="font-weight: 700; color: #15803d; font-size: 9px;">
                  ${isPendingBill ? 'GPay / PhonePe / Paytm થી સ્કેન કરી ચૂકવો' : 'GPay / PhonePe / BHIM સ્કેનર માન્ય'}
                </div>
                ${showUpi ? `<div style="font-size: 9px; margin-top: 1px;">UPI ID: <b>${storeSettings.upiId || '8140430395@apl'}</b></div>` : ''}
                <div style="font-size: 9px; color: #1f2937;">
                  ${isPendingBill ? `બાકી રકમ: <b>₹${Number(order.total).toFixed(2)}</b> (Bill: #${order.invoiceNo})` : `ચૂકવણી: <b>${order.paymentMode}</b> • સ્ટેટસ: <b>ચૂકતે (PAID)</b>`}
                </div>
              </div>
            </div>
          `
              : `
            <div style="border: 1.2px solid #10b981; background: #ecfdf5; border-radius: 4px; padding: 5px 8px; margin-bottom: 4px;">
              <div style="font-weight: 800; font-size: 10.5px; color: #047857;">
                ✅ પેમેન્ટ ચૂકતે / ઓનલાઇન જમા (PAID IN FULL)
              </div>
              <div style="font-size: 9.5px; color: #1f2937; margin-top: 1px;">
                ચૂકવણી પદ્ધતિ: <b>${order.paymentMode}</b> • કોઈ રકમ બાકી નથી
              </div>
              ${showHelpline ? `<div style="font-size: 9px; color: #4b5563; margin-top: 1px;">📞 સહાય / સંપર્ક: +91 ${storeSettings.phone}</div>` : ''}
            </div>
          `
          }

          ${
            showBankDetails
              ? `
            <div style="border: 1px solid #93c5fd; background: #eff6ff; border-radius: 4px; padding: 3px 6px; font-size: 9px; margin-bottom: 3px; line-height: 1.25; color: #1e3a8a;">
              💳 <b>બેંક ખાતાની વિગત (NEFT / RTGS / IMPS / Bank Transfer):</b> ${storeSettings.bankName || 'State Bank of India (SBI)'} | A/c: <b>${storeSettings.accountNumber || '38947291039'}</b> | IFSC: <b>${storeSettings.ifscCode || 'SBIN0000488'}</b> | શાખા: થરાદ (Tharad)
            </div>
          `
              : ''
          }

          ${
            showTerms
              ? `
            <div class="terms-box">
              <b>શરતો & નિયમો:</b> ${storeSettings.billTermsNote || '૧. ખરીદેલ માલ પરત લેવાશે નહિ. ફક્ત એક્સચેન્જ થઈ શકશે. ૨. વિવાદનું સ્થળ: થરાદ કોર્ટ.'}
              ${isCorporateGstMode ? ' • પ્રમાણિત કરવામાં આવે છે કે ઉપરોક્ત વિગતો ખરી અને સાચી છે.' : ''}
            </div>
          `
              : ''
          }
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
        ${storeSettings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!'} • કમ્પ્યુટર જનરેટેડ ટેક્સ ઇન્વોઇસ
      </div>
    </div>

  </div>
</body>
</html>`;
  };

  // Dedicated POS Thermal Receipt (58mm / 80mm continuous roll slip)
  const getThermalInvoiceHtmlString = (widthMm: 58 | 80 = 58, overrideQr?: string) => {
    const activeQr = overrideQr || effectiveQrCode;
    const printableWidth = widthMm === 58 ? 52 : 72;
    return `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="utf-8">
  <title>Thermal Bill - ${order.invoiceNo}</title>
  <style>
    @page {
      size: ${widthMm}mm auto;
      margin: 1mm;
    }
    @media print {
      body { width: ${printableWidth}mm; margin: 0 auto; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Courier New", Courier, monospace, sans-serif;
      width: ${printableWidth}mm;
      margin: 0 auto;
      padding: 2mm 0;
      color: #000000;
      font-size: 11px;
      line-height: 1.25;
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .shop-title { font-size: 14px; font-weight: 900; line-height: 1.15; margin: 0; }
    .shop-sub { font-size: 9.5px; margin: 1px 0; color: #111; }
    .dashed-line { border-top: 1px dashed #000; margin: 4px 0; }
    .solid-line { border-top: 1px solid #000; margin: 4px 0; }
    .double-line { border-top: 2px solid #000; margin: 4px 0; }
    .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin: 1.5px 0; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .items-table th { border-bottom: 1px dashed #000; padding: 2px 0; text-align: left; }
    .items-table td { padding: 2.5px 0; vertical-align: top; }
    .qr-container { text-align: center; margin: 6px 0; }
    .qr-image { width: 125px; height: 125px; display: block; margin: 0 auto 3px auto; }
    .footer-text { font-size: 9.5px; text-align: center; margin-top: 5px; line-height: 1.25; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="shop-title">${storeSettings.storeNameGu}</div>
    <div style="font-size: 11px; font-weight: 800;">${storeSettings.storeNameEn}</div>
    <div class="shop-sub">${storeSettings.address}</div>
    <div class="shop-sub">📞 +91 ${storeSettings.phone}</div>
    ${storeSettings.gstNumber ? `<div class="shop-sub"><b>GSTIN:</b> ${storeSettings.gstNumber}</div>` : ''}
  </div>

  <div class="dashed-line"></div>

  <div class="meta-row"><span>બિલ: <b>#${order.invoiceNo}</b></span><span>${order.date}</span></div>
  <div class="meta-row"><span>ગ્રાહક: <b>${order.customerName}</b></span><span>${order.mobile ? `+91 ${order.mobile}` : ''}</span></div>

  <div class="solid-line"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 52%;">આઇટમ</th>
        <th style="width: 18%; text-align: center;">જથ્થો</th>
        <th style="width: 30%; text-align: right;">રકમ</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(it => `
        <tr>
          <td>${it.name}</td>
          <td style="text-align: center;">${it.qty}</td>
          <td style="text-align: right;">₹${(it.qty * it.price).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="dashed-line"></div>

  <div class="meta-row"><span>સબટોટલ:</span><span>₹${Number(order.subtotal).toFixed(2)}</span></div>
  ${order.discount > 0 ? `<div class="meta-row" style="color: red;"><span>ડિસ્કાઉન્ટ:</span><span>-₹${Number(order.discount).toFixed(2)}</span></div>` : ''}

  <div class="double-line"></div>

  <div class="meta-row" style="font-size: 13px; font-weight: 900;">
    <span>કુલ રકમ (TOTAL):</span>
    <span>₹${Number(order.total).toFixed(2)}</span>
  </div>

  <div class="meta-row" style="margin-top: 2px;">
    <span>ચૂકવણી:</span>
    <span><b>${order.paymentMode}</b> (${order.paymentStatus === 'Paid' ? 'ચૂકવેલ' : 'બાકી'})</span>
  </div>

  <div class="dashed-line"></div>

  ${showQr && activeQr ? `
    <div class="qr-container">
      <div style="font-weight: 800; font-size: 10px; margin-bottom: 2px;">
        📱 બાકી રકમ ચૂકવવા UPI QR કોડ
      </div>
      <img src="${activeQr}" class="qr-image" alt="UPI QR" />
      <div style="font-size: 10.5px; font-weight: 900;">
        સ્કેન કરી ₹${Number(order.total).toFixed(2)} ચૂકવો
      </div>
      <div style="font-size: 9px; color: #333;">(GPay / PhonePe / Paytm / BHIM)</div>
    </div>
    <div class="dashed-line"></div>
  ` : `
    <div style="text-align: center; margin: 4px 0; font-weight: 900; font-size: 10px; color: #047857;">
      ✓ પેમેન્ટ ચૂકતે / ઓનલાઇન જમા (PAID)
    </div>
    <div class="dashed-line"></div>
  `}

  <div class="footer-text">
    <div>${storeSettings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!'}</div>
    <div>માલ પરત લેવાશે નહિ • વિવાદ સ્થળ: થરાદ</div>
  </div>
</body>
</html>`;
  };

  // Thermal Slip Direct Print
  const handleThermalPrint = async (widthMm: 58 | 80 = 58) => {
    let activeQr = effectiveQrCode;
    if (showQr && (!activeQr || !activeQr.startsWith('data:image/'))) {
      try {
        const fresh = await generateUpiQrDataUrl(
          storeSettings.upiId || '8140430395@apl',
          storeSettings.payeeName || storeSettings.storeNameEn || 'PRISHA STATIONERY',
          order.total,
          order.invoiceNo
        );
        if (fresh) activeQr = fresh;
      } catch (e) {
        // fallback
      }
    }

    try {
      const printWin = window.open('', '_blank', 'width=420,height=650');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(getThermalInvoiceHtmlString(widthMm, activeQr));
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.error('Thermal print error:', e);
          }
        }, 300);
        return;
      }
    } catch (e) {
      console.warn('Popup blocked, using iframe');
    }

    try {
      let iframe = document.getElementById('prisha-thermal-print-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'prisha-thermal-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '300px';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(getThermalInvoiceHtmlString(widthMm, activeQr));
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      window.print();
    }
  };

  // Direct Print
  const handleDirectPrint = async () => {
    let activeQr = effectiveQrCode;
    if (showQr && (!activeQr || !activeQr.startsWith('data:image/'))) {
      try {
        const fresh = await generateUpiQrDataUrl(
          storeSettings.upiId || '8140430395@apl',
          storeSettings.payeeName || storeSettings.storeNameEn || 'PRISHA STATIONERY',
          order.total,
          order.invoiceNo
        );
        if (fresh) {
          activeQr = fresh;
          setUpiQrDataUrl(fresh);
        }
      } catch (e) {
        // fallback
      }
    }

    try {
      const printWin = window.open('', '_blank', 'width=850,height=1000');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(getInvoiceHtmlString(activeQr));
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
        doc.write(getInvoiceHtmlString(activeQr));
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

  // Direct A4 PDF Download
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      let activeQr = effectiveQrCode;
      if (showQr) {
        try {
          const freshQr = await generateUpiQrDataUrl(
            storeSettings.upiId || '8140430395@apl',
            storeSettings.payeeName || storeSettings.storeNameEn || 'PRISHA STATIONERY',
            order.total,
            order.invoiceNo
          );
          if (freshQr) {
            activeQr = freshQr;
            setUpiQrDataUrl(freshQr);
          }
        } catch (e) {
          console.warn('QR generation in PDF:', e);
        }
      }

      let canvas: HTMLCanvasElement | null = null;

      if (billContentRef.current && billFormat !== 'thermal') {
        canvas = await html2canvas(billContentRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
      } else {
        const renderDiv = document.createElement('div');
        renderDiv.id = 'prisha-pdf-temp-render';
        renderDiv.style.position = 'fixed';
        renderDiv.style.top = '0';
        renderDiv.style.left = '0';
        renderDiv.style.width = '794px';
        renderDiv.style.backgroundColor = '#ffffff';
        renderDiv.style.zIndex = '-9999';
        renderDiv.style.opacity = '0';
        renderDiv.style.pointerEvents = 'none';
        renderDiv.innerHTML = getInvoiceHtmlString(activeQr);
        document.body.appendChild(renderDiv);

        await new Promise(resolve => setTimeout(resolve, 200));

        const targetEl = (renderDiv.querySelector('.bill-wrapper') as HTMLElement) || renderDiv;
        canvas = await html2canvas(targetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 850
        });

        document.body.removeChild(renderDiv);
      }

      if (!canvas) {
        throw new Error('Canvas generation failed');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 6;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pdfHeight - margin * 2));
      pdf.save(`Prisha_Tax_Invoice_${order.invoiceNo}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      handleDirectPrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Order Receipt Sharing
  const handleWhatsAppShare = () => {
    let itemsText = '';
    order.items.forEach((item, idx) => {
      const hsnStr = item.hsnCode ? ` [HSN:${item.hsnCode}]` : '';
      itemsText += `${idx + 1}. *${item.name}*${hsnStr} x ${item.qty} = ₹${(item.price * item.qty).toFixed(2)}\n`;
    });

    const targetMobile = (order.mobile || '').replace(/\D/g, '').slice(-10) || (storeSettings.phone || '').replace(/\D/g, '').slice(-10);

    const msg =
      `🧾 *TAX INVOICE - ${storeSettings.storeNameEn || storeSettings.storeNameGu || 'PRISHA STATIONERY'}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *ઇન્વોઇસ નં:* ${order.invoiceNo}\n` +
      `📅 *તારીખ:* ${order.date}\n` +
      `👤 *ગ્રાહકનું નામ:* ${order.customerName}\n` +
      (order.mobile ? `📞 *મોબાઇલ:* +91 ${order.mobile}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *આઇટમ્સ વિગત:*\n${itemsText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *સબટોટલ:* ₹${(order.subtotal || order.total).toFixed(2)}\n` +
      ((order.discount || 0) > 0 ? `🏷️ *ડિસ્કાઉન્ટ:* -₹${Number(order.discount).toFixed(2)}\n` : '') +
      `🏛️ *કરપાત્ર રકમ (Taxable Value):* ₹${gstBreakup.totalTaxableValue.toFixed(2)}\n` +
      `🏛️ *CGST:* ₹${gstBreakup.totalCgst.toFixed(2)} | *SGST:* ₹${gstBreakup.totalSgst.toFixed(2)}\n` +
      `💰 *ચોખ્ખી રકમ (Total Payable):* ₹${order.total}/-\n` +
      `💳 *પેમેન્ટ સ્થિતિ:* ${order.paymentMode} (${order.paymentStatus === 'Paid' ? '✅ ચૂકવેલ' : '⏳ બાકી'})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (storeSettings.gstNumber ? `🏛️ GSTIN: ${storeSettings.gstNumber}\n` : '') +
      `📍 *દુકાન:* ${storeSettings.address || 'થરાદ'}\n` +
      `📞 *સંપર્ક:* +91 ${storeSettings.phone}\n\n` +
      `🙏 ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!`;

    window.open(`https://wa.me/91${targetMobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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
                <span>{isSuccessView ? '🎉 ઓર્ડર નોંધાઈ ગયો (ઇન્વોઇસ તૈયાર)' : '🧾 ટેક્સ ઇન્વોઇસ (Tax Invoice)'}</span>
              </h3>
              <p className="text-[11px] text-blue-200 font-bold">
                બિલ નં: <span className="font-mono text-orange-400 font-black">{order.invoiceNo}</span> | {order.date}
              </p>
            </div>
          </div>

          {/* Format Switcher & Action Buttons in Header */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            {/* Format Selector */}
            <div className="flex items-center bg-blue-950/80 p-0.5 rounded-xl border border-blue-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillFormat('a4')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  billFormat === 'a4' ? 'bg-amber-400 text-black font-black shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
                title="સ્ટાન્ડર્ડ A4 કોર્પોરેટ બિલ"
              >
                📄 સ્ટાન્ડર્ડ A4
              </button>
              <button
                type="button"
                onClick={() => setBillFormat('corporate_gst')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  billFormat === 'corporate_gst' ? 'bg-amber-400 text-black font-black shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
                title="સંપૂર્ણ HSN & GST ટેક્સ બ્રેકઅપ સાથે કોર્પોરેટ ઇન્વોઇસ (Tata / Reliance Format)"
              >
                🏢 કોર્પોરેટ GST બિલ
              </button>
              <button
                type="button"
                onClick={() => setBillFormat('gem_portal')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  billFormat === 'gem_portal' ? 'bg-amber-400 text-black font-black shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
                title="GeM પોર્ટલ સરકારી GST ઇન્વોઇસ (Government e-Marketplace Tax Invoice - PDF < 5MB)"
              >
                🏛️ GeM સરકારી બિલ
              </button>
              <button
                type="button"
                onClick={() => setBillFormat('thermal')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  billFormat === 'thermal' ? 'bg-amber-400 text-black font-black shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
                title="૫૮mm નાનું પોસ થર્મલ સ્લિપ"
              >
                🧾 નાનું થર્મલ
              </button>
            </div>

            {billFormat === 'thermal' ? (
              <button
                type="button"
                onClick={() => handleThermalPrint(58)}
                className="bg-amber-400 hover:bg-amber-500 text-black px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
                title="૫૮mm નાનું પોસ થર્મલ બિલ પ્રિન્ટ કરો"
              >
                <Printer className="w-4 h-4" />
                <span>🧾 નાનું પ્રિન્ટર (58mm)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDirectPrint}
                className="bg-orange-500 hover:bg-orange-600 text-black px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
                title="૧ પેજમાં A4 બિલ પ્રિન્ટ કરો"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ A4 પ્રિન્ટ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs disabled:opacity-50"
              title="PDF ડાઉનલોડ કરો"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
              title="WhatsApp પર શેર કરો"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
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

        {/* GeM Government Order Details Quick Editor Toolbar */}
        {billFormat === 'gem_portal' && (
          <div className="no-print bg-amber-50 p-3 border-b-2 border-amber-300 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                <span>🏛️ Government e-Marketplace (GeM) પોર્ટલ બિલ વિગતો:</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                  PDF સાઈઝ &lt; 5 MB • 100% GeM Matched
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGemGuideModal(true)}
                className="bg-amber-800 hover:bg-amber-900 text-white font-black text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <span>📚 GeM સ્ટેશનરી HSN કોડ માર્ગદર્શિકા</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-bold text-neutral-800">
              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                  GeM Contract/Order No. (ફરજિયાત):
                </label>
                <input
                  type="text"
                  value={gemContractNo}
                  onChange={e => setGemContractNo(e.target.value)}
                  placeholder="e.g. GEMC-5116877051234"
                  className="w-full p-1.5 bg-white border border-amber-400 rounded-lg text-xs font-mono font-black text-amber-950 outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                  GeM Order Date:
                </label>
                <input
                  type="text"
                  value={gemContractDate}
                  onChange={e => setGemContractDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full p-1.5 bg-white border border-amber-400 rounded-lg text-xs font-bold text-neutral-900 outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                  સરકારી વિભાગ / કચેરીનું નામ:
                </label>
                <input
                  type="text"
                  value={consigneeDept}
                  onChange={e => setConsigneeDept(e.target.value)}
                  placeholder="દા.ત. મામલતદાર કચેરી, થરાદ"
                  className="w-full p-1.5 bg-white border border-amber-400 rounded-lg text-xs font-bold text-neutral-900 outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-0.5">
                  વિભાગ GSTIN / TAN (Consignee GSTIN):
                </label>
                <input
                  type="text"
                  value={consigneeGstin}
                  onChange={e => setConsigneeGstin(e.target.value)}
                  placeholder="24AHGPD1234F1Z1"
                  className="w-full p-1.5 bg-white border border-amber-400 rounded-lg text-xs font-mono font-bold text-neutral-900 outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONDITIONAL BILL PREVIEW: THERMAL POS SLIP OR A4 CORPORATE TAX INVOICE */}
        {billFormat === 'thermal' ? (
          <div className="p-4 sm:p-6 bg-neutral-100 flex flex-col items-center">
            <div className="max-w-[340px] w-full bg-white border-2 border-dashed border-neutral-400 p-4 shadow-md font-mono text-[11px] text-black space-y-2">
              {/* Header */}
              <div className="text-center space-y-0.5">
                <div className="text-base font-black tracking-tight">{storeSettings.storeNameGu}</div>
                <div className="text-xs font-bold text-neutral-800">{storeSettings.storeNameEn}</div>
                <div className="text-[10px] text-neutral-600">{storeSettings.address}</div>
                <div className="text-[10px] text-neutral-600">📞 +91 {storeSettings.phone}</div>
                {storeSettings.gstNumber && <div className="text-[10px] font-bold">GSTIN: {storeSettings.gstNumber}</div>}
              </div>

              <div className="border-t border-dashed border-neutral-400 my-1"></div>

              <div className="flex justify-between text-[10.5px]">
                <span>બિલ: <b>#{order.invoiceNo}</b></span>
                <span>${order.date}</span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span>ગ્રાહક: <b>{order.customerName}</b></span>
                <span>{order.mobile ? `+91 ${order.mobile}` : ''}</span>
              </div>

              <div className="border-t border-neutral-900 my-1"></div>

              {/* Items Table */}
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-dashed border-neutral-400 text-left">
                    <th className="pb-1">આઇટમ</th>
                    <th className="pb-1 text-center">જથ્થો</th>
                    <th className="pb-1 text-right">રકમ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-neutral-200">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-0.5 pr-1 font-bold">{it.name}</td>
                      <td className="py-0.5 text-center">{it.qty}</td>
                      <td className="py-0.5 text-right font-bold">₹{(it.qty * it.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-neutral-400 my-1"></div>

              <div className="flex justify-between text-[10.5px]">
                <span>સબટોટલ:</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[10.5px] text-red-600">
                  <span>ડિસ્કાઉન્ટ:</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}

              <div className="border-t-2 border-neutral-900 my-1"></div>

              <div className="flex justify-between text-sm font-black">
                <span>કુલ રકમ (TOTAL):</span>
                <span>₹{Number(order.total).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[10px] text-neutral-600">
                <span>ચૂકવણી:</span>
                <span><b>{order.paymentMode}</b> ({order.paymentStatus === 'Paid' ? 'ચૂકવેલ' : 'બાકી'})</span>
              </div>

              <div className="border-t border-dashed border-neutral-400 my-1"></div>

              {/* Dynamic QR */}
              {showQr && effectiveQrCode && (
                <div className="text-center py-1 space-y-1">
                  <div className="text-[10px] font-bold text-neutral-700">📱 UPI QR કોડ (GPay/PhonePe)</div>
                  <img
                    src={effectiveQrCode}
                    alt="Thermal UPI QR"
                    className="w-28 h-28 mx-auto border border-neutral-300 p-0.5 bg-white"
                  />
                  <div className="text-[11px] font-black text-emerald-800">
                    સ્કેન કરી ₹{Number(order.total).toFixed(2)} ચૂકવો
                  </div>
                  <div className="text-[9px] text-neutral-500">UPI ID: {storeSettings.upiId}</div>
                </div>
              )}

              <div className="border-t border-dashed border-neutral-400 my-1"></div>

              <div className="text-center text-[9.5px] text-neutral-600 space-y-0.5 pt-1">
                <div>{storeSettings.invoiceFooterNote || 'ખરીદી બદલ આપનો ખૂબ ખૂબ આભાર!'}</div>
                <div>માલ પરત લેવાશે નહિ • થરાદ</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => handleThermalPrint(58)}
                className="bg-amber-400 hover:bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>પ્રિન્ટ 58mm (નાનું રોલ સ્લિપ)</span>
              </button>
              <button
                type="button"
                onClick={() => handleThermalPrint(80)}
                className="bg-neutral-800 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>પ્રિન્ટ 80mm સ્લિપ</span>
              </button>
            </div>
          </div>
        ) : (
          /* PRINTABLE BILL CANVAS - CORPORATE A4 TAX INVOICE (Tata / Reliance / Adani standard) */
          <div
            ref={billContentRef}
            id="printable-bill-area"
            className="relative overflow-hidden p-4 sm:p-6 bg-white text-black text-[12px] font-sans space-y-2.5 print:p-0 print:space-y-2 print:text-[11px] print:w-full"
          >
          {/* Watermark Overlay for On-Screen & PDF (~30% Opacity) */}
          {showWatermark && (
            <div
              className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center select-none z-0 rotate-[-25deg]"
              style={{ opacity: watermarkOpacity }}
            >
              {(watermarkType === 'logo' || watermarkType === 'both') && (
                <img
                  src={effectiveLeftLogo}
                  alt="Watermark Logo"
                  className="w-24 h-24 object-contain grayscale mb-1.5"
                />
              )}
              {(watermarkType === 'name' || watermarkType === 'both') && (
                <>
                  <div className="text-2xl sm:text-3xl font-black uppercase font-mono tracking-widest text-black text-center max-w-md leading-tight">
                    {watermarkText}
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-neutral-800 text-center mt-0.5">
                    TAX INVOICE • ORIGINAL FOR RECIPIENT
                  </div>
                </>
              )}
            </div>
          )}

          <div className="relative z-10 space-y-2.5">
            {/* A. CORPORATE / GeM TOP STRIP */}
            {isGemPortalMode ? (
              <div className="bg-amber-100 border-b-2 border-black p-1.5 flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-black uppercase tracking-wide">
                <span className="flex items-center gap-1.5 text-amber-950 font-black">
                  <span>🏛️</span>
                  <span>GOVERNMENT e-MARKETPLACE (GeM) - TAX INVOICE / સરકારી ટેક્સ ઇન્વોઇસ</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-neutral-800 font-black flex items-center gap-1">
                  <span>ORIGINAL FOR RECIPIENT</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b-2 border-black pb-1 text-[11px] sm:text-xs font-black uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <span>🇮🇳</span>
                  <span>ટેક્સ ઇન્વોઇસ (TAX INVOICE)</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-neutral-700 font-bold">
                  અસલ ગ્રાહક નકલ (ORIGINAL FOR RECIPIENT)
                </span>
              </div>
            )}

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
                {(showTagline || showOwnerName) && (
                  <div className="text-[11px] font-bold text-black mt-0.5">
                    {showTagline ? storeSettings.tagline : ''}
                    {showTagline && showOwnerName ? ' • ' : ''}
                    {showOwnerName ? `સંચાલક: ${storeSettings.ownerName}` : ''}
                  </div>
                )}
                {showAddress && (
                  <div className="text-[10.5px] text-neutral-800 font-medium max-w-lg mx-auto leading-tight mt-0.5">
                    {storeSettings.address}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10.5px] font-bold text-black pt-0.5">
                  {showHelpline && <span>📞 +91 {storeSettings.phone}</span>}
                  {showHelpline && storeSettings.email && <span>• ✉️ {storeSettings.email}</span>}
                  {showGst && (
                    <span>• <b>GSTIN:</b> {storeSettings.gstNumber}</span>
                  )}
                  {showPan && (
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
            {isGemPortalMode ? (
              <div className="space-y-0">
                <div className="grid grid-cols-2 border border-black text-[11px] sm:text-xs">
                  {/* Left: Seller Details */}
                  <div className="p-2 border-r border-black space-y-0.5 bg-blue-50/20">
                    <div className="text-[10px] font-black uppercase text-blue-900 border-b border-blue-200 pb-0.5 mb-1">
                      1. SELLER / SUPPLIER DETAILS (વિક્રેતાની વિગતો):
                    </div>
                    <div className="text-xs sm:text-sm font-black text-black uppercase">{storeSettings.storeNameEn}</div>
                    <div className="text-xs font-bold text-black">{storeSettings.storeNameGu}</div>
                    <div className="text-black font-medium text-[10.5px]">📍 {storeSettings.address}</div>
                    <div className="font-bold text-black text-[10.5px]">
                      🏛️ GSTIN: {storeSettings.gstNumber || '24AAAAA0000A1Z5'} | PAN: {storeSettings.panNumber || 'N/A'}
                    </div>
                    <div className="text-[10px] text-neutral-700">
                      📞 +91 {storeSettings.phone} {storeSettings.email ? ` | ✉️ ${storeSettings.email}` : ''}
                    </div>
                  </div>

                  {/* Right: Buyer / Consignee Details */}
                  <div className="p-2 space-y-0.5 bg-emerald-50/20">
                    <div className="text-[10px] font-black uppercase text-emerald-900 border-b border-emerald-200 pb-0.5 mb-1">
                      2. BUYER / CONSIGNEE DETAILS (ખરીદનાર સરકારી કચેરી):
                    </div>
                    <div className="text-xs sm:text-sm font-black text-neutral-900">{consigneeDept}</div>
                    <div className="font-bold text-black text-[11px]">👤 અધિકારી/ગ્રાહક: {order.customerName} ({order.mobile})</div>
                    <div className="text-black font-medium text-[10.5px]">📍 સરનામું: {consigneeAddress}</div>
                    <div className="font-bold text-emerald-900 text-[10.5px]">
                      🏛️ Dept GSTIN / TAN: {consigneeGstin || 'URP / Government Dept'}
                    </div>
                    <div className="text-[10px] text-neutral-700">સપ્લાય સ્થળ: 24-ગુજરાત (Place of Supply: 24-Gujarat)</div>
                  </div>
                </div>

                {/* GeM Order Metadata Strip */}
                <div className="grid grid-cols-5 border-x border-b border-black text-[10.5px] font-bold bg-slate-100 p-1.5 gap-1">
                  <div><b>GeM Contract No:</b> <span className="font-mono font-black text-blue-900">{gemContractNo}</span></div>
                  <div><b>Contract Date:</b> {gemContractDate}</div>
                  <div><b>Tax Inv No:</b> <span className="font-mono font-black">{order.invoiceNo}</span></div>
                  <div><b>Inv Date:</b> {order.date}</div>
                  <div><b>Supply State:</b> 24-Gujarat</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 border border-black text-[11px] sm:text-xs">
                {/* Left: Customer */}
                <div className="p-2 border-r border-black space-y-0.5">
                  <div className="text-[10px] font-black uppercase text-neutral-600 underline">
                    ગ્રાહકની વિગત (BILLED TO / CUSTOMER):
                  </div>
                  <div className="text-xs sm:text-sm font-black text-black">{order.customerName}</div>
                  <div className="font-bold text-black">📞 +91 {order.mobile}</div>
                  <div className="text-black font-medium">📍 {order.address || 'કાઉન્ટર ગ્રાહક (Tharad)'}</div>
                  <div className="text-[10px] text-neutral-700">રાજ્ય: ગુજરાત (State: 24-Gujarat)</div>
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
                  <div className="font-bold text-black">ચૂકવણી: {isGemPortalMode ? 'GeM Online Payment / PFMS' : order.paymentMode} ({order.paymentStatus})</div>
                  <div className="text-black text-[10px]">સપ્લાય સ્થળ: 24-ગુજરાત (Place of Supply: 24-Gujarat)</div>
                  <div className="text-[10px] text-neutral-600">રિવર્સ ચાર્જ: ના (No)</div>
                </div>
              </div>
            )}

            {/* D. ITEMS TABLE */}
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse text-[11.5px] border border-black">
                <thead>
                  <tr className="bg-neutral-100 text-black border-b border-black font-black text-[10.5px]">
                    <th className="p-1.5 text-center w-8 border-r border-black">#</th>
                    <th className="p-1.5 border-r border-black">વસ્તુ / સેવાની વિગત (Description of Goods & Services)</th>
                    {showHsnColumn && <th className="p-1.5 text-center w-16 border-r border-black">HSN/SAC</th>}
                    <th className="p-1.5 text-center w-12 border-r border-black">જથ્થો</th>
                    <th className="p-1.5 text-right w-16 border-r border-black">દર (₹)</th>
                    {(isCorporateGstMode || isGemPortalMode) && (
                      <>
                        <th className="p-1.5 text-right w-16 border-r border-black">કરપાત્ર (₹)</th>
                        <th className="p-1.5 text-center w-12 border-r border-black">GST%</th>
                      </>
                    )}
                    <th className="p-1.5 text-right w-20">કુલ (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => {
                    const itemHsn = it.hsnCode || detectHsnAndGst(it.name).hsnCode;
                    const itemGstRate = it.gstRate !== undefined ? it.gstRate : detectHsnAndGst(it.name).gstRate;
                    const itemLineTotal = Number(it.price * it.qty);
                    const unitTaxableRate = (itemGstRate > 0 && (isCorporateGstMode || isGemPortalMode))
                      ? it.price / (1 + itemGstRate / 100)
                      : it.price;
                    const itemTaxable = unitTaxableRate * it.qty;
                    const displayRate = (isCorporateGstMode || isGemPortalMode) ? unitTaxableRate : it.price;

                    return (
                      <tr key={idx} className="border-b border-black">
                        <td className="p-1.5 text-center font-bold text-black border-r border-black">{idx + 1}</td>
                        <td className="p-1.5 font-bold text-black border-r border-black">
                          {it.name} {it.unit ? `(${it.unit})` : ''}
                        </td>
                        {showHsnColumn && (
                          <td className="p-1.5 text-center font-mono text-[10.5px] text-neutral-800 border-r border-black">
                            {itemHsn}
                          </td>
                        )}
                        <td className="p-1.5 text-center font-black text-black border-r border-black">{it.qty}</td>
                        <td className="p-1.5 text-right font-medium text-black border-r border-black">
                          ₹{displayRate.toFixed(2)}
                        </td>
                        {(isCorporateGstMode || isGemPortalMode) && (
                          <>
                            <td className="p-1.5 text-right font-mono text-[10px] text-neutral-800 border-r border-black">
                              ₹{itemTaxable.toFixed(2)}
                            </td>
                            <td className="p-1.5 text-center font-bold text-[10px] border-r border-black">
                              {itemGstRate}%
                            </td>
                          </>
                        )}
                        <td className="p-1.5 text-right font-black text-black">
                          ₹{itemLineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* E.1 Corporate & GeM HSN/SAC GST Tax Summary Schedule */}
            {(isCorporateGstMode || isGemPortalMode) && (
              <div className="p-2 border-x border-b border-black bg-blue-50/30">
                <div className="text-[10px] font-black text-blue-900 mb-1">
                  📊 GST ટેક્સ બ્રેકઅપ સમરી (HSN/SAC Summary - Corporate Tax Schedule):
                </div>
                <table className="w-full border-collapse border border-black text-[10px] text-center bg-white">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black font-black">
                      <th className="p-1 border-r border-black">HSN / SAC</th>
                      <th className="p-1 border-r border-black text-left">વસ્તુ / સેવા વર્ણન</th>
                      <th className="p-1 border-r border-black">કરપાત્ર રકમ (Taxable ₹)</th>
                      <th className="p-1 border-r border-black">CGST %</th>
                      <th className="p-1 border-r border-black">CGST રકમ (₹)</th>
                      <th className="p-1 border-r border-black">SGST %</th>
                      <th className="p-1 border-r border-black">SGST રકમ (₹)</th>
                      <th className="p-1 font-black">કુલ ટેક્સ (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstBreakup.rows.map((r, rIdx) => (
                      <tr key={rIdx} className="font-bold border-b border-neutral-200">
                        <td className="p-1 border-r border-black font-mono">{r.hsnCode}</td>
                        <td className="p-1 border-r border-black text-left text-[9px] truncate max-w-[140px]">{r.description}</td>
                        <td className="p-1 border-r border-black font-mono">₹{r.taxableValue.toFixed(2)}</td>
                        <td className="p-1 border-r border-black">{r.cgstRate}%</td>
                        <td className="p-1 border-r border-black font-mono">₹{r.cgstAmount.toFixed(2)}</td>
                        <td className="p-1 border-r border-black">{r.sgstRate}%</td>
                        <td className="p-1 border-r border-black font-mono">₹{r.sgstAmount.toFixed(2)}</td>
                        <td className="p-1 font-black font-mono text-blue-900">₹{r.totalTax.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-black bg-neutral-100 border-t border-black">
                      <td colSpan={2} className="p-1 border-r border-black text-center">કુલ સરવાળો (Total)</td>
                      <td className="p-1 border-r border-black font-mono">₹{gstBreakup.totalTaxableValue.toFixed(2)}</td>
                      <td className="p-1 border-r border-black">-</td>
                      <td className="p-1 border-r border-black font-mono">₹{gstBreakup.totalCgst.toFixed(2)}</td>
                      <td className="p-1 border-r border-black">-</td>
                      <td className="p-1 border-r border-black font-mono">₹{gstBreakup.totalSgst.toFixed(2)}</td>
                      <td className="p-1 font-black font-mono text-blue-900">₹{gstBreakup.totalTax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* E. TOTALS & WORDS SUMMARY ROW */}
            <div className="grid grid-cols-12 border border-black bg-neutral-50/50 text-[11.5px]">
              {/* Left 7 cols: In Words */}
              <div className="col-span-7 p-2 border-r border-black space-y-1">
                {showWords ? (
                  <>
                    <div className="text-[10px] font-black uppercase text-neutral-600">
                      અક્ષરે રૂપિયા (Amount in Words):
                    </div>
                    <div className="text-xs font-black text-black">{words.gu}</div>
                    <div className="text-[10px] text-neutral-600 italic">{words.en}</div>
                  </>
                ) : (
                  <div className="text-xs font-black text-black">{storeSettings.storeNameGu} • અધિકૃત ટેક્સ ઇન્વોઇસ</div>
                )}
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
                {isCorporateGstMode && (
                  <div className="text-[10.5px] text-neutral-700 font-medium">
                    કુલ કરપાત્ર: ₹{gstBreakup.totalTaxableValue.toFixed(2)} | GST: ₹{gstBreakup.totalTax.toFixed(2)}
                  </div>
                )}
                <div className="text-sm font-black text-black border-t border-black pt-1 mt-1">
                  કુલ રકમ (Total): ₹{Number(order.total).toFixed(2)}
                </div>
                <div className="text-[10px] font-bold text-neutral-700">
                  સ્થિતિ: {isPendingBill ? '⚠️ બાકી (Pending)' : '✅ ચૂકતે (Paid)'} ({order.paymentMode})
                </div>
              </div>
            </div>

            {/* GeM Statutory Declaration & Certification Box */}
            {isGemPortalMode && (
              <div className="p-2 border border-black bg-slate-50 text-[10px] text-neutral-800 space-y-1">
                <div className="font-black text-blue-950 uppercase border-b border-neutral-300 pb-0.5">
                  📜 GeM Portal Certification & Statutory Declaration (GeM પોર્ટલ મંજુરી પ્રમાણપત્ર):
                </div>
                <p className="leading-snug font-medium">
                  "Certified that the particulars given above are true and correct and the amount, item specifications, HSN/SAC codes, and GST tax breakups match 100% with GeM Contract Order Number <b>{gemContractNo}</b> on Government e-Marketplace Portal (gem.gov.in). Uploaded Tax Invoice file format is PDF and under 5 MB size limit as mandated by GeM Portal guidelines."
                </p>
              </div>
            )}

            {/* F. BOTTOM ROW: DETAILS ON LEFT | AUTHORIZED SIGNATORY ON RIGHT */}
            <div className="grid grid-cols-12 border border-black text-[11px]">
              {/* Left 7 cols: Automatic QR Code / Support & Terms */}
              <div className="col-span-7 p-2.5 border-r border-black flex flex-col justify-between">
                {showQr && effectiveQrCode ? (
                  <div className={`flex items-center gap-3 p-1.5 rounded border ${isPendingBill ? 'bg-amber-50/80 border-amber-300' : 'bg-emerald-50/80 border-emerald-300'}`}>
                    {/* Passport-size QR Code (approx 78x78px) */}
                    <img
                      src={effectiveQrCode}
                      alt="Automatic UPI Payment QR Code"
                      className="w-[78px] h-[78px] object-contain border border-black rounded p-0.5 bg-white shrink-0"
                      title="આ QR કોડ GPay/PhonePe થી સ્કેન કરો"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className={`font-black text-xs flex items-center gap-1 ${isPendingBill ? 'text-red-700' : 'text-emerald-800'}`}>
                        <span>{isPendingBill ? '📱 બાકી રકમ ચૂકવવા UPI QR કોડ' : '✅ પેમેન્ટ વેરિફિકેશન & દુકાન UPI QR'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700">
                        {isPendingBill ? 'GPay / PhonePe / Paytm થી સ્કેન કરો' : 'GPay / PhonePe / BHIM સ્કેનર માન્ય'}
                      </div>
                      {showUpi && (
                        <div className="text-[10px] text-neutral-800">
                          UPI ID: <span className="font-mono font-bold text-black">{storeSettings.upiId || '8140430395@apl'}</span>
                        </div>
                      )}
                      <div className="text-[9.5px] text-neutral-700 truncate">
                        {isPendingBill ? (
                          <>બાકી રકમ: <b>₹${Number(order.total).toFixed(2)}</b> (Bill: #{order.invoiceNo})</>
                        ) : (
                          <>ચૂકવણી: <b>{order.paymentMode}</b> • સ્ટેટસ: <b className="text-emerald-700">ચૂકતે (PAID)</b></>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-300 rounded p-1.5 text-neutral-800 space-y-0.5">
                    <div className="font-black text-xs text-emerald-800 flex items-center gap-1">
                      <span>✅ પેમેન્ટ ચૂકતે / ઓનલાઇન જમા (PAID IN FULL)</span>
                    </div>
                    <div className="text-[10.5px] font-bold text-neutral-700">
                      પદ્ધતિ: <span className="text-black">{order.paymentMode}</span> • કોઈ રકમ બાકી નથી
                    </div>
                    {showHelpline && (
                      <div className="text-[9px] text-neutral-600">
                        📞 સંપર્ક / સહાય: +91 {storeSettings.phone}
                      </div>
                    )}
                  </div>
                )}

                {showBankDetails && (
                  <div className="text-[9.5px] text-blue-900 bg-blue-50/70 border border-blue-200 rounded p-1 mt-1 leading-tight">
                    💳 <b>બેંક ખાતાની વિગત (NEFT / RTGS / IMPS / Bank Transfer):</b> {storeSettings.bankName || 'SBI'} | A/c: <b>{storeSettings.accountNumber || '38947291039'}</b> | IFSC: <b>{storeSettings.ifscCode || 'SBIN0000488'}</b> | શાખા: થરાદ (Tharad)
                  </div>
                )}

                {showTerms && (
                  <div className="text-[9px] text-neutral-700 pt-1.5 mt-1 border-t border-dashed border-neutral-300 leading-tight">
                    <b>શરતો:</b> {storeSettings.billTermsNote || 'ખરીદેલ માલ પરત લેવાશે નહિ. ફક્ત એક્સચેન્જ થઈ શકશે. વિવાદનું સ્થળ: થરાદ કોર્ટ.'}
                    {isCorporateGstMode && ' • પ્રમાણિત કરવામાં આવે છે કે ઉપરોક્ત વિગતો ખરી અને સાચી છે.'}
                  </div>
                )}
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
        </div>
        )}

        {/* BOTTOM ACTION BAR (NO-PRINT) */}
        <div className="no-print bg-neutral-100 p-3 sm:p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black px-8 py-2.5 rounded-xl text-sm font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
          >
            <span>પૂર્ણ (Close)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* GeM STATIONERY HSN & GST DIRECTORY GUIDE MODAL */}
        {showGemGuideModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 no-print">
            <div className="bg-white rounded-2xl max-w-xl w-full p-4 border-2 border-amber-500 shadow-2xl space-y-3 relative text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                  <span>📚 GeM સ્ટેશનરી આઇટમ્સ HSN કોડ & GST દર માર્ગદર્શિકા</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGemGuideModal(false)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <p className="text-[11px] text-neutral-600 font-bold">
                  GeM પોર્ટલ પર સ્ટેશનરી સામાનનું ઇન્વોઇસ અપલોડ કરતી વખતે દરેક આઇટમનો સાચો HSN કોડ હોવો ફરજિયાત છે:
                </p>

                <div className="overflow-x-auto rounded-xl border border-neutral-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-100 text-amber-950 font-black border-b border-amber-300">
                        <th className="p-2 border-r border-amber-300">HSN કોડ</th>
                        <th className="p-2 border-r border-amber-300">સ્ટેશનરી આઇટમ વર્ગીકરણ</th>
                        <th className="p-2 text-center">GST દર</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">4802</td>
                        <td className="p-2 border-r">A4 પ્રિન્ટિંગ પેપર રીમ, લીગલ પેપર, એક્ઝિક્યુટિવ બોન્ડ પેપર (Paper Reams)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">12% / 18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">4820</td>
                        <td className="p-2 border-r">નોટબુક, રજિસ્ટર, એકાઉન્ટ બુક્સ, ફાઇલ ફોલ્ડર્સ, ડાયરી (Registers & Notebooks)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">12%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">9608</td>
                        <td className="p-2 border-r">બોલપેન, જેલ પેન, માર્કર પેન, હાઇલાઇટર, ફાઉન્ટન પેન, રિફિલ (Pens & Refills)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">9609</td>
                        <td className="p-2 border-r">પેન્સિલ, સ્કેચ પેન, કલર પેન્સિલ, ડ્રોઇંગ ચાર્કોલ (Pencils & Crayons)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">12% / 18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">3926</td>
                        <td className="p-2 border-r">પ્લાસ્ટિક ફાઇલો, કોબ્રા ક્લિપ, L-ફોલ્ડર, બોક્સ ફાઇલ (Plastic Files & Folders)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">8214</td>
                        <td className="p-2 border-r">ઓફિસ કાતર, પેપર કટર, પેન્સિલ સંચો (Scissors, Cutters & Sharpeners)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">8472</td>
                        <td className="p-2 border-r">સ્ટેપલર મશીન, પંચિંગ મશીન, પેપર કટીંગ મશીન (Staplers & Punching Machines)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">18%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">4016</td>
                        <td className="p-2 border-r">રબર / ઇરેઝર, રબર બેન્ડ (Erasers & Rubber Bands)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">12%</td>
                      </tr>
                      <tr className="hover:bg-amber-50/50">
                        <td className="p-2 font-mono font-black text-amber-900 border-r">3506</td>
                        <td className="p-2 border-r">ફેવિકોલ, સેલોટેપ, ગમ સ્ટીક, ગ્લુ (Adhesives & Tapes)</td>
                        <td className="p-2 text-center font-bold text-emerald-800">18%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowGemGuideModal(false)}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-black px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  સમજાઈ ગયું (Close)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
