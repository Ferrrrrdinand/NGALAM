import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Clock, 
  Search, Phone, Smartphone, User, FileText, ArrowRight, ExternalLink,
  RefreshCw, Wrench, Calendar, Tag, Check, X, MessageSquare, Send,
  Sparkles, HelpCircle, ChevronRight, CheckCircle2, Copy
} from 'lucide-react';
import { fetchApi, formatDateId } from '../../utils/api';

interface WarrantyTabProps {
  warranties: any[];
  stats?: any;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function WarrantyTab({
  warranties = [],
  stats = {},
  loading = false,
  onRefresh
}: WarrantyTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_repair' | 'active' | 'expired'>('all');
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Modal Review & Detail Sertifikat
  const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newClaimStatus, setNewClaimStatus] = useState<'approved' | 'in_repair' | 'resolved' | 'rejected' | 'pending'>('approved');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Ajukan Klaim Baru dari Sisi Admin
  const [newClaimModalOpen, setNewClaimModalOpen] = useState(false);
  const [claimComplaint, setClaimComplaint] = useState('');
  const [claimMethod, setClaimMethod] = useState('Datang Langsung ke Workshop Meja 1');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedTicketId(text);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  // Filter Data untuk Tabel Langsung
  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      // 1. Status Filter
      if (statusFilter === 'pending' && w.claimStatus !== 'pending') return false;
      if (statusFilter === 'in_repair' && w.claimStatus !== 'in_repair') return false;
      if (statusFilter === 'active' && (!w.isActive || w.claimStatus === 'pending')) return false;
      if (statusFilter === 'expired' && !w.isExpired) return false;

      // 2. Search Term (Real-time pencarian No Tiket, Kode Garansi, Pelanggan, No WA, Tipe HP)
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase().trim();
      const sDigits = s.replace(/\D/g, '');

      const ticketMatch = String(w.order_id || '').toLowerCase().includes(s);
      const invMatch = String(w.invoice_number || '').toLowerCase().includes(s);
      const codeMatch = String(w.warranty_code || '').toLowerCase().includes(s);
      const nameMatch = String(w.customer_name || '').toLowerCase().includes(s);
      const phoneMatch = sDigits.length >= 4 && String(w.customer_whatsapp || '').replace(/\D/g, '').includes(sDigits);
      const brandMatch = String(w.brand_model || '').toLowerCase().includes(s);
      const itemMatch = String(w.service_item || '').toLowerCase().includes(s);

