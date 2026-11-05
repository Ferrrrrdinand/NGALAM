import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Clock,
  Wrench,
  Edit3,
  X,
  Save,
  Tag
} from 'lucide-react';
import { formatRp } from '../../utils/api';

export interface TransactionItem {
  id?: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  ticketId?: string;
  customerName?: string;
  customerPhone?: string;
  whatsapp?: string;
  deviceType?: string;
  phoneType?: string;
  technicianName?: string;
  baseCost?: number;
  discount?: number;
  promoCode?: string;
  deliveryFee?: number;
  totalPaid?: number;
  amount?: number;
  paymentMethod?: string;
  amountReceived?: number;
  change?: number;
  status?: string;
  cashier?: string;
  cashierName?: string;
  date?: string;
  displayDate?: string;
  serviceItem?: string;
  warrantyDurationDays?: number;
  warrantyTypeLabel?: string;
  warrantyStartDate?: string;
  warrantyValidUntil?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  warrantyCode?: string;
  warrantyClaimStatus?: 'unclaimed' | 'claimed' | 'resolved' | string;
  warrantyClaimDate?: string;
  warrantyClaimNotes?: string;
  [key: string]: any;
}

interface TransactionsTabProps {
  transactions: TransactionItem[];
  setTransactions?: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
  loading: boolean;
  handleExportExcel: () => void;
  setReceiptTx: (tx: any) => void;
}

