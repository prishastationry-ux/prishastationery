/**
 * GST HSN/SAC Master Directory & Calculation Engine for Stationery, Xerox & Printing Services
 * Compliant with GST Act (Rule 46 - Tax Invoice) & Standard Corporate Invoicing (Tata, Birla, Reliance, Adani formats)
 */

export interface HsnMasterEntry {
  code: string;
  type: 'HSN' | 'SAC';
  nameGu: string;
  nameEn: string;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  category: string;
  keywords: string[];
}

export const HSN_SAC_DIRECTORY: HsnMasterEntry[] = [
  {
    code: '4802',
    type: 'HSN',
    nameGu: 'A4 ઝેરોક્ષ પેપર, નોટ પેપર, ડ્રોઈંગ પેપર',
    nameEn: 'Uncoated Writing & Printing Paper, A4 Copier Paper',
    gstRate: 18,
    category: 'paper',
    keywords: ['paper', 'પેપર', 'a4', 'copier', 'ઝેરોક્ષ પેપર', 'sheet', 'demy', 'બંડલ', 'પાના', 'drawing paper']
  },
  {
    code: '4820',
    type: 'HSN',
    nameGu: 'ચોપડા, નોટબુક, રજીસ્ટર, રોજમેળ, ખાતાવહી, રિસીપ્ટ બુક, ફાઇલ ફોલ્ડર',
    nameEn: 'Registers, Account Books, Notebooks, Order Books, Receipt Books, File Folders',
    gstRate: 12,
    category: 'books',
    keywords: ['ચોપડા', 'નોટબુક', 'notebook', 'register', 'રજીસ્ટર', 'રોજમેળ', 'ખાતાવહી', 'ખાતા', 'ડાયરી', 'diary', 'book', 'bill book', 'રિસીપ્ટ', 'voucher', 'વાઉચર', 'ફાઇલ', 'folder']
  },
  {
    code: '9608',
    type: 'HSN',
    nameGu: 'બોલપેન, જેલપેન, ફાઉન્ટેન પેન, રિફિલ, માર્કર પેન',
    nameEn: 'Ballpoint Pens, Felt Tipped Pens, Gel Pens, Markers, Refills',
    gstRate: 18,
    category: 'stationery',
    keywords: ['pen', 'પેન', 'ballpen', 'gel', 'refill', 'રિફિલ', 'marker', 'માર્કર', 'highlighter', 'હાઇલાઇટર', 'butterflow', 'cello', 'reynolds', 'pentonic', 'trimax', 'writometer']
  },
  {
    code: '9609',
    type: 'HSN',
    nameGu: 'પેન્સિલ, ઈરેઝર (રબર), સંચો (શાર્પનર), ક્રેયોન કલર',
    nameEn: 'Pencils, Crayons, Drawing Charcoals, Erasers, Pencil Sharpeners',
    gstRate: 12,
    category: 'stationery',
    keywords: ['pencil', 'પેન્સિલ', 'eraser', 'રબર', 'sharpener', 'સંચો', 'apsara', 'natraj', 'crayon', 'કલર', 'doms', 'lead', 'charcoal']
  },
  {
    code: '9983',
    type: 'SAC',
    nameGu: 'ઓનલાઇન ઝેરોક્ષ, પ્રિન્ટિંગ સેવા, સ્કેનિંગ, લેમિનેશન',
    nameEn: 'Photocopying / Xerox Services, Document Printing, Scanning, Lamination',
    gstRate: 18,
    category: 'printing',
    keywords: ['xerox', 'ઝેરોક્ષ', 'પ્રિન્ટ', 'print', 'લેમિનેશન', 'lamination', 'scanning', 'સ્કેન', 'ફોટોકોપી', 'photocopy', 'કોલ લેટર', 'call letter', 'ટિકિટ', 'ticket']
  },
  {
    code: '3926',
    type: 'HSN',
    nameGu: 'PVC સ્માર્ટ કાર્ડ પ્રિન્ટિંગ (આધાર, પાન, આયુષ્માન, ડ્રાઇવિંગ લાયસન્સ)',
    nameEn: 'PVC Plastic Cards, Smart Card Printing, Plastic Identity Cards',
    gstRate: 18,
    category: 'printing',
    keywords: ['pvc', 'card', 'કાર્ડ', 'aadhaar', 'આધાર', 'pan', 'પાન', 'ayushman', 'આયુષ્માન', 'voter', 'ચૂંટણી', 'license', 'લાયસન્સ', 'smart card']
  },
  {
    code: '9989',
    type: 'SAC',
    nameGu: 'કોમર્શિયલ પ્રિન્ટિંગ સેવા, બુક બાઈન્ડિંગ, લેટરહેડ',
    nameEn: 'Commercial Printing Services, Book Binding Services',
    gstRate: 18,
    category: 'printing',
    keywords: ['binding', 'બાઈન્ડિંગ', 'spiral', 'સ્પાયરલ', 'letterhead', 'લેટરહેડ', 'visiting card', 'વિઝિટિંગ કાર્ડ', 'pamphlet', 'પેમ્પલેટ']
  },
  {
    code: '3506',
    type: 'HSN',
    nameGu: 'ફેવિકોલ, ગુંદર, ગુંદર પટ્ટી, સેલોટેપ, એડહેસિવ',
    nameEn: 'Glues, Adhesives, Fevicol, Gum Tapes, Sticky Notes',
    gstRate: 18,
    category: 'stationery',
    keywords: ['fevicol', 'ફેવિકોલ', 'glue', 'ગુંદર', 'tape', 'સેલોટેપ', 'ગુંદર પટ્ટી', 'adhesive', 'gum', 'fevikwik', 'sticky note']
  },
  {
    code: '8214',
    type: 'HSN',
    nameGu: 'પેપર કટર, કાતર, સ્ટેશનરી બ્લેડ',
    nameEn: 'Paper Cutters, Scissors, Stationery Blades',
    gstRate: 18,
    category: 'stationery',
    keywords: ['cutter', 'કટર', 'scissor', 'કાતર', 'blade', 'બ્લેડ']
  },
  {
    code: '8305',
    type: 'HSN',
    nameGu: 'સ્ટેપલર, સ્ટેપલર પિન, પેપર ક્લિપ, પંચિંગ મશીન',
    nameEn: 'Staplers, Staple Pins, Paper Clips, Punching Machines, Binder Clips',
    gstRate: 18,
    category: 'office',
    keywords: ['stapler', 'સ્ટેપલર', 'pin', 'પિન', 'clip', 'ક્લિપ', 'punching', 'પંચિંગ', 'binder clip', 'kangaro']
  },
  {
    code: '4901',
    type: 'HSN',
    nameGu: 'પુસ્તકો, પાઠ્યપુસ્તકો, ધાર્મિક પુસ્તકો, શૈક્ષણિક સાહિત્ય',
    nameEn: 'Printed Books, School Textbooks, Educational Literature (Exempt / Nil-Rated)',
    gstRate: 0,
    category: 'books',
    keywords: ['book', 'પુસ્તક', 'ચોપડી', 'પાઠ્યપુસ્તક', 'textbook', 'નવનીત', 'navneet', 'ગાલા', 'gala', 'અપેક્ષિત', 'સાહિત્ય']
  },
  {
    code: '4909',
    type: 'HSN',
    nameGu: 'પ્રિન્ટેડ ગ્રીટિંગ કાર્ડ્સ, આમંત્રણ પત્રિકા, કંકોત્રી',
    nameEn: 'Printed Cards, Invitation Cards, Greeting Cards',
    gstRate: 12,
    category: 'printing',
    keywords: ['invitation', 'કંકોત્રી', 'greeting', 'કાર્ડ', 'આમંત્રણ']
  },
  {
    code: '4911',
    type: 'HSN',
    nameGu: 'પ્રિન્ટેડ પોસ્ટર, સર્ટિફિકેટ, ફોર્મ્સ, બ્રોશર',
    nameEn: 'Printed Forms, Posters, Certificates, Commercial Trade Advertising',
    gstRate: 18,
    category: 'printing',
    keywords: ['poster', 'પોસ્ટર', 'certificate', 'સર્ટિફિકેટ', 'form', 'ફોર્મ', 'brochure']
  },
  {
    code: '4202',
    type: 'HSN',
    nameGu: 'સ્કૂલ બેગ, દફતર, પાઉચ, કોલેજ બેગ',
    nameEn: 'School Bags, Backpacks, Pencil Pouches, College Bags',
    gstRate: 18,
    category: 'bags',
    keywords: ['bag', 'બેગ', 'દફતર', 'pouch', 'પાઉચ', 'backpack', 'સ્કૂલ બેગ']
  },
  {
    code: '3923',
    type: 'HSN',
    nameGu: 'પ્લાસ્ટિક ફાઇલ, ફોલ્ડર, ડોક્યુમેન્ટ બેગ, ઝિપ બેગ',
    nameEn: 'Plastic Files, Clear Folders, Document Zip Bags',
    gstRate: 18,
    category: 'office',
    keywords: ['plastic file', 'ડોક્યુમેન્ટ ફાઇલ', 'cobra file', 'box file', 'બોક્સ ફાઇલ', 'ઝિપ બેગ', 'folder file']
  },
  {
    code: '4817',
    type: 'HSN',
    nameGu: 'કવર, પરબિડીયા, પોસ્ટકાર્ડ',
    nameEn: 'Envelopes, Letter Cards, Postcards',
    gstRate: 18,
    category: 'office',
    keywords: ['envelope', 'કવર', 'પરબિડીયું', 'cover', 'letter cover']
  },
  {
    code: '9017',
    type: 'HSN',
    nameGu: 'કંપાસ બોક્સ, ફૂટપટ્ટી (સ્કેલ), પરિકર, મેથેમેટિકલ સાધનો',
    nameEn: 'Geometry Boxes, Drawing Scales, Mathematical Drawing Instruments',
    gstRate: 18,
    category: 'stationery',
    keywords: ['geometry', 'કંપાસ', 'scale', 'સ્કેલ', 'ફૂટપટ્ટી', 'compass', 'protactor', 'સેટ સ્ક્વેર']
  },
  {
    code: '8443',
    type: 'HSN',
    nameGu: 'પ્રિન્ટર કાર્ટ્રેજ, ઇંક બોટલ, ટોનર પાઉડર',
    nameEn: 'Printer Ink Cartridges, Ink Bottles, Toner Cartridges',
    gstRate: 18,
    category: 'office',
    keywords: ['cartridge', 'કાર્ટ્રેજ', 'ink', 'ઇંક', 'toner', 'ટોનર', 'canon', 'epson', 'hp']
  },
  {
    code: '8523',
    type: 'HSN',
    nameGu: 'પેનડ્રાઇવ, મેમરી કાર્ડ, એક્સટર્નલ સ્ટોરેજ',
    nameEn: 'Pen Drives, Flash Drives, Memory Cards, Optical Media',
    gstRate: 18,
    category: 'office',
    keywords: ['pendrive', 'પેનડ્રાઇવ', 'memory card', 'sd card', 'usb', 'sandisk']
  },
  {
    code: '8470',
    type: 'HSN',
    nameGu: 'કેલ્ક્યુલેટર (ગણતરી યંત્ર)',
    nameEn: 'Electronic Calculators',
    gstRate: 18,
    category: 'office',
    keywords: ['calculator', 'કેલ્ક્યુલેટર', 'casio', 'citizen', 'orpat']
  }
];

