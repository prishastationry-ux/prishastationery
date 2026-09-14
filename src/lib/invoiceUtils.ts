import QRCode from 'qrcode';

/**
 * Generate a dynamic UPI payment QR code as a PNG Data URL
 * When scanned by PhonePe, Google Pay, Paytm, BHIM, etc., it automatically
 * pre-fills the Payee Name, UPI ID, Bill Invoice Number, and exact Amount.
 */
export async function generateUpiQrDataUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  invoiceNo: string
): Promise<string> {
  const cleanUpi = (upiId || '8140430395@apl').trim();
  const cleanPayee = (payeeName || 'PRISHA STATIONERY').trim();
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanNote = `Bill ${invoiceNo || 'INV'}`.slice(0, 30);

  // Standard NPCI UPI URI string
  const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanPayee)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  try {
    const dataUrl = await QRCode.toDataURL(upiUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (err) {
    console.warn('Local QRCode generator fallback:', err);
    // Fallback URL if local engine fails
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;
  }
}

/**
 * Official default Left Logo for Prisha Stationery (Vector SVG Data URI)
 * Used when no custom logo is uploaded, so the bill ALWAYS has an official,
 * government-grade emblem on the left.
 */
export function getDefaultLeftLogoSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="56" fill="#0B1E48" stroke="#F59E0B" stroke-width="4"/>
    <circle cx="60" cy="60" r="50" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2"/>
    <!-- Book -->
    <path d="M60 46 C45 38 28 42 26 43 L26 78 C28 77 45 73 60 80 C75 73 92 77 94 78 L94 43 C92 42 75 38 60 46 Z" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2"/>
    <line x1="60" y1="46" x2="60" y2="80" stroke="#0B1E48" stroke-width="2"/>
    <!-- Pen Nib -->
    <path d="M60 22 L66 34 L60 38 L54 34 Z" fill="#F59E0B"/>
    <circle cx="60" cy="30" r="1.5" fill="#0B1E48"/>
    <!-- Star & Text -->
    <text x="60" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="8.5" fill="#F59E0B" letter-spacing="0.5">PRISHA</text>
    <text x="60" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="6.5" fill="#FFFFFF" letter-spacing="0.3">STATIONERY</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Official default Right Logo: CSC Digital Seva & Gujarat Government Emblem Style
 */
export function getDefaultRightLogoSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="56" fill="#FFFFFF" stroke="#0B1E48" stroke-width="4"/>
    <circle cx="60" cy="60" r="50" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5"/>
    <!-- CSC Hexagon / Digital Emblem -->
    <polygon points="60,25 90,42 90,78 60,95 30,78 30,42" fill="#0B1E48" stroke="#F59E0B" stroke-width="2"/>
    <!-- Inner emblem -->
    <circle cx="60" cy="60" r="20" fill="#FFFFFF"/>
    <path d="M50 60 L57 67 L72 52" fill="none" stroke="#16A34A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="60" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF">CSC</text>
    <text x="60" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="6.5" fill="#FFFFFF">DIGITAL SEVA</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Convert number to Indian Rupees in Words (English & Gujarati)
 */
export function numberToWordsINR(amount: number): { en: string; gu: string } {
  const total = Math.round(Number(amount) || 0);
  if (total === 0) {
    return { en: 'Zero Rupees Only', gu: 'શૂન્ય રૂપિયા પૂરા' };
  }

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let res = '';
    if (h) res += ones[h] + ' Hundred';
    if (r) res += (res ? ' ' : '') + convertTwoDigits(r);
    return res;
  }

  let num = total;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crore) words += convertTwoDigits(crore) + ' Crore ';
  if (lakh) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand) words += convertTwoDigits(thousand) + ' Thousand ';
  if (remainder) words += convertThreeDigits(remainder);

  const enResult = `${words.trim()} Rupees Only`;
  return {
    en: enResult,
    gu: `રૂપિયા ${total}/- પૂરા (${enResult})`
  };
}

/**
 * Resize and compress user-uploaded image (Logo / Signature / QR)
 * Keeps files under ~30KB to ensure fast sync and avoid Firestore document size bloat
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG for signature/logos with transparency, or JPEG
        const isPng = file.type === 'image/png';
        const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}
