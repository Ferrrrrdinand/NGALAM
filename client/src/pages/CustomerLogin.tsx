import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  User, AlertCircle, Phone, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2,
  Smartphone, Search, RefreshCw, Calendar, Tag, FileText, ExternalLink, ChevronRight, 
  X, AlertTriangle, Sparkles, Send, MapPin, Copy, Check, Printer, Clock, Info,
  Wrench, CheckCircle, HelpCircle, LogOut
} from 'lucide-react';
import { fetchApi, formatRp, formatDateId } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo-ngalam-fix-pro.jpg';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.8 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C37.1 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// Modal Nota / Struk Transaksi Digital Pelanggan
function CustomerReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-600" /> Tanda Terima Servis & Garansi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Slip Nota / Tanda Terima */}
        <div className="p-5 bg-amber-50/40 border border-dashed border-amber-300 rounded-2xl font-mono text-xs text-slate-800 space-y-3">
          <div className="text-center pb-3 border-b border-dashed border-amber-300">
            <strong className="text-sm block font-sans font-black tracking-wide text-slate-900">NGALAM FIX PRO</strong>
            <span className="text-[10px] text-slate-600">Spesialis Servis HP &amp; iPhone Malang</span>
            <div className="text-[9px] text-slate-500 mt-1">Workshop Meja Terbuka • Hotline: 0813-3030-4321</div>
          </div>

          <div className="space-y-1.5 py-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Tiket:</span>
              <strong className="text-slate-900">{order.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal:</span>
              <span>{order.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pemilik:</span>
              <span className="font-semibold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">WhatsApp:</span>
              <span>{order.whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perangkat:</span>
              <span className="font-semibold text-slate-900">{order.phoneType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teknisi:</span>
              <span>{order.technician}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-amber-300 pt-2 pb-1 text-[11px]">
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Layanan / Komponen:</span>
            </div>
            <div className="text-slate-700 pl-2 text-[10.5px]">
              • {order.damageDescription}
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 mt-2 font-bold text-xs text-slate-900">
              <span>Total Biaya:</span>
              <span className="text-amber-700">{order.cost}</span>
            </div>
            <div className="flex justify-between text-[10px] text-emerald-700 pt-0.5">
              <span>Status Pembayaran:</span>
              <span className="font-bold">LUNAS KASIR</span>
            </div>
          </div>

          {/* Garansi Resmi */}
          {order.warranty && (
            <div className="border-t border-dashed border-amber-300 pt-2.5 text-[10.5px] bg-white/70 p-2.5 rounded-xl border border-amber-200">
              <div className="flex items-center gap-1 font-bold text-amber-900 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{order.warranty.warrantyTypeLabel || 'Garansi Resmi Workshop'}</span>
              </div>
              <div className="text-slate-600 text-[10px] space-y-0.5">
                <div>Kode Sertifikat: <b className="text-slate-800">{order.warranty.warrantyCode}</b></div>
                <div>Periode: <b>{order.warranty.startDate}</b> s/d <b>{order.warranty.endDate}</b></div>
                <div className="text-amber-800 font-semibold">{order.warranty.statusLabel}</div>
              </div>
            </div>
          )}

          <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-amber-300">
            Terima kasih atas kepercayaan Anda di Ngalam Fix Pro.<br/>
            Simpan nomor tiket ini sebagai bukti sah klaim garansi resmi.
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Tanda Terima</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Klaim Garansi Resmi Pelanggan
function CustomerClaimWarrantyModal({ 
  order, 
  customer, 
  onClose, 
  onClaimSuccess 
}: { 
  order: any; 
  customer: any; 
  onClose: () => void; 
  onClaimSuccess: () => void; 
}) {
  const [complaint, setComplaint] = useState('');
  const [claimMethod, setClaimMethod] = useState('Datang Langsung ke Workshop Meja 1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!order) return null;

  const warranty = order.warranty || {};
  const isBattery = /baterai|battery/i.test(order.damageDescription || '');
  const durationLabel = isBattery ? '90 Hari (3 Bulan)' : `${warranty.durationDays || 30} Hari`;

  // Dynamic WhatsApp link with filled complaint
  const generateWhatsAppClaimUrl = () => {
    const text = encodeURIComponent(
      `Halo Tim Servis Ngalam Fix Pro,\n\n` +
      `Saya ingin mengajukan KLAIM GARANSI resmi untuk unit servis saya:\n` +
      `---------------------------------------\n` +
      `🎫 No. Tiket: ${order.id}\n` +
      `📱 Tipe Smartphone: ${order.phoneType}\n` +
      `👤 Nama Pemilik: ${customer?.name || order.customerName}\n` +
      `📞 WhatsApp: ${customer?.whatsapp || order.whatsapp}\n` +
      `🛡️ Garansi: ${warranty.warrantyTypeLabel || 'Garansi Resmi'}\n` +
      `🏷️ Kode Garansi: ${warranty.warrantyCode || '-'}\n` +
      `⏳ Batas Berlaku: s/d ${warranty.endDate} (Sisa ${warranty.daysRemaining} Hari)\n` +
      `🚗 Metode Kedatangan: ${claimMethod}\n` +
      `---------------------------------------\n` +
      `⚠️ Kendala / Keluhan yang Terjadi:\n` +
      `"${complaint.trim() || 'Unit mengalami kendala setelah perbaikan'}"\n\n` +
      `Mohon dibantu info jadwal pengecekan langsung di workshop lab. Terima kasih!`
    );
    return `https://wa.me/6281330304321?text=${text}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) {
      setErrorMsg('Harap deskripsikan kendala atau keluhan unit Anda secara rinci.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetchApi('/api/customer/claim-warranty', {
        method: 'POST',
        body: {
          ticketId: order.id,
          warrantyCode: warranty.warrantyCode,
          phoneType: order.phoneType,
          customerName: customer?.name || order.customerName,
          whatsapp: customer?.whatsapp || order.whatsapp,
          damageDescription: order.damageDescription,
          issueComplaint: complaint.trim(),
          claimMethod,
          notes: notes.trim()
        }
      });

      if (res.ok && res.data && res.data.success) {
        setSuccessData(res.data);
        onClaimSuccess();
      } else {
        setErrorMsg(res.data?.message || 'Gagal mengirim pengajuan klaim garansi. Silakan coba kembali.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi server saat mengajukan klaim garansi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Pengajuan Klaim Garansi Resmi</h3>
              <p className="text-[11px] text-slate-500">Workshop Ngalam Fix Pro • Bebas Biaya Jasa &amp; Part Baru</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sukses Submisi Klaim */}
        {successData ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Klaim Berhasil Dicatat</span>
              <h4 className="text-lg font-black text-slate-900 mt-0.5">Tiket Klaim: {successData.claimId}</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Pengajuan garansi untuk unit <b>{order.phoneType}</b> ({order.id}) telah masuk ke sistem antrean meja lab teknisi kami.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs space-y-1.5 text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Status Proteksi:</span>
                <strong className="text-emerald-700">Garansi Prioritas Lab</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Sertifikat:</span>
                <span className="font-mono font-bold text-amber-800">{successData.warrantyCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Penyerahan:</span>
                <span className="font-semibold">{claimMethod}</span>
              </div>
              <div className="pt-2 border-t border-amber-200/80 text-[11px] text-slate-600">
                💡 <b>Langkah Selanjutnya:</b> Bawa unit smartphone Anda ke workshop meja terbuka kami di Jl. Candi Mendut No.12. Teknisi akan langsung mendiagnosa unit tanpa antre panjang.
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={successData.claimWaUrl || generateWhatsAppClaimUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Buka Konfirmasi via WhatsApp Langsung ↗</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Kembali ke Daftar Transaksi
              </button>
            </div>
          </div>
        ) : (
          /* Form Klaim Garansi */
          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
            
            {/* Info Unit & Garansi */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border border-amber-200/90 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-800">Detail Unit Servis</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                  {durationLabel}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>{order.phoneType}</span>
                <span className="font-mono text-amber-900">{order.id}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Pengerjaan Sebelumnya: <b>{order.damageDescription}</b>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                <span className="text-slate-500">Masa Garansi:</span>
                <span className="font-semibold text-emerald-700">
                  {warranty.isExpired ? '⚠️ Telah Berakhir' : `🛡️ Aktif s/d ${warranty.endDate} (Sisa ${warranty.daysRemaining} Hari)`}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Keluhan / Kendala */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Deskripsi Kendala yang Dialami Unit Saat Ini *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Daya baterai cepat drop di bawah 20%, atau layar sentuh bagian samping kanan kurang responsif..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Jelaskan apa yang dirasakan agar teknisi lab langsung menyiapkan sparepart pengganti original.
              </span>
            </div>

            {/* Pilihan Metode Penyerahan */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Metode Pengantaran Unit ke Workshop
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setClaimMethod('Datang Langsung ke Workshop Meja 1')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    claimMethod === 'Datang Langsung ke Workshop Meja 1'
                      ? 'border-amber-500 bg-amber-50/60 text-slate-900 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Datang Langsung</span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 font-normal block">Dikerjakan di depan meja transparan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClaimMethod('Kirim via Kurir / Ojek Online')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    claimMethod === 'Kirim via Kurir / Ojek Online'
                      ? 'border-amber-500 bg-amber-50/60 text-slate-900 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Kirim via Kurir / Ojol</span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 font-normal block">Diterima resepsionis intake counter</span>
                </button>
              </div>
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Rencana datang jam 14.00, tolong dicek charger..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Aksi Kirim */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Mengirim Pengajuan Klaim...' : 'Ajukan Tiket Klaim Garansi Resmi ↗'}</span>
              </button>

              <a
                href={generateWhatsAppClaimUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Atau Klaim Cepat Langsung via WhatsApp CS ↗</span>
              </a>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

// Tampilan Portal Akun Pelanggan Lengkap (Riwayat Transaksi + Klaim Garansi)
function CustomerAccountDashboard({ customer, logoutCustomer }: { customer: any; logoutCustomer: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active_warranty' | 'in_progress' | 'completed'>('all');
  const [claimTargetOrder, setClaimTargetOrder] = useState<any | null>(null);
  const [viewReceiptOrder, setViewReceiptOrder] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const customerIdentifier = customer?.whatsapp || customer?.phone || customer?.email || customer?.username || '';

  const loadCustomerOrders = useCallback(async () => {
    if (!customer) return;
    setLoadingOrders(true);
    setOrdersError('');

    try {
      const res = await fetchApi(`/api/customer/orders?query=${encodeURIComponent(customerIdentifier)}`);
      if (res.ok && res.data && res.data.success) {
        setOrders(res.data.orders || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrdersError('Gagal memuat riwayat transaksi dari database.');
    } finally {
      setLoadingOrders(false);
    }
  }, [customer, customerIdentifier]);

  useEffect(() => {
    loadCustomerOrders();
  }, [loadCustomerOrders]);

  const copyTicketId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper cek apakah unit sudah masuk tahap Siap Diambil di Workshop (Step 4) atau Sudah Diambil / Selesai (Step 5)
  const isReadyOrPickedUp = (order: any) => {
    const step = Number(order.step || order.currentStep || 1);
    const st = String(order.status || '').toLowerCase();
    return step >= 4 || st.includes('siap') || st.includes('ambil') || st.includes('selesai') || st.includes('lunas');
  };

  // Ringkasan Statistik
  const stats = useMemo(() => {
    const total = orders.length;
    const activeWarranties = orders.filter(o => (o.warranty?.isActive) || (isReadyOrPickedUp(o) && !o.warranty?.isExpired)).length;
    const inProgress = orders.filter(o => !isReadyOrPickedUp(o)).length;
    const completed = orders.filter(o => isReadyOrPickedUp(o)).length;
    return { total, activeWarranties, inProgress, completed };
  }, [orders]);

  // Filter & Search
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const readyOrDone = isReadyOrPickedUp(o);
      const hasActive = (o.warranty && o.warranty.isActive) || (readyOrDone && !o.warranty?.isExpired);

      // Filter status tab
      if (statusFilter === 'active_warranty' && !hasActive) {
        return false;
      }
      if (statusFilter === 'in_progress' && readyOrDone) {
        return false;
      }
      if (statusFilter === 'completed' && !readyOrDone) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const phoneMatch = (o.phoneType || '').toLowerCase().includes(q);
        const damageMatch = (o.damageDescription || '').toLowerCase().includes(q);
        const techMatch = (o.technician || '').toLowerCase().includes(q);
        return idMatch || phoneMatch || damageMatch || techMatch;
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      
      {/* 1. Header Profil Member Mewah (Pure White + Gold) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl relative overflow-hidden">
        {/* Gold accent top trim */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-amber-700">
                <User className="w-8 h-8" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {customer.name || 'Member Pelanggan'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs">
                  ✨ Member Prioritas Lab
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  {customer.whatsapp || customer.phone || '-'}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.email}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {customer.district || 'Kota Malang'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link
              to="/pesan-servis"
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Booking Servis Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={logoutCustomer}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Keluar dari akun member"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Benefit Voucher Member Diskon 10% */}
        <div 
          className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-600/15 border border-amber-400/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ boxShadow: '0 4px 18px -4px rgba(212, 175, 55, 0.18)' }}
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm border border-amber-300">
              👑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <b className="text-slate-900 text-sm font-black">Voucher Diskon 10% Member Aktif</b>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-2xs">
                  Siap Digunakan
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Gunakan kode voucher <b className="font-mono text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-300">MEMBER10</b> saat booking untuk potongan 10% langsung di nota kasir.
              </p>
            </div>
          </div>
          <Link
            to="/pesan-servis?promo=MEMBER10"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/20 whitespace-nowrap active:scale-95 transition-all shrink-0"
          >
            Gunakan Voucher (Pesan Servis) ↗
          </Link>
        </div>

        {/* 2. Banner Informasi Kebijakan Garansi Resmi */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11.5px] leading-relaxed">
              <strong className="text-slate-900 block font-bold">Kebijakan Garansi Resmi Workshop Ngalam Fix Pro:</strong>
              Garansi resmi <b>90 Hari (3 Bulan)</b> berlaku khusus untuk <b>Pergantian Baterai Original</b>. Layanan pergantian Layar OLED / Komponen Hardware bergaransi <b>30 Hari (1 Bulan)</b>, dan Software <b>7 Hari</b>. Seluruh riwayat transaksi Anda di bawah ini dapat diklaim garansinya langsung secara online!
            </div>
          </div>
          <Link
            to="/kontak"
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline whitespace-nowrap shrink-0"
          >
            Alamat Workshop ↗
          </Link>
        </div>
      </div>

      {/* 3. Statistik Ringkas Transaksi & Garansi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Servis</span>
            <strong className="text-lg font-black text-slate-900">{stats.total} Transaksi</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-300 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Garansi Aktif</span>
            <strong className="text-lg font-black text-amber-700">{stats.activeWarranties} Unit</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dikerjakan Lab</span>
            <strong className="text-lg font-black text-amber-600">{stats.inProgress} Unit</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Selesai Diambil</span>
            <strong className="text-lg font-black text-emerald-700">{stats.completed} Unit</strong>
          </div>
        </div>
      </div>

      {/* 4. Filter & Pencarian Riwayat Servis */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Riwayat Transaksi &amp; Klaim Garansi Unit</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau status pengerjaan, sertifikat garansi resmi, dan ajukan klaim dengan 1-klik
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCustomerOrders}
              disabled={loadingOrders}
              className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition-all cursor-pointer disabled:opacity-50"
              title="Segarkan riwayat servis"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no tiket / tipe HP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tab Kategori Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold border-b border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Transaksi ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active_warranty')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'active_warranty'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garansi Aktif ({stats.activeWarranties})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_progress'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Sedang Dikerjakan ({stats.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Selesai Diambil ({stats.completed})
          </button>
        </div>

        {/* 5. Daftar Transaksi */}
        {loadingOrders ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat riwayat transaksi dari sistem workshop...</p>
          </div>
        ) : ordersError ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-rose-700">{ordersError}</p>
            <button
              type="button"
              onClick={loadCustomerOrders}
              className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {searchTerm || statusFilter !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter' : 'Belum Ada Riwayat Transaksi Servis'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Coba ganti kata kunci pencarian atau pilih tab "Semua Transaksi".'
                : 'Setiap perbaikan HP atau pergantian sparepart yang Anda lakukan di workshop kami akan otomatis tercatat di sini lengkap dengan sertifikat garansinya.'}
            </p>
            <Link
              to="/pesan-servis"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20"
            >
              <span>Booking Servis Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => {
              const warranty = order.warranty || {};
              const isReadyOrDone = isReadyOrPickedUp(order);
              const isStep4Ready = Number(order.step || 1) === 4 || String(order.status || '').toLowerCase().includes('siap');
              const isCompleted = isReadyOrDone;
              const hasActiveWarranty = (warranty.isActive) || (isReadyOrDone && !warranty.isExpired);
              const isBattery = /baterai|battery/i.test(order.damageDescription || '');

              return (
                <div
                  key={order.id || idx}
                  className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-300 shadow-xs hover:shadow-md transition-all space-y-4 relative"
                >
                  {/* Baris Atas: Nomor Tiket & Status Pengerjaan */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {order.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyTicketId(order.id)}
                        className="text-[11px] text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-amber-50 px-2 py-0.5 rounded border border-slate-200 hover:border-amber-300 transition-colors"
                        title="Salin Nomor Tiket"
                      >
                        {copiedId === order.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        • {order.createdAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isStep4Ready
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 ring-1 ring-emerald-400/30'
                          : isCompleted 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isStep4Ready
                          ? '🟢 SIAP DIAMBIL DI WORKSHOP'
                          : isCompleted
                            ? '✅ SELESAI & SUDAH DIAMBIL'
                            : (order.status || `Tahap ${order.step || 1} dari 5`)}
                      </span>
                    </div>
                  </div>

                  {/* Baris Tengah: Info Perangkat & Kerusakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Perangkat</span>
                      <strong className="text-xs text-slate-900 block truncate flex items-center gap-1.5 font-bold">
                        <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{order.phoneType}</span>
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Layanan / Kendala</span>
                      <strong className="text-xs text-slate-900 block truncate flex items-center gap-1.5 font-bold">
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{order.damageDescription}</span>
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Biaya Servis</span>
                      <strong className="text-xs text-amber-700 block font-bold">
                        {order.cost}
                      </strong>
                      <span className="text-[9.5px] text-emerald-600 font-semibold block">Lunas Kasir Meja 1</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Teknisi Penanggungjawab</span>
                      <strong className="text-xs text-slate-800 block truncate font-semibold">
                        {order.technician}
                      </strong>
                    </div>
                  </div>

                  {/* 6. Section Status Garansi Spesifik (FOKUS UTAMA KLAIM GARANSI) */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    hasActiveWarranty 
                      ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/60 border-amber-300/90 shadow-2xs' 
                      : !isReadyOrDone
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Detail Garansi */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            hasActiveWarranty ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            {warranty.warrantyTypeLabel || (isBattery ? 'Garansi Baterai Original (90 Hari)' : 'Garansi Servis Hardware (30 Hari)')}
                          </span>

                          {hasActiveWarranty ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              🛡️ GARANSI AKTIF ({warranty.daysRemaining || 30} Hari Lagi)
                            </span>
                          ) : !isReadyOrDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                              ⏳ GARANSI SIAGA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-600">
                              ⚠️ GARANSI BERAKHIR
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap pl-8">
                          {warranty.warrantyCode && (
                            <span>Kode Sertifikat: <b className="font-mono text-slate-800">{warranty.warrantyCode}</b></span>
                          )}
                          {warranty.startDate && warranty.endDate && (
                            <span>Masa Berlaku: <b>{warranty.startDate}</b> s/d <b>{warranty.endDate}</b></span>
                          )}
                        </div>

                        <p className="text-[10.5px] text-slate-500 pl-8">
                          {hasActiveWarranty 
                            ? (isStep4Ready
                                ? 'Unit telah selesai diperbaiki dan siap diambil di counter workshop! Masa garansi resmi aktif penuh, bebas biaya perbaikan ulang & suku cadang.'
                                : 'Unit telah diserahkan & diambil. Bebas biaya sparepart pengganti original & jasa teknisi selama masa garansi aktif.')
                            : !isReadyOrDone
                              ? 'Garansi resmi akan otomatis aktif secara penuh setelah status pengerjaan siap diambil atau sudah diambil di workshop.'
                              : `Masa garansi resmi unit ini telah berakhir pada ${warranty.endDate || 'periode lalu'}. Anda tetap dapat berkonsultasi untuk pengecekan berkala.`}
                        </p>
                      </div>

                      {/* Right: Tombol Klaim Garansi / Tindakan */}
                      <div className="flex items-center gap-2 shrink-0 md:self-center">
                        {hasActiveWarranty ? (
                          <button
                            type="button"
                            onClick={() => setClaimTargetOrder(order)}
                            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-black shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Klaim Garansi Unit Ini</span>
                          </button>
                        ) : !isReadyOrDone ? (
                          <Link
                            to={`/lacak?id=${order.id}`}
                            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <span>Lacak Unit Live ↗</span>
                          </Link>
                        ) : (
                          <a
                            href={`https://wa.me/6281330304321?text=${encodeURIComponent(`Halo CS Ngalam Fix Pro, saya ingin konsultasi servis unit ${order.phoneType} (${order.id}) garansi lama.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Konsultasi Member</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewReceiptOrder(order)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          title="Lihat Tanda Terima & Nota Digital"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Nota</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Klaim Garansi */}
      {claimTargetOrder && (
        <CustomerClaimWarrantyModal
          order={claimTargetOrder}
          customer={customer}
          onClose={() => setClaimTargetOrder(null)}
          onClaimSuccess={() => {
            loadCustomerOrders();
          }}
        />
      )}

      {/* Modal Nota Digital */}
      {viewReceiptOrder && (
        <CustomerReceiptModal
          order={viewReceiptOrder}
          onClose={() => setViewReceiptOrder(null)}
        />
      )}

    </div>
  );
}

export default function CustomerLogin() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'complete'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleAuthPending, setGoogleAuthPending] = useState(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('auth') === 'google'
  ));
  const [errorMsg, setErrorMsg] = useState('');
  const { customer, loginCustomer, logoutCustomer } = useAuth();

  useEffect(() => {
    const auth = searchParams.get('auth');
    const mode = searchParams.get('mode') || searchParams.get('tab');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      const messages: Record<string, string> = {
        access_denied: 'Login Google dibatalkan.',
        invalid_state: 'Sesi login Google tidak valid. Silakan coba lagi.',
        google_not_configured: 'Login Google belum dikonfigurasi di server.',
        token_exchange_failed: 'Gagal menukar kode otorisasi Google.',
        profile_fetch_failed: 'Gagal mengambil profil Google.',
        staff_account_exists: 'Email ini terdaftar sebagai akun staf. Gunakan portal staf.',
        customer_account_exists: 'Email ini sudah terdaftar pada akun lain.',
        server_error: 'Terjadi kesalahan server saat login Google.'
      };
      setErrorMsg(messages[oauthError] || `Login Google gagal: ${oauthError}`);
      setGoogleAuthPending(false);
      return;
    }

    if (auth === 'google') {
      setLoading(true);
      fetchApi('/api/customer/me')
        .then(({ ok, data }) => {
          if (ok && data.success && data.customer) {
            loginCustomer(data.customer, true);
            if (data.customer.needsPhone) setTab('complete');
          } else {
            setErrorMsg(data.message || 'Sesi Google tidak valid. Silakan login ulang.');
          }
        })
        .catch(() => setErrorMsg('Gagal memuat sesi Google.'))
        .finally(() => {
          setLoading(false);
          setGoogleAuthPending(false);
        });
    } else if (mode === 'register') {
      setTab('register');
    }
  }, [searchParams, loginCustomer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/customer/login', {
        method: 'POST',
        body: { phone, whatsapp: phone, email: phone, pin, password: pin, rememberMe }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer || res.data.data, rememberMe);
      } else {
        setErrorMsg(res.data.message || 'Nomor WhatsApp / Email atau Password salah.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const savedMitraRef = (localStorage.getItem('ngalam_affiliate_ref') || '').trim();

    try {
      const res = await fetchApi('/api/customer/register', {
        method: 'POST',
        body: { 
          name, 
          phone, 
          whatsapp: phone, 
          email, 
          district, 
          pin, 
          password: pin, 
          rememberMe,
          referredByMitra: savedMitraRef
        }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer || res.data.data, rememberMe);
      } else {
        setErrorMsg(res.data.error || res.data.message || 'Pendaftaran member gagal.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/customer/complete-profile', {
        method: 'POST',
        body: { whatsapp: phone, district }
      });

      if (res.ok && res.data.success) {
        loginCustomer(res.data.customer, true);
        setTab('login');
        setPhone('');
      } else {
        setErrorMsg(res.data.message || 'Gagal menyimpan nomor WhatsApp.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const needsPhone = customer && (!customer.whatsapp || customer.needsPhone === true);

  if (googleAuthPending) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
            <User className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Menghubungkan Akun Google</h2>
          <p className="text-xs text-slate-500">Memeriksa sesi pelanggan dan status nomor WhatsApp...</p>
        </div>
      </div>
    );
  }

  // Jika pelanggan sudah login dan nomor WhatsApp sudah lengkap, tampilkan Dashboard Riwayat & Garansi!
  if (customer && !needsPhone) {
    return <CustomerAccountDashboard customer={customer} logoutCustomer={logoutCustomer} />;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md shadow-amber-500/20 p-1 bg-white">
              <img 
                src={logoImg} 
                alt="Logo Ngalam Fix Pro" 
                className="w-full h-full object-cover rounded-xl" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/logo-ngalam-fix-pro.jpg"; }} 
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {needsPhone ? 'Lengkapi Nomor WhatsApp' : tab === 'login' ? 'Masuk Portal Member' : 'Daftar Akun Member Baru'}
          </h1>
          <p className="text-xs text-slate-500">
            {needsPhone
              ? 'Nomor WhatsApp wajib diisi agar kami dapat menghubungi Anda terkait tiket servis.'
              : 'Pantau riwayat transaksi, sertifikat garansi resmi, & klaim garansi online HP Anda'}
          </p>
        </div>

        {!needsPhone && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
            <span>Ingin lacak progres unit tanpa login?</span>
            <Link to="/lacak" className="font-bold underline text-amber-700 whitespace-nowrap">
              Lacak Unit ↗
            </Link>
          </div>
        )}

        {!needsPhone && (
          <div className="space-y-4">
            <a
              href="/api/customer/auth/google"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs flex items-center justify-center gap-2.5 transition-all"
            >
              <GoogleIcon />
              <span>{tab === 'register' ? 'Daftar Cepat dengan Google' : 'Masuk / Daftar dengan Google'}</span>
            </a>

            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="flex-1 h-px bg-slate-200"></span>
              <span>atau akun member</span>
              <span className="flex-1 h-px bg-slate-200"></span>
            </div>

            {/* Tab switch */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Member
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Baru (Diskon 10%)
              </button>
            </div>

            {/* Benefit Tawaran Member Baru */}
            {tab === 'register' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-600/15 border border-amber-400/60 shadow-xs flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  👑
                </span>
                <div className="text-xs">
                  <b className="text-slate-900 block font-black">Keuntungan Mendaftar Member:</b>
                  <span className="text-slate-700 leading-relaxed">
                    Dapatkan <b className="text-amber-900 font-extrabold bg-amber-100 px-1 py-0.5 rounded border border-amber-300">Potongan Diskon 10%</b> otomatis (Kode: <code className="font-mono font-bold text-amber-800">MEMBER10</code>) langsung untuk servis HP Anda!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Needs Phone Form */}
        {needsPhone ? (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wilayah / Kecamatan Malang (Opsional)
              </label>
              <input
                type="text"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md transition-all cursor-pointer"
            >
              <span>{loading ? 'Menyimpan...' : 'Simpan & Buka Dashboard ↗'}</span>
            </button>
            <button
              type="button"
              onClick={logoutCustomer}
              className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer"
            >
              Batal & Keluar
            </button>
          </form>
        ) : tab === 'login' ? (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email / Nomor WhatsApp *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Email, WhatsApp, atau username"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan password akun"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
            >
              <span>{loading ? 'Memvalidasi...' : 'Buka Dashboard Member ↗'}</span>
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Lengkap Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="email@anda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                required
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wilayah / Kecamatan Malang (Opsional)
              </label>
              <input
                type="text"
                placeholder="Lowokwaru / Klojen / Sukun"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password Akun (Min. 6 Karakter) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Buat password akun"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/25 transition-all pt-2 cursor-pointer"
            >
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Member Sekarang ↗'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