/**
 * Smart automatic HSN & GST rate detector based on item name and category
 */
export function detectHsnAndGst(
  name: string,
  category?: string
): { hsnCode: string; gstRate: number; type: 'HSN' | 'SAC'; nameGu: string; nameEn: string } {
  const lowerName = (name || '').toLowerCase().trim();
  const lowerCat = (category || '').toLowerCase().trim();

  // 1. Check direct keyword match in directory
  for (const entry of HSN_SAC_DIRECTORY) {
    for (const kw of entry.keywords) {
      if (lowerName.includes(kw.toLowerCase())) {
        return {
          hsnCode: entry.code,
          gstRate: entry.gstRate,
          type: entry.type,
          nameGu: entry.nameGu,
          nameEn: entry.nameEn
        };
      }
    }
  }

  // 2. Category-based fallback
  if (lowerCat === 'printing' || lowerCat === 'service' || lowerCat.includes('પ્રિન્ટ')) {
    if (lowerName.includes('pvc') || lowerName.includes('કાર્ડ')) {
      return { hsnCode: '3926', gstRate: 18, type: 'HSN', nameGu: 'PVC કાર્ડ', nameEn: 'PVC Cards' };
    }
    return { hsnCode: '9983', gstRate: 18, type: 'SAC', nameGu: 'ઝેરોક્ષ / પ્રિન્ટિંગ સેવા', nameEn: 'Photocopy / Xerox Services' };
  }

  if (lowerCat === 'books' || lowerCat.includes('ચોપડા') || lowerCat.includes('પુસ્તક')) {
    if (lowerName.includes('પુસ્તક') || lowerName.includes('textbook') || lowerName.includes('નવનીત')) {
      return { hsnCode: '4901', gstRate: 0, type: 'HSN', nameGu: 'પુસ્તકો (કરમુક્ત)', nameEn: 'Printed Books (Exempt)' };
    }
    return { hsnCode: '4820', gstRate: 12, type: 'HSN', nameGu: 'ચોપડા / નોટબુક / રજીસ્ટર', nameEn: 'Registers & Notebooks' };
  }

  if (lowerCat === 'bags' || lowerCat.includes('બેગ') || lowerCat.includes('દફતર')) {
    return { hsnCode: '4202', gstRate: 18, type: 'HSN', nameGu: 'સ્કૂલ બેગ / પાઉચ', nameEn: 'School Bags & Pouches' };
  }

  if (lowerCat === 'office' || lowerCat.includes('ઓફિસ')) {
    return { hsnCode: '8305', gstRate: 18, type: 'HSN', nameGu: 'ઓફિસ સ્ટેશનરી', nameEn: 'Office Stationery' };
  }

  // 3. Default fallback for standard stationery goods
  return {
    hsnCode: '9608',
    gstRate: 18,
    type: 'HSN',
    nameGu: 'સ્ટેશનરી & પેન સામાન',
    nameEn: 'General Stationery & Writing Instruments'
  };
}

