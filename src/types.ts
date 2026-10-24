export interface ProductItem {
  id: string;
  nameGu: string;
  nameEn: string;
  category: 'books' | 'stationery' | 'service' | 'printing' | 'office' | 'bags' | 'other' | (string & {});
  price: number;
  costPrice: number;
  stock: number | string; // 'સેવા' or number
  isService?: boolean;
  unit: string;
  icon?: string;
  imageUrl?: string; // Main display photo
  galleryImages?: string[]; // Multiple photos (ક્લિક કરવાથી બધા ફોટા દેખાય)
  attachedFiles?: Array<{
    fileName: string;
    fileDataUrl: string;
    fileSize?: number;
    id?: string;
    pages?: number;
  }>;
  badge?: string;
  isSpecial?: boolean;
  description?: string;
  isCustomUpload?: boolean;
  
  // New properties based on feedback
  isHidden?: boolean; // છુપાવો (ગ્રાહકને ન દેખાય)
  mrp?: number; // છાપેલી કિંમત (Cross-out)
  bulkPricing?: string; // હોલસેલ ભાવ (e.g. "5 નંગ: ₹200")
  orderIdx?: number; // For admin reordering
  barcode?: string; // Barcode number for scanner guns / camera scanning
  hsnCode?: string;
  gstRate?: number; // e.g. 0, 5, 12, 18, 28
  minStockAlert?: number;
  discountPercent?: number; // ડિસ્કાઉન્ટ % (MRP પર)
  createdAt?: number;
  updatedAt?: number;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface BillItem {
  id?: string;
  name: string;
  qty: number;
  price: number;
  total?: number;
  unit?: string;
  productId?: string;
  hsnCode?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  fileDataUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface OrderRecord {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  mobile: string;
  address: string;
  gstin?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: 'UPI' | 'Cash' | 'Online' | 'બાકી (Credit)';
  paymentStatus: 'Paid' | 'Pending' | 'બાકી' | 'Verified';
  paymentScreenshot?: string;
  attachedFiles?: Array<{
    fileName: string;
    fileDataUrl: string;
    fileSize?: number;
    itemName?: string;
    id?: string;
    pages?: number;
  }>;
  orderType?: 'online' | 'counter';
  orderStatus?: 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  statusUpdatedAt?: string;
  notes?: string;
  profit?: number;
  timestamp?: number;
  paymentDetails?: {
    transactionId?: string;
    referenceNo?: string;
    notes?: string;
  };
  gemContractNo?: string;
  gemContractDate?: string;
  consigneeDept?: string;
  consigneeGstin?: string;
  // Delivery & Platform Charges Breakdown
  deliveryCharge?: number;
  deliveryType?: 'cover' | 'parcel';
  packageWeightKg?: number;
  platformFee?: number;
  packingCharge?: number;
  otherFee?: number;
  otherFeeLabel?: string;
  // Structured Address Fields
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  pincode?: string;
}

export interface StoryWidget {
  id: string;
  mediaUrl: string; // Image or video URL
  type: 'image' | 'video';
  title?: string;
  createdAt: number;
}

export interface StoreStory {
  id: string;
  title: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption?: string;
  date?: string;
  active: boolean;
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkUrl?: string;
}

export interface StoreSettings {
  storeNameEn: string;
  storeNameGu: string;
  tagline: string;
  subTagline: string;
  ownerName: string;
  phone: string;
  phoneDisplay: string;
  upiId: string;
  payeeName: string;
  gstNumber: string;
  address: string;
  marqueeText: string;
  leftLogoUrl: string;
  rightLogoUrl: string;
  bannerImageUrl: string;
  bannerTitle: string;
  bannerSubtitle: string;
  dhamakaOfferTitle?: string;
  dhamakaOfferText?: string;
  dhamakaOfferEnabled?: boolean;
  customQrUrl: string;
  invoiceFooterNote: string;
  adminPassword: string;
  developerCredit: string;
  cloudSyncEnabled?: boolean; // ઑફલાઇન મોડ / ક્લાઉડ સિન્ક સ્વિચ
  // Bill / Invoice Customization & Security Fields
  whatsappNumber?: string;
  email?: string;
  billFraudWarning?: string;
  billSpecialOffer?: string;
  billShowPan?: boolean; // Toggle PAN number on bill
  billShowGst?: boolean; // Toggle GST number on bill
  billShowQr?: boolean; // Toggle UPI QR Code on bill
  billShowUpi?: boolean; // Toggle UPI ID text on bill
  billShowAddress?: boolean; // Toggle Store Address on bill
  billShowHelpline?: boolean; // Toggle Helpline & Email on bill
  billShowLogos?: boolean; // Toggle Logos on bill
  billShowTerms?: boolean; // Toggle Terms and conditions on bill
  billShowTagline?: boolean; // Toggle Tagline/Sub-services on bill
  billShowOwnerName?: boolean; // Toggle Owner name on bill
  billShowHsnColumn?: boolean; // Toggle HSN/SAC column in items table
  billShowWords?: boolean; // Toggle Amount in Words on bill
  billShowBankDetails?: boolean; // Toggle Bank Account info on bill
  // Watermark Security (પાછળ વોટરમાર્ક સિક્યોરિટી)
  billShowWatermark?: boolean; // Toggle Watermark on bill
  billWatermarkType?: 'name' | 'logo' | 'both'; // Text, Logo or Both
  billWatermarkOpacity?: number; // Opacity percentage (e.g. 10 to 50, default 30)
  billWatermarkText?: string; // Custom watermark text (e.g. 'PRISHA STATIONERY & XEROX')
  hideUpiOnBill?: boolean;
  showMrpOnStore?: boolean;
  showDiscountOnStore?: boolean;
  billShowFraudWarning?: boolean;
  billShowSpecialOffer?: boolean;
  billTermsNote?: string;
  qrCodeMode?: 'dynamic' | 'custom';
  // Government Recognized & Authorized Signatory Fields
  signatureUrl?: string; // Digital signature / Stamp image base64
  billShowSignature?: boolean; // Whether to display signature box on bill
  signatoryTitle?: string; // e.g. "For, PRISHA STATIONERY & ONLINE SERVICES"
  signatoryName?: string; // e.g. "Authorized Signatory / અધિકૃત સહી"
  panNumber?: string; // PAN Number e.g. "BTQPC3756D"
  bankName?: string; // Optional Bank details for official invoices
  accountNumber?: string;
  ifscCode?: string;
  currentAccountOpeningBalance?: number;
  currentAccountBank?: string;
  currentAccountNumber?: string;
  currentAccountIfsc?: string;
  currentAccountBranch?: string;
  // Custom Invoice Number Prefix & Sequential Number Config
  invoicePrefix?: string; // e.g. "PRISHA", "INV", "GST"
  nextInvoiceSeq?: number; // Starting or next sequence number e.g. 1
  invoiceGstRate?: number; // Default GST rate (0, 5, 12, 18, 28)
  taxRate?: number; // Alias for default GST rate
  invoiceDefaultHsn?: string; // Default HSN/SAC code e.g. "4901" or "9983"

  // WEBSITE FRONTEND DISPLAY & POWER CUSTOMIZATION (દુકાન સેટિંગ્સ)
  headerNameSize?: 'small' | 'medium' | 'large' | 'xl'; // હેડર નામની સાઈઝ
  productTextSize?: 'small' | 'medium' | 'large'; // શબ્દોની સાઈઝ
  productCardSize?: 'small' | 'medium' | 'large'; // Card size: નાની, મધ્યમ, મોટી
  productLayoutMode?: 'grid' | 'list'; // View: બોક્સ (Grid) કે લિસ્ટ (List)
  catalogFirstView?: 'categories' | 'products'; // ગ્રાહકને પહેલા કેટેગરી બતાવવી કે પ્રોડક્ટ્સ
  productGridColumns?: '2' | '3' | '4' | '5'; // કોલમ સંખ્યા
  autoSlideBannerInterval?: number; // Banner auto-slide seconds (e.g. 4s)
  bannerSlides?: Array<{ id: string; imageUrl: string; title: string; subtitle?: string; linkUrl?: string }>; // મલ્ટિપલ બેનર સ્લાઇડ્સ
  storeStories?: Array<{ id: string; title: string; mediaUrl: string; type: 'image' | 'video'; caption?: string; date?: string; active: boolean }>; // WhatsApp/Insta Story box
  showStoriesWidget?: boolean; // Toggle story box on customer store
  mobilePosters?: Array<{ id: string; imageUrl: string; title: string; subtitle?: string; linkUrl?: string }>; // Mobile Poster Widget
  newsBoxPosters?: Array<{ id: string; imageUrl: string; title: string; subtitle?: string; linkUrl?: string }>; // News Box Widget
  showBannerSlider?: boolean; // Toggle hero banner
  showCategoryFirst?: boolean;
  // Xerox & Online Printing Pricing (ઓનલાઇન ઝેરોક્ષ ભાવ)
  xeroxBwSingleRate?: number; // દા.ત. ₹2/પેજ (B/W Single)
  xeroxBwDoubleRate?: number; // દા.ત. ₹3/પેજ (B/W Double)
  xeroxColorSingleRate?: number; // દા.ત. ₹10/પેજ (Colour Single)
  xeroxColorDoubleRate?: number; // દા.ત. ₹15/પેજ (Colour Double)
  xeroxLaminationRate?: number; // દા.ત. ₹20/પેજ (Lamination)
  pvcCardRate?: number; // દા.ત. ₹100 / કાર્ડ (Aadhaar, PAN, Ayushman, Driving Licence PVC Card)
  callLetterRate?: number; // દા.ત. ₹0 (Call Letter / Hall Ticket Print)
  callLetterOfferText?: string; // દા.ત. "નવરાત્રી સ્પેશિયલ: કોલ લેટર પ્રિન્ટ ફ્રી!"
  googleReviewUrl?: string; // ગૂગલ મેપ્સ રિવ્યૂ લિંક
  hideOutOfStock?: boolean; // સ્ટોક 0 હોય તે પ્રોડક્ટ્સ ગ્રાહકથી છુપાવવી

  // DELIVERY & ONLINE CHARGES CONFIGURATION (ઓનલાઇન ઓર્ડર ચાર્જીસ & ફી)
  deliveryChargeEnabled?: boolean; // Toggle ડિલિવરી ચાર્જ ચાલુ/બંધ
  deliveryChargePerKg?: number; // ડિલિવરી ચાર્જ પ્રતિ કિલો (Default ₹100)
  deliveryCoverCharge?: number; // કવર / એન્વલપ ડિલિવરી ચાર્જ (Default ₹50)
  deliveryFreeAbove?: number; // ફ્રી ડિલિવરી લિમિટ (0 = no limit)
  platformFeeEnabled?: boolean; // Toggle પ્લેટફોર્મ ફી ચાલુ/બંધ
  platformFeeAmount?: number; // પ્લેટફોર્મ ફી રકમ (Default ₹15)
  packingChargeEnabled?: boolean; // Toggle પેકિંગ ચાર્જ ચાલુ/બંધ
  packingChargeAmount?: number; // સુરક્ષિત પેકિંગ ચાર્જ (Default ₹30)
  otherFeeEnabled?: boolean; // Toggle અન્ય ચાર્જ ચાલુ/બંધ
  otherFeeLabel?: string; // અન્ય ચાર્જ નામ (Default "અન્ય સર્વિસ ચાર્જ")
  otherFeeAmount?: number; // અન્ય ચાર્જ રકમ (Default ₹0)
  
  // DISCOUNT & OFFERS CONFIGURATION (ડિસ્કાઉન્ટ & ઓફર સેટિંગ્સ)
  globalDiscount?: number; // આખી સાઇટ પર ડિસ્કાઉન્ટ % (Default 0)
  categoryDiscounts?: Record<string, number>; // કેટેગરી વાઈઝ ડિસ્કાઉન્ટ %
  secondaryPasswords?: string[]; // વધારાના પાસવર્ડ્સ (e.g. 0123, 2626)
}

export interface RojmelEntry {
  id: string;
  date: string; // DD/MM/YYYY
  type: 'aavak' | 'javak'; // આવક (Jama/Credit) કે જાવક (Udhar/Debit)
  category: string; // વેચાણ, ખર્ચ, માલ ખરીદી, ઉધારી વસૂલી, અંગત ખર્ચ, ભાડું, લાઈટબિલ, પગાર
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank' | 'બાકી (Credit)';
  personName?: string; // ગ્રાહક કે વેપારીનું નામ
  phone?: string;
  notes?: string;
  invoiceNo?: string;
  createdAt?: number;
}

export interface KhataAccount {
  id: string;
  type: 'customer' | 'supplier' | 'other'; // ગ્રાહક (Customer Khata), વેપારી (Supplier Ledger), અન્ય (Other Accounts)
  name: string;
  phone: string;
  address?: string;
  balance: number; // Positive = લેવાના બાકી (Receivable), Negative = આપવાના બાકી (Payable)
  totalGiven: number; // કુલ ઉધાર આપ્યો / ખરીદ્યો
  totalReceived: number; // કુલ જમા મળ્યા / ચૂકવ્યા
  lastTransactionDate: string;
  notes?: string;
}

export interface KhataTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  type: 'jama' | 'udhar'; // જમા (Received/Credit) કે ઉધાર (Given/Debit)
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank' | 'Transfer';
  billNo?: string;
  description?: string;
  balanceAfter: number;
  createdAt?: number;
}

export interface BankAccountEntry {
  id: string;
  date: string; // DD/MM/YYYY
  type: 'deposit' | 'withdrawal'; // જમા (Deposit/Credit) કે ઉપાડ (Withdrawal/Debit)
  amount: number;
  category: 'upi_receipt' | 'cash_deposit' | 'cheque_deposit' | 'neft_rtgs_in' | 'supplier_payment' | 'cash_withdrawal' | 'bank_charges' | 'other';
  categoryLabel?: string;
  particulars: string; // વિગત (Customer name, firm name, purpose)
  referenceNo?: string; // UTR / Cheque / Ref number
  accountType?: 'current' | 'savings'; // Defaults to 'current'
  bankName?: string;
  accountNumber?: string;
  balanceAfter?: number;
  notes?: string;
  createdAt?: number;
}

export interface TrashRecord {
  id: string;
  type: 'product' | 'order' | 'expense' | 'khata_account' | 'khata_transaction' | 'rojmel' | 'print_job' | 'bank_entry';
  title: string;
  deletedAt: string;
  summary: string;
  data: any;
}

export interface BusinessStats {
  dailySales: number;
  dailyPurchase: number;
  netProfit: number;
  totalLoss: number;
  outOfStock: number;
  lowStock: number;
  itemsSold: number;
  totalBills: number;
  correctionDaily?: number;
  correctionWeekly?: number;
  correctionMonthly?: number;
  correctionYearly?: number;
  correctionStockVal?: number;
  totalStockValue?: number;
  weeklySales?: number;
  monthlySales?: number;
  yearlySales?: number;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface PurchaseRecord {
  id: string;
  supplierName: string;
  billNo: string;
  date: string;
  totalAmount: number;
  itemsCount: number;
  paymentStatus: 'Paid' | 'Pending';
}

export interface PrintJobFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string; // base64 or blob URL
  dataUrl?: string; // alias for fileDataUrl
  fileBlob?: Blob; // optional in-memory blob for instant viewing
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadedToCloud?: boolean;
  uploadProgress?: number; // 0 to 100
  uploadSpeed?: string; // e.g. "2.4 MB/s"
  copies: number;
  pages?: number;
  colorMode: 'black_white' | 'color' | 'pvc_card';
  sideOption: 'single_side' | 'double_side';
  paperSize: 'A4' | 'A5' | 'Legal' | '4x6 Photo' | 'PVC Card';
  lamination: boolean;
  notes?: string;
  pricePerUnit?: number;
  totalPrice?: number;
}

export interface PrintJobRecord {
  id: string;
  jobNo: string;
  customerName: string;
  mobile: string;
  address?: string;
  deliveryType: 'pickup' | 'home_delivery';
  files: PrintJobFile[];
  createdAt: string;
  status: 'received' | 'in_progress' | 'printed' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  extraCharges: number;
  extraChargesNote?: string;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'બાકી' | 'Verified';
  paymentMode?: 'UPI' | 'Cash' | 'Online' | 'બાકી (Credit)';
  adminNotes?: string;
  notes?: string;
  paidAmount?: number;
  updatedAt?: number;
  syncStatus?: 'synced' | 'pending_push' | 'conflict';
  syncVersion?: number;
  invoiceGenerated?: boolean;
  invoiceNo?: string;
  totalJobSize?: number;
}

export interface ShopBillRecord {
  id: string;
  category: 'rent' | 'light_bill' | 'staff_salary' | 'tax_gumasta' | 'internet' | 'maintenance' | 'refreshment' | 'other';
  categoryLabel: string; // e.g. "🏠 દુકાન ભાડું"
  title: string; // e.g. "ઓક્ટોબર ૨૦૨૬ દુકાન ભાડું"
  periodMonthYear: string; // e.g. "10/2026" or "ઓક્ટોબર 2026"
  amount: number;
  dueDate?: string; // DD/MM/YYYY
  paymentDate?: string; // DD/MM/YYYY
  status: 'paid' | 'pending'; // ચૂકવાઈ ગયું કે બાકી
  recipientName: string; // Landlord name, PGVCL/UGVCL, Employee name, etc.
  paymentMode: 'Cash' | 'Current_Bank' | 'UPI' | 'Cheque';
  receiptNo?: string; // રસીદ કે બિલ નંબર
  consumerNo?: string; // મીટર નંબર / કન્ઝ્યુમર નંબર (ફોર લાઇટ બિલ)
  notes?: string;
  createdAt: number;
  syncToRojmel?: boolean;
}
