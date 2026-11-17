import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Clock, 
  Search, Phone, Smartphone, User, FileText, ArrowRight, ExternalLink,
  RefreshCw, Wrench, Calendar, Tag, Check, X, MessageSquare, Send,
  Sparkles, HelpCircle, ChevronRight, CheckCircle2
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
  
  // Quick Lookup / Cek Garansi Admin States
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Modal Review & Update Status Klaim
  const [selectedWarranty, setSelectedWarranty] = useState<any | null>(null);
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

  // Handle Cek Garansi Cepat Admin
  const handleQuickLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return;

    setLookupLoading(true);
    setLookupNotFound(false);
    setLookupResult(null);

    const qDigits = q.replace(/\D/g, '');

    // 1. Cek di memori lokal tab
    const matched = warranties.find(w => {
      const code = String(w.warranty_code || '').toLowerCase();
      const orderId = String(w.order_id || '').toLowerCase();
      const inv = String(w.invoice_number || '').toLowerCase();
      const wa = String(w.customer_whatsapp || '').replace(/\D/g, '');
      const name = String(w.customer_name || '').toLowerCase();

      return code.includes(q) ||
        orderId.includes(q) ||
        inv.includes(q) ||
        (qDigits.length >= 6 && wa.includes(qDigits)) ||
        (name.length >= 3 && name.includes(q));
    });

    if (matched) {
      setLookupResult(matched);
      setLookupLoading(false);
      return;
    }

    // 2. Jika tidak ada di cache, query ke backend API
    try {
      const res = await fetchApi(`/api/warranties?search=${encodeURIComponent(lookupQuery.trim())}`);
      if (res.ok && res.data && res.data.data && res.data.data.length > 0) {
        setLookupResult(res.data.data[0]);
      } else {
        setLookupNotFound(true);
      }
    } catch {
      setLookupNotFound(true);
    } finally {
      setLookupLoading(false);
    }
  };

  // Filter Data untuk Tabel
  const filteredWarranties = warranties.filter((w) => {
    // 1. Status Filter
    if (statusFilter === 'pending' && w.claimStatus !== 'pending') return false;
    if (statusFilter === 'in_repair' && w.claimStatus !== 'in_repair') return false;
    if (statusFilter === 'active' && (!w.isActive || w.claimStatus === 'pending')) return false;
    if (statusFilter === 'expired' && !w.isExpired) return false;

    // 2. Search Term
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (w.warranty_code && w.warranty_code.toLowerCase().includes(s)) ||
      (w.order_id && w.order_id.toLowerCase().includes(s)) ||
      (w.invoice_number && w.invoice_number.toLowerCase().includes(s)) ||
      (w.customer_name && w.customer_name.toLowerCase().includes(s)) ||
      (w.customer_whatsapp && w.customer_whatsapp.includes(s)) ||
      (w.brand_model && w.brand_model.toLowerCase().includes(s)) ||
      (w.service_item && w.service_item.toLowerCase().includes(s))
    );
  });

  // Open Review / Action Modal
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
        
        // Update lookupResult jika sedang dibuka
        if (lookupResult && lookupResult.id === selectedWarranty.id) {
          setLookupResult(res.data.data);
        }

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

        if (lookupResult && lookupResult.id === selectedWarranty.id) {
          setLookupResult(res.data.warranty);
        }

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
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span>Pusat Cek Garansi &amp; Manajemen Klaim Servis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cek validitas masa garansi unit pelanggan, pantau sisa hari aktif, verifikasi sertifikat resmi, dan setujui klaim perbaikan workshop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 2. FORM CEK GARANSI CEPAT ADMIN (QUICK WARRANTY LOOKUP) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300 shadow-md">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Form Cek Validitas Garansi Unit (Lookup Admin)</h3>
            <p className="text-[11px] text-slate-600">
              Ketik No. Tiket (<code className="font-mono text-amber-800">NGF-...</code>), Kode Garansi (<code className="font-mono text-amber-800">GAR-...</code>), No. Faktur (<code className="font-mono text-amber-800">INV-...</code>), atau Nomor WhatsApp Member
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Contoh: GAR-90D-1033 / NGF-20261105-5755 / 081377889900..."
              value={lookupQuery}
              onChange={(e) => { setLookupQuery(e.target.value); setLookupNotFound(false); }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-amber-200 rounded-2xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading || !lookupQuery.trim()}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {lookupLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memeriksa...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Cek Garansi Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Not Found Alert */}
        {lookupNotFound && (
          <div className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Data garansi untuk kata kunci "<b>{lookupQuery}</b>" tidak ditemukan di database. Pastikan nomor tiket, kode garansi, atau nomor WA sudah benar.</span>
            </div>
            <button
              type="button"
              onClick={() => setLookupNotFound(false)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* HASIL CEK GARANSI INTERAKTIF (SERTIFIKAT DIGITAL PREVIEW) */}
        {lookupResult && (
          <div className="mt-4 p-5 sm:p-6 bg-white border-2 border-amber-400 rounded-3xl shadow-lg space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-700">Sertifikat Garansi Resmi Workshop Lab</div>
                  <div className="text-base font-black text-slate-900 font-mono">{lookupResult.warranty_code}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lookupResult.claimStatus === 'pending' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                    ⏳ KLAIM DALAM PENINJAUAN LAB
                  </span>
                ) : lookupResult.claimStatus === 'approved' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                    ✓ KLAIM DISETUJUI LAB
                  </span>
                ) : lookupResult.claimStatus === 'in_repair' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                    ⚙️ SEDANG DALAM PENANGANAN LAB
                  </span>
                ) : lookupResult.claimStatus === 'resolved' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🎉 KLAIM SELESAI DIGANTI
                  </span>
                ) : lookupResult.isActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    🛡️ GARANSI AKTIF ({lookupResult.daysRemaining} Hari Lagi)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-600">
                    ⚠️ MASA GARANSI BERAKHIR
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setLookupResult(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Tutup Hasil Pencarian"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 4-Box Grid Detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pelanggan / Member</span>
                <strong className="text-slate-900 block font-bold text-sm">{lookupResult.customer_name}</strong>
                <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{lookupResult.customer_whatsapp || '-'}</span>
                </div>
                {lookupResult.customer_id && (
                  <span className="inline-block px-1.5 py-0.5 mt-1 bg-amber-100 text-amber-900 rounded text-[9px] font-black">
                    Member Terdaftar
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Perangkat Smartphone</span>
                <strong className="text-slate-900 block font-bold text-sm">{lookupResult.brand_model || lookupResult.device_type}</strong>
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">{lookupResult.service_item}</span>
                <span className="text-[10px] font-bold text-amber-800 block mt-1">
                  Tiket: {lookupResult.order_id || lookupResult.invoice_number || '-'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cakupan Proteksi</span>
                <strong className="text-amber-800 block font-bold text-sm">{lookupResult.warranty_type_label}</strong>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Masa Berlaku: <b>{lookupResult.startDateFormatted}</b> s/d <b>{lookupResult.endDateFormatted}</b>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status Klaim &amp; Frekuensi</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="text-slate-900 font-bold text-sm">
                    {lookupResult.claimCount > 0 ? `${lookupResult.claimCount}x Klaim Tercatat` : 'Belum Pernah Klaim'}
                  </strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {lookupResult.claimStatus === 'pending'
                    ? '⚠️ Butuh keputusan lab segera'
                    : lookupResult.claimStatus === 'resolved'
                    ? 'Selesai diganti / normal'
                    : 'Kondisi proteksi aman'}
                </div>
              </div>
            </div>

            {/* Riwayat Klaim Terakhir Jika Ada */}
            {lookupResult.claimHistory && lookupResult.claimHistory.length > 0 && (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Riwayat Keluhan Klaim Pelanggan:</span>
                </div>
                <div className="p-3 bg-white border border-amber-200 rounded-xl text-slate-800 italic">
                  "{lookupResult.claimHistory[lookupResult.claimHistory.length - 1].complaint || 'Tidak ada catatan keluhan tertulis.'}"
                </div>
                {lookupResult.technician_notes && (
                  <div className="text-[11px] text-slate-600 pt-1">
                    <b>Catatan Teknisi Lab:</b> {lookupResult.technician_notes}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar Khusus Hasil Pencarian */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {lookupResult.claimStatus === 'pending' || lookupResult.claimStatus === 'in_repair' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(lookupResult)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Tinjau &amp; Putuskan Klaim</span>
                  </button>
                ) : lookupResult.isActive ? (
                  <button
                    type="button"
                    onClick={() => handleOpenNewClaimModal(lookupResult)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Ajukan Klaim untuk Unit Ini</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleOpenActionModal(lookupResult)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Ubah Catatan Teknisi
                </button>
              </div>

              {lookupResult.customer_whatsapp && (
                <a
                  href={`https://wa.me/${lookupResult.customer_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kak ${lookupResult.customer_name}, perihal garansi unit ${lookupResult.brand_model} (${lookupResult.warranty_code}) dari Ngalam Fix Pro...`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hubungi Pelanggan via WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sertifikat</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{warranties.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Tercatat di Database</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garansi Aktif</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{activeCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Masih dalam masa proteksi</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          pendingCount > 0 ? 'bg-amber-500/10 border-amber-300' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              pendingCount > 0 ? 'text-amber-900' : 'text-slate-500'
            }`}>
              Klaim Pending
            </span>
            <span className={`p-2 rounded-xl ${
              pendingCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`mt-3 text-2xl font-black ${
            pendingCount > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Menunggu respons workshop</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengerjaan Lab</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-600">{inRepairCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Unit dalam penanganan klaim</div>
        </div>
      </div>

      {/* 4. Filter & Search Bar untuk Tabel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({warranties.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : pendingCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Klaim Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_repair')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_repair'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Di Lab ({inRepairCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Garansi Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'expired'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kedaluwarsa ({expiredCount})
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter daftar tabel di bawah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* 5. Tabel Seluruh Data Garansi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredWarranties.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada data garansi yang cocok</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Belum ada catatan garansi pada filter ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Sertifikat &amp; Tiket</th>
                  <th className="py-3 px-4">Akun Member / Pelanggan</th>
                  <th className="py-3 px-4">Perangkat &amp; Servis</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4 text-center">Status Garansi</th>
                  <th className="py-3 px-4 text-center">Status Klaim</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWarranties.map((w) => {
                  const isBattery = /baterai|battery/i.test(w.warranty_type_label || w.service_item || '');
                  const hasPendingClaim = w.claimStatus === 'pending';

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        hasPendingClaim ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. Sertifikat & Tiket */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>{w.warranty_code}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tiket: <span className="text-slate-600 font-semibold">{w.order_id || w.invoice_number || '-'}</span>
                        </div>
                        {w.customer_id && (
                          <span className="inline-block px-1.5 py-0.5 mt-1 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold text-amber-800">
                            Member Terdaftar
                          </span>
                        )}
                      </td>

                      {/* 2. Akun Pelanggan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.customer_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{w.customer_whatsapp || '-'}</span>
                        </div>
                      </td>

                      {/* 3. Perangkat & Servis */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 flex items-center gap-1 truncate">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{w.brand_model || w.device_type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {w.service_item || w.warranty_type_label}
                        </div>
                        <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          {isBattery ? '⚡ Garansi 90 Hari (3 Bulan)' : `🛡️ ${w.duration_days || 30} Hari Proteksi`}
                        </div>
                      </td>

                      {/* 4. Masa Berlaku & Sisa Hari */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-700">
                          <div>Mulai: <b>{w.startDateFormatted || formatDateId(w.start_date)}</b></div>
                          <div>S/d: <b>{w.endDateFormatted || formatDateId(w.end_date)}</b></div>
                        </div>
                        <div className="mt-1">
                          {w.isExpired ? (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Kedaluwarsa
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Sisa {w.daysRemaining} Hari
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Garansi */}
                      <td className="py-3.5 px-4 text-center">
                        {w.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                            Berakhir
                          </span>
                        )}
                      </td>

                      {/* 6. Status Klaim */}
                      <td className="py-3.5 px-4 text-center">
                        {w.claimStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse shadow-2xs">
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
                          <span className="text-[11px] text-slate-400">Belum Klaim</span>
                        )}
                      </td>

                      {/* 7. Aksi Cepat */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLookupResult(w);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Tampilkan Detail Sertifikat Garansi"
                          >
                            Cek Detail
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(w)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              hasPendingClaim
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <span>{hasPendingClaim ? 'Tinjau Klaim' : 'Kelola'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {w.customer_whatsapp && (
                            <a
                              href={`https://wa.me/${w.customer_whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Hubungi Pelanggan via WhatsApp"
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

      {/* 6. Modal Review / Kelola Keputusan Status Klaim Garansi */}
      {actionModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Kelola Status Klaim Garansi</h3>
                  <p className="text-[11px] text-slate-500">Workshop Ngalam Fix Pro • Lab Teknisi</p>
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

            {/* Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Kode Sertifikat:</span>
                <span className="font-mono font-bold text-slate-900">{selectedWarranty.warranty_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Pelanggan:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.customer_whatsapp || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Perangkat:</span>
                <span className="font-semibold text-slate-900">{selectedWarranty.brand_model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Masa Proteksi:</span>
                <span className="font-semibold text-amber-800">{selectedWarranty.warranty_type_label}</span>
              </div>
            </div>

            {/* Keluhan Pelanggan Terakhir (Jika ada pengajuan klaim) */}
            {selectedWarranty.claimHistory && selectedWarranty.claimHistory.length > 0 && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Keluhan / Masalah yang Diajukan Pelanggan:</span>
                </div>
                <div className="p-3 bg-white border border-amber-200/80 rounded-xl text-slate-800 italic">
                  "{selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].complaint || 'Tidak ada catatan keluhan tertulis.'}"
                </div>
                <div className="flex justify-between text-[11px] text-amber-800 font-semibold pt-1">
                  <span>Metode: {selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].claimMethod || 'Datang Langsung'}</span>
                  <span>Waktu: {formatDateId(selectedWarranty.claimHistory[selectedWarranty.claimHistory.length - 1].claimedAt)}</span>
                </div>
              </div>
            )}

            {/* Action Form */}
            <form onSubmit={handleSaveClaimStatus} className="space-y-4 pt-1">
              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{feedbackMsg.text}</span>
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
                  placeholder="Contoh: Modul layar diganti baru dengan QC 100% lulus. Bebas biaya jasa dan part."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan Status</span>
                    </>
                  )}
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

      {/* 7. Modal Ajukan Klaim Baru dari Sisi Admin */}
      {newClaimModalOpen && selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Ajukan Klaim Garansi untuk Pelanggan</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewClaimModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>No. Sertifikat: <b className="font-mono">{selectedWarranty.warranty_code}</b></div>
              <div>Pelanggan: <b>{selectedWarranty.customer_name}</b> ({selectedWarranty.customer_whatsapp})</div>
              <div>Perangkat: <b>{selectedWarranty.brand_model}</b></div>
            </div>

            <form onSubmit={handleAdminSubmitClaim} className="space-y-3">
              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan / Kendala Unit Pelanggan:
                </label>
                <textarea
                  rows={3}
                  required
                  value={claimComplaint}
                  onChange={(e) => setClaimComplaint(e.target.value)}
                  placeholder="Jelaskan kendala yang dialami unit..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Kedatangan Unit:</label>
                <select
                  value={claimMethod}
                  onChange={(e) => setClaimMethod(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Datang Langsung ke Workshop Meja 1">Datang Langsung ke Workshop Meja 1</option>
                  <option value="Layanan Antar-Jemput (Pickup) Workshop">Layanan Antar-Jemput (Pickup) Workshop</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingClaim ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Kirim &amp; Catat Pengajuan Klaim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
