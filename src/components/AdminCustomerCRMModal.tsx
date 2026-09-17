import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calendar,
  IndianRupee,
  MessageSquare,
  Package
} from 'lucide-react';
import { RegisteredCustomer, OrderRecord, PrintJobRecord } from '../types';

interface AdminCustomerCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredCustomers: RegisteredCustomer[];
  orders: OrderRecord[];
  printJobs: PrintJobRecord[];
  onViewOrderInvoice: (order: OrderRecord) => void;
}

export const AdminCustomerCRMModal: React.FC<AdminCustomerCRMModalProps> = ({
  isOpen,
  onClose,
  registeredCustomers,
  orders,
  printJobs,
  onViewOrderInvoice
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerMobile, setExpandedCustomerMobile] = useState<string | null>(null);

  if (!isOpen) return null;

  // Build a consolidated customer list combining registered account holders and distinct phone numbers in orders
  const customerMap = new Map<string, {
    name: string;
    mobile: string;
    address: string;
    isRegistered: boolean;
    registeredAt?: string;
    lastActive?: string;
    customerOrders: OrderRecord[];
    customerPrintJobs: PrintJobRecord[];
    totalSpent: number;
  }>();

  // 1. Add Registered Customers
  registeredCustomers.forEach(rc => {
    const cleanMob = rc.mobile.trim();
    customerMap.set(cleanMob, {
      name: rc.name,
      mobile: cleanMob,
      address: rc.address || '',
      isRegistered: true,
      registeredAt: rc.createdAt,
      lastActive: rc.lastLoginAt,
      customerOrders: [],
      customerPrintJobs: [],
      totalSpent: 0
    });
  });

  // 2. Add Customer Orders
  orders.forEach(ord => {
    const cleanMob = (ord.mobile || '').trim().replace(/\D/g, '');
    if (!cleanMob) return;

    let existing = customerMap.get(cleanMob);
    if (!existing) {
      existing = {
        name: ord.customerName || 'ગ્રાહક',
        mobile: cleanMob,
        address: ord.address || '',
        isRegistered: false,
        customerOrders: [],
        customerPrintJobs: [],
        totalSpent: 0
      };
      customerMap.set(cleanMob, existing);
    }
    existing.customerOrders.push(ord);
    existing.totalSpent += (ord.total || 0);
  });

  // 3. Add Print Jobs
  printJobs.forEach(pj => {
    const cleanMob = (pj.mobile || '').trim().replace(/\D/g, '');
    if (!cleanMob) return;

    let existing = customerMap.get(cleanMob);
    if (!existing) {
      existing = {
        name: pj.customerName || 'ગ્રાહક',
        mobile: cleanMob,
        address: pj.address || '',
        isRegistered: false,
        customerOrders: [],
        customerPrintJobs: [],
        totalSpent: 0
      };
      customerMap.set(cleanMob, existing);
    }
    existing.customerPrintJobs.push(pj);
    existing.totalSpent += (pj.totalAmount || 0);
  });

  const customerList = Array.from(customerMap.values()).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm)
  ).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-300">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500 text-black rounded-xl font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>👥 ગ્રાહક લિસ્ટ અને ખરીદી હિસ્ટ્રી (CRM)</span>
                <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  કુલ {customerList.length} ગ્રાહકો
                </span>
              </h3>
              <p className="text-[11px] text-blue-200">
                બધા રજિસ્ટર્ડ ગ્રાહકો અને તેમણે ખરીદેલી આઇટમ્સની વિગત
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

        {/* SEARCH BAR */}
        <div className="bg-neutral-100 p-3 border-b border-neutral-200 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ગ્રાહકનું નામ કે મોબાઈલ નંબર શોધો..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:border-blue-700 outline-none"
            />
          </div>
          <span className="text-xs font-black text-neutral-600 hidden sm:inline">
            કુલ વેચાણમાંથી રેન્કિંગ
          </span>
        </div>

        {/* CUSTOMERS LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {customerList.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <Users className="w-12 h-12 mx-auto text-neutral-300" />
              <p className="font-black text-sm">કોઈ ગ્રાહક મળ્યો નહીં</p>
            </div>
          ) : (
            customerList.map((cust, idx) => {
              const isExpanded = expandedCustomerMobile === cust.mobile;
              const totalOrdersCount = cust.customerOrders.length + cust.customerPrintJobs.length;

              return (
                <div
                  key={cust.mobile}
                  className="bg-white border-2 border-neutral-200 hover:border-blue-500 rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  <div
                    onClick={() => setExpandedCustomerMobile(isExpanded ? null : cust.mobile)}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-neutral-900">{cust.name}</h4>
                          {cust.isRegistered ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
                              ✓ રજિસ્ટર્ડ એકાઉન્ટ
                            </span>
                          ) : (
                            <span className="bg-neutral-100 text-neutral-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-neutral-300">
                              ગેસ્ટ ઓર્ડર
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-neutral-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>{cust.mobile}</span>
                          </span>
                          {cust.address && (
                            <span className="flex items-center gap-1 text-neutral-500">
                              <MapPin className="w-3.5 h-3.5 text-orange-600" />
                              <span className="truncate max-w-[150px]">{cust.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-neutral-400">કુલ ખરીદી</p>
                        <p className="text-sm font-black text-emerald-700">₹{cust.totalSpent}</p>
                        <p className="text-[10px] font-bold text-blue-900">{totalOrdersCount} ઓર્ડર</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/91${cust.mobile}?text=${encodeURIComponent(`નમસ્તે ${cust.name}જી, પ્રિષા સ્ટેશનરી તરફથી...`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                          title="WhatsApp મેસેજ કરો"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <div className="bg-neutral-50 p-3 sm:p-4 border-t border-neutral-200 space-y-3 animate-fade-in">
                      <h5 className="text-xs font-black text-neutral-800 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                        <span>ખરીદેલી વસ્તુઓની વિગત (Order History):</span>
                      </h5>

                      {totalOrdersCount === 0 ? (
                        <p className="text-xs text-neutral-500">આ ગ્રાહકે હજી સુધી ઓનલાઇન ખરીદી કરી નથી.</p>
                      ) : (
                        <div className="space-y-2">
                          {/* PRODUCT ORDERS */}
                          {cust.customerOrders.map(ord => (
                            <div key={ord.id} className="bg-white p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-black text-neutral-900">
                                <span>📦 ઓનલાઇન ઓર્ડર #{ord.invoiceNo} ({ord.date})</span>
                                <span className="text-emerald-700">₹{ord.total}</span>
                              </div>
                              <p className="text-neutral-600 text-[11px] font-bold">
                                આઇટમ્સ: {ord.items.map(i => `${i.name} × ${i.qty} (₹${i.price})`).join(', ')}
                              </p>
                            </div>
                          ))}

                          {/* PRINT JOBS */}
                          {cust.customerPrintJobs.map(pj => (
                            <div key={pj.id} className="bg-white p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-black text-neutral-900">
                                <span>🖨️ ઓનલાઇન પ્રિન્ટ જોબ #{pj.jobNo} ({pj.createdAt})</span>
                                <span className="text-blue-900">₹{pj.totalAmount}</span>
                              </div>
                              <p className="text-neutral-600 text-[11px] font-bold">
                                ફાઇલો ({pj.files?.length || 0}): {pj.files?.map(f => f.fileName).join(', ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-neutral-100 p-3 text-center border-t border-neutral-300">
          <button
            onClick={onClose}
            className="bg-blue-900 hover:bg-blue-950 text-white px-6 py-2 rounded-xl text-xs font-black cursor-pointer shadow-xs"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
