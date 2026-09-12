import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import {
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Upload,
  Phone,
  MapPin,
  Clock,
  User,
  Eye,
  Lock,
  Unlock,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Zap,
  TrendingUp,
  CreditCard,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  X,
  Edit3,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  PlusCircle,
  FileDown,
  LogOut,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Settings,
  DollarSign,
  Wallet,
  Building2,
  Calendar,
  Save,
  HelpCircle,
  Percent,
  Receipt
} from 'lucide-react';

// Product Interface with support for custom image uploads or emojis
interface ProductItem {
  id: string;
  nameGu: string;
  nameEn: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number | string; // 'સેવા' or number
  isService?: boolean;
  unit: string;
  icon?: string;
  imageUrl?: string;
  badge?: string;
  isSpecial?: boolean;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface BillItem {
  name: string;
  qty: number;
  price: number;
  unit?: string;
}

interface OrderRecord {
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
  paymentMode: 'Cash' | 'UPI' | 'બાકી (Credit)' | 'Online';
  paymentStatus: 'Paid' | 'Pending' | 'બાકી';
  paymentScreenshot?: string;
  notes?: string;
}

interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

interface PurchaseRecord {
  id: string;
  supplierName: string;
  billNo: string;
  date: string;
  totalAmount: number;
  itemsCount: number;
  paymentStatus: 'Paid' | 'Pending';
}

// Initial Seed Products
const INITIAL_POS_ITEMS: ProductItem[] = [
  {
    id: 'pos-1',
    nameGu: 'નોટબુક',
    nameEn: 'Notebook / Register',
    category: 'books',
    price: 50,
    costPrice: 35,
    stock: 105,
    unit: 'નંગ',
    icon: '📖'
  },
  {
    id: 'pos-2',
    nameGu: 'પેન-પેન્સિલ',
    nameEn: 'Pen & Pencil Set',
    category: 'stationery',
    price: 10,
    costPrice: 6,
    stock: 299,
    unit: 'નંગ',
    icon: '✒️'
  },
  {
    id: 'pos-3',
    nameGu: 'ઓનલાઇન ફોર્મ',
    nameEn: 'Online Form Application',
    category: 'service',
    price: 100,
    costPrice: 20,
    stock: 'સેવા',
    isService: true,
    unit: 'અરજી',
    icon: '📄'
  },
  {
    id: 'pos-4',
    nameGu: 'આધાર સેવાઓ',
    nameEn: 'Aadhaar Services',
    category: 'service',
    price: 50,
    costPrice: 15,
    stock: 'સેવા',
    isService: true,
    unit: 'કાર્ડ',
    icon: '🪪'
  },
  {
    id: 'pos-5',
    nameGu: 'પાન કાર્ડ',
    nameEn: 'PAN Card New & Correction',
    category: 'service',
    price: 200,
    costPrice: 70,
    stock: 'સેવા',
    isService: true,
    unit: 'અરજી',
    icon: '💳'
  },
  {
    id: 'pos-6',
    nameGu: 'પ્રિન્ટ / ઝેરોક્ષ',
    nameEn: 'Print & Xerox Service',
    category: 'service',
    price: 3,
    costPrice: 1,
    stock: 'સેવા',
    isService: true,
    unit: 'પેજ',
    icon: '🖨️'
  },
  {
    id: 'pos-7',
    nameGu: 'રેશન કાર્ડ',
    nameEn: 'Ration Card Services',
    category: 'service',
    price: 80,
    costPrice: 20,
    stock: 'સેવા',
    isService: true,
    unit: 'અરજી',
    icon: '📦'
  },
  {
    id: 'pos-8',
    nameGu: 'ડ્રોઇંગ સામાન',
    nameEn: 'Drawing & Art Kit',
    category: 'stationery',
    price: 110,
    costPrice: 75,
    stock: 65,
    unit: 'સેટ',
    icon: '🎨'
  },
  {
    id: 'pos-9',
    nameGu: 'ઓફિસ ફાઇલ',
    nameEn: 'Office Cobra File & Folder',
    category: 'stationery',
    price: 35,
    costPrice: 20,
    stock: 114,
    unit: 'નંગ',
    icon: '📁'
  },
  {
    id: 'pos-10',
    nameGu: 'સ્કૂલ બેગ',
    nameEn: 'School & College Bag',
    category: 'stationery',
    price: 450,
    costPrice: 320,
    stock: 22,
    unit: 'નંગ',
    icon: '🎒'
  },
  {
    id: 'pos-11',
    nameGu: 'કેલ્ક્યુલેટર',
    nameEn: 'Commercial Calculator',
    category: 'stationery',
    price: 250,
    costPrice: 180,
    stock: 14,
    unit: 'નંગ',
    icon: '🔢'
  },
  {
    id: 'pos-12',
    nameGu: 'દસ્તાવેજ અપલોડ',
    nameEn: 'Document Scan & Upload',
    category: 'service',
    price: 40,
    costPrice: 10,
    stock: 'નવું',
    isService: true,
    unit: 'સેટ',
    icon: '📤',
    isSpecial: true,
    badge: 'નવું'
  },
  {
    id: 'pos-13',
    nameGu: 'આયુષ્માન કાર્ડ',
    nameEn: 'PMJAY Ayushman Card',
    category: 'service',
    price: 50,
    costPrice: 15,
    stock: 'સેવા',
    isService: true,
    unit: 'કાર્ડ',
    icon: '🛡️'
  },
  {
    id: 'pos-14',
    nameGu: 'ચૂંટણી કાર્ડ',
    nameEn: 'Voter ID Card Online',
    category: 'service',
    price: 70,
    costPrice: 20,
    stock: 'સેવા',
    isService: true,
    unit: 'કાર્ડ',
    icon: '🗳️'
  }
];

export default function App() {
  // Navigation View: 'admin' (Original layout) | 'customer' (Client store) | 'gst_bill' | 'purchase' | 'expenses' | 'settings'
  const [activeTab, setActiveTab] = useState<'admin' | 'customer' | 'gst_bill' | 'purchase' | 'expenses' | 'settings'>('admin');
  
  // UI Zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Store Settings (Full editable from Admin)
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('prisha_store_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      storeNameEn: 'PRISHA STATIONERY & ONLINE SERVICES',
      storeNameGu: 'પ્રિશા સ્ટેશનરી અને ઓનલાઇન સર્વિસીસ',
      tagline: '(CSC ડિજિટલ સેવા કેન્દ્ર)',
      subTagline: '• પ્રિશા સ્ટેશનરી અને ઓનલાઇન સર્વિસીસ',
      ownerName: 'BHARAT CHAUDHARY',
      phone: '8140430395',
      phoneDisplay: '+૯૧ ૮૧૪૦૪ ૩૦૩૯૫',
      upiId: '8140430395@apl',
      payeeName: 'PRISHA STATIONERY',
      gstNumber: '24AAAAA0000A1Z5',
      address: 'ADD : 106,107 prince arced taluka panchayt same tharad dist vav.tharad ujarat pin 385565',
      marqueeText: '💥 ધમાકા ઓફર: સ્કૂલ સ્ટેશનરી, નોટબુક હોલસેલ ભાવે, આધાર-પાન કાર્ડ, ઝેરોક્ષ અને લેમિનેશન પર વિશેષ છૂટ ઉપલબ્ધ! ★ CSC ડિજિટલ સેવા કેન્દ્ર ★ 81404 30395',
      leftLogoUrl: '',
      rightLogoUrl: '',
      bannerImageUrl: '',
      bannerText: '🖼️ જાહેરાત બેનર\n(Click to edit banner & photo)',
      adminProfileImageUrl: '',
      developerCredit: 'Bharat Chaudhary',
      lastUpdate: '12/09/2026'
    };
  });

  // Products & Inventory state
  const [posItems, setPosItems] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('prisha_exact_items_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_POS_ITEMS;
  });

  // Business Statistics State (On-click editable)
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('prisha_exact_stats_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      dailySales: 180.00,
      dailyPurchase: 7750.00,
      netProfit: 0.00,
      totalLoss: 845.00,
      outOfStock: 1,
      lowStock: 0,
      itemsSold: 13,
      totalBills: 3
    };
  });

  // Order Logs & Invoices State
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem('prisha_order_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'ord-101',
        invoiceNo: 'INV-2026-001',
        date: '12/09/2026 10:30 AM',
        customerName: 'રમેશભાઈ પટેલ',
        mobile: '9825012345',
        address: 'ગામ: વાવ, થરાદ',
        items: [
          { name: 'નોટબુક (Notebook)', qty: 2, price: 50 },
          { name: 'પેન-પેન્સિલ (Pen Set)', qty: 3, price: 10 }
        ],
        subtotal: 130,
        discount: 0,
        tax: 0,
        total: 130,
        paymentMode: 'Cash',
        paymentStatus: 'Paid'
      }
    ];
  });

  // Expenses & Purchases
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('prisha_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'exp-1', title: 'દુકાન ચા-નાસ્તો', amount: 120, category: 'દૈનિક ખર્ચ', date: '12/09/2026' },
      { id: 'exp-2', title: 'લાઇટ બિલ / ઇન્ટરનેટ', amount: 450, category: 'યુટિલિટી', date: '11/09/2026' }
    ];
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    const saved = localStorage.getItem('prisha_purchases');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'pur-1', supplierName: 'અમદાવાદ સ્ટેશનરી માર્ટ', billNo: 'ASM-8821', date: '10/09/2026', totalAmount: 7750, itemsCount: 45, paymentStatus: 'Paid' }
    ];
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals and interactive editing state
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [editStatKey, setEditStatKey] = useState<string | null>(null);
  const [editStatLabel, setEditStatLabel] = useState('');
  const [editStatValue, setEditStatValue] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBannerEditModal, setShowBannerEditModal] = useState(false);
  const [activePrintInvoice, setActivePrintInvoice] = useState<OrderRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Fast new product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdEnName, setNewProdEnName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('50');
  const [newProdCost, setNewProdCost] = useState('35');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdIcon, setNewProdIcon] = useState('📦');
  const [newProdImage, setNewProdImage] = useState<string>('');
  const [newProdUnit, setNewProdUnit] = useState('નંગ');
  const [newProdCategory, setNewProdCategory] = useState('stationery');

  // Customer Shopping & Paywall
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string>('');
  const [billPaymentMode, setBillPaymentMode] = useState<'Cash' | 'UPI' | 'બાકી (Credit)' | 'Online'>('UPI');

  // POS Direct Billing Form
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerMobile, setPosCustomerMobile] = useState('');
  const [posPaymentMode, setPosPaymentMode] = useState<'Cash' | 'UPI' | 'બાકી (Credit)' | 'Online'>('Cash');
  const [posDiscount, setPosDiscount] = useState<number>(0);

  // Visitor Counter
  const [visitorCount, setVisitorCount] = useState<string>(() => {
    const saved = localStorage.getItem('prisha_visitor_count');
    if (!saved) {
      localStorage.setItem('prisha_visitor_count', '1000000001');
      return '1000000001';
    }
    const nextVal = (BigInt(saved) + BigInt(1)).toString();
    localStorage.setItem('prisha_visitor_count', nextVal);
    return nextVal;
  });

  // Local Storage synchronization
  useEffect(() => {
    localStorage.setItem('prisha_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('prisha_exact_items_v2', JSON.stringify(posItems));
  }, [posItems]);

  useEffect(() => {
    localStorage.setItem('prisha_exact_stats_v2', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('prisha_order_records', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('prisha_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('prisha_purchases', JSON.stringify(purchases));
  }, [purchases]);

  // Recalculate out of stock / low stock count
  useEffect(() => {
    const outCount = posItems.filter(p => typeof p.stock === 'number' && p.stock <= 0).length;
    const lowCount = posItems.filter(p => typeof p.stock === 'number' && p.stock > 0 && p.stock <= 5).length;
    setStats(prev => ({
      ...prev,
      outOfStock: outCount,
      lowStock: lowCount
    }));
  }, [posItems]);

  // Generate Dynamic QR Code for Cart Total using the store's current UPI ID
  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  useEffect(() => {
    if (cartTotal > 0 || activeTab === 'gst_bill') {
      const amount = cartTotal > 0 ? cartTotal : 100;
      const upiUrl = `upi://pay?pa=${encodeURIComponent(storeSettings.upiId)}&pn=${encodeURIComponent(storeSettings.payeeName)}&am=${amount}&cu=INR&tn=PrishaStationeryBill`;
      QRCode.toDataURL(upiUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then(url => setUpiQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [cartTotal, storeSettings.upiId, storeSettings.payeeName, activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Increment / Decrement Stock on POS Click
  const modifyStock = (itemId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPosItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          if (typeof item.stock === 'number') {
            const updated = Math.max(0, item.stock + delta);
            return { ...item, stock: updated };
          }
        }
        return item;
      })
    );

    if (delta < 0) {
      const it = posItems.find(p => p.id === itemId);
      if (it) {
        setStats(s => ({
          ...s,
          dailySales: Number((s.dailySales + it.price).toFixed(2)),
          itemsSold: s.itemsSold + 1,
          totalBills: s.totalBills + 1,
          netProfit: Number((s.netProfit + Math.max(0, it.price - it.costPrice)).toFixed(2))
        }));
        showToast(`⚡ વેચાણ (-1 સ્ટોક): ${it.nameGu} (₹${it.price})`);
      }
    } else {
      showToast(`➕ સ્ટોક વધાર્યો (+1)`);
    }
  };

  // Delete an Item completely with confirmation
  const handleDeleteItem = (itemId: string, itemName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`શું તમે ખરેખર "${itemName}" ને લિસ્ટમાંથી ડીલીટ (Delete) કરવા માંગો છો?`)) {
      setPosItems(prev => prev.filter(item => item.id !== itemId));
      if (editingItem?.id === itemId) setEditingItem(null);
      showToast(`🗑️ "${itemName}" સફળતાપૂર્વક ડીલીટ થઈ ગઈ!`);
    }
  };

  // Fast Add Product Form Handler
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('⚠️ કૃપા કરીને પ્રોડક્ટનું નામ દાખલ કરો!');
      return;
    }

    const newItem: ProductItem = {
      id: `pos-${Date.now()}`,
      nameGu: newProdName,
      nameEn: newProdEnName || newProdName,
      category: newProdCategory,
      price: Number(newProdPrice) || 0,
      costPrice: Number(newProdCost) || 0,
      stock: newProdCategory === 'service' ? 'સેવા' : Number(newProdStock) || 0,
      isService: newProdCategory === 'service',
      unit: newProdUnit || 'નંગ',
      icon: newProdIcon || '📦',
      imageUrl: newProdImage || undefined
    };

    setPosItems(prev => [newItem, ...prev]);
    setNewProdName('');
    setNewProdEnName('');
    setNewProdImage('');
    setIsAddingNewItem(false);
    showToast(`✅ નવી પ્રોડક્ટ ઉમેરાઈ ગઈ: ${newItem.nameGu}`);
  };

  // Save Item Modifications
  const handleSaveItemEdit = () => {
    if (editingItem) {
      setPosItems(prev => prev.map(p => (p.id === editingItem.id ? editingItem : p)));
      showToast(`✏️ "${editingItem.nameGu}" વિગતો સેવ થઈ ગઈ!`);
      setEditingItem(null);
    }
  };

  // On-Click Stat Override Trigger
  const handleStatClick = (key: string, label: string, currentVal: number) => {
    setEditStatKey(key);
    setEditStatLabel(label);
    setEditStatValue(currentVal.toString());
  };

  const handleSaveStat = () => {
    if (editStatKey) {
      setStats(prev => ({
        ...prev,
        [editStatKey]: Number(editStatValue) || 0
      }));
      showToast(`✏️ ${editStatLabel} બદલાઈને ₹${editStatValue} થયું!`);
      setEditStatKey(null);
    }
  };

  // Master Reset Stats to Zero
  const handleMasterResetStats = () => {
    if (window.confirm('શું તમે ખરેખર બધા સ્ટેટ્સ રીસેટ કરીને 0 (Zero) કરવા માંગો છો?')) {
      setStats({
        dailySales: 0,
        dailyPurchase: 0,
        netProfit: 0,
        totalLoss: 0,
        outOfStock: 0,
        lowStock: 0,
        itemsSold: 0,
        totalBills: 0
      });
      showToast('🔄 બધા સ્ટેટ્સ 0 (Zero) થઈ ગયા!');
    }
  };

  // Handle Logo Upload (Left, Right, or Admin profile)
  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'leftLogo' | 'rightLogo' | 'bannerImage' | 'adminProfile' | 'editingProduct' | 'newProduct'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        if (target === 'leftLogo') {
          setStoreSettings(prev => ({ ...prev, leftLogoUrl: base64 }));
          showToast('✅ ડાબો લોગો ફોટો અપલોડ થયો!');
        } else if (target === 'rightLogo') {
          setStoreSettings(prev => ({ ...prev, rightLogoUrl: base64 }));
          showToast('✅ જમણો લોગો ફોટો અપલોડ થયો!');
        } else if (target === 'bannerImage') {
          setStoreSettings(prev => ({ ...prev, bannerImageUrl: base64 }));
          showToast('✅ જાહેરાત બેનર ફોટો અપલોડ થયો!');
        } else if (target === 'adminProfile') {
          setStoreSettings(prev => ({ ...prev, adminProfileImageUrl: base64 }));
          showToast('✅ એડમિન પ્રોફાઇલ ફોટો અપલોડ થયો!');
        } else if (target === 'editingProduct' && editingItem) {
          setEditingItem({ ...editingItem, imageUrl: base64 });
          showToast('✅ આઇટમ ફોટો અપલોડ થયો!');
        } else if (target === 'newProduct') {
          setNewProdImage(base64);
          showToast('✅ નવી પ્રોડક્ટ ફોટો અપલોડ થયો!');
        }
      } catch (err) {
        console.error(err);
        showToast('❌ ફોટો અપલોડ કરવામાં ભૂલ આવી.');
      }
    }
  };

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart(prev => {
      const exist = prev.find(i => i.product.id === product.id);
      if (exist) {
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`🛒 ${product.nameGu} કાર્ટમાં ઉમેરાયું!`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id === productId) {
            const nextQ = i.quantity + delta;
            return nextQ > 0 ? { ...i, quantity: nextQ } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Customer Order Trigger with Payment Screenshot Lock
  const handleCustomerWhatsAppOrder = () => {
    if (!customerName.trim() || !customerMobile.trim() || !customerAddress.trim()) {
      showToast('⚠️ કૃપા કરીને તમારું નામ, મોબાઇલ નંબર અને સરનામું ભરો!');
      return;
    }
    if (!paymentProofFile && !paymentProofPreview) {
      showToast('⚠️ પેમેન્ટ રસીદ / સ્ક્રીનશોટ અપલોડ કરવો ફરજિયાત છે!');
      return;
    }

    const orderId = `PRISHA-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let itemsStr = '';
    cart.forEach((i, idx) => {
      itemsStr += `${idx + 1}. *${i.product.nameGu}* (${i.product.nameEn}) x ${i.quantity} = ₹${i.product.price * i.quantity}\n`;
    });

    const msg =
      `🧾 *નવો ઓર્ડર - ${storeSettings.storeNameGu}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *ઓર્ડર નં:* ${orderId}\n` +
      `📅 *તારીખ:* ${dateFormatted}\n` +
      `👤 *ગ્રાહકનું નામ:* ${customerName}\n` +
      `📞 *મોબાઇલ:* +91 ${customerMobile}\n` +
      `📍 *સરનામું:* ${customerAddress}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🛒 *આઇટમ્સની યાદી:*\n${itemsStr}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *કુલ રકમ:* ₹${cartTotal}/-\n` +
      `💳 *ચુકવણી પદ્ધતિ:* ${billPaymentMode} (UPI ID: ${storeSettings.upiId})\n` +
      `📸 *પેમેન્ટ સ્ક્રીનશોટ:* ઓર્ડર સાથે જોડેલ છે ✅\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *દુકાન:* ${storeSettings.address}\n` +
      `📞 *મોબાઇલ:* +91 ${storeSettings.phone}\n\n` +
      `નમસ્તે ${storeSettings.ownerName}, મારો ઓર્ડર કન્ફર્મ કરવા વિનંતી છે.`;

    // Deduct stock
    setPosItems(prev =>
      prev.map(p => {
        const inC = cart.find(c => c.product.id === p.id);
        if (inC && typeof p.stock === 'number') {
          return { ...p, stock: Math.max(0, p.stock - inC.quantity) };
        }
        return p;
      })
    );

    // Record order
    const inv: OrderRecord = {
      id: `ord-${Date.now()}`,
      invoiceNo: orderId,
      date: dateFormatted,
      customerName,
      mobile: customerMobile,
      address: customerAddress,
      items: cart.map(c => ({ name: c.product.nameGu, qty: c.quantity, price: c.product.price, unit: c.product.unit })),
      subtotal: cartTotal,
      discount: 0,
      tax: 0,
      total: cartTotal,
      paymentMode: billPaymentMode,
      paymentStatus: billPaymentMode === 'બાકી (Credit)' ? 'બાકી' : 'Paid',
      paymentScreenshot: paymentProofPreview
    };

    setOrders(prev => [inv, ...prev]);
    setActivePrintInvoice(inv);

    // Update stats
    setStats(s => ({
      ...s,
      dailySales: Number((s.dailySales + cartTotal).toFixed(2)),
      itemsSold: s.itemsSold + cart.reduce((acc, curr) => acc + curr.quantity, 0),
      totalBills: s.totalBills + 1
    }));

    // WhatsApp Redirect
    window.open(`https://wa.me/91${storeSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');

    setCart([]);
    setPaymentProofFile(null);
    setPaymentProofPreview('');
    showToast('🎉 ઓર્ડર સફળતાપૂર્વક કન્ફર્મ થઈ ગયો!');
  };

  // POS Generate Custom Bill
  const handleGeneratePOSBill = () => {
    if (cart.length === 0) {
      showToast('⚠️ કૃપા કરીને કાર્ટમાં વસ્તુઓ ઉમેરો!');
      return;
    }

    const orderId = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const finalTotal = Math.max(0, cartTotal - posDiscount);

    // Deduct stock
    setPosItems(prev =>
      prev.map(p => {
        const inC = cart.find(c => c.product.id === p.id);
        if (inC && typeof p.stock === 'number') {
          return { ...p, stock: Math.max(0, p.stock - inC.quantity) };
        }
        return p;
      })
    );

    const inv: OrderRecord = {
      id: `ord-${Date.now()}`,
      invoiceNo: orderId,
      date: dateFormatted,
      customerName: posCustomerName || 'Walk-in Customer (કાઉન્ટર)',
      mobile: posCustomerMobile || storeSettings.phone,
      address: 'દુકાન કાઉન્ટર - થરાદ',
      items: cart.map(c => ({ name: c.product.nameGu, qty: c.quantity, price: c.product.price, unit: c.product.unit })),
      subtotal: cartTotal,
      discount: posDiscount,
      tax: 0,
      total: finalTotal,
      paymentMode: posPaymentMode,
      paymentStatus: posPaymentMode === 'બાકી (Credit)' ? 'બાકી' : 'Paid'
    };

    setOrders(prev => [inv, ...prev]);
    setActivePrintInvoice(inv);

    setStats(s => ({
      ...s,
      dailySales: Number((s.dailySales + finalTotal).toFixed(2)),
      itemsSold: s.itemsSold + cart.reduce((acc, curr) => acc + curr.quantity, 0),
      totalBills: s.totalBills + 1
    }));

    setCart([]);
    setPosCustomerName('');
    setPosCustomerMobile('');
    setPosDiscount(0);
    showToast(`🧾 બિલ #${orderId} જનરેટ થઈ ગયું! (${posPaymentMode})`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const productData = posItems.map((p, index) => ({
        'ક્રમ': index + 1,
        'આઇટમ નામ (ગુજરાતી)': p.nameGu,
        'English Name': p.nameEn,
        'કેટેગરી': p.category,
        'વેચાણ ભાવ (₹)': p.price,
        'ખરીદ ભાવ (₹)': p.costPrice,
        'હાજર સ્ટોક': p.stock,
        'એકમ': p.unit
      }));

      const ordersData = orders.map(o => ({
        'બિલ નં': o.invoiceNo,
        'તારીખ': o.date,
        'ગ્રાહક': o.customerName,
        'મોબાઇલ': o.mobile,
        'ચુકવણી પદ્ધતિ (Mode)': o.paymentMode,
        'સ્ટેટસ': o.paymentStatus,
        'કુલ રકમ (₹)': o.total
      }));

      const wb = XLSX.utils.book_new();
      const wsP = XLSX.utils.json_to_sheet(productData);
      const wsO = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(wb, wsP, 'સ્ટોક ઇન્વેન્ટરી');
      XLSX.utils.book_append_sheet(wb, wsO, 'બિલ હિસ્ટ્રી');
      XLSX.writeFile(wb, `Prisha_Stationery_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('📊 Excel રિપોર્ટ ડાઉનલોડ થઈ ગયો!');
    } catch (e) {
      console.error(e);
      showToast('❌ Excel ડાઉનલોડમાં ભૂલ આવી.');
    }
  };

  // Filtered Items for POS Grid
  const filteredItems = posItems.filter(
    item =>
      item.nameGu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{ zoom: `${zoomLevel}%` }}
      className="min-h-screen bg-white text-black font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER - EXACT REPLICA OF THE IMAGE WITH FULL EDIT/UPLOAD CAPABILITIES */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-neutral-300 no-print">
        <div className="max-w-[1550px] mx-auto px-4 py-2 flex items-center justify-between">
          
          {/* LEFT PRISHA LOGO (Click to Upload or Edit) */}
          <div className="flex items-center gap-2 group relative">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageFileUpload(e, 'leftLogo')}
              />
              <div
                className="w-13 h-13 rounded-lg bg-white border border-neutral-300 flex flex-col items-center justify-center p-1 shadow-sm hover:border-orange-500 transition-all overflow-hidden relative"
                title="Click to Upload Left Logo Photo"
              >
                {storeSettings.leftLogoUrl ? (
                  <img src={storeSettings.leftLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <span className="text-[10px] font-black text-orange-600 leading-none">PRISHA</span>
                    <span className="text-sm">🪪</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black transition-opacity">
                  બદલો
                </div>
              </div>
            </label>
          </div>

          {/* CENTER MAIN STORE BRANDING (Editable in Settings) */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-3xl sm:text-4xl font-black text-[#EA580C] tracking-tight uppercase">
                {storeSettings.storeNameEn.split(' ')[0] || 'PRISHA'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#1E40AF] tracking-tight uppercase">
                {storeSettings.storeNameEn.substring(storeSettings.storeNameEn.indexOf(' ') + 1) || 'STATIONERY & ONLINE SERVICES'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-neutral-800">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-extrabold">
                {storeSettings.tagline}
              </span>
              <span className="text-neutral-700 font-bold">{storeSettings.subTagline}</span>
            </div>
          </div>

          {/* RIGHT CONTROLS & TWIN LOGO */}
          <div className="flex items-center gap-3">
            {/* TWIN RIGHT LOGO (Click to Upload) */}
            <div className="flex items-center gap-2 group relative">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageFileUpload(e, 'rightLogo')}
                />
                <div
                  className="w-13 h-13 rounded-lg bg-white border border-neutral-300 flex flex-col items-center justify-center p-1 shadow-sm hover:border-orange-500 transition-all overflow-hidden relative"
                  title="Click to Upload Right Logo Photo"
                >
                  {storeSettings.rightLogoUrl ? (
                    <img src={storeSettings.rightLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <span className="text-[10px] font-black text-orange-600 leading-none">PRISHA</span>
                      <span className="text-sm">📚</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black transition-opacity">
                    બદલો
                  </div>
                </div>
              </label>
            </div>

            {/* ZOOM / SCALE CONTROLS */}
            <div className="hidden sm:flex items-center border border-neutral-400 rounded-full px-2 py-1 bg-white shadow-xs text-xs font-bold gap-1.5">
              <span className="px-1 text-neutral-700">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-700 font-black cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="w-5 h-5 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-700 font-black cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-[11px] text-blue-700 font-bold border border-neutral-300 cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* SETTINGS GEAR */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-2 rounded-full border border-neutral-300 shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="વેબસાઇટ & દુકાન સેટિંગ્સ (Edit UPI, Name, Address, Marquee)"
            >
              <Settings className="w-4 h-4 text-neutral-700" />
            </button>
          </div>
        </div>

        {/* 2. FULL WIDTH DEEP BLUE HORIZONTAL BAR (SUB-HEADER) */}
        <div className="bg-[#0B1E48] text-white px-2 py-1.5 flex items-center justify-between text-xs font-bold">
          {/* Home Page Tab */}
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-[#002244] hover:bg-[#003366] text-white px-4 py-1 rounded text-xs font-black border border-blue-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Home Page</span>
            </button>
          </div>

          {/* Running Text Marquee */}
          <div className="flex-1 overflow-hidden mx-3 text-[11px] sm:text-xs">
            <div className="animate-marquee font-extrabold text-white flex items-center gap-4">
              <span>
                <strong className="text-orange-400">માહિતી:</strong> {storeSettings.marqueeText}
              </span>
              <span>★ સંપર્ક: {storeSettings.phoneDisplay} ★ {storeSettings.address}</span>
            </div>
          </div>

          {/* Right Mode Switchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'customer' ? 'admin' : 'customer')}
              className={`px-3 py-1 rounded text-[11px] font-black flex items-center gap-1 border transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-orange-500 text-black border-white'
                  : 'bg-[#1E40AF] hover:bg-blue-700 text-white border-blue-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{activeTab === 'customer' ? '⚙️ એડમિન પેનલ' : '🌐 ગ્રાહક વ્યૂ (Live Shop)'}</span>
            </button>

            <button
              onClick={() => showToast('🔒 લૉગઆઉટ સેવ થઈ ગયું!')}
              className="bg-[#B91C1C] hover:bg-red-700 text-white px-2.5 py-1 rounded text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>લૉગઆઉટ</span>
            </button>
          </div>
        </div>
      </header>

      {/* FLOATING ACTION NOTICES */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-2.5 rounded-xl shadow-2xl border-2 border-orange-500 font-black text-xs sm:text-sm flex items-center gap-2 animate-bounce no-print">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN BODY: ADMIN DASHBOARD (EXACT SCREENSHOT LAYOUT) */}
      {/* ========================================================================= */}
      {activeTab !== 'customer' ? (
        <main className="max-w-[1550px] mx-auto w-full px-2 sm:px-3 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 no-print">
          
          {/* ========================================== */}
          {/* LEFT SIDEBAR MENU (Admin Controls) */}
          {/* ========================================== */}
          <aside className="md:col-span-2 space-y-1 text-xs">
            <div className="bg-neutral-100 border border-neutral-300 rounded-t p-1.5 flex items-center justify-between font-black text-neutral-800">
              <div className="flex items-center gap-1.5">
                <span className="text-orange-600">⚙️</span>
                <span>Admin Controls</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-neutral-500 hover:text-blue-700"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Dashboard Button */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full p-2 font-black rounded-sm flex items-center gap-2 text-left shadow-xs transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-200'
              }`}
            >
              <span>📊</span>
              <span>Main Dashboard</span>
            </button>

            {/* Menu Buttons */}
            <div className="space-y-1 pt-0.5">
              <button
                onClick={() => setIsAddingNewItem(true)}
                className="w-full text-left p-2 rounded-sm border bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 flex items-center justify-between font-bold cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-black">➕</span>
                  <span>નવો સ્ટોક ઉમેરો</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('gst_bill')}
                className={`w-full text-left p-2 rounded-sm border flex items-center justify-between font-bold transition-colors cursor-pointer ${
                  activeTab === 'gst_bill'
                    ? 'bg-orange-100 text-orange-900 border-orange-400 font-black'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-700">🧾</span>
                  <span>જીએસટી બિલ (POS)</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-blue-300">
                  નવું
                </span>
              </button>

              <button
                onClick={() => setActiveTab('purchase')}
                className={`w-full text-left p-2 rounded-sm border flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                  activeTab === 'purchase'
                    ? 'bg-orange-100 text-orange-900 border-orange-400 font-black'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200'
                }`}
              >
                <span className="text-orange-600">🛒</span>
                <span>ખરીદી એન્ટ્રી (Purchase)</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`w-full text-left p-2 rounded-sm border flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-orange-100 text-orange-900 border-orange-400 font-black'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200'
                }`}
              >
                <span className="text-rose-600">💵</span>
                <span>દુકાન ખર્ચ (Expenses)</span>
              </button>

              <button
                onClick={() => handleExportExcel()}
                className="w-full text-left p-2 rounded-sm border bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="text-emerald-700">📊</span>
                <span>Excel રિપોર્ટ ડાઉનલોડ</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full text-left p-2 rounded-sm border bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="text-purple-600">⚙️</span>
                <span>વેબસાઇટ સેટિંગ્સ</span>
              </button>

              <button
                onClick={() => setActiveTab('customer')}
                className="w-full text-left p-2 rounded-sm border bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <span className="text-blue-600">🌐</span>
                <span>ગ્રાહક વેબસાઇટ જુઓ</span>
              </button>
            </div>
          </aside>

          {/* ========================================== */}
          {/* CENTER POS GRID & WORKBENCH */}
          {/* ========================================== */}
          <section className="md:col-span-8 space-y-3">
            
            {/* NEW PRODUCT FORM (Always visible or toggleable) */}
            <div className="bg-white border border-neutral-300 rounded p-3 shadow-2xs">
              <div className="flex items-center justify-between font-black text-xs text-neutral-900 mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-orange-600">➕</span>
                  <span>નવી પ્રોડક્ટ / સર્વિસ ઉમેરો</span>
                </div>
                <label className="text-[11px] text-blue-700 font-bold cursor-pointer flex items-center gap-1 hover:underline">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{newProdImage ? 'ફોટો પસંદ થયો ✅' : 'પ્રોડક્ટ ફોટો અપલોડ'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageFileUpload(e, 'newProduct')}
                  />
                </label>
              </div>

              <form onSubmit={handleAddNewProduct} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="આઇટમનું નામ (ગુજરાતી)"
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 border border-neutral-400 rounded focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="English Name"
                      value={newProdEnName}
                      onChange={e => setNewProdEnName(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 border border-neutral-400 rounded focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 border border-neutral-400 rounded focus:border-blue-600 outline-none bg-white"
                    >
                      <option value="stationery">સ્ટેશનરી (Stationery)</option>
                      <option value="books">બુક્સ / નોટબુક</option>
                      <option value="service">ઓનલાઇન સર્વિસ</option>
                      <option value="printing">ઝેરોક્ષ / પ્રિન્ટિંગ</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="ઇમોજી / આઇકોન"
                      value={newProdIcon}
                      onChange={e => setNewProdIcon(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 border border-neutral-400 rounded text-center focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-neutral-200 text-xs">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-neutral-700">
                    <span className="text-blue-800 font-black">▼ ખરીદો/વેચાણ કિંમત અને સ્ટોક:</span>
                    <span>વેચાણ:</span>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(e.target.value)}
                      className="w-14 p-0.5 border border-neutral-300 rounded font-black text-center"
                    />
                    <span>ખરીદો:</span>
                    <input
                      type="number"
                      value={newProdCost}
                      onChange={e => setNewProdCost(e.target.value)}
                      className="w-14 p-0.5 border border-neutral-300 rounded font-black text-center"
                    />
                    <span>સ્ટોક:</span>
                    <input
                      type="number"
                      value={newProdStock}
                      onChange={e => setNewProdStock(e.target.value)}
                      className="w-14 p-0.5 border border-neutral-300 rounded font-black text-center"
                    />
                    <span>એકમ:</span>
                    <input
                      type="text"
                      value={newProdUnit}
                      onChange={e => setNewProdUnit(e.target.value)}
                      className="w-14 p-0.5 border border-neutral-300 rounded font-black text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0B1E48] hover:bg-blue-900 text-white text-xs font-black px-4 py-1.5 rounded flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>💾 સેવ કરો</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SEARCH & QUICK ACTION NOTICE */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="વસ્તુ શોધો: નોટબુક, પેન, દસ્તાવેજ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-neutral-300 rounded focus:border-blue-600 outline-none bg-white font-bold"
                />
              </div>

              <div className="text-[11px] font-black text-orange-600 flex items-center gap-1">
                <span>⚡ ઇન્વેન્ટરી પર ક્લિક કરવાથી ઝડપથી ૧ સ્ટોક ઘટશે (Instant Sell)</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* EXACT ITEM BOXES GRID WITH IMAGE UPLOAD & FULL EDIT/DELETE */}
            {/* ============================================================== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => modifyStock(item.id, -1)}
                  className={`bg-white rounded border p-2 flex flex-col justify-between relative cursor-pointer hover:shadow-md transition-all select-none group ${
                    item.isSpecial ? 'border-2 border-red-500' : 'border-blue-400 hover:border-blue-600'
                  }`}
                >
                  {/* Top Header: Badge, Delete button, Stock number */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      {item.badge && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                          {item.badge}
                        </span>
                      )}
                      {/* Trash / Delete button */}
                      <button
                        onClick={e => handleDeleteItem(item.id, item.nameGu, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-0.5 rounded transition-opacity"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${
                        typeof item.stock === 'number' && item.stock <= 0
                          ? 'bg-red-50 text-red-700 border-red-300 font-black'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </div>

                  {/* Icon or Image + Title */}
                  <div className="my-1.5 text-center">
                    {item.imageUrl ? (
                      <div className="w-12 h-12 mx-auto mb-1 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center bg-neutral-50">
                        <img src={item.imageUrl} alt={item.nameGu} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="text-2xl mb-1">{item.icon || '📦'}</div>
                    )}
                    <div className="text-xs font-black text-black leading-tight">
                      {item.nameGu}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-bold leading-tight">
                      {item.nameEn}
                    </div>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-1.5 border-t border-dashed border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-black text-black">
                      ₹{item.price}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-600 text-[10px]"
                        title="Edit Item details & image"
                      >
                        <Edit3 className="w-3 h-3 text-blue-700" />
                      </button>

                      {/* -1 Button */}
                      <button
                        onClick={e => modifyStock(item.id, -1, e)}
                        className="bg-neutral-100 hover:bg-red-100 text-red-700 font-black px-1.5 py-0.5 rounded text-[10px] border border-neutral-300"
                        title="Instant Sell -1"
                      >
                        -1
                      </button>

                      {/* +1 Button */}
                      <button
                        onClick={e => modifyStock(item.id, 1, e)}
                        className="bg-neutral-100 hover:bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded text-[10px] border border-neutral-300"
                        title="Add Stock +1"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GST POS BILLING WORKBENCH (if activeTab === 'gst_bill') */}
            {activeTab === 'gst_bill' && (
              <div className="bg-white border-2 border-blue-600 rounded-lg p-4 shadow-md space-y-4 mt-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>ઝડપી જીએસટી / દુકાન બિલ જનરેટર</span>
                  </h3>
                  <span className="text-xs font-bold text-neutral-600">કાર્ટ આઇટમ્સ: {cart.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold block mb-1">ગ્રાહકનું નામ:</label>
                    <input
                      type="text"
                      placeholder="નામ દાખલ કરો"
                      value={posCustomerName}
                      onChange={e => setPosCustomerName(e.target.value)}
                      className="w-full p-1.5 border border-neutral-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">મોબાઇલ નંબર:</label>
                    <input
                      type="text"
                      placeholder="૧૦ આંકડાનો મોબાઇલ"
                      value={posCustomerMobile}
                      onChange={e => setPosCustomerMobile(e.target.value)}
                      className="w-full p-1.5 border border-neutral-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">ચુકવણી પદ્ધતિ (Payment Mode):</label>
                    <select
                      value={posPaymentMode}
                      onChange={e => setPosPaymentMode(e.target.value as any)}
                      className="w-full p-1.5 border border-neutral-300 rounded font-bold bg-white"
                    >
                      <option value="Cash">Cash (રોકડ)</option>
                      <option value="UPI">UPI (ઓનલાઇન ક્યૂઆર)</option>
                      <option value="બાકી (Credit)">બાકી (Credit / ઉધાર)</option>
                      <option value="Online">Online NetBanking</option>
                    </select>
                  </div>
                </div>

                {/* Cart summary */}
                <div className="border rounded p-2 bg-neutral-50 text-xs">
                  <div className="font-bold mb-1 text-neutral-800">બિલમાં પસંદ કરેલી વસ્તુઓ:</div>
                  {cart.length === 0 ? (
                    <div className="text-neutral-500 py-2 text-center">
                      ઉપરના ગ્રીડમાંથી વસ્તુઓ પસંદ કરવા માટે "+ ઉમેરો" અથવા ક્લિક કરો.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-200">
                      {cart.map(c => (
                        <div key={c.product.id} className="py-1.5 flex justify-between items-center">
                          <span className="font-bold">{c.product.nameGu} x {c.quantity}</span>
                          <span className="font-black">₹{c.product.price * c.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between items-center font-black text-sm">
                        <span>કુલ રકમ:</span>
                        <span className="text-blue-700">₹{cartTotal}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setCart([])}
                    className="px-3 py-1.5 border border-neutral-300 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                  >
                    કાર્ટ સાફ કરો
                  </button>
                  <button
                    onClick={handleGeneratePOSBill}
                    className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-black flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-4 h-4" />
                    <span>બિલ બનાવો અને પ્રિન્ટ કરો</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ========================================== */}
          {/* RIGHT SIDEBAR (ADMIN PROFILE, BANNER, STATS) */}
          {/* ========================================== */}
          <aside className="md:col-span-2 space-y-2.5">
            
            {/* TOP ADMIN USER PROFILE CARD (Clickable to change Name / Upload Photo) */}
            <div
              onClick={() => setShowSettingsModal(true)}
              className="bg-white border border-neutral-300 rounded p-2.5 text-center shadow-2xs space-y-2 cursor-pointer hover:border-blue-500 transition-colors group relative"
              title="Click to edit Admin profile & photo"
            >
              <div className="w-14 h-14 rounded-full border border-neutral-300 mx-auto flex items-center justify-center text-xs font-black text-neutral-700 bg-neutral-50 overflow-hidden relative">
                {storeSettings.adminProfileImageUrl ? (
                  <img
                    src={storeSettings.adminProfileImageUrl}
                    alt={storeSettings.ownerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>Admin</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black transition-opacity">
                  ફોટો
                </div>
              </div>
              <div className="bg-[#0B1E48] text-white text-xs font-black py-1 px-2 rounded shadow-xs">
                {storeSettings.ownerName}
              </div>
            </div>

            {/* CLICKABLE AD BANNER BOX (Upload Banner Photo / Text) */}
            <div
              onClick={() => setShowBannerEditModal(true)}
              className="border border-dashed border-orange-400 bg-orange-50/50 rounded p-2 text-center cursor-pointer hover:bg-orange-100/60 transition-colors overflow-hidden"
              title="Click to edit banner text and upload image"
            >
              {storeSettings.bannerImageUrl ? (
                <img
                  src={storeSettings.bannerImageUrl}
                  alt="Banner"
                  className="w-full h-16 object-cover rounded mb-1"
                />
              ) : null}
              <div className="text-xs font-bold text-neutral-800 whitespace-pre-line leading-tight">
                {storeSettings.bannerText}
              </div>
            </div>

            {/* ============================================================= */}
            {/* 8 INTERACTIVE METRIC COUNTERS (CLICK ANY CARD TO EDIT VALUES) */}
            {/* ============================================================= */}
            <div className="grid grid-cols-2 gap-1.5 text-center">
              
              {/* 1. ડેઇલી સેલ */}
              <div
                onClick={() => handleStatClick('dailySales', 'ડેઇલી સેલ (Daily Sales)', stats.dailySales)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-2xs group"
                title="Click to manually edit Daily Sales"
              >
                <div className="text-[10px] font-bold text-neutral-700 flex items-center justify-center gap-1">
                  <span>📊</span> <span>ડેઇલી સેલ</span>
                </div>
                <div className="text-xs font-black text-neutral-900 mt-0.5 group-hover:text-blue-700">
                  ₹ {stats.dailySales.toFixed(2)}
                </div>
              </div>

              {/* 2. ડેઇલી ખરીદી */}
              <div
                onClick={() => handleStatClick('dailyPurchase', 'ડેઇલી ખરીદી (Daily Purchase)', stats.dailyPurchase)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-2xs group"
                title="Click to manually edit Daily Purchase"
              >
                <div className="text-[10px] font-bold text-neutral-700 flex items-center justify-center gap-1">
                  <span>🛒</span> <span>ડેઇલી ખરીદી</span>
                </div>
                <div className="text-xs font-black text-neutral-900 mt-0.5 group-hover:text-blue-700">
                  ₹ {stats.dailyPurchase.toFixed(2)}
                </div>
              </div>

              {/* 3. ચોખ્ખો નફો */}
              <div
                onClick={() => handleStatClick('netProfit', 'ચોખ્ખો નફો (Net Profit)', stats.netProfit)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-2xs group"
                title="Click to manually edit Net Profit"
              >
                <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1">
                  <span>💰</span> <span>ચોખ્ખો નફો</span>
                </div>
                <div className="text-xs font-black text-emerald-700 mt-0.5">
                  ₹ {stats.netProfit.toFixed(2)}
                </div>
              </div>

              {/* 4. કુલ નુકસાન */}
              <div
                onClick={() => handleStatClick('totalLoss', 'કુલ નુકસાન (Total Loss)', stats.totalLoss)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-red-500 hover:bg-red-50/30 transition-all shadow-2xs group"
                title="Click to manually edit Total Loss"
              >
                <div className="text-[10px] font-bold text-neutral-700 flex items-center justify-center gap-1">
                  <span>📉</span> <span>કુલ નુકસાન</span>
                </div>
                <div className="text-xs font-black text-neutral-900 mt-0.5 group-hover:text-red-600">
                  ₹ {stats.totalLoss.toFixed(2)}
                </div>
              </div>

              {/* 5. આઉટ સ્ટોક */}
              <div
                onClick={() => handleStatClick('outOfStock', 'આઉટ સ્ટોક (Out of Stock)', stats.outOfStock)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-red-500 hover:bg-red-50/30 transition-all shadow-2xs group"
                title="Click to edit Out of Stock count"
              >
                <div className="text-[10px] font-bold text-red-600 flex items-center justify-center gap-1">
                  <span>❌</span> <span>આઉટ સ્ટોક</span>
                </div>
                <div className="text-xs font-black text-red-600 mt-0.5">
                  {stats.outOfStock} આઇટમ
                </div>
              </div>

              {/* 6. ઓછો સ્ટોક */}
              <div
                onClick={() => handleStatClick('lowStock', 'ઓછો સ્ટોક (Low Stock)', stats.lowStock)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all shadow-2xs group"
                title="Click to edit Low Stock count"
              >
                <div className="text-[10px] font-bold text-orange-600 flex items-center justify-center gap-1">
                  <span>⚠️</span> <span>ઓછો સ્ટોક</span>
                </div>
                <div className="text-xs font-black text-orange-600 mt-0.5">
                  {stats.lowStock} આઇટમ
                </div>
              </div>

              {/* 7. વસ્તુ વેચાણી */}
              <div
                onClick={() => handleStatClick('itemsSold', 'વસ્તુ વેચાણી (Items Sold)', stats.itemsSold)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-2xs group"
                title="Click to edit Items Sold count"
              >
                <div className="text-[10px] font-bold text-neutral-700 flex items-center justify-center gap-1">
                  <span>📦</span> <span>વસ્તુ વેચાણી</span>
                </div>
                <div className="text-xs font-black text-neutral-900 mt-0.5">
                  {stats.itemsSold} નંગ
                </div>
              </div>

              {/* 8. કુલ બિલ */}
              <div
                onClick={() => handleStatClick('totalBills', 'કુલ બિલ (Total Bills)', stats.totalBills)}
                className="bg-white border border-neutral-300 rounded p-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-2xs group"
                title="Click to edit Total Bills count"
              >
                <div className="text-[10px] font-bold text-neutral-700 flex items-center justify-center gap-1">
                  <span>🧾</span> <span>કુલ બિલ</span>
                </div>
                <div className="text-xs font-black text-neutral-900 mt-0.5">
                  {stats.totalBills} બિલ
                </div>
              </div>

            </div>

            {/* MASTER RESET BUTTON */}
            <div className="pt-1">
              <button
                onClick={handleMasterResetStats}
                className="w-full text-center text-[10px] font-black text-neutral-500 hover:text-red-600 py-1 underline cursor-pointer"
              >
                રીસેટ સ્ટેટિસ્ટિક્સ (Reset All to 0)
              </button>
            </div>
          </aside>

        </main>
      ) : (
        /* ========================================================================= */
        /* CUSTOMER VIEW (LOCKED CLIENT SHOPPING WITH UPI QR & SCREENSHOT PAYWALL) */
        /* ========================================================================= */
        <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 space-y-6 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
            <div>
              <span className="bg-orange-500 text-black text-xs font-black px-2.5 py-0.5 rounded">
                ગ્રાહક ખરીદી પોર્ટલ
              </span>
              <h2 className="text-2xl font-black text-black mt-1">
                {storeSettings.storeNameGu} - ઓનલાઇન ઓર્ડર
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('admin')}
              className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>સંચાલક એડમિન પેનલ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Catalog list */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-black">ઉપલબ્ધ વસ્તુઓ પસંદ કરો:</h3>
                <span className="text-xs font-bold text-neutral-500">કુલ {posItems.length} આઇટમ્સ</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {posItems.map(item => (
                  <div
                    key={item.id}
                    className="border border-neutral-300 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-all bg-white"
                  >
                    <div className="text-center">
                      {item.imageUrl ? (
                        <div className="w-14 h-14 mx-auto rounded-lg overflow-hidden border mb-1 flex items-center justify-center bg-neutral-50">
                          <img src={item.imageUrl} alt={item.nameGu} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-3xl block mb-1">{item.icon || '📦'}</span>
                      )}
                      <h4 className="text-xs font-black text-black mt-1">{item.nameGu}</h4>
                      <p className="text-[10px] text-neutral-500 font-bold">{item.nameEn}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-black block">₹{item.price}</span>
                        <span className="text-[10px] text-neutral-500">/{item.unit}</span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-xs"
                      >
                        + ઉમેરો
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart & Paywall Checkout Form */}
            <div className="lg:col-span-5 bg-neutral-50 border border-neutral-300 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-black text-black flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-700" />
                  <span>તમારું કાર્ટ ({cart.length})</span>
                </h3>
                <span className="text-base font-black text-blue-800">કુલ: ₹{cartTotal}</span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-xs font-bold">
                  તમારું કાર્ટ ખાલી છે. ડાબી બાજુથી વસ્તુ પસંદ કરો.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cart Items list */}
                  <div className="divide-y divide-neutral-200 max-h-40 overflow-y-auto pr-1 text-xs">
                    {cart.map(c => (
                      <div key={c.product.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-black text-black">{c.product.nameGu}</div>
                          <div className="text-[10px] text-neutral-500 font-bold">₹{c.product.price} x {c.quantity}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(c.product.id, -1)}
                            className="w-6 h-6 bg-neutral-200 rounded font-black flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-black w-4 text-center">{c.quantity}</span>
                          <button
                            onClick={() => updateCartQty(c.product.id, 1)}
                            className="w-6 h-6 bg-orange-500 text-black rounded font-black flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Details Form */}
                  <div className="space-y-2.5 pt-2 border-t border-neutral-200 text-xs">
                    <div>
                      <label className="font-black block mb-0.5">તમારું પૂરું નામ (Full Name) *:</label>
                      <input
                        type="text"
                        placeholder="નામ દાખલ કરો"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded font-bold bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-black block mb-0.5">મોબાઇલ નંબર (Mobile) *:</label>
                      <input
                        type="text"
                        placeholder="૧૦ આંકડાનો મોબાઇલ નંબર"
                        value={customerMobile}
                        onChange={e => setCustomerMobile(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded font-bold bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-black block mb-0.5">સરનામું (ગામ / તાલુકો) *:</label>
                      <input
                        type="text"
                        placeholder="ગામ, તાલુકો, સોસાયટી"
                        value={customerAddress}
                        onChange={e => setCustomerAddress(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded font-bold bg-white focus:border-blue-600 outline-none"
                      />
                    </div>

                    {/* Payment Mode Selection */}
                    <div>
                      <label className="font-black block mb-0.5">ચુકવણી પદ્ધતિ પસંદ કરો:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'UPI', label: 'UPI / QR' },
                          { id: 'Cash', label: 'Cash (રોકડ)' },
                          { id: 'બાકી (Credit)', label: 'બાકી (Credit)' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setBillPaymentMode(m.id as any)}
                            className={`p-1.5 rounded text-[11px] font-bold border text-center transition-all ${
                              billPaymentMode === m.id
                                ? 'bg-blue-700 text-white border-blue-800 font-black'
                                : 'bg-white text-neutral-800 border-neutral-300'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic UPI QR Code box */}
                    <div className="bg-white border-2 border-dashed border-blue-500 rounded-xl p-3 text-center space-y-2">
                      <div className="text-xs font-black text-blue-900">
                        📱 સ્કેન કરીને ₹{cartTotal} ચૂકવો
                      </div>
                      {upiQrCodeUrl && (
                        <div className="w-32 h-32 mx-auto border p-1 rounded-lg bg-white shadow-xs">
                          <img src={upiQrCodeUrl} alt="UPI QR" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="text-[11px] font-black text-neutral-800">
                        UPI ID: <span className="text-blue-700 select-all">{storeSettings.upiId}</span>
                      </div>
                    </div>

                    {/* SCREENSHOT PROOF UPLOAD (MANDATORY PAYWALL LOCK) */}
                    <div className="space-y-1 pt-1">
                      <label className="font-black block text-xs text-neutral-900">
                        📸 પેમેન્ટ રસીદ / સ્ક્રીનશોટ અપલોડ કરો *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setPaymentProofFile(f);
                            const r = new FileReader();
                            r.onload = () => setPaymentProofPreview(r.result as string);
                            r.readAsDataURL(f);
                            showToast('✅ પેમેન્ટ સ્ક્રીનશોટ સિલેક્ટ થયો!');
                          }
                        }}
                        className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-black file:bg-orange-500 file:text-black hover:file:bg-orange-600 cursor-pointer"
                      />
                      {paymentProofPreview && (
                        <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>સ્ક્રીનશોટ જોડાયેલ છે</span>
                        </div>
                      )}
                    </div>

                    {/* FINAL WHATSAPP SUBMIT BUTTON (LOCKED IF NO SCREENSHOT) */}
                    <button
                      disabled={!paymentProofFile && !paymentProofPreview}
                      onClick={handleCustomerWhatsAppOrder}
                      className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                        paymentProofFile || paymentProofPreview
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                          : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>📲 ઓર્ડર કન્ફર્મ કરો (WhatsApp)</span>
                    </button>
                    {(!paymentProofFile && !paymentProofPreview) && (
                      <p className="text-[10px] text-center text-red-600 font-bold">
                        ⚠️ ઓર્ડર મોકલવા માટે પેમેન્ટનો સ્ક્રીનશોટ અપલોડ કરવો જરૂરી છે.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. EDIT ITEM MODAL (NAME, PRICE, COST, STOCK, EMOJI, CUSTOM IMAGE UPLOAD) */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-2 border-black shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-black flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-700" />
                <span>આઇટમ વિગતો અને ફોટો બદલો</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">આઇટમ નામ (ગુજરાતી):</label>
                <input
                  type="text"
                  value={editingItem.nameGu}
                  onChange={e => setEditingItem({ ...editingItem, nameGu: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">English Name:</label>
                <input
                  type="text"
                  value={editingItem.nameEn}
                  onChange={e => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">વેચાણ ભાવ (₹):</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full p-2 border rounded font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">ખરીદ ભાવ (₹):</label>
                  <input
                    type="number"
                    value={editingItem.costPrice}
                    onChange={e => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">સ્ટોક (Stock):</label>
                  <input
                    type="text"
                    value={editingItem.stock}
                    onChange={e => setEditingItem({ ...editingItem, stock: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) })}
                    className="w-full p-2 border rounded font-bold"
                  />
                </div>
              </div>

              {/* Item Photo Upload */}
              <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200">
                <label className="font-bold block mb-1">આઇટમ ફોટો (Upload Custom Image):</label>
                <div className="flex items-center gap-3">
                  {editingItem.imageUrl ? (
                    <img src={editingItem.imageUrl} alt="Preview" className="w-12 h-12 rounded object-cover border" />
                  ) : (
                    <div className="text-2xl">{editingItem.icon || '📦'}</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileUpload(e, 'editingProduct')}
                    className="text-xs file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-700 file:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={e => handleDeleteItem(editingItem.id, editingItem.nameGu, e)}
                className="text-red-600 font-bold hover:underline flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ડીલીટ કરો</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 border rounded text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  onClick={handleSaveItemEdit}
                  className="px-4 py-1.5 bg-[#0B1E48] text-white rounded text-xs font-black shadow"
                >
                  સેવ કરો
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ON-CLICK STAT OVERRIDE MODAL (CLICK ANY STATISTIC COUNTER TO EDIT) */}
      {/* ========================================================================= */}
      {editStatKey && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full border-2 border-black shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-black">
                ✏️ {editStatLabel} બદલો
              </h3>
              <button onClick={() => setEditStatKey(null)} className="text-neutral-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">નવી કિંમત / આંકડો દાખલ કરો:</label>
              <input
                type="number"
                step="any"
                value={editStatValue}
                onChange={e => setEditStatValue(e.target.value)}
                className="w-full text-base font-black p-2 border-2 border-black rounded focus:ring-2 focus:ring-blue-600 outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditStatKey(null)}
                className="px-3 py-1.5 border rounded text-xs font-bold"
              >
                રદ કરો
              </button>
              <button
                onClick={handleSaveStat}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-black shadow"
              >
                અપડેટ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BANNER EDIT MODAL (PHOTO & TEXT) */}
      {/* ========================================================================= */}
      {showBannerEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full border-2 border-black shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-black">
                🖼️ જાહેરાત બેનર એડિટ & ફોટો અપલોડ
              </h3>
              <button onClick={() => setShowBannerEditModal(false)} className="text-neutral-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">બેનર લખાણ (Banner Text):</label>
                <textarea
                  rows={3}
                  value={storeSettings.bannerText}
                  onChange={e => setStoreSettings({ ...storeSettings, bannerText: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">બેનર ફોટો અપલોડ (Upload Image):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageFileUpload(e, 'bannerImage')}
                  className="w-full text-xs"
                />
              </div>

              {storeSettings.bannerImageUrl && (
                <div className="relative">
                  <img src={storeSettings.bannerImageUrl} alt="Banner Preview" className="w-full h-24 object-cover rounded border" />
                  <button
                    onClick={() => setStoreSettings({ ...storeSettings, bannerImageUrl: '' })}
                    className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
                  >
                    હટાવો
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowBannerEditModal(false)}
                className="px-4 py-1.5 bg-[#0B1E48] text-white rounded text-xs font-black shadow"
              >
                સેવ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. FULL STORE SETTINGS MODAL (UPI ID, PHONE, ADDRESS, OWNER NAME, ETC.) */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full border-2 border-black shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-black flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-600" />
                <span>દુકાન & વેબસાઇટ સેટિંગ્સ (Store Settings)</span>
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-orange-50 p-2.5 rounded border border-orange-200">
                <label className="font-black text-blue-900 block mb-1">
                  💳 UPI ID (આ UPI પર ગ્રાહકોના પૈસા જમા થશે):
                </label>
                <input
                  type="text"
                  value={storeSettings.upiId}
                  onChange={e => setStoreSettings({ ...storeSettings, upiId: e.target.value })}
                  placeholder="8140430395@apl"
                  className="w-full p-2 border-2 border-blue-600 rounded font-black text-sm bg-white"
                />
                <span className="text-[10px] text-neutral-600 mt-1 block font-bold">
                  નોંધ: આ UPI ID બદલવાથી ગ્રાહક વ્યૂ અને બિલના બધા QR કોડ તરત જ નવા UPI સાથે જોડાઈ જશે.
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">દુકાન માલિક / એડમિન નામ:</label>
                <input
                  type="text"
                  value={storeSettings.ownerName}
                  onChange={e => setStoreSettings({ ...storeSettings, ownerName: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">સંપર્ક મોબાઇલ નંબર:</label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={e => setStoreSettings({ ...storeSettings, phone: e.target.value, phoneDisplay: `+૯૧ ${e.target.value}` })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">સરનામું (Strict Address Match):</label>
                <textarea
                  rows={2}
                  value={storeSettings.address}
                  onChange={e => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">ઉપરની દોડતી જાહેરાત પટ્ટી (Marquee Ticker Text):</label>
                <textarea
                  rows={2}
                  value={storeSettings.marqueeText}
                  onChange={e => setStoreSettings({ ...storeSettings, marqueeText: e.target.value })}
                  className="w-full p-2 border rounded font-bold"
                />
              </div>

              {/* Admin Profile Image Upload */}
              <div className="p-2 border rounded bg-neutral-50 flex items-center justify-between">
                <div>
                  <label className="font-bold block">એડમિન પ્રોફાઇલ ફોટો:</label>
                  <span className="text-[10px] text-neutral-500">Bharat Chaudhary photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageFileUpload(e, 'adminProfile')}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast('💾 સેટિંગ્સ સફળતાપૂર્વક સેવ થઈ ગયા!');
                }}
                className="px-5 py-2 bg-[#0B1E48] hover:bg-blue-900 text-white rounded text-xs font-black shadow"
              >
                સેવ કરો અને લાગુ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PRINTABLE INVOICE / RECEIPT MODAL (GST, LOGO, UPI QR, CASH/CREDIT) */}
      {/* ========================================================================= */}
      {activePrintInvoice && (
        <div id="printable-invoice" className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto border-2 border-black p-6 rounded-xl space-y-4 text-black bg-white">
            
            {/* INVOICE HEADER */}
            <div className="text-center border-b-2 border-black pb-3 space-y-1">
              <div className="flex justify-center items-center gap-2">
                {storeSettings.leftLogoUrl && (
                  <img src={storeSettings.leftLogoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                )}
                <h2 className="text-xl font-black text-black uppercase">
                  {storeSettings.storeNameEn}
                </h2>
              </div>
              <p className="text-xs font-bold text-neutral-800">{storeSettings.storeNameGu} - {storeSettings.tagline}</p>
              <p className="text-[11px] font-bold text-neutral-700">{storeSettings.address}</p>
              <p className="text-xs font-black">📞 મો. {storeSettings.phoneDisplay} | GSTIN: {storeSettings.gstNumber}</p>
            </div>

            {/* BILL DETAILS */}
            <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
              <div>
                <div><strong>બિલ નં:</strong> {activePrintInvoice.invoiceNo}</div>
                <div><strong>ગ્રાહક:</strong> {activePrintInvoice.customerName}</div>
                <div><strong>મોબાઇલ:</strong> +91 {activePrintInvoice.mobile}</div>
              </div>
              <div className="text-right">
                <div><strong>તારીખ:</strong> {activePrintInvoice.date}</div>
                <div><strong>ચુકવણી:</strong> <span className="font-black underline">{activePrintInvoice.paymentMode}</span></div>
                <div><strong>સ્ટેટસ:</strong> {activePrintInvoice.paymentStatus}</div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-1">ક્રમ</th>
                  <th className="py-1">વિગત (Item)</th>
                  <th className="py-1 text-center">જથ્થો (Qty)</th>
                  <th className="py-1 text-right">ભાવ (₹)</th>
                  <th className="py-1 text-right">રકમ (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300 font-bold">
                {activePrintInvoice.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-1">{idx + 1}</td>
                    <td className="py-1">{it.name}</td>
                    <td className="py-1 text-center">{it.qty}</td>
                    <td className="py-1 text-right">₹{it.price}</td>
                    <td className="py-1 text-right font-black">₹{it.qty * it.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className="border-t-2 border-black pt-2 flex justify-between items-center text-sm font-black">
              <div>
                <span className="text-xs font-bold block">પેમેન્ટ મોડ: {activePrintInvoice.paymentMode}</span>
                <span className="text-[11px] text-neutral-600">મુલાકાત બદલ આભાર! 🙏</span>
              </div>
              <div className="text-right">
                <div>કુલ રકમ: ₹{activePrintInvoice.total}/-</div>
              </div>
            </div>

            {/* QR Code on Invoice */}
            <div className="border-t pt-2 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold block">UPI દ્વારા પેમેન્ટ કરો:</span>
                <span className="text-[10px] text-neutral-600">{storeSettings.upiId}</span>
              </div>
              {upiQrCodeUrl && (
                <img src={upiQrCodeUrl} alt="QR" className="w-16 h-16 border rounded" />
              )}
            </div>

            {/* ACTION BUTTONS (Hidden in Print) */}
            <div className="pt-3 border-t flex justify-end gap-2 no-print">
              <button
                onClick={() => setActivePrintInvoice(null)}
                className="px-4 py-1.5 border rounded text-xs font-bold"
              >
                બંધ કરો
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-black flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>પ્રિન્ટ કરો (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. STRICT FOOTER (EXACT MATCH) */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-neutral-300 py-2 text-[11px] font-bold text-neutral-800 no-print">
        <div className="max-w-[1550px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Strict Address */}
          <div className="flex items-center gap-1 text-center sm:text-left">
            <span className="text-red-600">📍</span>
            <span className="font-extrabold">સરનામું:</span>
            <span>{storeSettings.address}</span>
          </div>

          {/* Phone & Policies */}
          <div className="flex items-center gap-4">
            <a href={`tel:+91${storeSettings.phone}`} className="flex items-center gap-1 hover:text-blue-700">
              <span>📞 મો. {storeSettings.phoneDisplay}</span>
            </a>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-600">🔒 પ્રાઇવેસી પોલિસી | નિયમો અને શરતો</span>
          </div>
        </div>

        <div className="max-w-[1550px] mx-auto px-4 mt-1 pt-1 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-600">
          <div>
            👨‍💻 <strong className="text-neutral-900">Developer:</strong>{' '}
            <span className="text-orange-600 font-extrabold">{storeSettings.developerCredit}</span>
            &nbsp;&nbsp;&nbsp;🕒 Last Update: <strong className="text-neutral-900">{storeSettings.lastUpdate}</strong>
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <div className="border border-neutral-300 rounded px-2 py-0.5 bg-neutral-50 flex items-center gap-1 font-bold">
              <span>👁️ Visitor Counter:</span>
              <span className="text-blue-800 font-black">{visitorCount}</span>
            </div>
            <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-black">
              ✨ Powered by Netlify
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
