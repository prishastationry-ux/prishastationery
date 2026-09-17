import React from 'react';
import {
  X,
  Bell,
  Clock,
  Printer,
  ShoppingBag,
  CheckCircle2,
  Truck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  XCircle,
  PackageCheck
} from 'lucide-react';
import { OrderRecord, PrintJobRecord, StoreSettings } from '../types';

interface OrderNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingOrders: OrderRecord[];
  pendingPrintJobs: PrintJobRecord[];
  onUpdateOrderStatus: (orderId: string, newStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') => void;
  onUpdatePrintJobStatus: (jobId: string, newStatus: 'received' | 'in_progress' | 'printed' | 'ready' | 'completed' | 'cancelled') => void;
  onViewOrderInvoice: (order: OrderRecord) => void;
  storeSettings: StoreSettings;
}

export const OrderNotificationModal: React.FC<OrderNotificationModalProps> = ({
  isOpen,
  onClose,
  pendingOrders,
  pendingPrintJobs,
  onUpdateOrderStatus,
  onUpdatePrintJobStatus,
  onViewOrderInvoice,
  storeSettings
}) => {
  const [filter, setFilter] = React.useState<'all' | 'orders' | 'prints'>('all');

  if (!isOpen) return null;

  const activeOrders = pendingOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled');
  const activePrintJobs = pendingPrintJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');

  const totalActiveCount = activeOrders.length + activePrintJobs.length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-300">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 bg-orange-500/20 rounded-xl border border-orange-400/40">
              <Bell className="w-5 h-5 text-orange-400 animate-bounce" />
              {totalActiveCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-blue-950">
                  {totalActiveCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>🔔 નવા ઓર્ડર નોટિફિકેશન સેન્ટર</span>
                <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  {totalActiveCount} પેન્ડિંગ
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                જ્યાં સુધી ઓર્ડર ડિલિવર્ડ કે કમ્પ્લીટ નહીં થાય ત્યાં સુધી અહીં રહેશે
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILTER TABS */}
        <div className="bg-neutral-100 p-2.5 border-b border-neutral-200 flex items-center gap-2 overflow-x-auto text-xs font-black">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <span>બધા નોટિફિકેશન</span>
            <span className="bg-orange-500 text-black px-1.5 py-0.2 text-[10px] rounded-full">
              {totalActiveCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('orders')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'orders'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ઓનલાઇન ઓર્ડર ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setFilter('prints')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'prints'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>પ્રિન્ટ ઓર્ડર ({activePrintJobs.length})</span>
          </button>
        </div>

        {/* LIST CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {totalActiveCount === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                🎉
              </div>
              <h4 className="text-base font-black text-neutral-800">કોઈ પેન્ડિંગ ઓર્ડર નથી!</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                બધા ઓનલાઇન ઓર્ડર અને પ્રિન્ટ જોબ સફળતાપૂર્વક ડિલિવર / કમ્પ્લીટ થઈ ગયા છે.
              </p>
            </div>
          ) : (
            <>
              {/* ONLINE PRODUCT ORDERS */}
              {(filter === 'all' || filter === 'orders') && activeOrders.map(order => (
                <div
                  key={order.id}
                  className="bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-3.5 shadow-2xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                        📦 ઓનલાઇન ઓર્ડર
                      </span>
                      <span className="text-xs font-black text-neutral-900">#{order.invoiceNo}</span>
                      <span className="text-[10px] font-bold text-neutral-500">({order.date})</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ₹{order.total}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-neutral-800">
                    <div>
                      <p className="font-black text-neutral-900 text-sm">👤 {order.customerName}</p>
                      <p className="text-neutral-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <a href={`tel:${order.mobile}`} className="hover:underline text-blue-700 font-bold">{order.mobile}</a>
                        <a
                          href={`https://wa.me/91${order.mobile}?text=${encodeURIComponent(`નમસ્તે ${order.customerName}, તમારો પ્રિષા સ્ટેશનરી ઓર્ડર #${order.invoiceNo} અંગે...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded ml-1"
                        >
                          WhatsApp
                        </a>
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <p className="text-[11px] font-black text-neutral-700">
                        આઇટમ્સ ({order.items.reduce((s, i) => s + i.qty, 0)}):
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate max-w-xs">
                        {order.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onViewOrderInvoice(order)}
                      className="bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>બિલ જુઓ</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" />
                        <span>ડિલિવરીમાં મોકલો</span>
                      </button>

                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>✓ કમ્પ્લીટ & ડિલિવર્ડ</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('શું તમે આ ઓર્ડર રદ કરવા માંગો છો?')) {
                            onUpdateOrderStatus(order.id, 'cancelled');
                          }
                        }}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded-lg text-[11px] font-bold"
                        title="રદ કરો"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* PRINT JOBS */}
              {(filter === 'all' || filter === 'prints') && activePrintJobs.map(job => (
                <div
                  key={job.id}
                  className="bg-blue-50/70 border-2 border-blue-300 rounded-2xl p-3.5 shadow-2xs space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-blue-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                        🖨️ ઓનલાઇન પ્રિન્ટ જોબ
                      </span>
                      <span className="text-xs font-black text-neutral-900">#{job.jobNo}</span>
                      <span className="text-[10px] font-bold text-neutral-500">({job.createdAt})</span>
                    </div>
                    <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
                      ₹{job.totalAmount}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-neutral-800">
                    <div>
                      <p className="font-black text-neutral-900 text-sm">👤 {job.customerName}</p>
                      <p className="text-neutral-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <a href={`tel:${job.mobile}`} className="hover:underline text-blue-700 font-bold">{job.mobile}</a>
                        <a
                          href={`https://wa.me/91${job.mobile}?text=${encodeURIComponent(`નમસ્તે ${job.customerName}, તમારો પ્રિન્ટ ઓર્ડર #${job.jobNo} અંગે...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded ml-1"
                        >
                          WhatsApp
                        </a>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-black text-neutral-700">
                        ફાઇલો ({job.files?.length || 0} નંગ):
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate max-w-xs">
                        {job.files?.map(f => f.fileName).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      સ્ટેટસ: {job.status === 'received' ? '⏳ મળ્યો' : job.status === 'printed' ? '🖨️ પ્રિન્ટ થયો' : job.status === 'ready' ? '✅ તૈયાર' : job.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdatePrintJobStatus(job.id, 'printed')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>પ્રિન્ટ થઈ ગયું</span>
                      </button>

                      <button
                        onClick={() => onUpdatePrintJobStatus(job.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs"
                      >
                        <PackageCheck className="w-3 h-3" />
                        <span>✓ ડિલિવર્ડ (Clear Notification)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-neutral-100 p-3 border-t border-neutral-300 flex items-center justify-between text-xs font-bold text-neutral-600">
          <span>બધા સક્રિય ઓર્ડર અહીં ઓટો-અપડેટ થાય છે</span>
          <button
            onClick={onClose}
            className="bg-blue-900 text-white px-4 py-1.5 rounded-xl font-black hover:bg-blue-950 transition-colors cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
