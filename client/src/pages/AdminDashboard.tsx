import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, Wrench, RefreshCw, 
  LogOut, Plus, 
  Database, Users, Banknote, Menu,
  ClipboardList, History, Gift, UserCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/images/logo-ngalam-fix-pro.jpg";
import { fetchApi } from "../utils/api";
import "./AdminDashboard.css";

// Subcomponents for tab separation
import OrdersTab from "./admin/OrdersTab";
import TechnicianTab from "./admin/TechnicianTab";
import WalkinTab from "./admin/WalkinTab";
import CashierTab from "./admin/CashierTab";
import TransactionsTab from "./admin/TransactionsTab";
import MitraTab from "./admin/MitraTab";
import CustomersTab from "./admin/CustomersTab";
import PromosTab from "./admin/PromosTab";
import LogsTab from "./admin/LogsTab";
import ReceiptModal from "./admin/ReceiptModal";
export default function AdminDashboard() {
  const { user, loading: authLoading, logoutStaff } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'technician' | 'walkin' | 'cashier' | 'transactions' | 'promos' | 'logs' | 'mitra' | 'customers'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [mitras, setMitras] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [techFilter, setTechFilter] = useState('all');
  const [techSuccess, setTechSuccess] = useState('');

  // Cashier booking search
  const [bookingSearchInput, setBookingSearchInput] = useState('');
  const [bookingSearchError, setBookingSearchError] = useState('');

  // Payout Modal
  const [payoutModalMitra, setPayoutModalMitra] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');

  const handleMitraUpdated = (updated: any) => {
    setMitras((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  };

  const handleCustomerUpdated = (updated: any) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  };

  // Walk-in form state
  const [walkin, setWalkin] = useState({
    customerName: '',
    whatsapp: '',
    phoneType: 'iPhone 11',
    damage: '',
    estimatedCost: 200000,
    technician: 'Admin Workshop',
    referralCode: ''
  });
  const [walkinSuccess, setWalkinSuccess] = useState('');

  // Cashier payment modal/state
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    finalAmount: 0,
    paymentMethod: 'Tunai (Cash)',
    notes: ''
  });

  // Struk Modal state
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const printAreaRef = useRef<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashRes = await fetchApi('/api/admin/dashboard');
      if (dashRes.ok && dashRes.data.success) {
        setOrders(dashRes.data.orders || []);
        setTransactions(dashRes.data.transactions || []);
        setPromos(dashRes.data.promos || []);
        setActivityLogs(dashRes.data.activityLogs || []);
        setMitras(dashRes.data.mitras || []);
        setCustomers(dashRes.data.customers || []);
        setDbStatus(dashRes.data.dbStatus || null);
        return;
      }

      // Fallback ke endpoint individual bila agregat tidak tersedia
      const [ordRes, dbRes, promoRes, logRes, txRes, mitraRes, custRes] = await Promise.all([
        fetchApi('/api/orders'),
        fetchApi('/api/database/status'),
        fetchApi('/api/promos?all=true'),
        fetchApi('/api/activity-logs'),
        fetchApi('/api/finance/transactions'),
        fetchApi('/api/mitra/list'),
        fetchApi('/api/customer/list')
      ]);

      if (ordRes.ok && ordRes.data.success) setOrders(ordRes.data.data || []);
      if (dbRes.ok) setDbStatus(dbRes.data);
      if (promoRes.ok && promoRes.data.success) setPromos(promoRes.data.data || []);
      if (logRes.ok && logRes.data.success) setActivityLogs(logRes.data.logs || []);
      if (txRes.ok && txRes.data.success) setTransactions(txRes.data.data || []);
      if (mitraRes.ok && mitraRes.data.success) setMitras(mitraRes.data.data || []);
      if (custRes.ok && custRes.data.success) setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  // Walk-in submit
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        body: {
          customerName: walkin.customerName,
          whatsapp: walkin.whatsapp,
          phoneType: walkin.phoneType,
          damage: walkin.damage || 'Pemeriksaan Meja 1',
          cost: Number(walkin.estimatedCost) || 0,
          technician: walkin.technician,
          referralCode: walkin.referralCode || '',
          serviceMethod: 'walk_in_meja1',
          currentStep: 1,
          statusText: 'Unit diterima di counter Meja 1'
        }
      });

      if (res.ok && res.data.success) {
        setWalkinSuccess(`Tiket Walk-in Berhasil Dibuat: ${res.data.data.id}`);
        setWalkin({
          customerName: '',
          whatsapp: '',
          phoneType: 'iPhone 11',
          damage: '',
          estimatedCost: 200000,
          technician: 'Admin Workshop',
          referralCode: ''
        });
        loadData();
        setTimeout(() => setWalkinSuccess(''), 5000);
      }
    } catch {
      alert('Gagal mendaftarkan unit walk-in.');
    }
  };

  const handleUpdateStep = async (orderId, newStep, statusText) => {
    try {
      const res = await fetchApi(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: {
          currentStep: newStep,
          statusText: statusText,
          technician: user?.name || user?.username || 'Admin Workshop'
        }
      });
      if (res.ok && res.data.success) {
        setTechSuccess(`Tiket ${orderId} diupdate ke Step ${newStep}!`);
        setTimeout(() => setTechSuccess(''), 3000);
        loadData();
      }
    } catch {
      alert('Gagal memperbarui status pengerjaan tiket.');
    }
  };

  // Manual confirmation lookup by Booking Code / Ticket ID / Phone
  const handleSearchBookingCode = (e) => {
    e?.preventDefault();
    setBookingSearchError('');
    const query = bookingSearchInput.trim().toUpperCase();
    if (!query) return;

    const cleanDigits = bookingSearchInput.replace(/\D/g, '');
    const found = orders.find(o => 
      (o.id && o.id.toUpperCase() === query) ||
      (o.whatsapp && o.whatsapp.includes(query)) ||
      (cleanDigits && cleanDigits.length >= 6 && String(o.whatsapp || '').replace(/\D/g, '').includes(cleanDigits))
    );

    if (found) {
      setPaymentOrder(found);
      const rawCost = Number(String(found.cost || found.estimatedCost || '0').replace(/\D/g, '')) || 0;
      setPaymentForm({
        finalAmount: rawCost > 0 ? rawCost : 250000,
        paymentMethod: 'Tunai (Cash)',
        notes: found.affiliateRef ? `Komisi Mitra 10%: ${found.partnerName || found.affiliateMitraName || found.affiliateRef}` : ''
      });
      setBookingSearchInput('');
    } else {
      setBookingSearchError(`Nomor tiket / kode booking "${bookingSearchInput}" tidak ditemukan dalam antrian.`);
    }
  };

  // Payout / Tarik Saldo Komisi Mitra
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutModalMitra) return;
    try {
      const amt = Number(payoutAmount) || payoutModalMitra.balance;
      const res = await fetchApi('/api/mitra/payout', {
        method: 'POST',
        body: {
          referralCode: payoutModalMitra.referralCode,
          amount: amt,
          note: `Pencairan tunai oleh kasir ${user?.name || user?.username || 'Admin Workshop'}`
        }
      });
      if (res.ok && res.data.success) {
        alert(res.data.message || 'Pencairan saldo komisi mitra berhasil dicatat!');
        setPayoutModalMitra(null);
        setPayoutAmount('');
        loadData();
      } else {
        alert(res.data.message || 'Gagal mencairkan saldo mitra.');
      }
    } catch {
      alert('Koneksi server bermasalah.');
    }
  };

  // Payment settle -> Updates order & Records to finance transactions
  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!paymentOrder) return;
    try {
      const finalCost = Number(paymentForm.finalAmount) || 0;

      // 1. Update Order Status
      const resOrder = await fetchApi(`/api/orders/${paymentOrder.id}`, {
        method: 'PUT',
        body: {
          paid: true,
          cost: finalCost,
          paymentMethod: paymentForm.paymentMethod,
          paymentNotes: paymentForm.notes,
          currentStep: 5,
          statusText: 'Pembayaran Lunas di Admin Workshop'
        }
      });

      // 2. Insert into Transactions Ledger
      const resTx = await fetchApi('/api/finance/transactions', {
        method: 'POST',
        body: {
          ticketId: paymentOrder.id,
          customerName: paymentOrder.customerName,
          customerPhone: paymentOrder.whatsapp || '',
          customerEmail: paymentOrder.email || '',
          phoneType: paymentOrder.phoneType,
          damage: paymentOrder.damage,
          totalPaid: finalCost,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
          cashier: user?.name || user?.username || 'Admin Workshop'
        }
      });

      if (resOrder.ok && resOrder.data.success) {
        const txData = resTx.ok && resTx.data.data ? resTx.data.data : {
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          ticketId: paymentOrder.id,
          customerName: paymentOrder.customerName,
          customerPhone: paymentOrder.whatsapp,
          phoneType: paymentOrder.phoneType,
          totalPaid: finalCost,
          paymentMethod: paymentForm.paymentMethod,
          cashier: user?.name || 'Admin Workshop',
          createdAt: new Date().toISOString()
        };

        setReceiptTx(txData);
        setPaymentOrder(null);
        loadData();
      }
    } catch {
      alert('Gagal memproses pembayaran kasir.');
    }
  };

  // Print Receipt
  const handlePrint = () => {
    window.print();
  };

  // Export excel
  const handleExportExcel = () => {
    window.open('/api/export/transactions/excel', '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(s)) ||
      (o.customerName && o.customerName.toLowerCase().includes(s)) ||
      (o.whatsapp && o.whatsapp.includes(s)) ||
      (o.phoneType && o.phoneType.toLowerCase().includes(s))
    );
  });

  const navMenuItems = [
    { section: 'Operasional Utama' },
    { id: 'orders', label: 'Antrian Servis Unit', icon: <ClipboardList className="w-4 h-4 shrink-0" />, count: orders.length },
    { id: 'walkin', label: 'Intake Walk-in Meja 1', icon: <Plus className="w-4 h-4 shrink-0" /> },
    { id: 'cashier', label: 'Kasir & Pembayaran', icon: <Banknote className="w-4 h-4 shrink-0" /> },
    { id: 'transactions', label: 'Faktur & Riwayat Kasir', icon: <History className="w-4 h-4 shrink-0" />, count: transactions.length },
    
    { section: 'Workshop & Teknisi' },
    { id: 'technician', label: 'Meja Kerja Lab Teknisi', icon: <Wrench className="w-4 h-4 shrink-0" /> },
    { id: 'mitra', label: 'Mitra & Komisi Driver', icon: <Users className="w-4 h-4 shrink-0" />, count: mitras.length },
    { id: 'customers', label: 'Akun Pelanggan (Customer)', icon: <UserCheck className="w-4 h-4 shrink-0" />, count: customers.length },

    { section: 'Promosi & Sistem' },
    { id: 'promos', label: 'Banner & Voucher Promo', icon: <Gift className="w-4 h-4 shrink-0" />, count: promos.length },
    { id: 'logs', label: 'Log Audit Keamanan', icon: <ShieldCheck className="w-4 h-4 shrink-0" />, count: activityLogs.length }
  ];

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">Memverifikasi sesi staf...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-root min-h-screen flex bg-slate-100 text-slate-900 font-sans">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-950 text-white z-50 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/60">
          <Link to="/" className="flex items-center gap-3 no-underline text-white">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20 shrink-0">
              <img 
                src={logoImg} 
                alt="Logo Ngalam Fix Pro" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/logo-ngalam-fix-pro.jpg"; }}
              />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white leading-tight">Ngalam Fix Pro</div>
              <div className="text-[11px] font-extrabold tracking-wider text-amber-400 uppercase mt-0.5">Workshop Console</div>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-1.5">
          {navMenuItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="px-3 pt-3.5 pb-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {item.section}
                </div>
              );
            }

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`admin-sidebar-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? "active bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate flex-1">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive 
                      ? "bg-slate-950 text-amber-400" 
                      : "bg-slate-800 text-slate-300"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
              {(user?.name || user?.username || "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || user?.username || "Staf Admin"}
              </div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {user?.role || "Admin Super"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => { await logoutStaff(); navigate("/admin/login"); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold transition-all border border-red-500/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {navMenuItems.find(m => m.id === activeTab)?.label || "Dashboard Panel"}
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Pusat kendali operasional workshop, intake walk-in kasir &amp; kontrol lab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {dbStatus && (
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs ${
                dbStatus.connected 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{dbStatus.connected ? "PostgreSQL Neon Online" : "Local Storage Mode"}</span>
              </div>
            )}

            <button
              onClick={loadData}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <main className="admin-content-body flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

          {activeTab === "orders" && (
            <OrdersTab
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleExportExcel={handleExportExcel}
              loading={loading}
              filteredOrders={filteredOrders}
              onSelectOrderForPayment={(o) => {
                const numericCost = Number(String(o.cost || o.estimatedCost || "0").replace(/\D/g, "")) || 0;
                setPaymentOrder(o);
                setPaymentForm({
                  finalAmount: numericCost > 0 ? numericCost : 250000,
                  paymentMethod: "Tunai (Cash)",
                  notes: o.affiliateRef ? `Komisi Mitra 10%: ${o.partnerName || o.affiliateMitraName || o.affiliateRef}` : ""
                });
                setActiveTab("cashier");
              }}
            />
          )}

          {activeTab === "technician" && (
            <TechnicianTab
              orders={orders}
              techSuccess={techSuccess}
              techFilter={techFilter}
              setTechFilter={setTechFilter}
              loading={loading}
              handleUpdateStep={handleUpdateStep}
            />
          )}

          {activeTab === "walkin" && (
            <WalkinTab
              walkin={walkin}
              setWalkin={setWalkin}
              walkinSuccess={walkinSuccess}
              handleWalkinSubmit={handleWalkinSubmit}
            />
          )}

          {activeTab === "cashier" && (
            <CashierTab
              bookingSearchInput={bookingSearchInput}
              setBookingSearchInput={setBookingSearchInput}
              handleSearchBookingCode={handleSearchBookingCode}
              bookingSearchError={bookingSearchError}
              paymentOrder={paymentOrder}
              setPaymentOrder={setPaymentOrder}
              paymentForm={paymentForm}
              setPaymentForm={setPaymentForm}
              handleSettlePayment={handleSettlePayment}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionsTab
              transactions={transactions}
              setTransactions={setTransactions}
              loading={loading}
              handleExportExcel={handleExportExcel}
              setReceiptTx={setReceiptTx}
            />
          )}

          {activeTab === "mitra" && (
            <MitraTab
              mitras={mitras}
              loading={loading}
              payoutModalMitra={payoutModalMitra}
              setPayoutModalMitra={setPayoutModalMitra}
              payoutAmount={payoutAmount}
              setPayoutAmount={setPayoutAmount}
              handlePayoutSubmit={handlePayoutSubmit}
              onMitraUpdated={handleMitraUpdated}
            />
          )}

          {activeTab === "customers" && (
            <CustomersTab
              customers={customers}
              loading={loading}
              onCustomerUpdated={handleCustomerUpdated}
            />
          )}

          {activeTab === "promos" && (
            <PromosTab promos={promos} onRefresh={loadData} setPromos={setPromos} />
          )}

          {activeTab === "logs" && (
            <LogsTab activityLogs={activityLogs} />
          )}

          <ReceiptModal
            receiptTx={receiptTx}
            setReceiptTx={setReceiptTx}
            printAreaRef={printAreaRef}
            handlePrint={handlePrint}
          />
        </main>
      </div>

    </div>
  );
}