export default function TransactionsTab({
  transactions = [],
  setTransactions,
  loading,
  handleExportExcel,
  setReceiptTx
}: TransactionsTabProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unclaimed' | 'claimed' | 'battery' | 'screen'>('all');
  
  // State Modal Edit / Catat Klaim Garansi
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [claimStatus, setClaimStatus] = useState<'unclaimed' | 'claimed' | 'resolved'>('unclaimed');
  const [serviceItemInput, setServiceItemInput] = useState('');
  const [claimDateInput, setClaimDateInput] = useState('');
  const [claimNotesInput, setClaimNotesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const txList = Array.isArray(transactions) ? transactions : [];

  // Summary Metrics
  const summary = useMemo(() => {
    let totalVolume = 0;
    let unclaimedCount = 0;
    let claimedCount = 0;
    let batteryCount = 0;
    let screenCount = 0;

    txList.forEach((t) => {
      const paid = Number(t.totalPaid || t.amount || 0);
      totalVolume += paid;

      const isClaimed = t.warrantyClaimStatus === 'claimed';
      if (isClaimed) claimedCount++;
      else unclaimedCount++;

      const sLower = String(t.serviceItem || t.damageDescription || '').toLowerCase();
      if (/baterai|battery|batre/i.test(sLower) || paid === 450000) batteryCount++;
      if (/layar|lcd|oled|retina|amoled/i.test(sLower) || paid >= 1000000) screenCount++;
    });

    return {
      totalVolume,
      unclaimedCount,
      claimedCount,
      batteryCount,
      screenCount,
      totalCount: txList.length
    };
  }, [txList]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return txList.filter((tx) => {
      // 1. Filter Category Status
      if (filterStatus === 'unclaimed') {
        if (tx.warrantyClaimStatus === 'claimed') return false;
      } else if (filterStatus === 'claimed') {
        if (tx.warrantyClaimStatus !== 'claimed' && tx.warrantyClaimStatus !== 'resolved') return false;
      } else if (filterStatus === 'battery') {
        const sLower = String(tx.serviceItem || '').toLowerCase();
        const paid = Number(tx.totalPaid || 0);
        if (!(/baterai|battery/i.test(sLower) || paid === 450000)) return false;
      } else if (filterStatus === 'screen') {
        const sLower = String(tx.serviceItem || '').toLowerCase();
        const paid = Number(tx.totalPaid || 0);
        if (!(/layar|lcd|oled|retina|amoled/i.test(sLower) || paid >= 1000000)) return false;
      }

      // 2. Search Keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const inv = (tx.invoiceNumber || tx.invoiceNo || '').toLowerCase();
        const ticket = (tx.ticketId || '').toLowerCase();
        const name = (tx.customerName || '').toLowerCase();
        const phone = (tx.customerPhone || tx.whatsapp || '').toLowerCase();
        const device = (tx.phoneType || tx.deviceType || '').toLowerCase();
        const service = (tx.serviceItem || '').toLowerCase();
        const claimStatusText = (tx.warrantyClaimStatus || '').toLowerCase();
        return (
          inv.includes(q) ||
          ticket.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          device.includes(q) ||
          service.includes(q) ||
          claimStatusText.includes(q)
        );
      }

      return true;
    });
  }, [txList, filterStatus, search]);

  const handleOpenWarrantyModal = (tx: TransactionItem) => {
    setEditingTx(tx);
    const initialStatus = (tx.warrantyClaimStatus as any) || 'unclaimed';
    setClaimStatus(initialStatus);
    setServiceItemInput(tx.serviceItem || 'Servis Hardware Smartphone');
    setClaimDateInput(
      tx.warrantyClaimDate ||
        new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
    );
    setClaimNotesInput(tx.warrantyClaimNotes || '');
    setSaveMessage(null);
  };

  const handleSaveWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setIsSaving(true);
    setSaveMessage(null);

    const inv = editingTx.invoiceNumber || editingTx.id;
    try {
      const res = await fetch(`/api/finance/transactions/${encodeURIComponent(inv)}/warranty`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          warrantyClaimStatus: claimStatus,
          serviceItem: serviceItemInput.trim(),
          warrantyClaimDate: claimStatus !== 'unclaimed' ? claimDateInput : null,
          warrantyClaimNotes: claimNotesInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Gagal menyimpan status garansi.');
      }

      const updated = data.data;

      // Update state in local transactions list
      if (setTransactions) {
        setTransactions((prev) =>
          prev.map((t) =>
            (t.invoiceNumber || t.id) === inv ? { ...t, ...updated } : t
          )
        );
      }

      setSaveMessage({
        type: 'success',
        text: `Status garansi transaksi #${inv} berhasil diperbarui!`
      });

      setTimeout(() => {
        setEditingTx(null);
        setSaveMessage(null);
      }, 1200);
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menyimpan status garansi.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faktur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Faktur Kasir</span>
            <div className="text-2xl font-black text-slate-900">{summary.totalCount}</div>
            <span className="text-[11px] text-slate-400 font-medium">Transaksi lunas tersimpan</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Total Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">Total Kas Masuk</span>
            <div className="text-2xl font-black text-emerald-700">{formatRp(summary.totalVolume)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Verified settlement counter</span>
          </div>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Download Excel Riwayat Transaksi"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden xl:inline">Excel</span>
          </button>
        </div>

        {/* Belum Klaim Garansi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Belum Klaim Garansi</span>
            <div className="text-2xl font-black text-emerald-700">{summary.unclaimedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">🛡️ Garansi aman &amp; masih aktif</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Sudah Klaim Garansi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Sudah Klaim Garansi</span>
            <div className="text-2xl font-black text-amber-700">{summary.claimedCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">⚠️ Klaim unit ditangani lab</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Buku Riwayat Faktur Kasir, Garansi &amp; Klaim Transaksi
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Data Garansi Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh transaksi otomatis memiliki catatan layanan yang diservis, durasi garansi resmi lab, dan status apakah sudah atau belum pernah diklaim.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                {filteredTransactions.length} dari {summary.totalCount} Faktur
              </span>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari berdasarkan No. Faktur, Tiket, Pelanggan, Tipe HP, Layanan Servis, atau Status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
              {[
                { id: 'all', label: `Semua (${summary.totalCount})` },
                { id: 'unclaimed', label: `🛡️ Belum Klaim (${summary.unclaimedCount})` },
                { id: 'claimed', label: `⚠️ Sudah Klaim (${summary.claimedCount})` },
                { id: 'battery', label: `Baterai 90H (${summary.batteryCount})` },
                { id: 'screen', label: `Layar & Mesin (${summary.screenCount})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    filterStatus === tab.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No. Faktur</th>
                <th className="py-3.5 px-4">Tiket</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Perangkat</th>
                <th className="py-3.5 px-4">Layanan &amp; Garansi Servis</th>
                <th className="py-3.5 px-4">Total Bayar</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4 text-center">Status Klaim Garansi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-amber-600 animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-500">Memuat faktur transaksi kasir...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    {search
                      ? `Tidak ada transaksi yang cocok dengan kata kunci "${search}".`
                      : 'Belum ada faktur transaksi pada kategori ini.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isClaimed = tx.warrantyClaimStatus === 'claimed';
                  const isResolved = tx.warrantyClaimStatus === 'resolved';

                  return (
                    <tr key={tx.invoiceNumber || tx.id || idx} className="hover:bg-amber-50/20 transition-colors">
                      {/* No Faktur */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {tx.invoiceNumber || tx.invoiceNo || '-'}
                      </td>

                      {/* No Tiket */}
                      <td className="py-3.5 px-4 font-mono text-amber-600 font-semibold whitespace-nowrap">
                        {tx.ticketId || '-'}
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>{tx.customerName || '-'}</div>
                        {(tx.customerPhone || tx.whatsapp) && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.customerPhone || tx.whatsapp}
                          </div>
                        )}
                      </td>

                      {/* Perangkat */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {tx.phoneType || tx.deviceType || '-'}
                      </td>

                      {/* Layanan & Data Garansi (CORE FEATURE) */}
                      <td className="py-3.5 px-4 min-w-[230px]">
                        <div className="space-y-1">
                          {/* Nama Komponen / Servis */}
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{tx.serviceItem || 'Servis Komponen & Hardware'}</span>
                          </div>

                          {/* Badge Durasi Garansi & Masa Berlaku */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                tx.warrantyDurationDays === 90
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : tx.warrantyDurationDays === 14
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              🛡️ {tx.warrantyDurationDays || 30} Hari
                            </span>

                            {tx.isExpired ? (
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Berakhir ({tx.warrantyValidUntil})
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Sisa {tx.daysRemaining !== undefined ? `${tx.daysRemaining} Hari` : 'Aktif'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Bayar */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        {formatRp(tx.totalPaid || tx.amount || 0)}
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {tx.paymentMethod || 'Tunai'}
                        </span>
                      </td>

                      {/* Status Klaim Garansi (CORE FEATURE: SUDAH ATAU BELUM KLAIM) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenWarrantyModal(tx)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer shadow-2xs hover:scale-102 ${
                            isClaimed
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : isResolved
                              ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                          title="Klik untuk mengubah status klaim garansi"
                        >
                          {isClaimed ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>⚠️ Sudah Klaim</span>
                            </>
                          ) : isResolved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>✅ Klaim Selesai Diganti</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>🛡️ Belum Klaim (Aktif)</span>
                            </>
                          )}
                          <Edit3 className="w-3 h-3 text-slate-400 ml-0.5" />
                        </button>

                        {isClaimed && tx.warrantyClaimDate && (
                          <div className="text-[10px] text-amber-700 font-medium mt-1">
                            Diklaim: {tx.warrantyClaimDate}
                          </div>
                        )}
                      </td>

                      {/* Aksi: Cetak Struk */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWarrantyModal(tx)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Status Garansi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceiptTx(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                            title="Lihat & Cetak Struk Kasir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Seluruh transaksi terhubung dengan sertifikat garansi resmi dan tersinkronisasi realtime.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Terakhir dimuat: {new Date().toLocaleTimeString('id-ID')} WIB
          </span>
        </div>
      </div>

      {/* MODAL KELOLA STATUS KLAIM GARANSI TRANSAKSI */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kelola Catatan Garansi &amp; Klaim</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Faktur #{editingTx.invoiceNumber || editingTx.id} • Tiket #{editingTx.ticketId || '-'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Transaction Summary Card */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <strong className="text-slate-900">{editingTx.customerName || '-'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perangkat:</span>
                <span className="text-slate-800 font-medium">{editingTx.phoneType || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pembayaran:</span>
                <span className="font-bold text-emerald-700">{formatRp(editingTx.totalPaid || editingTx.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Masa Garansi Lab:</span>
                <span className="font-semibold text-amber-800">{editingTx.warrantyTypeLabel || 'Garansi 30 Hari'}</span>
              </div>
            </div>

            {/* Form Edit Garansi */}
            <form onSubmit={handleSaveWarranty} className="space-y-4">
              {/* Radio Pilihan Status Klaim (CORE REQUIREMENT) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Status Klaim Garansi Transaksi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      claimStatus === 'unclaimed'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimStatus"
                      value="unclaimed"
                      checked={claimStatus === 'unclaimed'}
                      onChange={() => setClaimStatus('unclaimed')}
                      className="accent-emerald-600"
                    />
                    <span>🛡️ Belum Klaim</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      claimStatus === 'claimed'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimStatus"
                      value="claimed"
                      checked={claimStatus === 'claimed'}
                      onChange={() => setClaimStatus('claimed')}
                      className="accent-amber-600"
                    />
                    <span>⚠️ Sudah Klaim</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      claimStatus === 'resolved'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimStatus"
                      value="resolved"
                      checked={claimStatus === 'resolved'}
                      onChange={() => setClaimStatus('resolved')}
                      className="accent-blue-600"
                    />
                    <span>✅ Selesai Diganti</span>
                  </label>
                </div>
              </div>

              {/* Input Layanan Yang Diservis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Komponen / Layanan yang Diservis:
                </label>
                <input
                  type="text"
                  value={serviceItemInput}
                  onChange={(e) => setServiceItemInput(e.target.value)}
                  placeholder="Misal: Ganti Baterai Original, Ganti Layar OLED Super Retina..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-900 font-medium transition-all"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  * Nama komponen servis menentukan durasi garansi (Baterai 90 hari, Layar/Mesin 30 hari, Port cas 14 hari).
                </span>
              </div>

              {/* Tanggal Klaim (Hanya jika status 'claimed' atau 'resolved') */}
              {claimStatus !== 'unclaimed' && (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pengajuan Klaim Konsumen:
                    </label>
                    <input
                      type="text"
                      value={claimDateInput}
                      onChange={(e) => setClaimDateInput(e.target.value)}
                      placeholder="Misal: 5 November 2026"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kendala / Keluhan Klaim &amp; Solusi Teknisi Lab:
                    </label>
                    <textarea
                      rows={3}
                      value={claimNotesInput}
                      onChange={(e) => setClaimNotesInput(e.target.value)}
                      placeholder="Misal: Baterai mengalami penurunan daya cepat, teknisi Meja 1 mengganti unit baterai baru secara gratis tanpa biaya tambahan."
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-white text-slate-900 resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Feedback Alert */}
              {saveMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Status Garansi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