      return ticketMatch || invMatch || codeMatch || nameMatch || phoneMatch || brandMatch || itemMatch;
    });
  }, [warranties, statusFilter, searchTerm]);

  // Open Detail Sertifikat Modal
  const handleOpenDetailModal = (w: any) => {
    setSelectedWarranty(w);
    setFeedbackMsg(null);
    setDetailModalOpen(true);
  };

  // Open Decision / Action Modal
  const handleOpenActionModal = (w: any) => {
    setSelectedWarranty(w);
    setNewClaimStatus(w.claimStatus === 'pending' ? 'approved' : w.claimStatus || 'approved');
    setTechnicianNotes(w.technician_notes || '');
    setFeedbackMsg(null);
    setActionModalOpen(true);
  };

  // Open New Claim Modal
  const handleOpenNewClaimModal = (w: any) => {
    setSelectedWarranty(w);
    setClaimComplaint('');
    setClaimMethod('Datang Langsung ke Workshop Meja 1');
    setFeedbackMsg(null);
    setNewClaimModalOpen(true);
  };

  // Submit Claim Status Update
  const handleSaveClaimStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty) return;

    setUpdating(true);
    setFeedbackMsg(null);

    try {
      const res = await fetchApi(`/api/warranties/${selectedWarranty.id}/claim-status`, {
        method: 'PUT',
        body: {
          claimStatus: newClaimStatus,
          technicianNotes: technicianNotes.trim()
        }
      });

      if (res.ok && res.data && res.data.success) {
        setFeedbackMsg({ type: 'success', text: `Status klaim unit berhasil diubah menjadi: ${newClaimStatus}` });
        if (onRefresh) onRefresh();
        setTimeout(() => {
          setActionModalOpen(false);
        }, 1200);
      } else {
        setFeedbackMsg({ type: 'error', text: res.data?.message || 'Gagal memperbarui status klaim.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Terjadi kesalahan koneksi saat memperbarui status klaim.' });
    } finally {
      setUpdating(false);
    }
  };

  // Submit Pengajuan Klaim Baru oleh Admin
  const handleAdminSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty || !claimComplaint.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Harap jelaskan keluhan kerusakan pada unit.' });
      return;
    }

    setSubmittingClaim(true);
    setFeedbackMsg(null);

    try {
      const res = await fetchApi('/api/warranties/claim', {
        method: 'POST',
        body: {
          warrantyCode: selectedWarranty.warranty_code,
          ticketId: selectedWarranty.order_id,
          complaint: claimComplaint.trim(),
          claimMethod,
          customerName: selectedWarranty.customer_name,
          whatsapp: selectedWarranty.customer_whatsapp
        }
      });

      if (res.ok && res.data && res.data.success) {
        setFeedbackMsg({ type: 'success', text: `Klaim berhasil diajukan dengan No: ${res.data.claimId}!` });
        if (onRefresh) onRefresh();
        setTimeout(() => {
          setNewClaimModalOpen(false);
        }, 1200);
      } else {
        setFeedbackMsg({ type: 'error', text: res.data?.message || 'Gagal mengajukan klaim garansi.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Terjadi kesalahan koneksi saat mengajukan klaim garansi.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Generate WhatsApp notification to customer
  const generateWaNotificationUrl = (w: any, status: string, notes: string) => {
    const phone = (w.customer_whatsapp || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone.startsWith('62') ? phone : '62' + phone;

    let statusText = 'Pembaruan Status Klaim Garansi';
    if (status === 'approved') statusText = 'KLAIM GARANSI DISETUJUI';
    else if (status === 'in_repair') statusText = 'UNIT SEDANG DALAM PENANGANAN LAB';
    else if (status === 'resolved') statusText = 'UNIT SELESAI DIPERBAIKI / DIGANTI';
    else if (status === 'rejected') statusText = 'INFO PENGAJUAN KLAIM GARANSI';

    const text = encodeURIComponent(
      `Halo Kak ${w.customer_name},\n\n` +
      `Update resmi dari Workshop Lab Ngalam Fix Pro perihal klaim garansi Anda:\n` +
      `---------------------------------------\n` +
      `🎫 No. Tiket: ${w.order_id || '-'}\n` +
      `🏷️ Kode Garansi: ${w.warranty_code}\n` +
      `📱 Perangkat: ${w.brand_model}\n` +
      `🛡️ Status: *${statusText}*\n` +
      (notes ? `📝 Catatan Teknisi: "${notes}"\n` : '') +
      `---------------------------------------\n` +
      `Silakan kunjungi workshop kami atau balas pesan ini jika ada pertanyaan. Terima kasih!`
    );

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const pendingCount = warranties.filter(w => w.claimStatus === 'pending').length;
  const inRepairCount = warranties.filter(w => w.claimStatus === 'in_repair').length;
  const activeCount = warranties.filter(w => w.isActive && w.claimStatus !== 'pending').length;
  const expiredCount = warranties.filter(w => w.isExpired).length;

  return (
    <div className="space-y-5">
      
      {/* 1. Header Banner & Quick Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Daftar Garansi Servis &amp; Pemantauan Tiket Unit</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seluruh tiket pesanan yang telah selesai otomatis tercatat di database garansi, terikat ke akun member, dan siap dipantau masa aktif serta klaimnya.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tiket Terdaftar</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{warranties.length} Tiket</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Tersinkron di database</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Garansi Aktif</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{activeCount} Tiket</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Proteksi lab sedang berjalan</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          pendingCount > 0 ? 'bg-amber-500/10 border-amber-300' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              pendingCount > 0 ? 'text-amber-900' : 'text-slate-500'
            }`}>
              Klaim Pending
            </span>
            <span className={`p-1.5 rounded-lg ${
              pendingCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`mt-2 text-2xl font-black ${
            pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {pendingCount} Klaim
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Menunggu verifikasi admin</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Di Lab Workshop</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600">{inRepairCount} Unit</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Sedang perbaikan klaim</div>
        </div>
      </div>

      {/* 3. Toolbar Pencarian Cepat & Filter Langsung */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Input Pencarian Real-time */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Ketik No. Tiket (NGF-...), Kode Garansi (GAR-...), Nama Pelanggan, No. WA, atau Tipe HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Reset Search Button */}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Hapus Pencarian
            </button>
          )}
        </div>

        {/* Filter Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Tiket ({warranties.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Garansi Aktif ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : pendingCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300 font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Klaim Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_repair')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_repair'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Di Lab ({inRepairCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'expired'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kedaluwarsa ({expiredCount})
          </button>
        </div>
      </div>

      {/* 4. TABEL LANGSUNG DAFTAR GARANSI & TIKET SERVIS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredWarranties.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada tiket garansi yang cocok</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm ? `Tidak ditemukan tiket atau pelanggan dengan kata kunci "${searchTerm}".` : 'Belum ada catatan garansi pada filter ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-4 font-mono">No. Tiket Servis</th>
                  <th className="py-3.5 px-4">Kode Garansi &amp; Proteksi</th>
                  <th className="py-3.5 px-4">Pelanggan / Member</th>
                  <th className="py-3.5 px-4">Perangkat &amp; Kerusakan</th>
                  <th className="py-3.5 px-4">Masa Berlaku</th>
                  <th className="py-3.5 px-4 text-center">Status Garansi</th>
                  <th className="py-3.5 px-4 text-center">Status Klaim</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarranties.map((w) => {
                  const isBattery = /baterai|battery/i.test(w.warranty_type_label || w.service_item || '');
                  const hasPendingClaim = w.claimStatus === 'pending';
                  const ticketNumber = w.order_id || w.invoice_number || 'NGF-TICKET';

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasPendingClaim ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* 1. NO. TIKET SERVIS (KOLOM UTAMA JELAS & TEGAS) */}
                      <td className="py-3.5 px-4 align-top font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg text-xs tracking-tight inline-block shadow-2xs">
                            {ticketNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ticketNumber)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title="Salin No Tiket"
                          >
                            {copiedTicketId === ticketNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {w.invoice_number && w.invoice_number !== w.order_id && (
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            Faktur: <span className="text-slate-700 font-semibold">{w.invoice_number}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Tercatat: {w.startDateFormatted || formatDateId(w.start_date)}
                        </div>
                      </td>

                      {/* 2. KODE GARANSI & PAKET */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-xs">
                          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{w.warranty_code}</span>
                        </div>
                        <div className="mt-1">
                          {isBattery ? (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              ⚡ Baterai 90 Hari (3 Bulan)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              🛡️ Hardware {w.duration_days || 30} Hari
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. PELANGGAN / AKUN MEMBER */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {w.customer_name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{w.customer_whatsapp || '-'}</span>
                        </div>
                        {w.customer_id && (
                          <span className="inline-block px-1.5 py-0.5 mt-1 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold text-amber-800">
                            👑 Member Terdaftar
                          </span>
                        )}
                      </td>

                      {/* 4. PERANGKAT & KERUSAKAN */}
                      <td className="py-3.5 px-4 align-top max-w-[200px]">
                        <div className="font-semibold text-slate-900 flex items-center gap-1 truncate text-xs">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{w.brand_model || w.device_type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={w.service_item}>
                          {w.service_item || w.warranty_type_label}
                        </div>
                      </td>

                      {/* 5. MASA BERLAKU & COUNTDOWN REAL-TIME */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-[11px] text-slate-700">
                          {w.countdownStarted ? (
                            <>
                              <div className="text-[10px] text-slate-400">
                                Mulai (Kasir): <span className="text-slate-600 font-semibold">{w.startDateFormatted || formatDateId(w.start_date)}</span>
                              </div>
                              <div className="mt-0.5">
                                Berakhir: <b>{w.endDateFormatted || formatDateId(w.end_date)}</b>
                              </div>
                            </>
                          ) : (
                            <div className="text-[10.5px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ⏳ Countdown mulai saat kasir menyelesaikan pembayaran
                            </div>
                          )}
                        </div>
                        <div className="mt-1.5">
                          {w.countdownStarted ? (
                            w.isExpired ? (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Kedaluwarsa
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full inline-block shadow-2xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                                {w.countdownLabel || `Sisa ${w.daysRemaining} Hari`}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                              Durasi: {w.durationDays || 30} Hari
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. STATUS GARANSI */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {w.countdownStarted && w.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full text-[10px] font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Garansi Aktif
                          </span>
                        ) : !w.countdownStarted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                            Menunggu Kasir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                            Berakhir
                          </span>
                        )}
                      </td>

                      {/* 7. STATUS KLAIM */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {w.claimStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            Klaim Pending
                          </span>
                        )}
                        {w.claimStatus === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                            Disetujui Lab
                          </span>
                        )}
                        {w.claimStatus === 'in_repair' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                            <Wrench className="w-3 h-3" />
                            Pengerjaan Lab
                          </span>
                        )}
                        {w.claimStatus === 'resolved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            Selesai Diganti
                          </span>
                        )}
                        {w.claimStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
                            Ditolak
                          </span>
                        )}
                        {(!w.claimStatus || w.claimStatus === 'none') && (
                          <span className="text-[11px] text-slate-400">Belum Ada Klaim</span>
                        )}
                      </td>

                      {/* 8. AKSI */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(w)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Lihat Detail Sertifikat"
                          >
                            Detail
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(w)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              hasPendingClaim
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            <span>{hasPendingClaim ? 'Tinjau Klaim' : 'Klaim'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {w.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${w.customer_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat WhatsApp Pelanggan"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL DETAIL SERTIFIKAT DIGITAL RESMI */}
      {detailModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Sertifikat Garansi Resmi Workshop</h3>
                  <p className="text-[11px] text-slate-500">Ngalam Fix Pro • Lab Teknisi Meja 1</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sertifikat Card Preview */}
            <div className="p-5 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 border-2 border-amber-300 rounded-2xl space-y-3 font-sans">
              <div className="flex justify-between items-center border-b border-dashed border-amber-200 pb-2.5">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">No. Tiket Servis</span>
                  <div className="font-mono text-base font-black text-slate-900">{selectedWarranty.order_id || selectedWarranty.invoice_number}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Kode Garansi</span>
                  <div className="font-mono text-sm font-bold text-amber-700">{selectedWarranty.warranty_code}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemilik Unit:</span>
                  <strong className="text-slate-900">{selectedWarranty.customer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp:</span>
                  <span className="font-mono text-slate-800">{selectedWarranty.customer_whatsapp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe HP:</span>
                  <strong className="text-slate-900">{selectedWarranty.brand_model}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis Garansi:</span>
                  <span className="font-bold text-amber-900">{selectedWarranty.warranty_type_label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Masa Berlaku:</span>
                  <span><b>{selectedWarranty.startDateFormatted}</b> s/d <b>{selectedWarranty.endDateFormatted}</b></span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Sisa Masa Aktif:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    selectedWarranty.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedWarranty.isActive ? `🛡️ Sisa ${selectedWarranty.daysRemaining} Hari` : '⚠️ Telah Berakhir'}
                  </span>
                </div>
              </div>

              {/* Riwayat Klaim */}
              {selectedWarranty.claimHistory && selectedWarranty.claimHistory.length > 0 && (
                <div className="mt-3 pt-2 border-t border-dashed border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-1">Riwayat Pengajuan Klaim Pelanggan:</span>
                  <div className="p-2.5 bg-white border border-amber-200 rounded-xl text-slate-800 italic text-[11px]">
                    "{selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].complaint}"
                  </div>
                  {selectedWarranty.technician_notes && (
                    <div className="text-[11px] text-slate-600 mt-1">
                      <b>Catatan Teknisi:</b> {selectedWarranty.technician_notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setDetailModalOpen(false); handleOpenActionModal(selectedWarranty); }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Kelola Status Klaim
              </button>

              {selectedWarranty.customer_whatsapp && (
                <a
                  href={`https://wa.me/${selectedWarranty.customer_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kak ${selectedWarranty.customer_name}, perihal garansi unit ${selectedWarranty.brand_model} (${selectedWarranty.order_id || selectedWarranty.warranty_code})...`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pesan WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KELOLA STATUS KLAIM GARANSI */}
      {actionModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Kelola Status Klaim Garansi</h3>
                  <p className="text-[11px] text-slate-500">Tiket: {selectedWarranty.order_id || selectedWarranty.invoice_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Tiket:</span>
                <span className="font-mono font-bold text-slate-900">{selectedWarranty.order_id || selectedWarranty.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Sertifikat:</span>
                <span className="font-mono font-bold text-amber-800">{selectedWarranty.warranty_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.customer_name} ({selectedWarranty.customer_whatsapp})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perangkat:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.brand_model}</span>
              </div>
            </div>

            {selectedWarranty.claimHistory && selectedWarranty.claimHistory.length > 0 && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Keluhan Member yang Diajukan:</span>
                <p className="text-slate-800 italic">"{selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].complaint}"</p>
              </div>
            )}

            <form onSubmit={handleSaveClaimStatus} className="space-y-4 pt-1">
              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Keputusan Status Klaim:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('approved')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'approved'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-blue-700">✓ Setujui Klaim</div>
                    <div className="text-[10px] text-slate-500">Unit boleh dibawa ke lab</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('in_repair')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'in_repair'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-indigo-700">⚙️ Pengerjaan Lab</div>
                    <div className="text-[10px] text-slate-500">Teknisi sedang mengganti part</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('resolved')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'resolved'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-emerald-700">🎉 Klaim Selesai</div>
                    <div className="text-[10px] text-slate-500">Unit normal, siap diambil</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewClaimStatus('rejected')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newClaimStatus === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-rose-700">✕ Tolak Klaim</div>
                    <div className="text-[10px] text-slate-500">Void / human error / pecah</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Teknisi / Hasil Diagnosa Workshop:
                </label>
                <textarea
                  rows={3}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Contoh: Modul suku cadang original diganti baru dan lulus QC..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Simpan Perubahan Status</span>
                </button>

                {selectedWarranty.customer_whatsapp && (
                  <a
                    href={generateWaNotificationUrl(selectedWarranty, newClaimStatus, technicianNotes)}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </a>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