export interface HsnTaxSummaryRow {
  hsnCode: string;
  type: 'HSN' | 'SAC';
  description: string;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface GstBreakupResult {
  rows: HsnTaxSummaryRow[];
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  isInterState: boolean;
}

/**
 * Calculates accurate item-level and HSN/SAC-level GST Tax breakdown
 * Uses standard GST formulas:
 *   When retail prices are GST inclusive:
 *     Taxable Value = Total Item Amount / (1 + GST_Rate / 100)
 *     Total Tax = Total Item Amount - Taxable Value
 *     CGST = Total Tax / 2 (when intra-state Gujarat)
 *     SGST = Total Tax / 2 (when intra-state Gujarat)
 *     IGST = Total Tax (when inter-state)
 */
export function calculateGstBreakup(
  items: Array<{
    name: string;
    qty: number;
    price: number;
    hsnCode?: string;
    gstRate?: number;
    category?: string;
  }>,
  overallDiscount: number = 0,
  isInterState: boolean = false
): GstBreakupResult {
  const hsnMap = new Map<string, HsnTaxSummaryRow>();

  const rawSubtotal = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
  const discountFactor = rawSubtotal > 0 && overallDiscount > 0 ? (rawSubtotal - overallDiscount) / rawSubtotal : 1;

  for (const item of items) {
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    const rawItemTotal = qty * price;
    const itemTotal = rawItemTotal * discountFactor;

    let hsn = (item.hsnCode || '').trim();
    let rate = item.gstRate;

    if (!hsn || rate === undefined || isNaN(rate)) {
      const detected = detectHsnAndGst(item.name, item.category);
      hsn = hsn || detected.hsnCode;
      rate = rate !== undefined ? rate : detected.gstRate;
    }

    const matchedEntry = HSN_SAC_DIRECTORY.find(e => e.code === hsn);
    const desc = matchedEntry ? matchedEntry.nameGu : (hsn.startsWith('99') ? 'સેવાઓ' : 'માલ સામાન');
    const type = matchedEntry ? matchedEntry.type : (hsn.startsWith('99') ? 'SAC' : 'HSN');

    // Calculate Taxable value (assuming prices are GST-inclusive retail standard)
    const gstMultiplier = 1 + (rate / 100);
    const taxableValue = rate > 0 ? itemTotal / gstMultiplier : itemTotal;
    const taxAmount = itemTotal - taxableValue;

    const cgstRate = isInterState ? 0 : rate / 2;
    const sgstRate = isInterState ? 0 : rate / 2;
    const igstRate = isInterState ? rate : 0;

    const cgstAmount = isInterState ? 0 : taxAmount / 2;
    const sgstAmount = isInterState ? 0 : taxAmount / 2;
    const igstAmount = isInterState ? taxAmount : 0;

    const key = `${hsn}-${rate}`;

    if (!hsnMap.has(key)) {
      hsnMap.set(key, {
        hsnCode: hsn,
        type: type,
        description: desc,
        taxableValue: taxableValue,
        gstRate: rate,
        cgstRate: cgstRate,
        cgstAmount: cgstAmount,
        sgstRate: sgstRate,
        sgstAmount: sgstAmount,
        igstRate: igstRate,
        igstAmount: igstAmount,
        totalTax: taxAmount,
        totalAmount: itemTotal
      });
    } else {
      const existing = hsnMap.get(key)!;
      existing.taxableValue += taxableValue;
      existing.cgstAmount += cgstAmount;
      existing.sgstAmount += sgstAmount;
      existing.igstAmount += igstAmount;
      existing.totalTax += taxAmount;
      existing.totalAmount += itemTotal;
    }
  }

  const rows = Array.from(hsnMap.values());

  const totalTaxableValue = rows.reduce((s, r) => s + r.taxableValue, 0);
  const totalCgst = rows.reduce((s, r) => s + r.cgstAmount, 0);
  const totalSgst = rows.reduce((s, r) => s + r.sgstAmount, 0);
  const totalIgst = rows.reduce((s, r) => s + r.igstAmount, 0);
  const totalTax = rows.reduce((s, r) => s + r.totalTax, 0);
  const grandTotal = totalTaxableValue + totalTax;

  return {
    rows,
    totalTaxableValue,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    grandTotal,
    isInterState
  };
}
