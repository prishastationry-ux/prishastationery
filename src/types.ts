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
  imageUrl?: string;
  badge?: string;
  isSpecial?: boolean;
  description?: string;
  
  // New properties based on feedback
  isHidden?: boolean; // છુપાવો (ગ્રાહકને ન દેખાય)
  mrp?: number; // છાપેલી કિંમત (Cross-out)
  bulkPricing?: string; // હોલસેલ ભાવ (e.g. "5 નંગ: ₹200")
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
  billFraudWarning?: string;
  billSpecialOffer?: string;
  billShowGst?: boolean;
  billShowQr?: boolean;
  billShowLogos?: boolean;
  email?: string;
  hideUpiOnBill?: boolean;
  showMrpOnStore?: boolean;
  showDiscountOnStore?: boolean;
  billShowFraudWarning?: boolean;
  billShowSpecialOffer?: boolean;
  billTermsNote?: string;
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
  invoiceGenerated?: boolean;
  invoiceNo?: string;
  totalJobSize?: number;
}
