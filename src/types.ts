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
