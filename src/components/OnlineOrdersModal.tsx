import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Printer,
  Trash2,
  Eye,
  Download,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  ImageIcon,
  Sparkles,
  Check
} from 'lucide-react';
import { OrderRecord, StoreSettings } from '../types';

interface OnlineOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onUpdateOrderStatus: (orderId: string, status: OrderRecord['orderStatus']) => void;
  onDeleteOrder: (orderId: string) => void;
  onPrintInvoice: (order: OrderRecord) => void;
  onEditOrder?: (order: OrderRecord) => void;
  storeSettings?: StoreSettings;
}

export const OnlineOrdersModal: React.FC<OnlineOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onPrintInvoice,
  onEditOrder,
  storeSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled'>('all');
  const [streamFilter, setStreamFilter] = useState<'all' | 'products' | 'documents' | 'counter'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // In-modal Photo & Document Viewer (No download unless requested!)
  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    type: 'image' | 'pdf' | 'other';
    fileName?: string;
  } | null>(null);

  // Helpers to distinguish document/xerox service vs stationery product orders vs counter bills
  const isDocumentOrder = (o: OrderRecord) => {
    return (
      (o.attachedFiles && o.attachedFiles.length > 0) ||
      o.items.some(it => 
        it.name.includes('ઝેરોક્ષ') ||
        it.name.includes('પ્રિન્ટ') ||
        it.name.includes('લેમિનેશન') ||
        it.name.includes('PVC') ||
        it.name.includes('પાસપોર્ટ') ||
        it.name.includes('ડોક્યુમેન્ટ') ||
        it.name.includes('ફાઇલ') ||
        it.name.includes('Aadhaar') ||
        it.name.includes('PAN')
      )
    );
  };

  const isCounterOrder = (o: OrderRecord) => {
    return o.orderType === 'counter' || (!o.invoiceNo.startsWith('ORD-') && o.orderType !== 'online');
  };

  // 4-Way Segregated Accounting Breakdown
  const stationeryOrders = useMemo(() => {
    return orders.filter(o => !isCounterOrder(o) && !isDocumentOrder(o));
  }, [orders]);

  const documentOrders = useMemo(() => {
    return orders.filter(o => !isCounterOrder(o) && isDocumentOrder(o));
  }, [orders]);

  const counterBills = useMemo(() => {
    return orders.filter(o => isCounterOrder(o));
  }, [orders]);

  const stationeryTotal = stationeryOrders.reduce((s, o) => s + (o.total || 0), 0);
  const documentTotal = documentOrders.reduce((s, o) => s + (o.total || 0), 0);
  const counterTotal = counterBills.reduce((s, o) => s + (o.total || 0), 0);
  const bankUpiTotal = orders
    .filter(o => (o.paymentMode === 'UPI' || o.paymentMode === 'Online') && (o.paymentStatus === 'Paid' || o.paymentStatus === 'Verified'))
    .reduce((s, o) => s + (o.total || 0), 0);

  // Filter list based on selected stream (products, documents, counter, all)
  const currentStreamOrders = useMemo(() => {
    let base = orders;
    if (streamFilter === 'products') {
      base = stationeryOrders;
    } else if (streamFilter === 'documents') {
      base = documentOrders;
    } else if (streamFilter === 'counter') {
      base = counterBills;
    }

    return base.sort((a, b) => {
      const timeA = a.timestamp || new Date(a.date).getTime() || 0;
      const timeB = b.timestamp || new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });
  }, [orders, streamFilter, stationeryOrders, documentOrders, counterBills]);

  // Counts for tabs
  const pendingCount = currentStreamOrders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'confirmed' || !o.orderStatus).length;
  const packedCount = currentStreamOrders.filter(o => o.orderStatus === 'packed').length;
  const outDeliveryCount = currentStreamOrders.filter(o => o.orderStatus === 'out_for_delivery').length;
  const deliveredCount = currentStreamOrders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledCount = currentStreamOrders.filter(o => o.orderStatus === 'cancelled').length;

  const filteredOrders = useMemo(() => {
    return currentStreamOrders.filter(o => {
      // Status Filter
      if (statusFilter === 'pending' && !(o.orderStatus === 'placed' || o.orderStatus === 'confirmed' || !o.orderStatus)) return false;
      if (statusFilter === 'packed' && o.orderStatus !== 'packed') return false;
      if (statusFilter === 'out_for_delivery' && o.orderStatus !== 'out_for_delivery') return false;
      if (statusFilter === 'delivered' && o.orderStatus !== 'delivered') return false;
      if (statusFilter === 'cancelled' && o.orderStatus !== 'cancelled') return false;

      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesInvoice = o.invoiceNo?.toLowerCase().includes(term);
        const matchesName = o.customerName?.toLowerCase().includes(term);
        const matchesMobile = o.mobile?.includes(term);
        const matchesAddress = o.address?.toLowerCase().includes(term) || o.village?.toLowerCase().includes(term);
        const matchesItem = o.items?.some(it => it.name?.toLowerCase().includes(term));
        return matchesInvoice || matchesName || matchesMobile || matchesAddress || matchesItem;
      }

      return true;
    });
  }, [currentStreamOrders, statusFilter, searchTerm]);

  if (!isOpen) return null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'placed':
        return { label: '📝 નવો ઓર્ડર મળ્યો', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'confirmed':
        return { label: '💳 પેમેન્ટ મંજૂર', bg: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'packed':
        return { label: '📦 પેક થઈ ગયું', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'out_for_delivery':
        return { label: '🚚 રવાના થયો', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'delivered':
        return { label: '✅ ડિલિવરી પૂર્ણ', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'cancelled':
        return { label: '❌ રદ થયેલ', bg: 'bg-red-100 text-red-900 border-red-300' };
      default:
        return { label: '📝 નવો ઓર્ડર', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
    }
  };

  const handleSendWhatsAppUpdate = (order: OrderRecord) => {
    const phone = order.mobile.replace(/\D/g, '');
    const validPhone = phone.length === 10 ? `91${phone}` : phone;
    const storeName = storeSettings?.storeNameGu || 'પ્રિષા સ્ટેશનરી & ઓનલાઇન સર્વિસ';
    
    let statusMsg = 'તમારો ઓર્ડર અમને મળી ગયો છે.';
    if (order.orderStatus === 'confirmed') statusMsg = 'તમારો ઓર્ડર અને પેમેન્ટ મંજૂર થઈ ગયા છે.';
    if (order.orderStatus === 'packed') statusMsg = 'તમારો સામાન પેક થઈ ગયો છે અને મોકલવા તૈયાર છે.';
    if (order.orderStatus === 'out_for_delivery') statusMsg = 'તમારો ઓર્ડર દુકાનેથી રવાના થઈ ગયો છે, જલ્દી મળશે.';
    if (order.orderStatus === 'delivered') statusMsg = 'તમારો ઓર્ડર સફળતાપૂર્વક ડિલિવરી થઈ ગયો છે. આભાર!';
    if (order.orderStatus === 'cancelled') statusMsg = 'તમારો ઓર્ડર રદ કરવામાં આવ્યો છે.';

    const itemsSummary = order.items.map(it => `• ${it.name} (${it.qty} ${it.unit}) - ₹${it.price * it.qty}`).join('\n');

    const msg = `નમસ્તે ${order.customerName}જી,\n*${storeName} (થરાદ)* માંથી તમારા ઓર્ડરની વિગત:\n\n*બિલ / ઓર્ડર નં:* #${order.invoiceNo}\n*તારીખ:* ${order.date}\n*સ્ટેટસ:* ${statusMsg}\n\n*ઓર્ડર કરેલ વસ્તુઓ:*\n${itemsSummary}\n\n*કુલ રકમ:* ₹${order.total} (${order.paymentMode} - ${order.paymentStatus})\n*સરનામું:* ${order.address || 'દુકાન પિકઅપ'}\n\nસંપર્ક: ${storeSettings?.phoneDisplay || '81404 30395'}\nખરીદી બદલ ખૂબ ખૂબ આભાર!`;

    window.open(`https://wa.me/${validPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-hidden">
      <div className="bg-neutral-100 rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col border-2 border-neutral-800 shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#0B1E48] text-white p-3.5 sm:p-4 flex items-center justify-between border-b-2 border-orange-500 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  🌐 ઓનલાઇન ઓર્ડર્સ મેનેજમેન્ટ (Online Orders)
                </h2>
                <span className="bg-orange-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                  {currentStreamOrders.length} ઓર્ડર્સ
                </span>
                {pendingCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} નવા / પેન્ડિંગ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 font-medium">
                ગ્રાહકોના ઓનલાઇન ઓર્ડરનું લિસ્ટ, વસ્તુઓની યાદી, બિલ અને ફોટો પ્રિવ્યુ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            title="બંધ કરો"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-WAY ACCOUNTING BREAKDOWN TILES (વસ્તુ હિસાબ, ડૉક્યુમેન્ટ હિસાબ, કાઉન્ટર હિસાબ, કરન્ટ એકાઉન્ટ) */}
        <div className="bg-white p-3 border-b border-neutral-300 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Stationery Products Total */}
          <button
            type="button"
            onClick={() => setStreamFilter('products')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              streamFilter === 'products'
                ? 'bg-amber-500 text-black border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold block">📦 ૧. વસ્તુ વેચાણ હિસાબ</span>
              <span className="text-[9px] font-black bg-amber-200/80 px-1.5 py-0.2 rounded">
                {stationeryOrders.length}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              ₹{stationeryTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] opacity-75 font-medium">નોટબુક, પેન, સ્ટેશનરી</span>
          </button>

          {/* 2. Documents & Xerox Total */}
          <button
            type="button"
            onClick={() => setStreamFilter('documents')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              streamFilter === 'documents'
                ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/40 shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold block">📄 ૨. ડૉક્યુમેન્ટ પ્રિન્ટ હિસાબ</span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${streamFilter === 'documents' ? 'bg-blue-800 text-white' : 'bg-blue-200 text-blue-900'}`}>
                {documentOrders.length}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              ₹{documentTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] opacity-75 font-medium">ઝેરોક્ષ, પ્રિન્ટ, લેમિનેશન</span>
          </button>

          {/* 3. Counter POS Bills Total */}
          <button
            type="button"
            onClick={() => setStreamFilter('counter')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              streamFilter === 'counter'
                ? 'bg-neutral-800 text-white border-black ring-2 ring-neutral-400/40 shadow-xs'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold block">🏪 ૩. કાઉન્ટર બિલ હિસાબ</span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${streamFilter === 'counter' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-800'}`}>
                {counterBills.length}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black mt-0.5">
              ₹{counterTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] opacity-75 font-medium">દુકાન રોકડ & કાઉન્ટર POS</span>
          </button>

          {/* 4. Bank / Current Account UPI Total */}
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-2.5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold block">🏦 ૪. બેંક / કરન્ટ A/c (UPI)</span>
              <span className="text-[9px] font-black bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                બેંક જમા
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-800 mt-0.5">
              ₹{bankUpiTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[9px] text-emerald-700 font-medium">UPI QR સ્કેન સીધા ખાતામાં</span>
          </div>
        </div>

        {/* ORDER LIST BODY */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-neutral-300 space-y-2">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
              <h3 className="text-sm font-black text-neutral-700">કોઈ ઓનલાઇન ઓર્ડર મળ્યો નથી</h3>
              <p className="text-xs text-neutral-500 font-medium">
                {searchTerm ? 'શોધ પરિણામમાં કોઈ ઓર્ડર મળ્યો નથી. ફિલ્ટર બદલીને પ્રયાસ કરો.' : 'હાલમાં આ કેટેગરીમાં કોઈ નવો ઓનલાઇન ઓર્ડર નથી.'}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const statusBadge = getStatusBadge(order.orderStatus);
              const isExpanded = expandedOrderId === order.id;

              // Check if customer provided a payment screenshot
              const hasScreenshot = Boolean(order.paymentScreenshot);
              
              // Genuine customer attached files (for upload/xerox)
              const attachedFiles = (order.attachedFiles && order.attachedFiles.length > 0)
                ? order.attachedFiles
                : [];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-blue-300 shadow-xs overflow-hidden transition-all"
                >
                  {/* ORDER CARD TOP HEADER */}
                  <div className="p-3 sm:p-4 bg-neutral-50/80 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300 flex items-center gap-1 font-mono">
                        #{order.invoiceNo}
                      </span>

                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>

                      <span className="text-xs text-neutral-500 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{order.date}</span>
                      </span>

                      {/* Stream Badge */}
                      {isCounterOrder(order) ? (
                        <span className="bg-neutral-200 text-neutral-800 text-[10px] font-black px-2 py-0.5 rounded border border-neutral-300">
                          🏪 કાઉન્ટર બિલ
                        </span>
                      ) : isDocumentOrder(order) ? (
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded border border-blue-300">
                          📄 ડૉક્યુમેન્ટ ઓર્ડર
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded border border-amber-300">
                          📦 વસ્તુ ઓર્ડર
                        </span>
                      )}

                      {order.deliveryType && (
                        <span className="bg-purple-50 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded border border-purple-200">
                          {order.deliveryType === 'parcel' ? '📦 પાર્સલ ડિલિવરી' : '✉️ કવર ડિલિવરી'}
                        </span>
                      )}
                    </div>

                    {/* Total Bill Amount & Payment Status */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 font-bold block">કુલ બિલ</span>
                        <span className="text-base sm:text-lg font-black text-orange-700">
                          ₹{order.total}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {order.paymentMode} ({order.paymentStatus})
                      </span>
                    </div>
                  </div>

                  {/* CUSTOMER & DELIVERY INFO BAR */}
                  <div className="p-3 sm:p-4 border-b border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    
                    {/* Customer Contact */}
                    <div className="space-y-1">
                      <div className="text-neutral-500 text-[10px] font-bold">ગ્રાહકની માહિતી:</div>
                      <div className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                        <span>👤 {order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${order.mobile}`}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-black px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-blue-200"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.mobile}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppUpdate(order)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-emerald-200 cursor-pointer"
                          title="ગ્રાહકને WhatsApp પર બિલ/ઓર્ડર મેસેજ મોકલો"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-1">
                      <div className="text-neutral-500 text-[10px] font-bold">ડિલિવરી સરનામું:</div>
                      <div className="font-medium text-neutral-800 leading-snug flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span>{order.address || 'દુકાનેથી સીધો પિકઅપ'}</span>
                          {(order.village || order.taluka || order.pincode) && (
                            <div className="text-[11px] text-neutral-500 font-bold mt-0.5">
                              {[order.village, order.taluka, order.district, order.pincode].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment & Transaction Notes */}
                    <div className="space-y-1">
                      <div className="text-neutral-500 text-[10px] font-bold">ચુકવણી & ટ્રાન્ઝેક્શન:</div>
                      <div className="font-bold text-neutral-700">
                        પદ્ધતિ: <strong className="text-neutral-900">{order.paymentMode}</strong>
                      </div>
                      {order.paymentDetails?.transactionId && (
                        <div className="text-[11px] font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                          UTR: {order.paymentDetails.transactionId}
                        </div>
                      )}
                      {order.notes && (
                        <div className="text-[11px] text-neutral-500 italic">
                          નોંધ: {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* DIRECT VASTU LIST (ડિરેક્ટ વસ્તુઓની યાદી) - ALWAYS PROMINENT */}
                  {/* ============================================================== */}
                  <div className="p-3 sm:p-4 bg-amber-50/40 border-b border-amber-200/60">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>🛒 ઓર્ડર કરેલ વસ્તુઓનું લિસ્ટ (Items List):</span>
                      </h4>
                      <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        કુલ {order.items.reduce((s, it) => s + it.qty, 0)} નંગ
                      </span>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-neutral-300 overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 font-black text-[11px]">
                            <th className="p-2 sm:px-3">ક્રમ</th>
                            <th className="p-2 sm:px-3">વસ્તુનું નામ (Item Name)</th>
                            <th className="p-2 sm:px-3 text-center">જથ્થો (Qty)</th>
                            <th className="p-2 sm:px-3 text-right">ભાવ (Rate)</th>
                            <th className="p-2 sm:px-3 text-right">સરવાળો (Total)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 text-neutral-800">
                          {order.items.map((item, idx) => {
                            const itemTotal = item.price * item.qty;
                            return (
                              <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                <td className="p-2 sm:px-3 text-neutral-500 font-bold">{idx + 1}</td>
                                <td className="p-2 sm:px-3 font-black text-neutral-900">
                                  <span>{item.name}</span>
                                  {item.hsnCode && (
                                    <span className="text-[10px] text-neutral-400 font-mono ml-1.5 font-normal">
                                      [HSN: {item.hsnCode}]
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 sm:px-3 text-center font-bold">
                                  <span className="bg-neutral-100 px-2 py-0.5 rounded font-black text-neutral-900">
                                    {item.qty} {item.unit || 'નંગ'}
                                  </span>
                                </td>
                                <td className="p-2 sm:px-3 text-right font-medium">₹{item.price}</td>
                                <td className="p-2 sm:px-3 text-right font-black text-neutral-950">₹{itemTotal}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-neutral-50 border-t border-neutral-300 text-neutral-800 font-bold text-xs">
                            <td colSpan={3} className="p-2 sm:px-3 text-neutral-500 font-normal">
                              વસ્તુઓનો કુલ સરવાળો (Subtotal):
                            </td>
                            <td colSpan={2} className="p-2 sm:px-3 text-right font-black text-neutral-900">
                              ₹{order.subtotal}
                            </td>
                          </tr>
                          {order.deliveryCharge !== undefined && order.deliveryCharge > 0 && (
                            <tr className="bg-neutral-50 text-neutral-700 text-xs">
                              <td colSpan={3} className="p-1.5 sm:px-3 text-neutral-500">
                                🚚 ડિલિવરી ચાર્જ:
                              </td>
                              <td colSpan={2} className="p-1.5 sm:px-3 text-right font-bold text-neutral-800">
                                +₹{order.deliveryCharge}
                              </td>
                            </tr>
                          )}
                          {order.packingCharge !== undefined && order.packingCharge > 0 && (
                            <tr className="bg-neutral-50 text-neutral-700 text-xs">
                              <td colSpan={3} className="p-1.5 sm:px-3 text-neutral-500">
                                📦 પેકિંગ ચાર્જ:
                              </td>
                              <td colSpan={2} className="p-1.5 sm:px-3 text-right font-bold text-neutral-800">
                                +₹{order.packingCharge}
                              </td>
                            </tr>
                          )}
                          {order.discount !== undefined && order.discount > 0 && (
                            <tr className="bg-neutral-50 text-emerald-700 text-xs">
                              <td colSpan={3} className="p-1.5 sm:px-3">
                                🏷️ ડિસ્કાઉન્ટ:
                              </td>
                              <td colSpan={2} className="p-1.5 sm:px-3 text-right font-black">
                                -₹{order.discount}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-amber-100/70 border-t-2 border-neutral-300 font-black text-xs text-neutral-950">
                            <td colSpan={3} className="p-2 sm:px-3 text-amber-950">
                              કુલ ચૂકવવાપાત્ર રકમ (Final Bill Total):
                            </td>
                            <td colSpan={2} className="p-2 sm:px-3 text-right text-base text-orange-800 font-black">
                              ₹{order.total}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* PHOTO & DOCUMENT VIEW BUTTONS (ફોટો જોવો હોય તો જ - નો ઓટો ડાઉનલોડ) */}
                  {/* ============================================================== */}
                  {(hasScreenshot || attachedFiles.length > 0) && (
                    <div className="p-3 sm:p-4 bg-blue-50/70 border-b border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-blue-700" />
                          <span>ગ્રાહકનો ફોટો / પેમેન્ટ સ્ક્રીનશોટ / ડોક્યુમેન્ટ:</span>
                        </span>
                        <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                          ક્લિક કરીને ફક્ત સ્ક્રીન પર જુઓ
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Payment Screenshot Viewer Button */}
                        {hasScreenshot && (
                          <button
                            type="button"
                            onClick={() => setViewingMedia({
                              url: order.paymentScreenshot!,
                              title: `પેમેન્ટ સ્ક્રીનશોટ - ઓર્ડર #${order.invoiceNo}`,
                              subtitle: `ગ્રાહક: ${order.customerName} (₹${order.total})`,
                              type: 'image',
                              fileName: `payment-${order.invoiceNo}.jpg`
                            })}
                            className="bg-purple-700 hover:bg-purple-800 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-200" />
                            <span>👁️ પેમેન્ટ સ્ક્રીનશોટ જુઓ</span>
                          </button>
                        )}

                        {/* Attached Files (for customer uploads) */}
                        {attachedFiles.map((af, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => {
                              const isPdf = af.fileName?.toLowerCase().endsWith('.pdf');
                              setViewingMedia({
                                url: af.fileDataUrl,
                                title: af.fileName || `ફાઇલ #${fIdx + 1}`,
                                subtitle: `ઓર્ડર #${order.invoiceNo} • ${order.customerName}`,
                                type: isPdf ? 'pdf' : 'image',
                                fileName: af.fileName
                              });
                            }}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-200" />
                            <span>👁️ {af.fileName || `ફાઇલ #${fIdx + 1}`} જુઓ</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM ACTION BAR: STATUS CHANGER + PRINT + EDIT + DELETE */}
                  <div className="p-3 bg-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    
                    {/* Status Changer Stepper / Dropdown */}
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-black text-neutral-700">
                        સ્ટેટસ બદલો:
                      </label>
                      <select
                        value={order.orderStatus || 'placed'}
                        onChange={e => onUpdateOrderStatus(order.id, e.target.value as OrderRecord['orderStatus'])}
                        className={`text-xs font-black px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer ${
                          (order.orderStatus || 'placed') === 'delivered'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : (order.orderStatus || 'placed') === 'cancelled'
                            ? 'bg-red-100 text-red-900 border-red-400'
                            : (order.orderStatus || 'placed') === 'out_for_delivery'
                            ? 'bg-purple-100 text-purple-900 border-purple-400'
                            : (order.orderStatus || 'placed') === 'packed'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-orange-100 text-orange-900 border-orange-400'
                        }`}
                      >
                        <option value="placed">📝 ૧. નવો ઓર્ડર મળ્યો (Placed)</option>
                        <option value="confirmed">💳 ૨. પેમેન્ટ મંજૂર (Confirmed)</option>
                        <option value="packed">📦 ૩. પેક થઈ ગયું (Packed)</option>
                        <option value="out_for_delivery">🚚 ૪. રવાના થયો (Out for Delivery)</option>
                        <option value="delivered">✅ ૫. ડિલિવરી પૂર્ણ (Delivered)</option>
                        <option value="cancelled">❌ ૬. રદ થયેલ (Cancelled)</option>
                      </select>

                      {order.statusUpdatedAt && (
                        <span className="text-[10px] text-neutral-400 font-bold hidden md:inline">
                          ({order.statusUpdatedAt})
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      
                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppUpdate(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        title="ગ્રાહકને WhatsApp પર બિલ/ઓર્ડર સ્ટેટસ મોકલો"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp મેસેજ</span>
                      </button>

                      {/* Print Invoice Button */}
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(order)}
                        className="bg-[#0B1E48] hover:bg-blue-900 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        title="આ ઓર્ડરનું પાકું બિલ / ઇન્વોઇસ પ્રિન્ટ કરો"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-400" />
                        <span>બિલ પ્રિન્ટ</span>
                      </button>

                      {/* Edit Bill Button */}
                      {onEditOrder && (
                        <button
                          type="button"
                          onClick={() => onEditOrder(order)}
                          className="bg-white hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-neutral-300 flex items-center gap-1 cursor-pointer"
                          title="બિલ એડિટ કરો"
                        >
                          <span>એડિટ</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`શું તમે ખરેખર ઓર્ડર #${order.invoiceNo} ડિલીટ કરવા માંગો છો?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-red-200 flex items-center gap-1 cursor-pointer"
                        title="ઓર્ડર ડિલીટ કરો"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ડિલીટ</span>
                      </button>

                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white p-3 sm:p-4 border-t border-neutral-300 flex items-center justify-between text-xs shrink-0">
          <div className="font-bold text-neutral-600">
            કુલ <strong className="text-neutral-900">{filteredOrders.length}</strong> ઓર્ડર્સ દર્શાવેલ છે
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-black text-white font-black px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
          >
            બંધ કરો (Close)
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* IN-SCREEN PHOTO & DOCUMENT PREVIEW LIGHTBOX (NO AUTO DOWNLOAD) */}
      {/* ============================================================== */}
      {viewingMedia && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-3 animate-fade-in no-print">
          <div className="bg-neutral-900 rounded-2xl max-w-3xl w-full h-[88vh] flex flex-col border border-neutral-700 shadow-2xl overflow-hidden">
            
            {/* Lightbox Header */}
            <div className="p-3 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
              <div>
                <h4 className="text-sm font-black text-white">{viewingMedia.title}</h4>
                {viewingMedia.subtitle && (
                  <p className="text-[11px] text-neutral-400">{viewingMedia.subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Optional Download button only if user explicitly asks for it */}
                <button
                  type="button"
                  onClick={() => handleDownloadFile(viewingMedia.url, viewingMedia.fileName || 'file.png')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  title="જો સાચવવું હોય તો કમ્પ્યુટરમાં ડાઉનલોડ કરો"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ડાઉનલોડ કરો</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingMedia(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Media Body */}
            <div className="flex-1 bg-black/60 flex items-center justify-center p-4 overflow-auto">
              {viewingMedia.type === 'image' ? (
                <img
                  src={viewingMedia.url}
                  alt={viewingMedia.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-neutral-800"
                />
              ) : (
                <iframe
                  src={viewingMedia.url}
                  title={viewingMedia.title}
                  className="w-full h-full rounded-lg bg-white"
                />
              )}
            </div>

            {/* Lightbox Footer Note */}
            <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 text-center text-[11px] text-neutral-400">
              👁️ ફોટો ફક્ત સ્ક્રીન પર જોઈ શકાય છે. કમ્પ્યુટરમાં સાચવવું હોય તો જ ઉપર આપેલ 'ડાઉનલોડ કરો' બટન દબાવો.
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
