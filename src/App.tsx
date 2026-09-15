import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ShoppingCart,
  Trash2,
  Phone,
  Lock,
  Unlock,
  Printer,
  Search,
  FileText,
  Sparkles,
  LogOut,
  Image as ImageIcon,
  Settings,
  Edit3,
  X,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Clock,
  User,
  Plus,
  Minus,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  Tag,
  Store,
  ChevronRight,
  Camera,
  Upload,
  BarChart3,
  Download,
  Receipt,
  Truck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Filter,
  Server,
  Share2,
  Newspaper
} from 'lucide-react';

import { ProductItem, CartItem, OrderRecord, StoreSettings, BusinessStats, ExpenseRecord, PurchaseRecord, TrashRecord, PrintJobRecord, PrintJobFile, BillItem } from './types';
import { DEFAULT_STORE_SETTINGS, INITIAL_PRODUCTS, INITIAL_STATS, INITIAL_ORDERS, INITIAL_PRINT_JOBS } from './data';
import { InvoiceModal } from './components/InvoiceModal';
import { CartDrawer } from './components/CartDrawer';
import { ImageCropModal } from './components/ImageCropModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { TrashModal } from './components/TrashModal';
import { DhamakaOfferModal } from './components/DhamakaOfferModal';
import { BillSettingsModal } from './components/BillSettingsModal';
import { ConfirmDeleteModal, DeleteTargetInfo } from './components/ConfirmDeleteModal';
import { OnlinePrintModal } from './components/OnlinePrintModal';
import { AdminPrintJobsModal } from './components/AdminPrintJobsModal';
import { MultiPlatformSyncModal } from './components/MultiPlatformSyncModal';
import { RojmelKhataModal } from './components/RojmelKhataModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { MobilePosterWidget } from './components/MobilePosterWidget';
import { BannerSlider } from './components/BannerSlider';
import { StoryWidget } from './components/StoryWidget';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RojmelEntry, KhataAccount, KhataTransaction } from './types';
import { useFirebaseSync } from './hooks/useFirebaseSync';

