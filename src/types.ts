export interface ProductItem {
  id: string;
  nameGu: string;
  nameEn: string;
  category: 'books' | 'stationery' | 'service' | 'printing' | 'office' | 'bags' | 'other';
  price: number;
  costPrice: number;
  stock: number | string; // 'સેવા' or number
  isService?: boolean;
  unit: string;
  icon?: string;
  imageUrl?: string; // Main display photo
  galleryImages?: string[]; // Multiple photos (ક્લિક કરવાથી બધા ફોટા દેખાય)
  badge?: string;
  isSpecial?: boolean;
  description?: string;
  
  // New properties based on feedback
  isHidden?: boolean; // છુપાવો (ગ્રાહકને ન દેખાય)
  mrp?: number; // છાપેલી કિંમત (Cross-out)
  bulkPricing?: string; // હોલસેલ ભાવ (e.g. "5 નંગ: ₹200")
  orderIdx?: number; // For admin reordering
  hsnCode?: string;
  minStockAlert?: number;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface BillItem {
  name: string;
  qty: number;
  price: number;
  unit?: string;
  productId?: string;
}

export interface OrderRecord {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  mobile: string;
  address: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: 'UPI' | 'Cash' | 'Online' | 'બાકી (Credit)';
  paymentStatus: 'Paid' | 'Pending' | 'બાકી';
  paymentScreenshot?: string;
  orderType?: 'online' | 'counter';
  orderStatus?: 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  statusUpdatedAt?: string;
  notes?: string;
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
  // Custom Invoice Number Prefix & Sequential Number Config
  invoicePrefix?: string; // e.g. "PRISHA", "INV", "GST"
  nextInvoiceSeq?: number; // Starting or next sequence number e.g. 1
  invoiceGstRate?: number; // Default GST rate (0, 5, 12, 18, 28)
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
  type: 'customer' | 'supplier'; // ગ્રાહક (Customer Khata) કે વેપારી (Supplier Ledger)
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

export interface TrashRecord {
  id: string;
  type: 'product' | 'order' | 'expense';
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
  fileBlob?: Blob; // optional in-memory blob for instant viewing
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress?: number; // 0 to 100
  uploadSpeed?: string; // e.g. "2.4 MB/s"
  copies: number;
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
  paymentStatus: 'Pending' | 'Paid' | 'બાકી';
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