export default function App() {
  // Navigation View: Default to 'customer' for all visitors
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'gst_bill' | 'purchase' | 'expenses' | 'settings'>('customer');
  
  // Admin Password & Lock State (Default: Bharat@1994)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Online Print Customer & Admin Print Job States
  const [showOnlinePrintModal, setShowOnlinePrintModal] = useState<boolean>(false);
  const [showAdminPrintJobsModal, setShowAdminPrintJobsModal] = useState<boolean>(false);
  const [showMultiPlatformSyncModal, setShowMultiPlatformSyncModal] = useState<boolean>(false);
  const [printJobs, setPrintJobs] = useFirebaseSync<PrintJobRecord[]>('printJobs', 'prisha_print_jobs_v1', INITIAL_PRINT_JOBS);

  // Ensure clean initial state (no starter sample mock print jobs)
  useEffect(() => {
    if (printJobs && printJobs.some(j => 
      j.id === 'prn-demo-1' || 
      j.jobNo === 'PRN-8821' || 
      j.jobNo === 'PRN-6065' || 
      j.customerName?.toLowerCase().includes('sample') ||
      j.files?.some(f => f.fileName?.toLowerCase().includes('sample'))
    )) {
      const cleaned = printJobs.filter(j => 
        j.id !== 'prn-demo-1' && 
        j.jobNo !== 'PRN-8821' && 
        j.jobNo !== 'PRN-6065' && 
        !j.customerName?.toLowerCase().includes('sample') &&
        !j.files?.some(f => f.fileName?.toLowerCase().includes('sample'))
      );
      setPrintJobs(cleaned);
    }
  }, [printJobs]);

  // Order Tracking & Admin Order Management States
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'online' | 'counter'>('all');

  // Trash / Recycle Bin State
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [trashList, setTrashList] = useFirebaseSync<TrashRecord[]>('trash', 'prisha_trash_v4', []);

  // Dhamaka Offer Edit Modal State
  const [showDhamakaEditModal, setShowDhamakaEditModal] = useState<boolean>(false);

  // Bill Settings & Customization Modal State
  const [showBillSettingsModal, setShowBillSettingsModal] = useState<boolean>(false);

  // In-App Confirm Delete Modal State (Works 100% reliably in all browsers/iframes)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DeleteTargetInfo | null>(null);

  // Store Settings (Full editable from Admin)
  const [storeSettings, setStoreSettings] = useFirebaseSync<StoreSettings>('storeSettings', 'prisha_store_settings_v4', DEFAULT_STORE_SETTINGS);

  // Products & Inventory state
  const [posItems, setPosItems] = useFirebaseSync<ProductItem[]>('products', 'prisha_products_v4', INITIAL_PRODUCTS);

  // Business Statistics State
  const [stats, setStats] = useFirebaseSync<BusinessStats>('stats', 'prisha_stats_v4', INITIAL_STATS);

  // Orders & Invoices State
  const [orders, setOrders] = useFirebaseSync<OrderRecord[]>('orders', 'prisha_orders_v4', INITIAL_ORDERS);

  // Clean old sample/demo orders if present
  useEffect(() => {
    if (orders && orders.some(o => 
      o.id === 'ord-101' || 
      o.invoiceNo === 'prisha000001' || 
      o.customerName?.toLowerCase().includes('sample') ||
      o.notes?.includes('PRN-6065') ||
      o.notes?.toLowerCase().includes('sample') ||
      o.items?.some(i => i.name.toLowerCase().includes('sample document') || i.name.toLowerCase().includes('sample'))
    )) {
      const cleanedOrders = orders.filter(o => 
        o.id !== 'ord-101' && 
        o.invoiceNo !== 'prisha000001' && 
        !o.customerName?.toLowerCase().includes('sample') &&
        !o.notes?.includes('PRN-6065') &&
        !o.notes?.toLowerCase().includes('sample') &&
        !o.items?.some(i => i.name.toLowerCase().includes('sample document') || i.name.toLowerCase().includes('sample'))
      );
      setOrders(cleanedOrders);
    }
  }, [orders]);

  // Expenses & Purchases
  const [expenses, setExpenses] = useFirebaseSync<ExpenseRecord[]>('expenses', 'prisha_expenses_v5', []);
  const [purchases, setPurchases] = useFirebaseSync<PurchaseRecord[]>('purchases', 'prisha_purchases_v5', []);

  // Rojmel (Daily Income/Expense) & Khata (Customer & Supplier Ledger) ERP States
  const [showRojmelModal, setShowRojmelModal] = useState<boolean>(false);
  const [showStoreSettingsModal, setShowStoreSettingsModal] = useState<boolean>(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);
  const [rojmelEntries, setRojmelEntries] = useFirebaseSync<RojmelEntry[]>('rojmel', 'prisha_rojmel_v1', []);
  const [khataAccounts, setKhataAccounts] = useFirebaseSync<KhataAccount[]>('khata_accounts', 'prisha_khata_accounts_v2', []);
  const [khataTransactions, setKhataTransactions] = useFirebaseSync<KhataTransaction[]>('khata_tx', 'prisha_khata_tx_v1', []);

  // Search & Filter Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');


  // Auto ERP Real-time Calculations (100% NaN-proof)
  const now = new Date();
  const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const getStartOfWeek = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return getStartOfDay(x); };
  const getStartOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const getStartOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1).getTime();

  let calcTodaySales = 0;
  let calcWeekSales = 0;
  let calcMonthSales = 0;
  let calcYearSales = 0;

  orders.forEach(o => {
    let time = 0;
    if (o && o.id && typeof o.id === 'string' && o.id.startsWith('ord-')) {
      const parts = o.id.split('-');
      if (parts[1]) time = parseInt(parts[1], 10);
    }
    if (!time || isNaN(time)) time = now.getTime(); // fallback

    const orderTotal = Number(o.total || 0);
    if (!isNaN(orderTotal) && orderTotal > 0) {
      if (time >= getStartOfDay(now)) calcTodaySales += orderTotal;
      if (time >= getStartOfWeek(now)) calcWeekSales += orderTotal;
      if (time >= getStartOfMonth(now)) calcMonthSales += orderTotal;
      if (time >= getStartOfYear(now)) calcYearSales += orderTotal;
    }
  });

  // Purchase/Cost Stock Value (ખરીદ મૂલ્ય) & Selling Stock Value (વેચાણ મૂલ્ય / MRP)
  const calcCostStockValue = posItems.reduce((acc, item) => {
    const stock = Number(item.stock || 0);
    const cost = Number(item.costPrice || 0);
    return acc + (isNaN(stock) || isNaN(cost) ? 0 : stock * cost);
  }, 0);

  const calcSellingStockValue = posItems.reduce((acc, item) => {
    const stock = Number(item.stock || 0);
    const price = Number(item.price || item.mrp || 0);
    return acc + (isNaN(stock) || isNaN(price) ? 0 : stock * price);
  }, 0);

  const calcTotalStockUnits = posItems.reduce((acc, item) => {
    const stock = Number(item.stock || 0);
    return acc + (isNaN(stock) ? 0 : stock);
  }, 0);

  const displayTodaySales = (isNaN(calcTodaySales) ? 0 : calcTodaySales) + (Number(stats?.correctionDaily) || 0);
  const displayWeekSales = (isNaN(calcWeekSales) ? 0 : calcWeekSales) + (Number(stats?.correctionWeekly) || 0);
  const displayMonthSales = (isNaN(calcMonthSales) ? 0 : calcMonthSales) + (Number(stats?.correctionMonthly) || 0);
  const displayYearSales = (isNaN(calcYearSales) ? 0 : calcYearSales) + (Number(stats?.correctionYearly) || 0);
  const displayCostStockValue = (isNaN(calcCostStockValue) ? 0 : calcCostStockValue) + (Number(stats?.correctionStockVal) || 0);
  const displaySellingStockValue = isNaN(calcSellingStockValue) ? 0 : calcSellingStockValue;


  // Customer Shopping Cart & UI State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
  const [isSuccessModal, setIsSuccessModal] = useState<boolean>(false);

  // Modals and interactive editing state for Admin
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [editStatKey, setEditStatKey] = useState<string | null>(null);
  const [editStatLabel, setEditStatLabel] = useState('');
  const [editStatValue, setEditStatValue] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBannerEditModal, setShowBannerEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Image Cropper & Zoom state
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
    aspectPreset: 'square' | 'banner' | 'standard' | 'free';
    target: 'leftLogo' | 'rightLogo' | 'bannerImage' | 'customQr' | 'signature' | 'editingProduct' | 'newProduct' | null;
  }>({
    isOpen: false,
    imageSrc: '',
    title: '',
    aspectPreset: 'square',
    target: null
  });

  // Fast new product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdEnName, setNewProdEnName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('50');
  const [newProdCost, setNewProdCost] = useState('35');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdBulkPricing, setNewProdBulkPricing] = useState('');
  const [newProdIsHidden, setNewProdIsHidden] = useState(false);
  const [newProdIcon, setNewProdIcon] = useState('📦');
  const [newProdImage, setNewProdImage] = useState<string>('');
  const [newProdUnit, setNewProdUnit] = useState('નંગ');
  const [newProdCategory, setNewProdCategory] = useState<string>('પેન & સ્ટેશનરી');
  const [newProdBadge, setNewProdBadge] = useState('');

  // POS Direct Counter Billing Form & In-Bill Item Selection
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerMobile, setPosCustomerMobile] = useState('');
  const [posPaymentMode, setPosPaymentMode] = useState<'Cash' | 'UPI' | 'બાકી (Credit)' | 'Online'>('Cash');
  const [posDiscount, setPosDiscount] = useState<number>(0);

  // Dedicated POS in-counter bill items list
  const [posBillItems, setPosBillItems] = useState<{
    id: string;
    product?: ProductItem;
    name: string;
    qty: number;
    price: number;
    unit: string;
  }[]>([]);
  const [posSelectedProdId, setPosSelectedProdId] = useState<string>('');
  const [posSelectedQty, setPosSelectedQty] = useState<number>(1);
  const [showCustomPosInput, setShowCustomPosInput] = useState<boolean>(false);
  const [customPosName, setCustomPosName] = useState<string>('');
  const [customPosPrice, setCustomPosPrice] = useState<string>('50');
  const [customPosQty, setCustomPosQty] = useState<string>('1');

  // Visitor Counter - increments realistically on each load / visit
  const [visitorCount, setVisitorCount] = useState<string>(() => {
    const saved = localStorage.getItem('prisha_visitor_count_v4');
    if (!saved) {
      const initial = '1000000156';
      localStorage.setItem('prisha_visitor_count_v4', initial);
      return initial;
    }
    const nextVal = (BigInt(saved) + BigInt(1)).toString();
    localStorage.setItem('prisha_visitor_count_v4', nextVal);
    return nextVal;
  });

  // Local Storage synchronization


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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
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

  // Handle Login Password Verification
  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPass = storeSettings.adminPassword || 'Bharat@1994';
    if (enteredPassword === correctPass) {
      setIsAdminUnlocked(true);
      setShowPasswordModal(false);
      setPasswordError('');
      setActiveTab('admin');
      showToast('🔓 સ્વાગત છે ભરતભાઈ! એડમિન પેનલ અનલૉક થઈ ગઈ.');
    } else {
      setPasswordError('❌ ખોટો પાસવર્ડ! કૃપા કરીને સાચો પાસવર્ડ દાખલ કરો.');
    }
  };

  // Lock Admin and return to Customer view
  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setActiveTab('customer');
    setShowSettingsModal(false);
    showToast('🔒 લૉગઆઉટ સફળ! (ગ્રાહક મોડ ચાલુ છે)');
  };

  // Stock modification by Admin
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

  // Reorder Item (Up/Down)
  const handleMoveItem = (itemId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Create a working copy and ensure orderIdx is initialized
    let itemsCopy = [...posItems].sort((a, b) => (a.orderIdx ?? 9999) - (b.orderIdx ?? 9999));
    itemsCopy = itemsCopy.map((item, index) => ({ ...item, orderIdx: item.orderIdx ?? index }));

    const currentIndex = itemsCopy.findIndex(p => p.id === itemId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous
      const temp = itemsCopy[currentIndex].orderIdx;
      itemsCopy[currentIndex].orderIdx = itemsCopy[currentIndex - 1].orderIdx;
      itemsCopy[currentIndex - 1].orderIdx = temp;
    } else if (direction === 'down' && currentIndex < itemsCopy.length - 1) {
      // Swap with next
      const temp = itemsCopy[currentIndex].orderIdx;
      itemsCopy[currentIndex].orderIdx = itemsCopy[currentIndex + 1].orderIdx;
      itemsCopy[currentIndex + 1].orderIdx = temp;
    }

    setPosItems(itemsCopy);
  };

  // Delete an Item completely -> Opens In-App Confirm Modal -> Moves to Trash Bin (Recycle Bin)
  const handleDeleteItem = (itemId: string, itemName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemToDelete = posItems.find(p => p.id === itemId);
    if (!itemToDelete) return;

    setDeleteConfirmTarget({
      type: 'product',
      id: itemId,
      title: itemToDelete.nameGu,
      subtitle: `ભાવ: ₹${itemToDelete.price} | સ્ટોક: ${itemToDelete.stock} ${itemToDelete.unit} | કેટેગરી: ${itemToDelete.category}`,
      data: itemToDelete
    });
  };

  // Fast Add Product Form Handler
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('⚠️ કૃપા કરીને પ્રોડક્ટનું નામ દાખલ કરો!');
      return;
    }

    const newItem: ProductItem = {
      id: `prod-${Date.now()}`,
      nameGu: newProdName,
      nameEn: newProdEnName || newProdName,
      category: newProdCategory as any,
      price: Number(newProdPrice) || 0,
      costPrice: Number(newProdCost) || 0,
      stock: newProdCategory === 'service' ? 'સેવા' : Number(newProdStock) || 0,
      mrp: newProdMrp ? Number(newProdMrp) : undefined,
      bulkPricing: newProdBulkPricing || undefined,
      isHidden: newProdIsHidden,
      isService: newProdCategory === 'service',
      unit: newProdUnit || 'નંગ',
      icon: newProdIcon || '📦',
      imageUrl: newProdImage || undefined,
      badge: newProdBadge || undefined
    };

    setPosItems(prev => [newItem, ...prev]);
    setNewProdName('');
    setNewProdEnName('');
    setNewProdImage('');
    setNewProdBadge('');
    setNewProdMrp('');
    setNewProdBulkPricing('');
    setNewProdIsHidden(false);
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

  // Handle Image Uploads with Interactive Crop & Zoom Modal for Admin
  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'leftLogo' | 'rightLogo' | 'bannerImage' | 'customQr' | 'editingProduct' | 'newProduct' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        const titleMap: Record<string, string> = {
          leftLogo: 'ડાબો લોગો ફોટો ક્રોપ અને ઝૂમ કરો (Left Logo)',
          rightLogo: 'જમણો લોગો ફોટો ક્રોપ અને ઝૂમ કરો (Right Logo)',
          bannerImage: 'દુકાન પ્રોમો બેનર ક્રોપ અને ઝૂમ કરો (Banner)',
          customQr: 'કસ્ટમ QR કોડ ફોટો ક્રોપ કરો (UPI QR)',
          editingProduct: 'પ્રોડક્ટ ફોટો ક્રોપ અને ઝૂમ કરો',
          newProduct: 'નવી પ્રોડક્ટ ફોટો ક્રોપ અને ઝૂમ કરો',
          signature: 'અધિકૃત સહી / સ્ટેમ્પ ક્રોપ અને ઝૂમ કરો (Signature)'
        };

        setCropModalData({
          isOpen: true,
          imageSrc: base64,
          title: titleMap[target] || 'ફોટો ક્રોપ અને ઝૂમ કરો',
          aspectPreset: target === 'bannerImage' ? 'banner' : 'square',
          target
        });
        e.target.value = '';
      } catch (err) {
        console.error(err);
        showToast('❌ ફોટો વાંચવામાં ભૂલ આવી.');
      }
    }
  };

  // Handle final cropped image save
  const handleCropComplete = (croppedBase64: string) => {
    const target = cropModalData.target;
    if (!target) return;

    if (target === 'leftLogo') {
      setStoreSettings(prev => ({ ...prev, leftLogoUrl: croppedBase64 }));
      showToast('✅ ડાબો લોગો ફોટો અપડેટ થયો!');
    } else if (target === 'rightLogo') {
      setStoreSettings(prev => ({ ...prev, rightLogoUrl: croppedBase64 }));
      showToast('✅ જમણો લોગો ફોટો અપડેટ થયો!');
    } else if (target === 'bannerImage') {
      setStoreSettings(prev => ({ ...prev, bannerImageUrl: croppedBase64 }));
      showToast('✅ જાહેરાત બેનર ફોટો અપડેટ થયો!');
    } else if (target === 'customQr') {
      setStoreSettings(prev => ({ ...prev, customQrUrl: croppedBase64 }));
      showToast('✅ કસ્ટમ QR કોડ અપડેટ થયો!');
    } else if (target === 'signature') {
      setStoreSettings(prev => ({ ...prev, signatureUrl: croppedBase64 }));
      showToast('✅ અધિકૃત સહી / સ્ટેમ્પ અપડેટ થયો!');
    } else if (target === 'editingProduct' && editingItem) {
      setEditingItem({ ...editingItem, imageUrl: croppedBase64 });
      showToast('✅ પ્રોડક્ટ ફોટો ક્રોપ અને અપલોડ થયો!');
    } else if (target === 'newProduct') {
      setNewProdImage(croppedBase64);
      showToast('✅ નવી પ્રોડક્ટ ફોટો ક્રોપ અને અપલોડ થયો!');
    }

    setCropModalData(prev => ({ ...prev, isOpen: false }));
  };

  // Customer Cart Operations
  const addToCart = (product: ProductItem) => {
    setCart(prev => {
      const exist = prev.find(i => i.product.id === product.id);
      if (exist) {
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Friendly feedback without obstructing screen
    showToast(`🛒 "${product.nameGu}" કાર્ટમાં ઉમેરાયું!`);
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

  const removeCartItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
    showToast('🗑️ આઇટમ કાર્ટમાંથી દૂર કરી.');
  };

  // SEQUENTIAL ORDER INVOICE ID GENERATOR (Configurable prefix + sequential series)
  const getNextOrderNumber = (): string => {
    const seqKey = 'prisha_order_seq_v4';
    let currentSeq = Number(localStorage.getItem(seqKey));
    if (!currentSeq || isNaN(currentSeq) || currentSeq < 1) {
      currentSeq = storeSettings.nextInvoiceSeq || Math.max(orders.length + 1, 1);
    }
    const nextSeq = currentSeq + 1;
    localStorage.setItem(seqKey, String(nextSeq));
    
    // Auto-update storeSettings next sequence
    setStoreSettings(prev => ({ ...prev, nextInvoiceSeq: nextSeq }));

    const prefix = storeSettings.invoicePrefix?.trim() || 'prisha';
    return `${prefix}${String(currentSeq).padStart(6, '0')}`;
  };

  // CUSTOMER CONFIRM ORDER: Instant On-Screen Success & Sequential Invoice
  const handleCustomerConfirmOrder = (orderDetails: {
    customerName: string;
    mobile: string;
    address: string;
    paymentMode: 'UPI' | 'Cash';
    paymentScreenshot?: string;
  }) => {
    const orderId = getNextOrderNumber();
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const totalProfit = cart.reduce((sum, item) => sum + (Math.max(0, item.product.price - item.product.costPrice) * item.quantity), 0);

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

    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      invoiceNo: orderId,
      date: dateFormatted,
      customerName: orderDetails.customerName,
      mobile: orderDetails.mobile,
      address: orderDetails.address,
      items: cart.map(c => ({
        name: c.product.nameGu,
        qty: c.quantity,
        price: c.product.price,
        unit: c.product.unit,
        productId: c.product.id
      })),
      subtotal: totalAmount,
      discount: 0,
      tax: 0,
      total: totalAmount,
      paymentMode: orderDetails.paymentMode,
      paymentStatus: 'Paid',
      orderType: 'online',
      orderStatus: 'placed',
      paymentScreenshot: orderDetails.paymentScreenshot,
      statusUpdatedAt: dateFormatted
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update Stats
    setStats(s => ({
      ...s,
      dailySales: Number((s.dailySales + totalAmount).toFixed(2)),
      itemsSold: s.itemsSold + cart.reduce((acc, curr) => acc + curr.quantity, 0),
      totalBills: s.totalBills + 1,
      netProfit: Number((s.netProfit + totalProfit).toFixed(2))
    }));

    // Clear Cart and Close Drawer
    setCart([]);
    setIsCartDrawerOpen(false);

    // Open Instant Order Success & Printable Bill Modal on Screen!
    setActiveInvoiceOrder(newOrder);
    setIsSuccessModal(true);
    showToast(`🎉 ઓર્ડર #${orderId} કન્ફર્મ થઈ ગયો! નીચેથી બિલ પ્રિન્ટ કે સેવ કરો.`);
  };

  // =========================================================================
  // ONLINE PRINT JOBS HANDLERS
  // =========================================================================
  const handleSubmitPrintJob = (newJob: PrintJobRecord) => {
    setPrintJobs(prev => [newJob, ...prev]);
    showToast(`🎉 પ્રિન્ટ જોબ #${newJob.jobNo} સફળતાપૂર્વક અપલોડ થઈ ગયું!`);
  };

  const handleUpdatePrintJob = (jobId: string, updates: Partial<PrintJobRecord>) => {
    setPrintJobs(prev => prev.map(j => (j.id === jobId ? { ...j, ...updates } : j)));
    showToast('✅ પ્રિન્ટ જોબ વિગત અપડેટ થઈ ગઈ!');
  };

  const handleDeletePrintJob = (jobId: string) => {
    setPrintJobs(prev => prev.filter(j => j.id !== jobId));
    showToast('🗑️ પ્રિન્ટ જોબ ડિલીટ થઈ ગયો.');
  };

  const handleConvertPrintJobToInvoice = (job: PrintJobRecord, billItems: BillItem[], finalTotal: number) => {
    const orderId = getNextOrderNumber();
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newInvoice: OrderRecord = {
      id: `ord-prn-${Date.now()}`,
      invoiceNo: orderId,
      date: dateFormatted,
      customerName: job.customerName || 'Customer',
      mobile: job.mobile || storeSettings.phone,
      address: job.deliveryType === 'home_delivery' ? (job.address || 'Home Delivery') : 'દુકાન પિકઅપ (Tharad)',
      items: billItems,
      subtotal: finalTotal,
      discount: job.discount || 0,
      tax: 0,
      total: finalTotal,
      paymentMode: job.paymentMode || 'UPI',
      paymentStatus: 'Paid',
      orderType: 'online',
      orderStatus: 'delivered',
      statusUpdatedAt: dateFormatted,
      notes: `ઓનલાઇન પ્રિન્ટ જોબ #${job.jobNo}`
    };

    setOrders(prev => [newInvoice, ...prev]);
    
    // Update the job status
    handleUpdatePrintJob(job.id, {
      invoiceGenerated: true,
      invoiceNo: orderId,
      status: 'completed',
      paymentStatus: 'Paid'
    });

    // Update Daily Business Stats
    setStats(s => ({
      ...s,
      dailySales: Number((s.dailySales + finalTotal).toFixed(2)),
      itemsSold: s.itemsSold + billItems.reduce((acc, curr) => acc + curr.qty, 0),
      totalBills: s.totalBills + 1
    }));

    // Open 1-page Official Invoice Modal
    setActiveInvoiceOrder(newInvoice);
    setIsSuccessModal(false);
    setShowAdminPrintJobsModal(false);

    showToast(`🧾 સત્તાવાર ૧ પેજ બિલ #${orderId} સફળતાપૂર્વક બની ગયું!`);
  };

  // DELETE BILL / ORDER - Opens In-App Modal -> Auto-restocks and Moves to Trash Bin
  const handleDeleteOrder = (orderId: string) => {
    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete) return;

    setDeleteConfirmTarget({
      type: 'order',
      id: orderId,
      title: `બિલ #${orderToDelete.invoiceNo} - ${orderToDelete.customerName}`,
      subtitle: `કુલ રકમ: ₹${orderToDelete.total} | ${orderToDelete.items.length} આઇટમ્સ | ${orderToDelete.paymentMode}`,
      data: orderToDelete
    });
  };

  // RESTORE ITEMS FROM TRASH BIN
  const handleRestoreTrashRecord = (record: TrashRecord) => {
    if (record.type === 'product') {
      const prod: ProductItem = record.data;
      setPosItems(prev => [prod, ...prev.filter(p => p.id !== prod.id)]);
      setTrashList(prev => prev.filter(t => t.id !== record.id));
      showToast(`🔄 પ્રોડક્ટ "${prod.nameGu}" સ્ટોકમાં પાછી ઉમેરાઈ ગઈ!`);
    } else if (record.type === 'order') {
      const ord: OrderRecord = record.data;
      setOrders(prev => [ord, ...prev.filter(o => o.id !== ord.id)]);
      
      // Re-deduct stock for the restored order
      setPosItems(prev =>
        prev.map(p => {
          const matched = ord.items.find(i => i.name === p.nameGu || i.name === p.nameEn);
          if (matched && typeof p.stock === 'number') {
            return { ...p, stock: Math.max(0, p.stock - matched.qty) };
          }
          return p;
        })
      );

      setStats(s => ({
        ...s,
        dailySales: Number((s.dailySales + ord.total).toFixed(2)),
        totalBills: s.totalBills + 1,
        itemsSold: s.itemsSold + ord.items.reduce((acc, curr) => acc + curr.qty, 0)
      }));

      setTrashList(prev => prev.filter(t => t.id !== record.id));
      showToast(`🔄 બિલ #${ord.invoiceNo} ઓર્ડર લિસ્ટમાં પાછું આવી ગયું!`);
    } else if (record.type === 'expense') {
      const exp: ExpenseRecord = record.data;
      setExpenses(prev => [exp, ...prev.filter(e => e.id !== exp.id)]);
      setTrashList(prev => prev.filter(t => t.id !== record.id));
      showToast(`🔄 ખર્ચ રેકોર્ડ પાછો ઉમેરાઈ ગયો!`);
    } else if (record.type === 'khata_account') {
      const accData = record.data?.account || record.data;
      const txData = record.data?.transactions || [];
      if (accData) {
        setKhataAccounts(prev => [...prev.filter(a => a.id !== accData.id), accData]);
        if (txData && txData.length > 0) {
          const txIds = new Set(txData.map((t: any) => t.id));
          setKhataTransactions(prev => [...prev.filter(t => !txIds.has(t.id)), ...txData]);
        }
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(`🔄 ખાતું "${accData.name}" પાછું આવી ગયું!`);
      }
    } else if (record.type === 'khata_transaction') {
      const tx = record.data;
      if (tx) {
        setKhataTransactions(prev => [...prev.filter(t => t.id !== tx.id), tx]);
        // Re-apply balance
        setKhataAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            const txAmt = tx.type === 'jama' ? tx.amount : -tx.amount;
            return {
              ...a,
              balance: a.balance + txAmt,
              totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + tx.amount : (a.totalGiven || 0),
              totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + tx.amount : (a.totalReceived || 0)
            };
          }
          return a;
        }));
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(`🔄 ખાતાનો વ્યવહાર પાછો ઉમેરાઈ ગયો!`);
      }
    } else if (record.type === 'rojmel') {
      const entry = record.data;
      if (entry) {
        setRojmelEntries(prev => [...prev.filter(e => e.id !== entry.id), entry]);
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(`🔄 રોજમેળ એન્ટ્રી પાછી ઉમેરાઈ ગઈ!`);
      }
    }
  };

  // PERMANENT DELETE FROM TRASH - Opens In-App Modal
  const handlePermanentDeleteTrash = (record: TrashRecord) => {
    setDeleteConfirmTarget({
      type: 'trash_item',
      id: record.id,
      title: record.title,
      subtitle: record.summary,
      data: record
    });
  };

  // EMPTY ENTIRE TRASH BIN - Opens In-App Modal
  const handleEmptyAllTrash = () => {
    if (trashList.length === 0) {
      showToast('ℹ️ ટ્રેશ બિન પહેલેથી જ ખાલી છે.');
      return;
    }
    setDeleteConfirmTarget({
      type: 'all_trash',
      id: 'all',
      title: 'ટ્રેશ બિનની તમામ વસ્તુઓ',
      subtitle: `કુલ ${trashList.length} આઇટમ્સ કાયમી ડિલીટ થશે`
    });
  };

  // CENTRAL EXECUTION HANDLER FOR CONFIRMED DELETIONS (Works 100% reliably in all browsers/iframes)
  const handleExecuteConfirmedDelete = () => {
    if (!deleteConfirmTarget) return;

    const { type, id, data } = deleteConfirmTarget;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (type === 'product') {
      const itemToDelete: ProductItem = data || posItems.find(p => p.id === id);
      if (itemToDelete) {
        const trashRec: TrashRecord = {
          id: `trash-${Date.now()}`,
          type: 'product',
          title: itemToDelete.nameGu,
          deletedAt: dateFormatted,
          summary: `ભાવ: ₹${itemToDelete.price} | સ્ટોક: ${itemToDelete.stock} ${itemToDelete.unit} | કેટેગરી: ${itemToDelete.category}`,
          data: itemToDelete
        };
        setTrashList(prev => [trashRec, ...prev]);
        setPosItems(prev => prev.filter(item => item.id !== id));
        if (editingItem?.id === id) setEditingItem(null);
        showToast(`🗑️ "${itemToDelete.nameGu}" ડિલીટ થઈ ટ્રેશ બિનમાં ખસેડવામાં આવી!`);
      }
    } else if (type === 'order') {
      const orderToDelete: OrderRecord = data || orders.find(o => o.id === id);
      if (orderToDelete) {
        // Restore inventory stock for all items in the deleted order
        setPosItems(prev =>
          prev.map(p => {
            const matchedItem = orderToDelete.items.find(
              it => it.productId === p.id || it.name === p.nameGu || it.name === p.nameEn
            );
            if (matchedItem && typeof p.stock === 'number') {
              return { ...p, stock: p.stock + matchedItem.qty };
            }
            return p;
          })
        );
        
        // calculate profit to deduct
        const totalProfitToDeduct = orderToDelete.items.reduce((sum, item) => {
          if (item.productId) {
            const prod = posItems.find(p => p.id === item.productId);
            if (prod) {
              return sum + (Math.max(0, item.price - prod.costPrice) * item.qty);
            }
          }
          return sum + (item.price * item.qty * 0.1);
        }, 0);

        // Deduct from business stats
        setStats(s => ({
          ...s,
          dailySales: Math.max(0, Number((s.dailySales - orderToDelete.total).toFixed(2))),
          totalBills: Math.max(0, s.totalBills - 1),
          itemsSold: Math.max(
            0,
            s.itemsSold - orderToDelete.items.reduce((acc, curr) => acc + curr.qty, 0)
          ),
          netProfit: Math.max(0, Number((s.netProfit - totalProfitToDeduct).toFixed(2)))
        }));

        const trashRec: TrashRecord = {
          id: `trash-${Date.now()}`,
          type: 'order',
          title: `બિલ #${orderToDelete.invoiceNo} - ${orderToDelete.customerName}`,
          deletedAt: dateFormatted,
          summary: `રકમ: ₹${orderToDelete.total} | તારીખ: ${orderToDelete.date} | આઇટમ્સ: ${orderToDelete.items.length} | પેમેન્ટ: ${orderToDelete.paymentMode}`,
          data: orderToDelete
        };

        setTrashList(prev => [trashRec, ...prev]);
        setOrders(prev => prev.filter(o => o.id !== id));
        showToast(`🗑️ બિલ #${orderToDelete.invoiceNo} ડિલીટ થયું અને માલ સ્ટોકમાં જમા થયો!`);
      }
    } else if (type === 'expense') {
      const expToDelete: ExpenseRecord = data || expenses.find(e => e.id === id);
      if (expToDelete) {
        const trashRec: TrashRecord = {
          id: `trash-${Date.now()}`,
          type: 'expense',
          title: expToDelete.title,
          deletedAt: dateFormatted,
          summary: `રકમ: ₹${expToDelete.amount} | કેટેગરી: ${expToDelete.category} | તારીખ: ${expToDelete.date}`,
          data: expToDelete
        };
        setTrashList(prev => [trashRec, ...prev]);
        setExpenses(prev => prev.filter(e => e.id !== id));
        showToast(`🗑️ ખર્ચ એન્ટ્રી ટ્રેશ બિનમાં ખસેડાઈ!`);
      }
    } else if (type === 'trash_item') {
      setTrashList(prev => prev.filter(t => t.id !== id));
      showToast(`❌ આઇટમ કાયમી ધોરણે ડિલીટ થઈ ગઈ.`);
    } else if (type === 'all_trash') {
      setTrashList([]);
      showToast('🧹 ટ્રેશ બિન આખું ખાલી થઈ ગયું!');
    }

    setDeleteConfirmTarget(null);
  };

  // UPDATE ORDER STATUS (e.g. placed -> confirmed -> packed -> out_for_delivery -> delivered)
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderRecord['orderStatus']) => {
    const now = new Date();
    const timeFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            statusUpdatedAt: timeFormatted,
            ...(newStatus === 'confirmed' ? { paymentStatus: 'Paid' } : {})
          };
        }
        return o;
      })
    );
    showToast(`✅ ઓર્ડર સ્ટેટસ અપડેટ થઈ ગયું!`);
  };

  // DIRECT INVENTORY STOCK NUMBER UPDATE (e.g. typing 100 directly)
  const handleDirectStockUpdate = (productId: string, newStockVal: string) => {
    const parsed = Number(newStockVal);
    setPosItems(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stock: isNaN(parsed) ? p.stock : Math.max(0, parsed)
          };
        }
        return p;
      })
    );
  };

  // SAVE EDITED ORDER
  const handleSaveOrderEdit = (updatedOrder: OrderRecord) => {
    setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
    setEditingOrder(null);
    showToast(`✅ બિલ #${updatedOrder.invoiceNo} અપડેટ થઈ ગયું!`);
  };

  // POS IN-BILL ITEM OPERATIONS
  const handlePosAddProduct = () => {
    if (!posSelectedProdId) {
      showToast('⚠️ કૃપા કરીને લિસ્ટમાંથી પ્રોડક્ટ પસંદ કરો!');
      return;
    }
    const prod = posItems.find(p => p.id === posSelectedProdId);
    if (!prod) return;

    const qty = Math.max(1, posSelectedQty || 1);
    setPosBillItems(prev => {
      const existing = prev.find(item => item.product?.id === prod.id);
      if (existing) {
        return prev.map(item =>
          item.product?.id === prod.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `pos-${Date.now()}-${Math.random()}`,
          product: prod,
          name: prod.nameGu,
          qty,
          price: prod.price,
          unit: prod.unit
        }
      ];
    });

    setPosSelectedQty(1);
    showToast(`➕ "${prod.nameGu}" (${qty} ${prod.unit}) બિલમાં ઉમેરાઈ!`);
  };

  const handlePosAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPosName.trim()) {
      showToast('⚠️ કૃપા કરીને વસ્તુનું નામ લખો!');
      return;
    }
    const price = Number(customPosPrice) || 0;
    const qty = Number(customPosQty) || 1;

    setPosBillItems(prev => [
      ...prev,
      {
        id: `pos-custom-${Date.now()}`,
        name: customPosName.trim(),
        qty,
        price,
        unit: 'નંગ'
      }
    ]);

    setCustomPosName('');
    setCustomPosPrice('50');
    setCustomPosQty('1');
    setShowCustomPosInput(false);
    showToast(`➕ કસ્ટમ આઇટમ બિલમાં ઉમેરાઈ!`);
  };

  const handlePosUpdateItemQty = (index: number, delta: number) => {
    setPosBillItems(prev =>
      prev
        .map((item, idx) => {
          if (idx === index) {
            const nextQ = item.qty + delta;
            return nextQ > 0 ? { ...item, qty: nextQ } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof prev
    );
  };

  const handlePosRemoveItem = (index: number) => {
    setPosBillItems(prev => prev.filter((_, idx) => idx !== index));
    showToast('🗑️ આઇટમ બિલમાંથી કાઢી નાખી.');
  };

  const handlePosClearBill = () => {
    setPosBillItems([]);
    setPosCustomerName('');
    setPosCustomerMobile('');
    setPosDiscount(0);
    showToast('🧹 બિલ ક્લિયર થઈ ગયું.');
  };

  // POS DIRECT BILL GENERATOR (Admin) - Supports sequential order ID
  const handleGeneratePOSBill = () => {
    // Collect items either from posBillItems or fallback to cart
    const billItems = posBillItems.length > 0
      ? posBillItems.map(b => ({
          name: b.name,
          qty: b.qty,
          price: b.price,
          unit: b.unit,
          productId: b.product?.id
        }))
      : cart.map(c => ({
          name: c.product.nameGu,
          qty: c.quantity,
          price: c.product.price,
          unit: c.product.unit,
          productId: c.product.id
        }));

    if (billItems.length === 0) {
      showToast('⚠️ કૃપા કરીને બિલમાં વસ્તુઓ ઉમેરો!');
      return;
    }

    const orderId = getNextOrderNumber();
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const billSubtotal = billItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const finalTotal = Math.max(0, billSubtotal - posDiscount);
    
    // Calculate profit
    const totalProfit = billItems.reduce((sum, item) => {
      if (item.productId) {
        const prod = posItems.find(p => p.id === item.productId);
        if (prod) {
          return sum + (Math.max(0, item.price - prod.costPrice) * item.qty);
        }
      }
      return sum + (item.price * item.qty * 0.1); // Fallback 10% profit if custom item
    }, 0);

    // Deduct stock for inventory products
    setPosItems(prev =>
      prev.map(p => {
        const inB = billItems.find(b => b.productId === p.id || b.name === p.nameGu || b.name === p.nameEn);
        if (inB && typeof p.stock === 'number') {
          return { ...p, stock: Math.max(0, p.stock - inB.qty) };
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
      items: billItems.map(b => ({ name: b.name, qty: b.qty, price: b.price, unit: b.unit, productId: b.productId })),
      subtotal: billSubtotal,
      discount: posDiscount,
      tax: 0,
      total: finalTotal,
      paymentMode: posPaymentMode,
      paymentStatus: posPaymentMode === 'બાકી (Credit)' ? 'બાકી' : 'Paid',
      orderType: 'counter',
      orderStatus: 'delivered',
      statusUpdatedAt: dateFormatted
    };

    setOrders(prev => [inv, ...prev]);
    setActiveInvoiceOrder(inv);
    setIsSuccessModal(false);

    setStats(s => ({
      ...s,
      dailySales: Number((s.dailySales + finalTotal).toFixed(2)),
      itemsSold: s.itemsSold + billItems.reduce((acc, curr) => acc + curr.qty, 0),
      totalBills: s.totalBills + 1,
      netProfit: Number((s.netProfit + totalProfit).toFixed(2))
    }));

    setPosBillItems([]);
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

  // Filtered Items for Catalog & POS Grid
  const filteredItems = posItems.filter(item => {
    // If not admin, hide items marked as hidden
    if (!isAdminUnlocked && item.isHidden) return false;
    
    const matchesSearch =
      item.nameGu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  }).sort((a, b) => (a.orderIdx ?? 9999) - (b.orderIdx ?? 9999));

  const cartTotalAmount = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const getHeaderSizeClasses = () => {
    switch (storeSettings.headerNameSize) {
      case 'small': return 'text-lg sm:text-xl md:text-2xl';
      case 'medium': return 'text-xl sm:text-2xl md:text-3xl';
      case 'xl': return 'text-3xl sm:text-5xl md:text-6xl';
      case 'large': 
      default: return 'text-2xl sm:text-4xl md:text-5xl';
    }
  };

  const getSubHeaderSizeClasses = () => {
    switch (storeSettings.headerNameSize) {
      case 'small': return 'text-base sm:text-lg md:text-xl';
      case 'medium': return 'text-lg sm:text-xl md:text-2xl';
      case 'xl': return 'text-2xl sm:text-4xl md:text-5xl';
      case 'large': 
      default: return 'text-xl sm:text-3xl md:text-4xl';
    }
  };

  const getProductTextSizeClasses = () => {
    switch (storeSettings.productTextSize) {
      case 'small': return 'text-[10px] sm:text-[11px]';
      case 'large': return 'text-sm sm:text-base';
      case 'medium':
      default: return 'text-xs sm:text-sm';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      
      {showStoreSettingsModal && (
        <StoreSettingsModal
          isOpen={showStoreSettingsModal}
          onClose={() => setShowStoreSettingsModal(false)}
          settings={storeSettings}
          onSave={(updated) => {
            setStoreSettings(prev => ({ ...prev, ...updated }));
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL AMAZON / FLIPKART STYLE TOP HEADER */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-neutral-300 shadow-xs no-print sticky top-0 z-40">
        <div className="max-w-[1550px] mx-auto px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* LEFT LOGO (Admin Upload Triggerable - Enriched Size) */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdminUnlocked ? (
              <label className="cursor-pointer relative group" title="ડાબો લોગો બદલવા / ક્રોપ કરવા ક્લિક કરો">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageFileUpload(e, 'leftLogo')}
                />
                <div className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-orange-50 border-2 border-orange-500 flex flex-col items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative">
                  {storeSettings.leftLogoUrl ? (
                    <img src={storeSettings.leftLogoUrl} alt="Left Logo" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-xs font-black text-orange-600 leading-none">PRISHA</span>
                      <span className="text-sm sm:text-lg">🪪</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black transition-opacity">
                    બદલો
                  </div>
                </div>
              </label>
            ) : (
              <div className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-orange-50 border-2 border-orange-500 flex flex-col items-center justify-center p-1 shadow-2xs overflow-hidden">
                {storeSettings.leftLogoUrl ? (
                  <img src={storeSettings.leftLogoUrl} alt="Left Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <span className="text-[10px] sm:text-xs font-black text-orange-600 leading-none">PRISHA</span>
                    <span className="text-sm sm:text-lg">🪪</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CENTER STORE TITLE (LARGER, HIGH CONTRAST TYPOGRAPHY) */}
          <div className="text-center flex flex-col items-center flex-1 min-w-0 px-1">
            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center">
              <span className={`${getHeaderSizeClasses()} font-black text-[#EA580C] tracking-tight uppercase drop-shadow-xs`}>
                {storeSettings.storeNameEn.split(' ')[0] || 'PRISHA'}
              </span>
              <span className={`${getSubHeaderSizeClasses()} font-black text-[#1E40AF] tracking-tight uppercase truncate drop-shadow-xs`}>
                {storeSettings.storeNameEn.substring(storeSettings.storeNameEn.indexOf(' ') + 1) || 'STATIONERY & ONLINE SERVICES'}
              </span>
            </div>
            
            {/* Gujarati Subtitle & Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 mt-0.5 text-xs sm:text-sm font-bold text-neutral-800">
              <span className="text-orange-900 bg-orange-100/90 px-2.5 py-0.5 rounded-md border border-orange-300 font-black text-xs sm:text-sm">
                {storeSettings.storeNameGu}
              </span>
              <span className="hidden sm:inline text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 text-xs font-black">
                {storeSettings.tagline}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: RIGHT LOGO + CART + LOGIN/LOGOUT */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* RIGHT LOGO (Admin Upload Triggerable - Enriched Size) */}
            {isAdminUnlocked ? (
              <label className="cursor-pointer relative group" title="જમણો લોગો બદલવા / ક્રોપ કરવા ક્લિક કરો">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageFileUpload(e, 'rightLogo')}
                />
                <div className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-blue-50 border-2 border-blue-600 flex flex-col items-center justify-center p-1 shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative">
                  {storeSettings.rightLogoUrl ? (
                    <img src={storeSettings.rightLogoUrl} alt="Right Logo" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-xs font-black text-blue-700 leading-none">CSC</span>
                      <span className="text-sm sm:text-lg">🏪</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black transition-opacity">
                    બદલો
                  </div>
                </div>
              </label>
            ) : (
              <div className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-2xl bg-blue-50 border-2 border-blue-600 flex flex-col items-center justify-center p-1 shadow-2xs overflow-hidden">
                {storeSettings.rightLogoUrl ? (
                  <img src={storeSettings.rightLogoUrl} alt="Right Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <span className="text-[10px] sm:text-xs font-black text-blue-700 leading-none">CSC</span>
                    <span className="text-sm sm:text-lg">🏪</span>
                  </>
                )}
              </div>
            )}

            {/* CART BUTTON WITH LIVE BADGE */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative bg-orange-500 hover:bg-orange-600 text-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">કાર્ટ</span>
              {totalCartCount > 0 && (
                <span className="bg-neutral-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* SINGLE CLEAN LOGIN BUTTON / ADMIN LOGOUT */}
            {!isAdminUnlocked ? (
              <button
                onClick={() => {
                  setEnteredPassword('');
                  setPasswordError('');
                  setShowPasswordModal(true);
                }}
                className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                <span>Login</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab(activeTab === 'customer' ? 'admin' : 'customer')}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 border shadow-2xs transition-all ${
                    activeTab === 'customer'
                      ? 'bg-orange-500 text-black border-orange-600'
                      : 'bg-[#1E40AF] text-white border-blue-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{activeTab === 'customer' ? 'Admin Panel' : 'Customer View'}</span>
                </button>

                <button
                  onClick={handleLockAdmin}
                  className="bg-red-700 hover:bg-red-800 text-white px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="લૉગઆઉટ"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* SUB RUNNING INFO STRIP WITH CLEAN "HOME" & "TRACK ORDER" BUTTONS */}
        <div className="bg-[#0B1E48] text-white px-3 sm:px-5 py-1.5 flex items-center justify-between text-xs font-bold border-t border-blue-900">
          <div className="flex items-center gap-2 shrink-0">
            {/* CLEAN SINGLE "HOME" BUTTON */}
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                activeTab === 'customer' ? 'bg-orange-500 text-black shadow-xs' : 'bg-blue-950 text-white hover:bg-blue-900'
              }`}
            >
              Home
            </button>

            {/* DIRECT ONLINE PRINT ACTION BUTTON */}
            <button
              onClick={() => setShowOnlinePrintModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black px-3 py-1 rounded-lg text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
              title="ફોટા, PDF, Word કે Excel ફાઇલ અપલોડ કરીને પ્રિન્ટ કરાવો"
            >
              <Printer className="w-3.5 h-3.5 text-black" />
              <span>🖨️ ઓનલાઇન પ્રિન્ટ કરાવો</span>
            </button>

            {/* CUSTOMER LIVE ORDER TRACKING BUTTON */}
            <button
              onClick={() => setShowTrackingModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-black cursor-pointer shadow-xs flex items-center gap-1 transition-all"
            >
              <Truck className="w-3.5 h-3.5 text-white" />
              <span>ઓર્ડર ટ્રેક કરો (Track)</span>
            </button>

            {/* STORE SHARE LINK BUTTON */}
            <button
              onClick={() => {
                const url = typeof window !== 'undefined' && window.location.origin.includes('netlify')
                  ? window.location.origin
                  : 'https://prishastationery.netlify.app';
                navigator.clipboard.writeText(url);
                setToastMessage('✅ દુકાનની લિંક કોપી થઈ ગઈ: ' + url);
                setTimeout(() => setToastMessage(''), 3500);
              }}
              className="bg-blue-900 hover:bg-blue-800 text-amber-300 border border-blue-700 px-3 py-1 rounded-lg text-xs font-black cursor-pointer shadow-xs flex items-center gap-1 transition-all"
              title="ગ્રાહકોને મોકલવા માટે Prisha Stationery ની લિંક કોપી કરો"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>🔗 લિંક શેર કરો</span>
            </button>

            {/* PWA INSTALL BUTTON */}
            <PWAInstallButton />
          </div>

          <div className="flex-1 overflow-hidden mx-3 text-[11px] sm:text-xs">
            <div className="animate-marquee font-extrabold text-white flex items-center gap-4">
              <span>
                <strong className="text-orange-400">માહિતી:</strong> {storeSettings.marqueeText}
              </span>
              <span>★ સંપર્ક: {storeSettings.phoneDisplay} ★ {storeSettings.address}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-300">
            <span>📍 થરાદ સેન્ટર</span>
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
      {/* 2. ADMIN PASSWORD LOGIN MODAL */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-black shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-black">સંચાલક લૉગિન</h3>
                  <p className="text-[10px] text-neutral-500 font-bold">Bharat Chaudhary Private Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-neutral-400 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div>
                <label className="text-xs font-black block mb-1 text-neutral-800">
                  🔑 પાસવર્ડ દાખલ કરો:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    placeholder="Enter Password..."
                    value={enteredPassword}
                    onChange={e => {
                      setEnteredPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full text-sm font-black p-2.5 pr-10 border-2 border-neutral-400 rounded-xl focus:border-blue-700 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] font-black text-red-600 mt-1.5 bg-red-50 p-1.5 rounded border border-red-200">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B1E48] hover:bg-blue-900 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5 text-orange-400" />
                  <span>લૉગિન કરો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN BODY: CUSTOMER E-COMMERCE VIEW (DEFAULT) */}
      {/* ========================================================================= */}
      {activeTab === 'customer' ? (
        <main className="max-w-[1550px] mx-auto w-full px-3 sm:px-5 py-4 flex-1 space-y-4 no-print">
          
          {/* DHAMAKA OFFER TICKER / BANNER (Editable by Admin) */}
          {(storeSettings?.dhamakaOfferEnabled || isAdminUnlocked) && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-black p-3.5 sm:p-4 shadow-md border-2 border-amber-300 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black text-amber-400 flex items-center justify-center font-black shrink-0 text-xl shadow-md animate-bounce">
                    🔥
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        સ્પેશિયલ ઓફર
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-neutral-950">
                        {storeSettings?.dhamakaOfferTitle || 'ધમાકા ઓફર!'}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
                      {storeSettings?.dhamakaOfferText || 'બધી સ્કૂલ અને ઓફિસ સ્ટેશનરી પર જબરદસ્ત ડિસ્કાઉન્ટ!'}
                    </p>
                  </div>
                </div>

                {isAdminUnlocked && (
                  <button
                    type="button"
                    onClick={() => setShowDhamakaEditModal(true)}
                    className="bg-black hover:bg-neutral-900 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-black shadow flex items-center gap-1.5 cursor-pointer shrink-0 border border-amber-400"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>ઓફર એડિટ કરો</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ROTATING BANNER SLIDER & STORIES WIDGET (Configured in Store Settings) */}
          {storeSettings.showBannerSlider !== false && (
            <div className="relative">
              <BannerSlider
                slides={storeSettings.bannerSlides}
                defaultImageUrl={storeSettings.bannerImageUrl}
                defaultTitle={storeSettings.bannerTitle}
                defaultSubtitle={storeSettings.bannerSubtitle}
                storeNameGu={storeSettings.storeNameGu}
                intervalSeconds={storeSettings.autoSlideBannerInterval || 4}
              />
              {isAdminUnlocked && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStoreSettingsModal(true)}
                    className="bg-black/80 hover:bg-black text-amber-300 border border-amber-400/80 px-2.5 py-1 rounded-lg text-xs font-black shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-orange-400" />
                    <span>દુકાન સેટિંગ્સ & બેનર</span>
                  </button>
                </div>
              )}
            </div>
          )}

          

          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="નોટબુક, પેન, પાન કાર્ડ, આધાર સર્ચ કરો..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-bold pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:border-blue-700 outline-none"
                />
              </div>

              {/* View Cart Quick Bar */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-neutral-500">
                  કુલ {filteredItems.length} વસ્તુઓ ઉપલબ્ધ
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setIsCartDrawerOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-black px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer animate-pulse"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>કાર્ટ જુઓ (₹{cartTotalAmount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips with Online Print as the VERY FIRST OPTION */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-black">
              {/* 1. FIRST EXCLUSIVE OPTION: ONLINE PRINT MODAL TRIGGER */}
              <button
                type="button"
                onClick={() => setShowOnlinePrintModal(true)}
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-black px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border-2 border-black font-black shadow-xs animate-pulse"
                title="ફોટો, PDF, Excel, Word અપલોડ કરીને પ્રિન્ટ કરાવો"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>🖨️ ૧. ઓનલાઇન પ્રિન્ટ (Upload & Print)</span>
              </button>

              {['all', ...Array.from(new Set(posItems.map(p => p.category)))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#0B1E48] text-white border-blue-900 shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  <span>{cat === 'all' ? '🛍️ બધી પ્રોડક્ટ્સ' : `✨ ${cat}`}</span>
                  {cat !== 'all' && (
                    <span className="opacity-70 text-[10px]">
                      ({posItems.filter(p => p.category === cat).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* DEDICATED ONLINE PRINT INTERACTIVE HERO CARD */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-2 border-orange-300 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  નવી સુવિધા • NEW
                </span>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 flex items-center gap-1.5">
                  <Printer className="w-5 h-5 text-orange-600" />
                  <span>🖨️ ઓનલાઇન ડોક્યુમેન્ટ, ફોટો & PVC કાર્ડ પ્રિન્ટિંગ</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed">
                તમારા મોબાઈલ કે કમ્પ્યુટરમાંથી PDF, Word, Excel, JPG ફોટા કે ID કાર્ડ અહીં ૧-ક્લિકમાં અપલોડ કરો. કલર, B&W, સિંગલ/ડબલ સાઇડ, A4/Legal/4×6 સાઇઝ, PVC સ્માર્ટ કાર્ડ અને લેમિનેશન ઓપ્શન સાથે તરત પ્રિન્ટ કરાવો!
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-bold text-neutral-800">
                <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs">📑 PDF, Word, Excel, JPG</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs">🌈 કલર / ⚪⚫ B&W</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs">🪪 PVC સ્માર્ટ કાર્ડ</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs">📄 A4, A5, Legal, 4×6</span>
                <span className="bg-white px-2 py-0.5 rounded-md border border-orange-200 shadow-2xs">✨ લેમિનેશન ટીક માર્ક</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOnlinePrintModal(true)}
              className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>📤 ફાઇલ અપલોડ & પ્રિન્ટ ઓર્ડર કરો</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 4. AMAZON / FLIPKART STYLE PRODUCT GRID & RIGHT POSTER WIDGET */}
          {/* ========================================================================= */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            
            {/* Left Side: Product Grid */}
            <div className={`flex-1 w-full ${
              storeSettings.productLayoutMode === 'list' 
              ? "flex flex-col gap-3" 
              : "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4.5"
            }`}>
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.product.id === item.id);
                const isOutOfStock = typeof item.stock === 'number' && item.stock <= 0;
                const isListView = storeSettings.productLayoutMode === 'list';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-neutral-300 hover:border-orange-500 shadow-2xs hover:shadow-md transition-all flex justify-between overflow-hidden group relative ${isListView ? 'flex-row items-center p-2 gap-3' : 'flex-col'}`}
                  onClick={() => setSelectedProductForModal(item)}
                >
                  {/* Top Badge */}
                  {item.badge && (
                    <div className="absolute top-2 left-2 z-20">
                      <span className="bg-orange-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Admin Edit / Delete Shortcuts */}
                  {isAdminUnlocked && (
                    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end">
                      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-neutral-300 shadow-sm">
                        <button
                          onClick={e => handleMoveItem(item.id, 'up', e)}
                          className="text-neutral-500 hover:text-black p-1 rounded hover:bg-neutral-200 cursor-pointer"
                          title="ઉપર ખસેડો"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        <button
                          onClick={e => handleMoveItem(item.id, 'down', e)}
                          className="text-neutral-500 hover:text-black p-1 rounded hover:bg-neutral-200 cursor-pointer"
                          title="નીચે ખસેડો"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-700 hover:text-blue-900 p-1 rounded hover:bg-blue-50 cursor-pointer"
                          title="પ્રોડક્ટ એડિટ કરો"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleDeleteItem(item.id, item.nameGu, e)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                          title="પ્રોડક્ટ ડિલીટ કરો"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Product Image / Icon Area */}
                  <div className={`${isListView ? 'w-24 h-24 sm:w-32 sm:h-32 rounded-xl shrink-0' : 'h-44 sm:h-52 w-full border-b border-neutral-200'} bg-slate-100 flex items-center justify-center overflow-hidden relative group/img`}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.nameGu}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-blue-50/50 flex items-center justify-center">
                        <span className="text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xs">
                          {item.icon || '📦'}
                        </span>
                      </div>
                    )}

                    {/* Quick Admin Crop & Change Photo Trigger */}
                    {isAdminUnlocked && (
                      <label
                        className="absolute bottom-2 left-2 bg-black/80 hover:bg-black text-white px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer z-20 shadow-md"
                        title="આ ફોટો ક્રોપ અને ઝૂમ કરો"
                      >
                        <Camera className="w-3 h-3 text-orange-400" />
                        <span>ક્રોપ / બદલો</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            setEditingItem(item);
                            handleImageFileUpload(e, 'editingProduct');
                          }}
                        />
                      </label>
                    )}

                    {/* Stock status indicator */}
                    <div className="absolute bottom-2 right-2 text-[10px] font-black z-10 shadow-xs">
                      {item.isService ? (
                        <span className="text-blue-800 bg-white/95 px-2 py-0.5 rounded-md border border-blue-200 font-extrabold backdrop-blur-xs">
                          ⚡ સેવા
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-red-700 bg-white/95 px-2 py-0.5 rounded-md border border-red-300 font-extrabold backdrop-blur-xs">
                          ❌ ખલાસ
                        </span>
                      ) : (
                        <span className="text-neutral-800 bg-white/95 px-2 py-0.5 rounded-md border border-neutral-300 font-extrabold backdrop-blur-xs">
                          સ્ટોક: {item.stock} {item.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className={`flex-1 flex flex-col justify-between space-y-2 ${isListView ? 'py-1' : 'p-3'}`}>
                    <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProductForModal(item); }}>
                      <h3 className={`${getProductTextSizeClasses()} font-black text-neutral-900 leading-snug line-clamp-2`}>
                        {item.nameGu}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-bold truncate mt-0.5">
                        {item.nameEn}
                      </p>
                      
                      {/* Bulk Pricing / Offer Note */}
                      {item.bulkPricing && (
                        <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                          {item.bulkPricing}
                        </p>
                      )}
                    </div>

                    {/* Price and Cart Control */}
                    <div className={`pt-2 border-t border-neutral-100 flex items-center justify-between gap-1 ${isListView ? 'border-t border-neutral-200 mt-2' : ''}`}>
                      <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProductForModal(item); }}>
                        {/* Show MRP if exists and greater than price */}
                        {storeSettings.showMrpOnStore !== false && item.mrp && item.mrp > item.price && (
                          <div className="text-[10px] sm:text-[11px] text-neutral-400 font-bold line-through">
                            ₹{item.mrp}
                          </div>
                        )}
                        <span className="text-sm sm:text-base font-black text-orange-700">
                          ₹{item.price}
                        </span>
                        {storeSettings.showDiscountOnStore !== false && item.mrp && item.mrp > item.price && (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 ml-1 rounded">
                            {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% છૂટ
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-bold ml-1">
                          / {item.unit}
                        </span>
                      </div>

                      {inCart ? (
                        /* In Cart Stepper */
                        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 border border-neutral-300" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-5 h-5 bg-white text-black font-black rounded flex items-center justify-center hover:bg-neutral-200 text-xs shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black px-1 text-neutral-900">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateCartQty(item.id, 1); }}
                            className="w-5 h-5 bg-orange-500 text-black font-black rounded flex items-center justify-center hover:bg-orange-600 text-xs shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        /* Add Button */
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          disabled={isOutOfStock}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer ${
                            isOutOfStock
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600 text-black'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ઉમેરો</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
            </div>

            {/* Right Side: Mobile Poster Widget (Hidden on small screens, visible on large) */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-24">
              <MobilePosterWidget
                posters={storeSettings.mobilePosters || []}
              />
              
            </div>
          </div>

        </main>
      ) : (
        /* ========================================================================= */
        /* 5. ADMIN CONTROL DASHBOARD & BILLING COUNTER */
        /* ========================================================================= */
        <main className="max-w-[1550px] mx-auto w-full px-3 sm:px-5 py-4 flex-1 space-y-4 no-print">
          
          {/* ADMIN TOP CONTROL BAR */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">
                  સંચાલક કંટ્રોલ પેનલ (Admin Dashboard)
                </h2>
                <p className="text-xs text-neutral-500 font-bold">
                  સંચાલક: {storeSettings.ownerName} • પાસવર્ડ સુરક્ષિત
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* DAILY SALES, PROFIT & STOCK REPORT BUTTON */}
              <button
                type="button"
                onClick={() => setShowRojmelModal(true)}
                className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer border border-blue-400"
                title="રોજમેળ અને ખાતાવહી (Excel Style)"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>📈 રોજમેળ (Daily ERP)</span>
              </button>

              {/* ONLINE PRINT JOBS ADMIN BUTTON */}
              <button
                type="button"
                onClick={() => setShowAdminPrintJobsModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer border-2 border-black animate-pulse"
                title="ગ્રાહકોએ અપલોડ કરેલ PDF, Word, Excel, ફોટા ડાઉનલોડ & પ્રિન્ટ બિલ બનાવો"
              >
                <Printer className="w-4 h-4 text-black" />
                <span>🖨️ પ્રિન્ટ ઓર્ડર્સ ({printJobs.filter(j => j.status === 'received').length ? `${printJobs.filter(j => j.status === 'received').length} નવા` : printJobs.length})</span>
              </button>

              {/* MULTI-PLATFORM ECOSYSTEM & SYNC HUB BUTTON */}
              <button
                type="button"
                onClick={() => setShowMultiPlatformSyncModal(true)}
                className="bg-neutral-900 hover:bg-black text-amber-300 border border-amber-400/80 px-3.5 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Desktop App (SQLite) & Mobile App રિયલ-ટાઇમ સિન્ક અને 4K સ્ટોરેજ કન્ટ્રોલ"
              >
                <Server className="w-4 h-4 text-amber-400" />
                <span>🌐 મલ્ટિ-પ્લેટફોર્મ સિન્ક</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingNewItem(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ નવો સ્ટોક ઉમેરો</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDhamakaEditModal(true)}
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-black px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer border border-amber-300"
                title="ધમાકા ઓફર માહિતી એડિટ કરો"
              >
                <span>🔥 ધમાકા ઓફર</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTrashModal(true)}
                className="bg-rose-700 hover:bg-rose-800 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="ડીલીટ કરેલ ડેટા / રિસાયકલ બિન"
              >
                <Trash2 className="w-4 h-4 text-rose-200" />
                <span>ટ્રેશ બિન ({trashList.length})</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="bg-green-800 hover:bg-green-900 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Excel રિપોર્ટ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="એડમિન પાસવર્ડ બદલો"
              >
                <KeyRound className="w-4 h-4 text-amber-200" />
                <span>પાસવર્ડ બદલો</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBillSettingsModal(true)}
                className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="પાસપોર્ટ લોગો, QR કોડ, અધિકૃત સહી અને બિલ કસ્ટમાઇઝેશન"
              >
                <FileText className="w-4 h-4 text-orange-400" />
                <span>બિલ / ઇન્વોઇસ સેટિંગ્સ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStoreSettingsModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="બેનર, સ્ટોરી, કલર, ફોન્ટ અને લેઆઉટ કસ્ટમાઇઝેશન"
              >
                <Settings className="w-4 h-4 text-emerald-200" />
                <span>વેબસાઇટ / દુકાન સેટિંગ્સ</span>
              </button>
            </div>
          </div>

          {/* LIVE STOCK & CATEGORY ANALYTICS BAR (REAL-TIME COST VS SELLING PRICE) */}
          {(() => {
            const totalCategories = new Set(posItems.map(p => p.category)).size;
            const totalItemsCount = posItems.length;
            const projectedProfit = Math.max(0, displaySellingStockValue - displayCostStockValue);

            return (
              <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-[#0B1E48] text-white p-4 rounded-2xl shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black shrink-0 shadow-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>📊 દુકાન લાઈવ સ્ટોક & માલ વિગત</span>
                      <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        ઓટો અપડેટ
                      </span>
                    </h3>
                    <p className="text-[11px] text-blue-200 font-bold">
                      ખરીદ ભાવ, વેચાણ ભાવ (MRP), હાજર સ્ટોક નંગ અને અંદાજિત નફો રિયલ-ટાઇમ
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs w-full lg:w-auto">
                  <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                    <span className="block text-[10px] text-blue-200 font-bold">કુલ કેટેગરી</span>
                    <span className="text-sm sm:text-base font-black text-orange-400">{totalCategories}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                    <span className="block text-[10px] text-blue-200 font-bold">કુલ વસ્તુઓ</span>
                    <span className="text-sm sm:text-base font-black text-white">{totalItemsCount}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                    <span className="block text-[10px] text-blue-200 font-bold">હાજર સ્ટોક (નંગ)</span>
                    <span className="text-sm sm:text-base font-black text-emerald-400">{calcTotalStockUnits} નંગ</span>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center">
                    <span className="block text-[10px] text-blue-200 font-bold">કુલ ખરીદ મૂલ્ય</span>
                    <span className="text-sm sm:text-base font-black text-rose-300">₹{displayCostStockValue.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-center col-span-2 sm:col-span-1">
                    <span className="block text-[10px] text-blue-200 font-bold">કુલ વેચાણ (MRP)</span>
                    <span className="text-sm sm:text-base font-black text-amber-300">₹{displaySellingStockValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* REAL-TIME ERP DASHBOARD (6 RESPONSIVE STAT CARDS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => {
                const val = prompt('દૈનિક વેચાણ (Today) કરેક્શન/સુધારો (+/-):', (stats?.correctionDaily || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionDaily: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-orange-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">💰 આજનું વેચાણ</p>
              <h3 className="text-sm sm:text-base font-black text-orange-600">₹{(displayTodaySales || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('અઠવાડિયાનું વેચાણ (Weekly) કરેક્શન/સુધારો (+/-):', (stats?.correctionWeekly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionWeekly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-blue-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">📅 આ અઠવાડિયાનું વેચાણ</p>
              <h3 className="text-sm sm:text-base font-black text-blue-700">₹{(displayWeekSales || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('મહિનાનું વેચાણ (Monthly) કરેક્શન/સુધારો (+/-):', (stats?.correctionMonthly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionMonthly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">📈 આ મહિનાનું વેચાણ</p>
              <h3 className="text-sm sm:text-base font-black text-emerald-600">₹{(displayMonthSales || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('આખા વર્ષનું વેચાણ (Yearly) કરેક્શન/સુધારો (+/-):', (stats?.correctionYearly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionYearly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-purple-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">🏆 વાર્ષિક વેચાણ</p>
              <h3 className="text-sm sm:text-base font-black text-purple-700">₹{(displayYearSales || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('કુલ ખરીદ સ્ટોક મૂલ્ય કરેક્શન (+/-):', (stats?.correctionStockVal || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionStockVal: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-rose-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">🛒 કુલ ખરીદ માલ મૂલ્ય</p>
              <h3 className="text-sm sm:text-base font-black text-rose-600">₹{(displayCostStockValue || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs"
            >
              <p className="text-[10px] font-bold text-neutral-500">🏷️ કુલ વેચાણ મૂલ્ય (MRP)</p>
              <h3 className="text-sm sm:text-base font-black text-emerald-700">₹{(displaySellingStockValue || 0).toFixed(2)}</h3>
              <span className="text-[9px] text-emerald-600 font-bold">નફો: +₹{Math.max(0, displaySellingStockValue - displayCostStockValue).toFixed(2)}</span>
            </div>
          </div>

          {/* POS COUNTER BILLING & INVENTORY TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* POS COUNTER BILLING BOX (WITH DIRECT IN-BILL ITEM SELECTION & LIST) */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-black text-neutral-900">
                    કાઉન્ટર બિલિંગ (POS)
                  </h3>
                </div>
                {posBillItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePosClearBill}
                    className="text-[11px] font-bold text-red-600 hover:text-red-800"
                  >
                    બિલ ખાલી કરો
                  </button>
                )}
              </div>

              {/* 1. Add Item into Bill Section */}
              <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-900 flex items-center gap-1">
                    <span>➕ બિલમાં વસ્તુ ઉમેરો</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomPosInput(!showCustomPosInput)}
                    className="text-[11px] font-black text-blue-700 hover:underline"
                  >
                    {showCustomPosInput ? 'લિસ્ટેડ આઇટમ' : '+ કસ્ટમ આઇટમ'}
                  </button>
                </div>

                {!showCustomPosInput ? (
                  /* Standard Product Dropdown Selector */
                  <div className="space-y-1.5">
                    <select
                      value={posSelectedProdId}
                      onChange={e => setPosSelectedProdId(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-neutral-300 rounded-lg outline-none focus:border-orange-500"
                    >
                      <option value="">-- લિસ્ટમાંથી વસ્તુ પસંદ કરો --</option>
                      {posItems.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.nameGu} ({prod.nameEn}) - ₹{prod.price} (હાજર સ્ટોક: {prod.stock})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-neutral-600">જથ્થો:</span>
                        <input
                          type="number"
                          min="1"
                          value={posSelectedQty}
                          onChange={e => setPosSelectedQty(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-xs font-black p-1.5 bg-white border border-neutral-300 rounded-lg text-center outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handlePosAddProduct}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black py-1.5 px-3 rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>બિલમાં ઉમેરો</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Custom Item Name & Price Input */
                  <form onSubmit={handlePosAddCustomItem} className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="વસ્તુનું નામ (દા.ત. પાસપોર્ટ સાઈઝ ફોટો)"
                      value={customPosName}
                      onChange={e => setCustomPosName(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 bg-white border border-neutral-300 rounded-lg outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="ભાવ ₹"
                        value={customPosPrice}
                        onChange={e => setCustomPosPrice(e.target.value)}
                        className="w-20 text-xs font-bold p-1.5 bg-white border border-neutral-300 rounded-lg outline-none"
                      />
                      <input
                        type="number"
                        placeholder="જથ્થો"
                        value={customPosQty}
                        onChange={e => setCustomPosQty(e.target.value)}
                        className="w-16 text-xs font-bold p-1.5 bg-white border border-neutral-300 rounded-lg outline-none"
                      />
                      <button
                        type="submit"
                        className="flex-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-black py-1.5 rounded-lg cursor-pointer"
                      >
                        + ઉમેરો
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 2. In-Bill Live Items Table */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 px-1">
                  <span>બિલ આઇટમ્સ ({posBillItems.length})</span>
                  <span>
                    કુલ: ₹
                    {posBillItems.reduce((sum, item) => sum + item.price * item.qty, 0)}
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto border border-neutral-200 rounded-xl divide-y divide-neutral-100 bg-neutral-50/50">
                  {posBillItems.length === 0 ? (
                    <p className="text-center text-xs text-neutral-400 py-4 font-bold">
                      ઉપરથી વસ્તુ પસંદ કરી બિલમાં ઉમેરો
                    </p>
                  ) : (
                    posBillItems.map((item, idx) => (
                      <div key={item.id} className="p-2 flex items-center justify-between gap-1 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-neutral-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-neutral-500">₹{item.price} / {item.unit}</p>
                        </div>

                        {/* Qty Stepper */}
                        <div className="flex items-center gap-1 bg-white rounded border border-neutral-300 p-0.5">
                          <button
                            type="button"
                            onClick={() => handlePosUpdateItemQty(idx, -1)}
                            className="w-4 h-4 bg-neutral-100 hover:bg-neutral-200 rounded text-[10px] font-black flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-black px-1 text-neutral-800">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePosUpdateItemQty(idx, 1)}
                            className="w-4 h-4 bg-orange-400 hover:bg-orange-500 text-black rounded text-[10px] font-black flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-black text-orange-700 w-14 text-right">
                          ₹{item.price * item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handlePosRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="કાઢી નાખો"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Customer Info, Payment Mode, Discount, & Print Button */}
              <div className="space-y-2 pt-1 border-t">
                <input
                  type="text"
                  placeholder="ગ્રાહકનું નામ (Customer Name)"
                  value={posCustomerName}
                  onChange={e => setPosCustomerName(e.target.value)}
                  className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
                <input
                  type="tel"
                  placeholder="મોબાઇલ નંબર (Mobile No)"
                  value={posCustomerMobile}
                  onChange={e => setPosCustomerMobile(e.target.value)}
                  className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />

                <div className="grid grid-cols-3 gap-1.5">
                  {(['Cash', 'UPI', 'બાકી (Credit)'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPosPaymentMode(mode)}
                      className={`p-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                        posPaymentMode === mode
                          ? 'bg-[#0B1E48] text-white border-blue-900'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">ડિસ્કાઉન્ટ (₹):</span>
                  <input
                    type="number"
                    value={posDiscount || ''}
                    onChange={e => setPosDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 text-xs font-black p-1.5 border border-neutral-300 rounded-lg text-right outline-none"
                  />
                </div>

                {(() => {
                  const billSub = posBillItems.length > 0
                    ? posBillItems.reduce((s, i) => s + i.price * i.qty, 0)
                    : cartTotalAmount;
                  return (
                    <div className="border-t pt-2 flex items-center justify-between font-black text-sm">
                      <span>ચૂકવવાપાત્ર:</span>
                      <span className="text-base text-orange-700">
                        ₹{Math.max(0, billSub - posDiscount)}/-
                      </span>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleGeneratePOSBill}
                  className="w-full bg-[#0B1E48] hover:bg-blue-900 text-white font-black py-2.5 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>કાઉન્ટર બિલ પ્રિન્ટ કરો</span>
                </button>
              </div>
            </div>

            {/* ORDERS LOGS & MANAGEMENT TABLE */}
            <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>ઓર્ડર અને બિલિંગ મેનેજમેન્ટ ({orders.length})</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-bold">
                    નવા ઓનલાઇન ઓર્ડર્સ પ્રોસેસ કરો, સ્ટેટસ બદલો, બિલ એડિટ/ડિલીટ કરો
                  </p>
                </div>

                {/* Filter Tabs: All, Online, Counter */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdminOrderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      adminOrderFilter === 'all'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    બધા ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminOrderFilter('online')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                      adminOrderFilter === 'online'
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>🌐 ઓનલાઇન</span>
                    <span className="bg-orange-500 text-black px-1 rounded-full text-[10px] font-black">
                      {orders.filter(o => o.orderType === 'online').length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminOrderFilter('counter')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      adminOrderFilter === 'counter'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    🏪 કાઉન્ટર ({orders.filter(o => o.orderType !== 'online').length})
                  </button>
                </div>
              </div>

              {/* ORDERS LIST */}
              <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200 pr-1 space-y-2">
                {orders
                  .filter(o => {
                    if (adminOrderFilter === 'online') return o.orderType === 'online';
                    if (adminOrderFilter === 'counter') return o.orderType !== 'online';
                    return true;
                  })
                  .map(o => (
                    <div
                      key={o.id}
                      className="p-3 bg-neutral-50/70 hover:bg-neutral-100/80 rounded-xl border border-neutral-200 transition-colors space-y-2"
                    >
                      {/* Top Row: Invoice + Name + Total + Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                            #{o.invoiceNo}
                          </span>
                          <span className="text-xs font-black text-neutral-900">
                            {o.customerName}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-bold">
                            📞 {o.mobile}
                          </span>
                          {o.orderType === 'online' ? (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded border border-purple-300 flex items-center gap-0.5">
                              🌐 ઓનલાઇન ઓર્ડર
                            </span>
                          ) : (
                            <span className="bg-neutral-200 text-neutral-700 text-[10px] font-black px-2 py-0.5 rounded">
                              🏪 કાઉન્ટર
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-orange-700">
                            ₹{o.total}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              o.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}
                          >
                            {o.paymentMode} ({o.paymentStatus})
                          </span>
                        </div>
                      </div>

                      {/* Items & Address details */}
                      <div className="text-[11px] text-neutral-600 bg-white p-2 rounded-lg border border-neutral-200">
                        <p className="font-bold">
                          🛒 <strong className="text-neutral-800">આઇટમ્સ:</strong>{' '}
                          {o.items.map(it => `${it.name} (${it.qty} ${it.unit})`).join(', ')}
                        </p>
                        {o.address && (
                          <p className="font-bold text-neutral-500 mt-0.5">
                            📍 <strong>સરનામું:</strong> {o.address}
                          </p>
                        )}
                      </div>

                      {/* Bottom Controls: Live Status Changer + Screenshot View + Edit + Delete + Print */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {/* Live Delivery Status Selector */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-black text-neutral-700">
                            સ્ટેટસ:
                          </label>
                          <select
                            value={o.orderStatus || 'placed'}
                            onChange={e =>
                              handleUpdateOrderStatus(o.id, e.target.value as OrderRecord['orderStatus'])
                            }
                            className={`text-xs font-black px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                              (o.orderStatus || 'placed') === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                : (o.orderStatus || 'placed') === 'cancelled'
                                ? 'bg-red-100 text-red-900 border-red-400'
                                : 'bg-blue-100 text-blue-900 border-blue-400'
                            }`}
                          >
                            <option value="placed">📝 ઓર્ડર મળ્યો (Placed)</option>
                            <option value="confirmed">💳 પેમેન્ટ મંજૂર (Confirmed)</option>
                            <option value="packed">📦 પેક થઈ ગયું (Packed)</option>
                            <option value="out_for_delivery">🚚 રવાના થયો (Out for Delivery)</option>
                            <option value="delivered">✅ ડિલિવરી પૂર્ણ (Delivered)</option>
                            <option value="cancelled">❌ રદ (Cancelled)</option>
                          </select>

                          {o.statusUpdatedAt && (
                            <span className="text-[9px] text-neutral-400 font-bold hidden sm:inline">
                              ({o.statusUpdatedAt})
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Payment Screenshot Viewer Button */}
                          {o.paymentScreenshot && (
                            <button
                              type="button"
                              onClick={() => setViewingScreenshot(o.paymentScreenshot!)}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                              title="UPI પેમેન્ટ સ્ક્રીનશોટ જુઓ"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                              <span>સ્ક્રીનશોટ</span>
                            </button>
                          )}

                          {/* Print Invoice Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInvoiceOrder(o);
                              setIsSuccessModal(false);
                            }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                            title="બિલ પ્રિન્ટ / જુઓ"
                          >
                            <Printer className="w-3.5 h-3.5 text-neutral-700" />
                            <span>પ્રિન્ટ</span>
                          </button>

                          {/* Edit Bill Button */}
                          <button
                            type="button"
                            onClick={() => setEditingOrder(o)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                            title="બિલ એડિટ કરો"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                            <span>એડિટ</span>
                          </button>

                          {/* Delete Bill with Auto-Restock Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1 rounded-lg border border-red-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                            title="બિલ ડિલીટ કરો (માલ સ્ટોકમાં જમા થશે)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>ડિલીટ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {orders.length === 0 && (
                  <p className="text-center py-6 text-xs text-neutral-500 font-bold">
                    કોઈ ઓર્ડર ઉપલબ્ધ નથી.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* INVENTORY MANAGEMENT TABLE WITH DIRECT STOCK INPUT */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>ઇન્વેન્ટરી સ્ટોક મેનેજમેન્ટ ({posItems.length} આઇટમ્સ)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 font-bold">
                  હાજર સ્ટોક ખાનામાં સીધો નંબર (દા.ત. 100) લખીને તરત સ્ટોક અપડેટ કરો
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNewItem(true)}
                className="bg-[#0B1E48] hover:bg-blue-900 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                <span>નવી પ્રોડક્ટ ઉમેરો</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-700 border-b font-black">
                    <th className="p-2">પ્રોડક્ટ</th>
                    <th className="p-2">કેટેગરી</th>
                    <th className="p-2">વેચાણ ભાવ</th>
                    <th className="p-2">ખરીદ ભાવ</th>
                    <th className="p-2 text-center">હાજર સ્ટોક (ડાયરેક્ટ અપડેટ)</th>
                    <th className="p-2 text-right">એક્શન</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {posItems.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="p-2 font-black text-neutral-900 flex items-center gap-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.nameGu}
                            className="w-8 h-8 rounded-lg object-contain bg-white border border-neutral-300 shrink-0"
                          />
                        ) : (
                          <span className="text-lg">{item.icon || '📦'}</span>
                        )}
                        <div>
                          <span>{item.nameGu}</span>
                          <span className="block text-[10px] text-neutral-400 font-bold">{item.nameEn}</span>
                          {item.isHidden && <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded border border-red-200">Hidden</span>}
                        </div>
                      </td>
                      <td className="p-2 font-bold text-neutral-600">{item.category}</td>
                      <td className="p-2 font-black text-orange-700">
                        ₹{item.price}
                        {item.mrp && <span className="block text-[10px] text-neutral-400 font-bold line-through">MRP ₹{item.mrp}</span>}
                        {item.bulkPricing && <span className="block text-[9px] text-emerald-600 mt-0.5">{item.bulkPricing}</span>}
                      </td>
                      <td className="p-2 font-bold text-neutral-600">₹{item.costPrice}</td>
                      
                      {/* DIRECT STOCK NUMBER INPUT + QUICK +/- BUTTONS */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={e => modifyStock(item.id, -1, e)}
                            className="w-6 h-6 bg-neutral-200 hover:bg-neutral-300 rounded-md font-black text-xs cursor-pointer flex items-center justify-center"
                            title="1 ઘટાડો"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            key={item.stock}
                            defaultValue={item.stock}
                            onBlur={e => handleDirectStockUpdate(item.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleDirectStockUpdate(item.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-16 text-center font-black text-xs py-1 px-1.5 border-2 border-neutral-300 rounded-md focus:border-orange-500 outline-none bg-white text-neutral-900"
                            title="અહીં સીધો સ્ટોક નંબર લખો (દા.ત. 100)"
                          />

                          <button
                            type="button"
                            onClick={e => modifyStock(item.id, 1, e)}
                            className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-black rounded-md font-black text-xs cursor-pointer flex items-center justify-center"
                            title="1 વધારો"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="text-blue-700 hover:text-blue-900 p-1 font-bold text-xs cursor-pointer"
                            title="એડિટ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={e => handleDeleteItem(item.id, item.nameGu, e)}
                            className="text-red-600 hover:text-red-800 p-1 font-bold text-xs cursor-pointer"
                            title="ડિલીટ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}

      {/* ========================================================================= */}
      {/* 6. SIDE DRAWER CART & CHECKOUT MODAL */}
      {/* ========================================================================= */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQty}
        onRemoveItem={removeCartItem}
        onClearCart={() => setCart([])}
        storeSettings={storeSettings}
        onConfirmOrder={handleCustomerConfirmOrder}
      />

      {/* ========================================================================= */}
      {/* 7. PRINTABLE INVOICE & ORDER SUCCESS MODAL */}
      {/* ========================================================================= */}
      {activeInvoiceOrder && (
        <InvoiceModal
          order={activeInvoiceOrder}
          storeSettings={storeSettings}
          onClose={() => {
            setActiveInvoiceOrder(null);
            setIsSuccessModal(false);
          }}
          isSuccessView={isSuccessModal}
        />
      )}

      {/* ========================================================================= */}
      {/* 8. ADMIN STORE & BILL SETTINGS MODAL (Now unified in BillSettingsModal) */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <BillSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          settings={storeSettings}
          onSave={updatedSettings => {
            setStoreSettings(prev => ({
              ...prev,
              ...updatedSettings
            }));
            showToast('✅ બિલ સેટિંગ્સ & કસ્ટમાઇઝેશન સાચવાઈ ગયું!');
          }}
          onUploadImage={handleImageFileUpload}
        />
      )}

      {/* ========================================================================= */}
      {/* 9. FAST NEW PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isAddingNewItem && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-2 border-black shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ નવી પ્રોડક્ટ / સેવા ઉમેરો</span>
              </h3>
              <button onClick={() => setIsAddingNewItem(false)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">આઇટમ નામ (ગુજરાતી) *</label>
                <input
                  type="text"
                  placeholder="દા.ત. ક્લાસમેટ નોટબુક"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">English Name</label>
                <input
                  type="text"
                  placeholder="e.g. Classmate Notebook"
                  value={newProdEnName}
                  onChange={e => setNewProdEnName(e.target.value)}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">વેચાણ ભાવ (₹) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">ખરીદ ભાવ (₹)</label>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={e => setNewProdCost(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-500 bg-orange-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-neutral-600">છાપેલી કિંમત (MRP ₹)</label>
                  <input
                    type="number"
                    value={newProdMrp}
                    onChange={e => setNewProdMrp(e.target.value)}
                    placeholder="દા.ત. 100"
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">સ્ટોક જથ્થો</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value)}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">કેટેગરી</label>
                <input
                  list="category-list"
                  type="text"
                  value={newProdCategory}
                  onChange={e => setNewProdCategory(e.target.value)}
                  placeholder="નવી કેટેગરી લખો અથવા પસંદ કરો"
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                />
                <datalist id="category-list">
                  {Array.from(new Set(posItems.map(p => p.category))).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <label className="font-bold block mb-1 text-neutral-600">હોલસેલ ભાવ / ઓફર વિગત</label>
                <input
                  type="text"
                  value={newProdBulkPricing}
                  onChange={e => setNewProdBulkPricing(e.target.value)}
                  placeholder='દા.ત. "5 નંગ: ₹200, 10 નંગ: ₹350"'
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="hideNewProduct" 
                  checked={newProdIsHidden}
                  onChange={e => setNewProdIsHidden(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 cursor-pointer"
                />
                <label htmlFor="hideNewProduct" className="font-bold text-red-600 cursor-pointer">
                  આ પ્રોડક્ટ ગ્રાહકને ન બતાવો (Hide from Customer)
                </label>
              </div>

              <div>
                <label className="font-bold block mb-1">મુખ્ય ફોટો (Main Photo):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileUpload(e, 'newProduct')}
                    className="w-full text-xs"
                  />
                  {newProdImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setCropModalData({
                          isOpen: true,
                          imageSrc: newProdImage,
                          title: 'નવી પ્રોડક્ટ ફોટો ક્રોપ અને ઝૂમ કરો',
                          aspectPreset: 'square',
                          target: 'newProduct'
                        })
                      }
                      className="px-2.5 py-1 bg-neutral-800 text-white rounded text-[11px] font-bold whitespace-nowrap"
                    >
                      🔍 ફરી ક્રોપ કરો
                    </button>
                  )}
                </div>
                {newProdImage && (
                  <div className="mt-2 w-16 h-16 rounded-lg border border-neutral-300 overflow-hidden bg-slate-100">
                    <img src={newProdImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddingNewItem(false)}
                  className="px-3.5 py-2 border rounded-xl font-bold text-neutral-600"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-black shadow"
                >
                  ઉમેરો (Add Product)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-2 border-black shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-700" />
                <span>આઇટમ એડિટ કરો: {editingItem.nameGu}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">આઇટમ નામ (ગુજરાતી)</label>
                <input
                  type="text"
                  value={editingItem.nameGu}
                  onChange={e => setEditingItem({ ...editingItem, nameGu: e.target.value })}
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">કેટેગરી</label>
                <input
                  list="edit-category-list"
                  type="text"
                  value={editingItem.category}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                  placeholder="કેટેગરી લખો અથવા પસંદ કરો"
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none bg-white"
                />
                <datalist id="edit-category-list">
                  {Array.from(new Set(posItems.map(p => p.category))).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">વેચાણ ભાવ (₹)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">ખરીદ કિંમત (₹)</label>
                  <input
                    type="number"
                    value={editingItem.costPrice}
                    onChange={e => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) || 0 })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-500 bg-orange-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-neutral-600">છાપેલી કિંમત (MRP ₹)</label>
                  <input
                    type="number"
                    value={editingItem.mrp || ''}
                    onChange={e => setEditingItem({ ...editingItem, mrp: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="દા.ત. 100"
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">હાજર સ્ટોક</label>
                  <input
                    type="text"
                    value={editingItem.stock}
                    onChange={e => setEditingItem({ ...editingItem, stock: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) })}
                    className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="font-bold block mb-1 text-neutral-600">હોલસેલ ભાવ / ઓફર વિગત</label>
                <input
                  type="text"
                  value={editingItem.bulkPricing || ''}
                  onChange={e => setEditingItem({ ...editingItem, bulkPricing: e.target.value })}
                  placeholder='દા.ત. "5 નંગ: ₹200, 10 નંગ: ₹350"'
                  className="w-full font-bold p-2 border border-neutral-300 rounded-lg outline-none text-[11px]"
                />
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="hideProduct" 
                  checked={editingItem.isHidden || false}
                  onChange={e => setEditingItem({ ...editingItem, isHidden: e.target.checked })}
                  className="w-4 h-4 accent-orange-600 cursor-pointer"
                />
                <label htmlFor="hideProduct" className="font-bold text-red-600 cursor-pointer">
                  આ પ્રોડક્ટ ગ્રાહકને ન બતાવો (Hide from Customer)
                </label>
              </div>

              <div>
                <label className="font-bold block mb-1">મુખ્ય ફોટો (Main Photo):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageFileUpload(e, 'editingProduct')}
                    className="w-full text-xs"
                  />
                  {editingItem.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setCropModalData({
                          isOpen: true,
                          imageSrc: editingItem.imageUrl || '',
                          title: `"${editingItem.nameGu}" ફોટો ક્રોપ અને ઝૂમ કરો`,
                          aspectPreset: 'square',
                          target: 'editingProduct'
                        })
                      }
                      className="px-2.5 py-1 bg-neutral-800 text-white rounded text-[11px] font-bold whitespace-nowrap"
                    >
                      🔍 ફરી ક્રોપ કરો
                    </button>
                  )}
                </div>
                {editingItem.imageUrl && (
                  <div className="mt-2 w-16 h-16 rounded-lg border border-neutral-300 overflow-hidden bg-slate-100">
                    <img src={editingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold block mb-1 text-neutral-600">વધારાના ફોટા (Product Gallery):</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const urls: string[] = [];
                    for (let i = 0; i < files.length; i++) {
                      try {
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve) => {
                          reader.onload = (ev) => resolve(ev.target?.result as string);
                          reader.readAsDataURL(files[i]);
                        });
                        urls.push(base64);
                      } catch (err) { }
                    }
                    setEditingItem({
                      ...editingItem,
                      galleryImages: [...(editingItem.galleryImages || []), ...urls]
                    });
                  }}
                  className="w-full font-bold p-1 border border-neutral-300 rounded-lg text-xs"
                />
                {(editingItem.galleryImages && editingItem.galleryImages.length > 0) && (
                  <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {editingItem.galleryImages.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg border overflow-hidden shrink-0 group">
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            ...editingItem,
                            galleryImages: editingItem.galleryImages?.filter((_, i) => i !== idx)
                          })}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 border rounded-xl font-bold text-neutral-600"
                >
                  રદ કરો
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemEdit}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-black shadow"
                >
                  સેવ કરો (Save Changes)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. BANNER TEXT EDIT MODAL */}
      {/* ========================================================================= */}
      {showBannerEditModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border-2 border-black shadow-2xl space-y-3">
            <h3 className="font-black text-sm text-neutral-900">🖼️ બેનર ટેક્સ્ટ એડિટ કરો</h3>
            <div>
              <label className="text-xs font-bold block mb-1">મુખ્ય હેડિંગ (Title):</label>
              <input
                type="text"
                value={storeSettings.bannerTitle}
                onChange={e => setStoreSettings({ ...storeSettings, bannerTitle: e.target.value })}
                className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">વિગત (Subtitle):</label>
              <textarea
                rows={2}
                value={storeSettings.bannerSubtitle}
                onChange={e => setStoreSettings({ ...storeSettings, bannerSubtitle: e.target.value })}
                className="w-full text-xs font-bold p-2 border border-neutral-300 rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBannerEditModal(false)}
                className="bg-[#0B1E48] text-white px-4 py-1.5 rounded-lg text-xs font-black"
              >
                સાચવો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. IMAGE CROPPER & ZOOM MODAL (For Product Photos, Logos, Banner & QR) */}
      {/* ========================================================================= */}
      {cropModalData.isOpen && (
        <ImageCropModal
          imageSrc={cropModalData.imageSrc}
          title={cropModalData.title}
          aspectPreset={cropModalData.aspectPreset}
          onClose={() => setCropModalData(prev => ({ ...prev, isOpen: false }))}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* ========================================================================= */}
      {/* 13. SECURE ADMIN PASSWORD CHANGE MODAL (Requires 8140430395 Verification) */}
      {/* ========================================================================= */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          currentStoredPassword={storeSettings.adminPassword}
          ownerSecretNumber="8140430395"
          onClose={() => setShowChangePasswordModal(false)}
          onPasswordChanged={newPass => {
            setStoreSettings(prev => ({ ...prev, adminPassword: newPass }));
            showToast('✅ એડમિન પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો!');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 14. CUSTOMER LIVE ORDER TRACKING MODAL */}
      {/* ========================================================================= */}
      {showTrackingModal && (
        <OrderTrackingModal
          isOpen={showTrackingModal}
          onClose={() => setShowTrackingModal(false)}
          orders={orders}
          printJobs={printJobs}
          onViewInvoice={order => {
            setActiveInvoiceOrder(order);
            setIsSuccessModal(false);
          }}
          storeSettings={storeSettings}
        />
      )}

      {/* ========================================================================= */}
      {/* 15. TRASH / RECYCLE BIN MODAL */}
      {/* ========================================================================= */}
      {showTrashModal && (
        <TrashModal
          isOpen={showTrashModal}
          onClose={() => setShowTrashModal(false)}
          trashList={trashList}
          onRestore={handleRestoreTrashRecord}
          onPermanentDelete={handlePermanentDeleteTrash}
          onEmptyTrash={handleEmptyAllTrash}
        />
      )}

      {/* ========================================================================= */}
      {/* 16. DHAMAKA OFFER SETTINGS MODAL */}
      {/* ========================================================================= */}
      {showDhamakaEditModal && (
        <DhamakaOfferModal
          isOpen={showDhamakaEditModal}
          onClose={() => setShowDhamakaEditModal(false)}
          storeSettings={storeSettings}
          settings={storeSettings}
          onSave={updatedSettings => {
            setStoreSettings(prev => ({
              ...prev,
              ...updatedSettings
            }));
            showToast('🎉 ધમાકા ઓફર વિગતો સફળતાપૂર્વક અપડેટ થઈ ગઈ!');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 17. PAYMENT SCREENSHOT FULLSCREEN VIEWER MODAL */}
      {/* ========================================================================= */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 border-2 border-neutral-800 shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-700" />
                <span>UPI પેમેન્ટ સ્ક્રીનશોટ વેરિફિકેશન</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingScreenshot(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-neutral-300 bg-neutral-900 flex items-center justify-center p-2">
              <img
                src={viewingScreenshot}
                alt="Payment Screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow"
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-1 border-t">
              <span className="text-[11px] text-neutral-500 font-bold">
                પેમેન્ટ ચેક કરી ઓર્ડર કન્ફર્મ કરો
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewingScreenshot(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  બંધ કરો (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. EDIT BILL / ORDER MODAL */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border-2 border-neutral-800 shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-700" />
                  <span>બિલ એડિટ કરો #{editingOrder.invoiceNo}</span>
                </h3>
                <p className="text-[11px] text-neutral-500 font-bold">{editingOrder.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-bold">
              <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200">
                <div>
                  <label className="block text-blue-950 mb-1 flex items-center gap-1">
                    <span>🧾 બિલ નંબર (Invoice No):</span>
                  </label>
                  <input
                    type="text"
                    value={editingOrder.invoiceNo}
                    onChange={e =>
                      setEditingOrder({ ...editingOrder, invoiceNo: e.target.value.trim() })
                    }
                    className="w-full p-2 border border-blue-400 bg-white rounded-lg font-mono font-black text-blue-900 outline-none focus:border-blue-700"
                    placeholder="દા.ત. prisha000001"
                  />
                  <span className="text-[9px] text-blue-700 font-medium">બિલ નંબર બદલી શકાય છે</span>
                </div>

                <div>
                  <label className="block text-blue-950 mb-1 flex items-center gap-1">
                    <span>📅 તારીખ & સમય (Date):</span>
                  </label>
                  <input
                    type="text"
                    value={editingOrder.date}
                    onChange={e =>
                      setEditingOrder({ ...editingOrder, date: e.target.value })
                    }
                    className="w-full p-2 border border-blue-400 bg-white rounded-lg font-mono font-bold text-neutral-800 outline-none focus:border-blue-700 text-xs"
                    placeholder="DD/MM/YYYY HH:MM"
                  />
                  <span className="text-[9px] text-blue-700 font-medium">તારીખ બદલી શકાય છે</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">ગ્રાહકનું નામ:</label>
                <input
                  type="text"
                  value={editingOrder.customerName}
                  onChange={e =>
                    setEditingOrder({ ...editingOrder, customerName: e.target.value })
                  }
                  className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">મોબાઇલ નંબર:</label>
                <input
                  type="tel"
                  value={editingOrder.mobile}
                  onChange={e =>
                    setEditingOrder({ ...editingOrder, mobile: e.target.value })
                  }
                  className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">સરનામું:</label>
                <input
                  type="text"
                  value={editingOrder.address || ''}
                  onChange={e =>
                    setEditingOrder({ ...editingOrder, address: e.target.value })
                  }
                  className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-700 mb-1">પેમેન્ટ મોડ:</label>
                  <select
                    value={editingOrder.paymentMode}
                    onChange={e =>
                      setEditingOrder({
                        ...editingOrder,
                        paymentMode: e.target.value as OrderRecord['paymentMode']
                      })
                    }
                    className="w-full p-2 border border-neutral-300 rounded-lg outline-none"
                  >
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI QR</option>
                    <option value="બાકી (Credit)">બાકી (Credit)</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">પેમેન્ટ સ્ટેટસ:</label>
                  <select
                    value={editingOrder.paymentStatus}
                    onChange={e =>
                      setEditingOrder({
                        ...editingOrder,
                        paymentStatus: e.target.value as OrderRecord['paymentStatus']
                      })
                    }
                    className="w-full p-2 border border-neutral-300 rounded-lg outline-none"
                  >
                    <option value="Paid">Paid (ચૂકવાઈ ગયું)</option>
                    <option value="બાકી">બાકી (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">ડિલિવરી સ્ટેટસ:</label>
                <select
                  value={editingOrder.orderStatus || 'placed'}
                  onChange={e =>
                    setEditingOrder({
                      ...editingOrder,
                      orderStatus: e.target.value as OrderRecord['orderStatus']
                    })
                  }
                  className="w-full p-2 border border-neutral-300 rounded-lg outline-none"
                >
                  <option value="placed">📝 ઓર્ડર મળ્યો (Placed)</option>
                  <option value="confirmed">💳 પેમેન્ટ મંજૂર (Confirmed)</option>
                  <option value="packed">📦 પેક થઈ ગયું (Packed)</option>
                  <option value="out_for_delivery">🚚 રવાના થયો (Out for Delivery)</option>
                  <option value="delivered">✅ ડિલિવરી પૂર્ણ (Delivered)</option>
                  <option value="cancelled">❌ રદ (Cancelled)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-3.5 py-2 border rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="button"
                onClick={() => handleSaveOrderEdit(editingOrder)}
                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-black shadow cursor-pointer"
              >
                બિલ સેવ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 18. BILL / INVOICE DESIGN & CUSTOMIZATION MODAL (Admin Bill Editor) */}
      {/* ========================================================================= */}
      {showBillSettingsModal && (
        <BillSettingsModal
          isOpen={showBillSettingsModal}
          onClose={() => setShowBillSettingsModal(false)}
          settings={storeSettings}
          onSave={updatedSettings => {
            setStoreSettings(prev => ({
              ...prev,
              ...updatedSettings
            }));
            showToast('✅ બિલ સેટિંગ્સ & કસ્ટમાઇઝેશન સાચવાઈ ગયું!');
          }}
          onUploadImage={handleImageFileUpload}
        />
      )}

      {/* ========================================================================= */}
      {/* 19. RELIABLE IN-APP DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <ConfirmDeleteModal
          isOpen={!!deleteConfirmTarget}
          target={deleteConfirmTarget}
          onCancel={() => setDeleteConfirmTarget(null)}
          onConfirm={handleExecuteConfirmedDelete}
        />
      )}

      {/* ========================================================================= */}
      {/* 20. CUSTOMER ONLINE PRINT UPLOAD & OPTIONS MODAL */}
      {/* ========================================================================= */}
      {showOnlinePrintModal && (
        <OnlinePrintModal
          isOpen={showOnlinePrintModal}
          onClose={() => setShowOnlinePrintModal(false)}
          storeSettings={storeSettings}
          onSubmitJob={handleSubmitPrintJob}
        />
      )}

      {/* ========================================================================= */}
      {/* 21. ADMIN ONLINE PRINT JOBS, DIRECT DOWNLOAD & BILL CREATOR MODAL */}
      {/* ========================================================================= */}
      {showAdminPrintJobsModal && (
        <AdminPrintJobsModal
          isOpen={showAdminPrintJobsModal}
          onClose={() => setShowAdminPrintJobsModal(false)}
          storeSettings={storeSettings}
          printJobs={printJobs}
          onUpdateJob={handleUpdatePrintJob}
          onDeleteJob={handleDeletePrintJob}
          onConvertToInvoice={handleConvertPrintJobToInvoice}
        />
      )}

      {/* ========================================================================= */}
      {/* 22. MULTI-PLATFORM ECOSYSTEM & REAL-TIME SYNC MODAL */}
      {/* ========================================================================= */}
      {showMultiPlatformSyncModal && (
        <MultiPlatformSyncModal
          isOpen={showMultiPlatformSyncModal}
          onClose={() => setShowMultiPlatformSyncModal(false)}
          printJobCount={printJobs.length}
        />
      )}

      {/* ========================================================================= */}
      {/* 23. ROJMEL & KHATA ERP MODAL */}
      {/* ========================================================================= */}
      {showRojmelModal && (
        <RojmelKhataModal
          isOpen={showRojmelModal}
          onClose={() => setShowRojmelModal(false)}
          rojmelEntries={rojmelEntries}
          onAddRojmelEntry={(entry) => {
            const newEntry = {
              ...entry,
              id: `rojmel-${Date.now()}`,
              createdAt: Date.now()
            };
            setRojmelEntries(prev => [...prev, newEntry]);
          }}
          onOpenTrash={() => setShowTrashModal(true)}
          onDeleteRojmelEntry={(id) => {
            const entry = rojmelEntries.find(e => e.id === id);
            if (entry) {
              setTrashList(prev => [{
                id: 'trash-rojmel-' + Date.now(),
                type: 'rojmel',
                title: 'રોજમેળ: ' + entry.category + ' (₹' + entry.amount + ')',
                deletedAt: new Date().toLocaleString(),
                summary: 'પ્રકાર: ' + (entry.type === 'aavak' ? 'આવક' : 'જાવક') + ', તારીખ: ' + entry.date + ', વ્યક્તિ: ' + (entry.personName || '-'),
                data: entry
              }, ...prev]);
            }
            setRojmelEntries(prev => prev.filter(e => e.id !== id));
            showToast('🗑️ રોજમેળ એન્ટ્રી ટ્રેશ બિનમાં ખસેડાઈ.');
          }}
          khataAccounts={khataAccounts}
          onAddKhataAccount={(acc) => {
            const newAcc = {
              ...acc,
              id: `khata-acc-${Date.now()}`,
              balance: 0,
              totalGiven: 0,
              totalReceived: 0,
              lastTransactionDate: new Date().toISOString()
            };
            setKhataAccounts(prev => [...prev, newAcc]);
          }}
          khataTransactions={khataTransactions}
          onAddKhataTransaction={(tx) => {
            // Find account to calculate balanceAfter
            const acc = khataAccounts.find(a => a.id === tx.accountId);
            const currentBalance = acc?.balance || 0;
            const txAmt = tx.type === 'jama' ? tx.amount : -tx.amount;
            const balanceAfter = currentBalance + txAmt;

            const newTx = {
              ...tx,
              id: `khata-tx-${Date.now()}`,
              createdAt: Date.now(),
              balanceAfter
            };
            
            // Update account balance
            setKhataAccounts(prev => prev.map(a => {
              if (a.id === tx.accountId) {
                return {
                  ...a,
                  balance: balanceAfter,
                  totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + tx.amount : (a.totalGiven || 0),
                  totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + tx.amount : (a.totalReceived || 0),
                  lastTransactionDate: new Date().toISOString()
                };
              }
              return a;
            }));

            setKhataTransactions(prev => [...prev, newTx]);
          }}
                    onDeleteKhataAccount={(id) => {
            const acc = khataAccounts.find(a => a.id === id);
            const txs = khataTransactions.filter(t => t.accountId === id);
            if (acc) {
              setTrashList(prev => [{
                id: `trash-khata-acc-${Date.now()}`,
                type: 'khata_account',
                title: `खाતું: ${acc.name} (${acc.type === 'customer' ? 'ગ્રાહક' : 'વેપારી'})`,
                deletedAt: new Date().toLocaleString(),
                summary: `ಬાકી: ₹${acc.balance}, ફોન: ${acc.phone || 'નથી'}`,
                data: { account: acc, transactions: txs }
              }, ...prev]);
            }
            setKhataAccounts(prev => prev.filter(a => a.id !== id));
            setKhataTransactions(prev => prev.filter(t => t.accountId !== id));
            showToast('🗑️ ખાતું અને વ્યવહારો ટ્રેશ બિનમાં ખસેડાયા.');
          }}
                    onDeleteKhataTransaction={(id, accountId) => {
            const tx = khataTransactions.find(t => t.id === id);
            if (!tx) return;
            
            setTrashList(prev => [{
              id: `trash-khata-tx-${Date.now()}`,
              type: 'khata_transaction',
              title: `વ્યવહાર: ${tx.accountName} (₹${tx.amount})`,
              deletedAt: new Date().toLocaleString(),
              summary: `પ્રકાર: ${tx.type}, વિગત: ${tx.description || '-'}`,
              data: tx
            }, ...prev]);
            
            setKhataTransactions(prev => prev.filter(t => t.id !== id));
            
            // Reverse the balance
            setKhataAccounts(prev => prev.map(a => {
              if (a.id === accountId) {
                const reverseAmt = tx.type === 'jama' ? -tx.amount : tx.amount;
                return {
                  ...a,
                  balance: a.balance + reverseAmt,
                  totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) - tx.amount : (a.totalGiven || 0),
                  totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) - tx.amount : (a.totalReceived || 0)
                };
              }
              return a;
            }));
            showToast('🗑️ વ્યવહાર ટ્રેશ બિનમાં ગયો.');
          }}
          onEditKhataAccount={(id, newName, newPhone, newAddress) => {
             setKhataAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName, phone: newPhone, address: newAddress } : a));
             showToast('✅ ખાતાની વિગત (નામ, ફોન, સરનામું) અપડેટ થઈ ગઈ!');
          }}
          onEditKhataTransaction={(id, newAmount, newDesc) => {
            const tx = khataTransactions.find(t => t.id === id);
            if (!tx) return;
            
            const amountDiff = newAmount - tx.amount;
            
            setKhataTransactions(prev => prev.map(t => {
               if(t.id === id) {
                 return { ...t, amount: newAmount, description: newDesc };
               }
               return t;
            }));
            
            setKhataAccounts(prev => prev.map(a => {
               if (a.id === tx.accountId) {
                 const balanceDiff = tx.type === 'jama' ? amountDiff : -amountDiff;
                 return {
                   ...a,
                   balance: a.balance + balanceDiff,
                   totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + amountDiff : (a.totalGiven || 0),
                   totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + amountDiff : (a.totalReceived || 0)
                 };
               }
               return a;
            }));
            showToast('✅ વ્યવહાર અપડેટ થયો.');
          }}
          storeSettings={storeSettings}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 14. PROFESSIONAL FOOTER WITH REAL VISITOR COUNTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#0B1E48] text-white border-t border-blue-900 mt-8 py-6 px-4 no-print text-xs">
        <div className="max-w-[1550px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Col 1: Store Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <h3 className="font-black text-sm text-orange-400">
                {storeSettings.storeNameGu}
              </h3>
            </div>
            <p className="text-[11px] text-neutral-300">
              {storeSettings.storeNameEn}
            </p>
            <p className="text-[10px] text-neutral-400">
              {storeSettings.tagline} • સંચાલક: {storeSettings.ownerName}
            </p>
          </div>

          {/* Col 2: Address & Location */}
          <div className="space-y-1.5">
            <h4 className="font-black text-orange-400 text-xs">📍 દુકાન સરનામું</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {storeSettings.address}
            </p>
            <p className="text-[11px] font-bold text-neutral-300">
              📞 હેલ્પલાઇન: <a href={`tel:+91${storeSettings.phone}`} className="text-orange-400 hover:underline">{storeSettings.phoneDisplay}</a>
            </p>
          </div>

          {/* Col 3: CSC & Online Services */}
          <div className="space-y-1.5">
            <h4 className="font-black text-orange-400 text-xs">⚡ ઉપલબ્ધ સેવાઓ</h4>
            <ul className="text-[11px] text-neutral-300 space-y-1">
              <li>✓ તમામ સરકારી ભરતી ઓનલાઇન ફોર્મ</li>
              <li>✓ આધાર સ્માર્ટ કાર્ડ પ્રિન્ટિંગ & અપડેટ</li>
              <li>✓ પાન કાર્ડ નવું & નામ સુધારો</li>
              <li>✓ સ્કૂલ/ઓફિસ સ્ટેશનરી હોલસેલ ભાવે</li>
            </ul>
          </div>

          {/* Col 4: Real Visitor Counter */}
          <div className="space-y-2 bg-blue-950/80 p-3 rounded-xl border border-blue-900">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-orange-400">🌐 કુલ મુલાકાતીઓ (Visitors)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-700 flex items-center justify-center gap-1 font-mono text-base font-black text-emerald-400 tracking-widest shadow-inner">
              {visitorCount.split('').map((digit, idx) => (
                <span key={idx} className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                  {digit}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-neutral-400 text-center">
              લાસ્ટ અપડેટ: 12/09/2026 • ડેવલપર: {storeSettings.developerCredit}
            </p>
          </div>

        </div>

        <div className="max-w-[1550px] mx-auto border-t border-blue-900/60 mt-6 pt-4 text-center text-[10px] text-neutral-400">
          © 2026 {storeSettings.storeNameEn}. All Rights Reserved. • Powered by AI Studio
        </div>
      </footer>

      {/* OFFLINE STATE NOTIFICATION TOAST */}
      <OfflineIndicator />
    </div>
  );
}
